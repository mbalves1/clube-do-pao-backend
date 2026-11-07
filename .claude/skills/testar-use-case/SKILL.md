---
name: testar-use-case
description: Escreve testes unitários com Vitest para use cases e regras de domínio do core do Clube do Pão (src/core), usando repositórios fake em memória que implementam os ports — sem banco, sem Express, sem Supabase. Inclui o setup inicial do Vitest se ainda não existir. Use sempre que o usuário pedir para testar, cobrir com testes, garantir que um use case funciona, criar fakes/mocks de repositório, ou antes de refatorar um use case (ex. "testa o accept-order", "cobre a regra de transição de status", "quero testes antes de mexer no generate", "como garanto que o delete-item barra outro lojista?"). Não use para testes de integração com Prisma/Postgres ou testes HTTP de rotas (supertest).
---

# Testar use case

O core depende só de ports (interfaces), então cada use case pode ser testado trocando o repositório Prisma por um **fake em memória**. É o retorno direto da inversão de dependência: testes rápidos, determinísticos e que documentam a regra de negócio.

## Passo 0 — Setup (só na primeira vez)

Verifique se `vitest` está em `devDependencies` e se existe `vitest.config.ts`. Se não:

1. `npm install -D vitest@3`
2. Script em `package.json`: `"test": "vitest run"` e `"test:watch": "vitest"`.
3. `vitest.config.ts` na raiz:
   ```ts
   import { defineConfig } from 'vitest/config';

   export default defineConfig({
   	test: {
   		include: ['tests/**/*.spec.ts'],
   		environment: 'node',
   	},
   });
   ```
4. Testes ficam em **`tests/`**, fora de `src/`. Motivo: o `tsconfig.json` tem `rootDir: ./src` e o `build` compila tudo em `src/` para `dist/` — spec dentro de `src` iria para produção no Vercel. Estrutura espelha o core:
   ```
   tests/
   ├── fakes/                  # um fake por port: in-memory-item-repository.ts
   ├── builders/               # makeItem(), makeUser()... com defaults sensatos
   └── core/usecases/item/delete-item.spec.ts
   ```
5. Adicione `- name: Test` / `run: npm test` em `.github/workflows/ci.yml`, depois do `check:architecture`.
6. Avise o usuário do que foi instalado/alterado — é mudança de projeto, não só de teste.

## Passo 1 — Entender a regra antes de testar

Leia o use case, o port e a entidade. Liste os **comportamentos** (não as linhas):
- caminho feliz (o que muda no repositório / o que retorna);
- cada `throw` — qual erro (`NotFoundError`, `ForbiddenError`, `ConflictError`, `InvalidOrderStatusTransitionError`...) e em qual condição;
- casos de borda de domínio: outro lojista tentando agir, pedido já reivindicado, idempotência (`generate` não duplica), transição ilegal para o papel.

Teste o contrato público (`execute` ou a função exportada), nunca métodos privados. Se algo importante só é alcançável por um privado, isso é sinal de design — mencione ao usuário (ver skill `revisar-solid`).

## Passo 2 — Fakes

Um fake por port, em `tests/fakes/`, **implementando a interface real** (`implements ItemRepository`) — assim o TypeScript quebra o fake quando o port muda, e ele nunca fica mentindo. Reaproveite se já existir.

```ts
import { Item } from '../../src/core/entities/item';
import { CreateItemData, ItemRepository, UpdateItemData } from '../../src/core/ports/item-repository';

export class InMemoryItemRepository implements ItemRepository {
	items: Item[] = [];

	async create(data: CreateItemData): Promise<Item> {
		const item: Item = {
			id: crypto.randomUUID(),
			description: null,
			available: true,
			createdAt: new Date(),
			updatedAt: new Date(),
			...data,
		};
		this.items.push(item);
		return item;
	}

	async findById(id: string) {
		return this.items.find((i) => i.id === id) ?? null;
	}
	// ...demais métodos com a mesma semântica do Prisma
}
```

