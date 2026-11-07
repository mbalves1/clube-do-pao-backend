---
name: revisar-solid
description: Revisa código TypeScript do backend do Clube do Pão contra SOLID, Clean Architecture e boas práticas (responsabilidade única, dependências invertidas, ports enxutos, erros de domínio, tipagem estrita, testabilidade) e entrega um relatório priorizado com arquivo:linha, princípio violado, impacto e sugestão concreta. Use sempre que o usuário pedir para revisar, auditar ou avaliar a qualidade de um arquivo, use case, controller, repositório ou do diff atual — inclusive com frases como "isso está bom?", "tá SOLID?", "o que dá pra melhorar aqui?", "revisa antes do PR", "esse código está limpo?" ou "tem code smell?". Não use para caçar bugs de lógica/segurança (use /code-review ou /security-review) nem para implementar features.
---

# Revisar SOLID

Revisão de **design**, não de bugs. A pergunta central é: *este código vai continuar fácil de mudar e de testar quando a próxima feature chegar?* Cada achado precisa responder "o que dói, quando" — princípio citado sem impacto concreto é ruído.

Por padrão a revisão é **somente leitura**. Só aplique correções se o usuário pedir.

## Passo 1 — Definir o escopo

- Usuário citou arquivo/pasta → revise isso.
- Senão → `git diff` + `git diff --staged` (e `git diff master...HEAD` se estiver numa branch). Revise os arquivos tocados, mas leia também os vizinhos que eles usam (port, entidade, factory) — muitas violações só aparecem na fronteira.
- Rode `npm run check:architecture`. Se falhar, isso é o achado nº 1.

## Passo 2 — Ler o contexto que define "certo" aqui

Antes de julgar, leia `.claude/rules/` da camada em questão (`core.md`, `infra.md`, `main.md`...). Elas registram decisões já tomadas — p.ex. entidades são `type` sem métodos, autorização por dono fica no use case via `resolveOwnerBakeryId`. **Não sugira contrariar uma regra registrada** (ex. "transforme a entidade em classe rica"); se achar que a regra está errada, diga isso separadamente, como observação, não como achado.

## Passo 3 — Checklist por princípio

Use como lente, não como formulário: só reporte o que encontrar.

**S — Responsabilidade única**
- Controller com regra de negócio (decidir status, calcular preço, checar dono) em vez de só traduzir `req` → use case → `res`.
- Use case que faz várias operações independentes ou mistura parsing de formato (`'DD-MM-YYYY'`) com regra de negócio — parsing pertence à borda (validator Zod).
- Lógica repetida entre controllers (ex. `handleError` copiado entre controllers → candidato a middleware de erro do Express).

**O — Aberto/fechado**
- `switch`/`if` por status, papel ou `fulfillmentType` que precisa de um novo ramo a cada feature. Referência boa do projeto: `usecases/orders/order-status-transitions.ts` (tabela de regras declarativa) — aponte para ela como modelo.

**L — Substituição de Liskov**
- Repositório Prisma que diverge do contrato do port: lança onde o port promete `null`/`false` (ver `claim`/`release` em `orders-repository.ts`, que retornam `false` por design), ou devolve objeto do Prisma com campos extras/faltando.
- Subclasse de `AppError` que muda semântica (status HTTP incoerente com o pai).

**I — Segregação de interfaces**
- Port que obriga use cases a depender de métodos que não usam. Sintoma: fakes de teste cheios de `throw new Error('not implemented')`. Só vale sugerir quebra quando há consumidores realmente distintos — não fragmente por esporte.

**D — Inversão de dependência**
- `new PrismaXRepository()`, `prisma.` ou `process.env` fora de `main/factories` / `infra`.
- Dependências **ocultas** no core: `new Date()`, `Math.random()`, `crypto.randomUUID()` dentro de use case. Funcionam, mas tornam o use case não-determinístico e difícil de testar. Sugira injetar (`now: () => Date` no construtor ou receber a data no `execute`). Ex.: `ListAvailableOrdersUseCase` e `GenerateOrdersFromSubscriptionsUseCase.resolveDate`.
- Port tipado com tipos do Prisma.

**Boas práticas gerais (TS / Clean Code)**
- `throw new Error(...)` genérico no core em vez de subclasse de `AppError`.
- `any`, `as` desnecessário, `!` non-null; status/papéis como `string` em vez de union.
- Primitive obsession em valores com regra: centavos, CNPJ, datas de serviço. Sugira value object/função de domínio apenas quando a mesma validação aparece em ≥2 lugares.
- Datas: mistura de horário local (`new Date(y, m, d)`) com UTC (`setUTCHours`) — classifique como **alto**, isso costuma virar bug de fuso em produção (Vercel roda em UTC, dev roda no fuso local).
- Nomes que mentem (`updateOrders` que só faz uma coisa), funções > ~40 linhas, aninhamento > 3 níveis, comentário explicando *o quê* em vez de *por quê*.
- Código que dificulta teste: lógica em função privada impossível de exercitar pelo `execute`, construtor que faz I/O.

## Passo 4 — Classificar

| Severidade | Critério |
|---|---|
| **Alto** | Quebra fronteira de camada, esconde bug provável, ou vai forçar mudança em vários arquivos na próxima feature |
| **Médio** | Atrapalha teste ou leitura de forma recorrente; vale corrigir neste PR ou no próximo |
| **Baixo** | Polimento; mencione só se o relatório não estiver poluído |

Seja honesto sobre trade-offs: num CRUD simples, abstração extra costuma custar mais do que economiza. Se o código está bom, diga que está bom — inventar achados para preencher o relatório destrói a confiança na revisão.

## Passo 5 — Relatório

Use este formato:

```markdown
## Revisão SOLID — <escopo>

`check:architecture`: ✅ / ❌ <detalhe>

### Alto
1. **<título curto>** — `src/caminho/arquivo.ts:42` · <princípio>
   - **Problema:** o que está acontecendo.
   - **Impacto:** o que dói e quando (ex. "a próxima regra de status exige mexer em 3 arquivos").
   - **Sugestão:** mudança concreta, com trecho de código curto se ajudar.

### Médio
...

### Baixo
...

### O que está bom
- 1–3 pontos que devem ser mantidos como referência (ajuda a não "consertar" o que está certo).

### Próximo passo sugerido
Uma frase: o que atacar primeiro e se vale um PR separado.
```

Agrupe achados repetidos ("`handleError` duplicado em N controllers") em vez de listar um por arquivo. Termine perguntando se o usuário quer que você aplique alguma correção.
