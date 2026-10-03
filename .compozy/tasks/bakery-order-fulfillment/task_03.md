---
status: completed
title: "order-status-machine.ts — função pura de transições"
type: backend
complexity: medium
dependencies:
  - task_02
---

# Task 3: order-status-machine.ts — função pura de transições

## Overview
Cria a fonte única de verdade das transições de status do pedido (ADR-003). Função pura, sem repositório, que sabe qual ator (`company` ou `delivery`) pode levar o pedido de um status a outro. Todos os use cases de transição vão consumir isto.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include verification in deliverables
</critical>

<requirements>
- MUST criar `src/core/usecases/orders/order-status-machine.ts` exportando:
  - `type OrderActor = 'company' | 'delivery'`
  - `canTransition(from: OrderStatus, to: OrderStatus, actor: OrderActor): boolean`
  - `assertTransition(from: OrderStatus, to: OrderStatus, actor: OrderActor): void`
- MUST implementar exatamente a matriz do PRD ("Status model"):
  - `company`: `PENDING→PREPARING`, `PREPARING→READY`, e `PENDING|PREPARING|READY → CANCELED`.
  - `delivery`: `READY→ACCEPTED` (claim), `ACCEPTED→READY` (release), `ACCEPTED→PICKED_UP`, `PICKED_UP→DELIVERED`.
  - Nenhuma transição a partir de `PICKED_UP`/`DELIVERED`/`CANCELED` exceto `PICKED_UP→DELIVERED`.
- MUST `assertTransition` lançar `ConflictError` quando a transição não existe para nenhum ator, e `ForbiddenError` quando existe mas para o outro ator.
- MUST NOT importar nada de `infra/` nem de Prisma.
</requirements>

## Subtasks
- [x] 3.1 Definir a estrutura de dados da matriz (mapa `from → { to → actor }` ou lista de tuplas).
- [x] 3.2 Implementar `canTransition` e `assertTransition`.
- [x] 3.3 Importar `ConflictError`/`ForbiddenError` direto dos arquivos (sem barrel).

## Implementation Details
Ver TechSpec "usecases/orders/order-status-machine.ts" e ADR-003. Manter a função sem estado — recebe `from`/`to`/`actor` e responde. A guarda de concorrência do `claim` continua no repositório (task_06); esta máquina só diz se a transição é *legal*.

### Relevant Files
- `src/core/errors/ConflictError.ts`, `src/core/errors/ForbiddenError.ts` — erros a lançar.
- `src/core/entities/orders.ts` — união `OrderStatus` (task_02).
- `src/core/usecases/orders/release-order.ts` — exemplo atual de checagem de transição feita na mão (`status !== 'ACCEPTED'`), a ser substituída.

### Dependent Files
- `src/core/usecases/orders/advance-order-by-bakery.ts` (task_10)
- `src/core/usecases/orders/accept-order.ts` (task_12)
- `src/core/usecases/orders/release-order.ts` (task_13)
- `src/core/usecases/orders/advance-order-by-courier.ts` (task_14)

## Deliverables
- Novo arquivo `src/core/usecases/orders/order-status-machine.ts`.
- Verificação manual **(OBRIGATÓRIO)**.

## Tests
- Verificação manual (script pontual chamando a função, ou REPL `ts-node`):
  - [x] `canTransition('PENDING','PREPARING','company')` → `true`; `(...'delivery')` → `false`.
  - [x] `canTransition('READY','ACCEPTED','delivery')` → `true`; `(...'company')` → `false`.
  - [x] `canTransition('PREPARING','READY','company')` → `true`.
  - [x] `canTransition('ACCEPTED','PICKED_UP','delivery')` → `true`; `('PICKED_UP','ACCEPTED', *)` → `false`.
  - [x] `canTransition('READY','CANCELED','company')` → `true`; `('ACCEPTED','CANCELED', *)` → `false`.
  - [x] `assertTransition('PENDING','READY','company')` → lança `ConflictError`.
  - [x] `assertTransition('READY','ACCEPTED','company')` → lança `ForbiddenError`.
- Cobertura alvo: matriz completa do PRD exercitada.

### Nota — implementado evoluindo a máquina existente (decisão do usuário, 2026-10-03)
A fonte única de transições já existia desde a feature `seller-order-fulfillment`: `src/core/usecases/orders/order-status-transitions.ts` (`assertOrderTransition`, usada por `update-orders.ts` e `update-order-status-by-seller.ts`). Criar `order-status-machine.ts` em paralelo duplicaria a matriz, contra a ADR-003, e perderia regras já em produção. Por isso, em vez de um arquivo novo:
- **Mantidos:** nome do arquivo, atores `'seller' | 'courier'` (equivalem a `company`/`delivery`), parâmetro `fulfillmentType` e a transição `READY→PICKED_UP` do lojista em pedidos `PICKUP` (documentada em `docs/architecture.md`; não consta da tabela do PRD desta feature).
- **Adicionados:** `canTransition(from, to, actor, fulfillmentType)`, e em `assertOrderTransition` a distinção pedida: `ForbiddenError` (403) quando a transição só vale para o outro ator, `InvalidOrderStatusTransitionError` (409) quando não vale para ninguém.
- `InvalidOrderStatusTransitionError` agora estende `ConflictError` (antes 422), e o Swagger de `PATCH /orders/:id/status` e `PATCH /orders/:orderId/:deliveryId` passou de 422 para 409/403.

Verificação: `npm run build` exit 0, mais um script sobre `dist/` cobrindo as 196 combinações (2 `fulfillmentType` × 2 atores × 7×7 status) comparadas com a matriz esperada: 0 falhas (15× 403, 166× 409, o resto permitido). Os casos da lista de testes acima foram conferidos com os nomes de ator equivalentes (`company`→`seller`, `delivery`→`courier`, `fulfillmentType` `DELIVERY`).

Para as tasks 10/12/13/14: consumir `assertOrderTransition` de `order-status-transitions.ts`, não `order-status-machine.ts`.

## Success Criteria
- Toda transição do PRD retorna `true` para o ator certo e `false` para o outro.
- `assertTransition` distingue `ConflictError` (inválida) de `ForbiddenError` (ator errado).
