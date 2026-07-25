---
name: adicionar-recurso
description: Adiciona um novo recurso/módulo de domínio ao backend do Clube do Pão seguindo Clean Architecture (entidade → port → use case → repositório Prisma → mapper → validator Zod → controller → rotas → factory → registro → schema Prisma). Fixa a convenção de nomenclatura por camada (singular, camelCase para entidade/usecases, kebab-case para o resto da infra) para evitar o drift já existente no projeto (ex. "orders" vs "order", "subscribe" vs "subscription", "delivery-user" vs "delivery-users"). Use quando o usuário pedir para criar um novo recurso, módulo, CRUD, entidade de domínio ou endpoint completo. Não use para editar um recurso já existente ou para tarefas que não envolvem todas as camadas (ex. só um endpoint novo em um recurso existente).
---

# Adicionar recurso

Cria um novo recurso de domínio de ponta a ponta, seguindo exatamente a ordem e as camadas descritas em `docs/architecture.md`, mas com a convenção de nomenclatura fixada abaixo — o código atual tem drift entre módulos (ver "Débito técnico existente") e esse drift não deve ser replicado em recursos novos.

## Passo 0 — Fixar o nome canônico do recurso

Antes de criar qualquer arquivo, defina UM nome canônico, **singular**, no idioma do domínio (português ou inglês, conforme o restante do projeto — hoje é inglês: `user`, `bakery`, `order`). Confirme com o usuário se não estiver óbvio.

A partir desse nome canônico, derive só duas formas — nunca improvise uma terceira variação por arquivo:

| Forma | Uso |
|---|---|
| `camelCase` (singular) | nome do arquivo de entidade e da pasta de use cases |
| `kebab-case` (singular) | todo o resto: port, repositório Prisma, mapper, validator, controller, rotas, factory |

Exemplo com recurso hipotético "cartão fidelidade" → nome canônico `loyaltyCard`:
- camelCase: `loyaltyCard`
- kebab-case: `loyalty-card`

Se o recurso tiver relação direta com um model do `prisma/schema.prisma`, o nome canônico deve ser o mesmo nome do model (no singular), para não criar um terceiro nome diferente do banco.

## Débito técnico existente (não copiar como modelo de nomenclatura)

O projeto já tem módulos com nomes inconsistentes entre camadas — use os arquivos deles como **modelo estrutural** (como o código é organizado dentro do arquivo), nunca como **modelo de nomenclatura**:

- `orders` (plural) nas entidades/rotas/use cases vs `order-validator.ts` / `order-controller-factory.ts` (singular)
- `subscribe` (verbo) na maioria das camadas vs `subscription-validator.ts` / model `Subscription` no Prisma (substantivo)
- `delivery` → `delivery-user-routes.ts` (singular) vs `delivery-users-controller.ts` (plural) vs `devlivery-user-controller-factory.ts` (typo "devlivery") vs model `DeliveryPerson` no Prisma
- Só o módulo `bakery` tem mapper (`bakery-mapper.ts` / `prisma-bakery-mapper.ts`) — os outros não têm, porque não precisaram até agora

Recursos novos seguem a convenção do Passo 0, independente do que esses módulos fazem.

## Workflow

Siga esta ordem, criando um arquivo por vez. Para cada camada, use o arquivo existente indicado como referência estrutural (imports, formato do construtor, padrão de erro etc.), mas aplique a nomenclatura do Passo 0.

1. **Entidade** — `src/core/entities/<camelCase>.ts`. Modelo estrutural: `src/core/entities/bakery.ts`.
2. **Port** — `src/core/ports/<kebab-case>-repository.ts` (interface). Modelo: `src/core/ports/bakery-repository.ts`.
3. **Use cases** — `src/core/usecases/<camelCase>/<verbo>-<kebab-case>.ts`, um arquivo por operação (`create-`, `list-`, `update-`, `delete-`). Modelo: `src/core/usecases/bakery/create-bakery.ts`.
4. **Repositório Prisma** — `src/infra/repositories/prisma-<kebab-case>-repository.ts`, implementa o port do passo 2. Modelo: `src/infra/repositories/prisma-bakery-repository.ts`.
5. **Mapper** (se os campos do Prisma não baterem 1:1 com a entidade de domínio) — `src/infra/mappers/prisma-<kebab-case>-mapper.ts`. Modelo: `src/infra/mappers/prisma-bakery-mapper.ts`.
6. **Validadores Zod** — `src/infra/http/validators/<kebab-case>-validator.ts`. Modelo: `src/infra/http/validators/bakery-validator.ts`.
7. **Controller** — `src/infra/controllers/<kebab-case>-controller.ts`. Modelo: `src/infra/controllers/bakery-controller.ts`.
8. **Rotas** — `src/infra/http/routes/<kebab-case>-routes.ts`, com anotações swagger no mesmo padrão dos outros arquivos de rota. Modelo: `src/infra/http/routes/bakery-routes.ts`.
9. **Factory** — `src/main/factories/<kebab-case>-controller-factory.ts` (instancia repositório → use cases → controller). Modelo: `src/main/factories/bakery-controller-factory.ts`.
10. **Registrar** — adicionar em `src/infra/http/routes.ts` (import + `router.use`) e em `src/main/app.ts` (chamar a factory e passar o controller para `makeRoutes`).
11. **Schema Prisma** — adicionar/ajustar o `model` em `prisma/schema.prisma` (nome do model = forma PascalCase do nome canônico) e rodar `npx prisma migrate dev`.

## Checklist antes de considerar pronto

- **Login/autenticação**: se o recurso representa um novo tipo de conta que precisa logar, o cadastro precisa chamar `authGateway.createCredential(email, password, role)` (ver `src/core/usecases/user/create-user.ts`) e o `Role` em `src/core/ports/auth-gateway.ts` precisa incluir a nova role — senão a conta fica sem login, como aconteceu com `Bakery`/`DeliveryPerson` (ver `docs/architecture.md`, seção "Autenticação e papéis"). Confirme com o usuário se este recurso precisa disso.
- **Padrões obrigatórios de `docs/architecture.md`**: core não importa de `infra/`; toda instanciação conjunta (repositório + use case + controller) só acontece na factory; erros de domínio estendem `AppError`; nunca instanciar `PrismaClient` diretamente.
- Rodar `npm run build` no final e confirmar que compila sem erro.

## Não fazer

- Não renomear ou "corrigir" a nomenclatura de módulos já existentes como parte dessa skill — isso é um refactor separado e fora de escopo aqui.
- Não pular camadas mesmo que pareçam redundantes para o caso de uso (ex. pular o mapper só é aceitável se os campos do Prisma já baterem exatamente com a entidade).