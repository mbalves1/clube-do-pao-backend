---
status: pending
title: "OrdersRepository port estendido"
type: backend
complexity: low
dependencies:
  - task_02
---

# Task 5: OrdersRepository port estendido

## Overview
Redefine o contrato `OrdersRepository` para suportar todo o ciclo de vida sobre `Order`: geração idempotente, feed do lojista, pool de retirada, `claim`/`release` à prova de corrida e atualização de status com timestamps. O port atual só tem `create(order, deliveryId)`, `update`, `findBySubscriptionId`, `find` — insuficiente e com assinatura confusa.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include verification in deliverables
</critical>

<requirements>
- MUST redefinir `src/core/ports/orders-repository.ts` com:
  - `create(data: CreateOrderData): Promise<Order>` onde `CreateOrderData = { subscriptionId: number; bakeryId: string; serviceDate: Date; status?: OrderStatus }` (default `PENDING`).
  - `existsForSubscriptionOnDate(subscriptionId: number, serviceDate: Date): Promise<boolean>`
  - `findById(id: number): Promise<Order | null>`
  - `findByBakeryId(bakeryId: string, filter: { status?: OrderStatus[]; from?: Date; to?: Date }): Promise<Order[]>`
  - `findAvailableForPickup(from: Date, to: Date): Promise<Order[]>`
  - `claim(id: number, deliveryPersonId: string): Promise<boolean>`
  - `release(id: number, deliveryPersonId: string): Promise<boolean>`
  - `updateStatus(id: number, status: OrderStatus, stamps: Partial<Pick<Order, 'preparingAt'|'readyAt'|'acceptedAt'|'pickedUpAt'|'deliveredAt'|'canceledAt'>>): Promise<Order>`
- MUST remover a assinatura antiga `create(order, deliveryId)` e o tipo `UpdateOrderData` genérico se não houver mais consumidor.
- MUST documentar em comentário que `claim`/`release` retornam `false` (não lançam) no caso de corrida perdida — mesmo contrato do `SubscribeRepository.claim` atual.
- MUST NOT importar nada de `infra/`.
</requirements>

## Subtasks
- [ ] 5.1 Reescrever a interface e os tipos auxiliares.
- [ ] 5.2 `grep -rn "OrdersRepository\|orders-repository" src/` — mapear quem precisa mudar (repo impl task_06, use cases task_08/11–14).

## Implementation Details
Ver TechSpec "ports/orders-repository.ts". `findBySubscriptionId` do port atual pode ser mantido se `AdvanceOrderByCourierUseCase` ainda precisar; avaliar na task_14 e remover se não. O objetivo é um contrato onde `Order.id` (Int) é a chave de tudo.

### Relevant Files
- `src/core/ports/orders-repository.ts` — arquivo a reescrever.
- `src/core/ports/subscribe-repository.ts` — referência do contrato `claim`/`release` (comentário sobre retorno `false`).

### Dependent Files
- `src/infra/repositories/prisma-orders-repository.ts` (task_06)
- `src/core/usecases/orders/*` (task_08, task_11, task_12, task_13, task_14)

## Deliverables
- `src/core/ports/orders-repository.ts` reescrito.
- Verificação manual **(OBRIGATÓRIO)**.

## Tests
- Verificação manual:
  - [ ] `npm run build` aponta como erro exatamente os pontos a migrar nas tasks seguintes (repо impl + use cases), e nada além disso.
  - [ ] `grep` confirma que nenhum arquivo fora do escopo previsto referencia os métodos removidos.
- Sem framework de teste automatizado no projeto.

## Success Criteria
- Interface cobre geração, feed, pool, claim/release e updateStatus, toda chaveada por `Order.id`.
