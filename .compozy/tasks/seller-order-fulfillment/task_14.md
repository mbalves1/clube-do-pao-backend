---
status: pending
title: "Migrate AcceptOrderUseCase onto Order.claim"
type: backend
complexity: medium
dependencies:
  - task_02
  - task_07
---

# Task 14: `AcceptOrderUseCase` claims an `Order`

## Overview
Courier claim currently runs `SubscribeRepository.claim` (conditional `updateMany` on `subscription`). Move it to `OrdersRepository.claim`, with the precondition now being `status = READY` ([ADR-001](adrs/adr-001.md), [ADR-003](adrs/adr-003.md)).

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include verification in deliverables
</critical>

<requirements>
- MUST change `src/core/usecases/orders/accept-order.ts` to call `ordersRepository.claim(orderId, courier.id)` instead of `subscribeRepository.claim(...)`.
- MUST keep the courier identity resolution unchanged: `userRepository.findBySupabaseUserId` → `deliveryUserRepository.findByUserId`, with `NotFoundError('Entregador não encontrado')` on either miss.
- MUST keep the existing not-found check for the order — use `ordersRepository.findByIdWithItems(orderId)` (or a lighter existence check) and throw `NotFoundError('Pedido não encontrado')` if absent, before attempting the claim.
- MUST keep throwing `ConflictError('Pedido já foi reivindicado')` when `claim` returns `false` (lost race or not `READY`).
- MUST drop the `SubscribeRepository` dependency from this use case if it becomes unused; update the constructor.
- MUST keep `npm run build` passing (factory wiring may defer to task_21 with a note).
</requirements>

## Subtasks
- [ ] 14.1 Swap `subscribeRepository.claim` → `ordersRepository.claim`.
- [ ] 14.2 Order existence check via `OrdersRepository`.
- [ ] 14.3 Trim unused deps; build.

## Implementation Details
`OrdersRepository.claim` (task_07) already sets `status: 'ACCEPTED'` and `acceptedAt` atomically where `status = 'READY'` and `deliveryPersonId = null`. Same optimistic-concurrency contract as before (`delivery-order-assignment` ADR-004), so the use case's error handling is unchanged — only the data source moves.

### Relevant Files
- `src/core/usecases/orders/accept-order.ts` — modified.
- `src/core/ports/orders-repository.ts` — `claim`.

### Dependent Files
- `src/infra/controllers/orders-controller.ts` (task_19) — `acceptOrder` handler (already passes `orderId`, `req.user.id`).
- `src/main/factories/order-controller-factory.ts` (task_21).

### Related ADRs
- [ADR-001](adrs/adr-001.md), [ADR-003](adrs/adr-003.md).

## Deliverables
- Modified `accept-order.ts`.
- Manual verification **(REQUIRED)**.

## Tests
- Manual verification:
  - [ ] `POST /orders/:id/accept` on a `READY` delivery order → 200; order becomes `ACCEPTED` with `deliveryPersonId` + `acceptedAt`.
  - [ ] Second concurrent accept on the same order → one 200, one 409.
  - [ ] Accept on a `PREPARING` order → 409 (not `READY`).
  - [ ] Accept as a non-courier user → 404 'Entregador não encontrado'.
- Coverage target: N/A.

## Success Criteria
- Claiming operates atomically on `Order`, gated on `READY`.