Regras para o fake ser confiável:
- **Mesma semântica do contrato**: se o port diz que `claim` retorna `false` quando o pedido não está `READY`/livre, o fake faz exatamente isso — não lança.
- Estado público (`items`) para *arrange* e *assert* direto, em vez de espionar chamadas. Prefira verificar **estado resultante** a `expect(spy).toHaveBeenCalledWith(...)`: teste de estado sobrevive a refatoração, teste de chamada quebra à toa.
- `vi.fn()` só para dependências sem estado relevante (ex. um publisher SSE, onde "foi emitido com X" é o comportamento).

## Passo 3 — Builders

Em `tests/builders/`, funções `makeX(overrides?: Partial<X>): X` com defaults válidos. O teste declara só o que importa para o cenário:

```ts
const item = makeItem({ bakeryId: 'bakery-outra' });
```

Para autorização de lojista, crie um helper que semeia `User` + `BakeryPerson` nos fakes e devolve `{ supabaseUserId, bakeryId }` — quase todo use case de `company` precisa disso (fluxo de `resolveOwnerBakeryId`).

## Passo 4 — Escrever o spec

```ts
import { beforeEach, describe, expect, it } from 'vitest';
import { DeleteItemUseCase } from '../../../../src/core/usecases/item/delete-item';
import { ForbiddenError } from '../../../../src/core/errors/ForbiddenError';
import { NotFoundError } from '../../../../src/core/errors/NotFoundError';

describe('DeleteItemUseCase', () => {
	let items: InMemoryItemRepository;
	let users: InMemoryUserRepository;
	let bakeryPeople: InMemoryBakeryPersonRepository;
	let sut: DeleteItemUseCase;

	beforeEach(() => {
		items = new InMemoryItemRepository();
		users = new InMemoryUserRepository();
		bakeryPeople = new InMemoryBakeryPersonRepository();
		sut = new DeleteItemUseCase(items, users, bakeryPeople);
	});

	it('remove o item quando o lojista é dono da padaria', async () => {
		const owner = seedBakeryOwner(users, bakeryPeople);
		items.items.push(makeItem({ id: 'item-1', bakeryId: owner.bakeryId }));

		await sut.execute(owner.supabaseUserId, 'item-1');

		expect(items.items).toHaveLength(0);
	});

	it('lança ForbiddenError quando o item é de outra padaria', async () => {
		const owner = seedBakeryOwner(users, bakeryPeople);
		items.items.push(makeItem({ id: 'item-1', bakeryId: 'outra' }));

		await expect(sut.execute(owner.supabaseUserId, 'item-1')).rejects.toBeInstanceOf(ForbiddenError);
		expect(items.items).toHaveLength(1); // nada foi apagado
	});
});
```

Convenções:
- `describe` = nome da classe/função; `it` em **português**, descrevendo comportamento ("lança X quando Y"), como o resto do projeto.
- Arrange / Act / Assert separados por linha em branco; um comportamento por `it`.
- Em erro, cheque o **tipo** (`toBeInstanceOf`) — mensagens mudam, a classe é o contrato com o HTTP. E cheque que nada foi alterado.
- Funções puras (ex. `order-status-transitions.ts`) pedem `it.each` com a tabela de casos — legal, ilegal-para-o-papel (403) e ilegal-para-todos (409).

## Passo 5 — Tempo e aleatoriedade

Use cases que chamam `new Date()` internamente (ex. `ListAvailableOrdersUseCase`, `GenerateOrdersFromSubscriptionsUseCase`) ficam não-determinísticos. Em ordem de preferência:
1. Se o usuário topar mexer no código: injetar `now: () => Date` no construtor (default `() => new Date()`, então as factories não mudam).
2. Sem mexer: `vi.useFakeTimers(); vi.setSystemTime(new Date('2026-11-09T12:00:00Z'))` e `vi.useRealTimers()` no `afterEach`.

Fixe datas em UTC explícito (`...Z`) — local vs UTC é uma fonte real de bug neste projeto (Vercel roda em UTC).

## Passo 6 — Verificar

Rode `npm test` e `npm run build` (garante que nada de `tests/` vazou para o build) e `npm run check:architecture`. Reporte quantos testes passaram. Se um teste revelar bug real no use case, **não ajuste o teste para passar** — pare e mostre ao usuário o comportamento atual vs o esperado.
