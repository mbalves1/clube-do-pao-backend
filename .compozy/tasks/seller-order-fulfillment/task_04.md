---
status: completed
title: "order-status-transitions.ts module + InvalidOrderStatusTransitionError"
type: backend
complexity: medium
dependencies:
  - task_03
---

# Task 4: Actor-aware order status transition module

## Overview
A single pure core module that defines every legal `OrderStatus` transition and who may make it, used by both the seller status use case (task_12) and the courier status use case (task_16). Plus the error it throws.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include verification in deliverables
</critical>

<requirements>
- MUST add `src/core/errors/InvalidOrderStatusTransitionError.ts` extending `AppError` with status `422`, default message e.g. `'Transição de status inválida'` — mirror `src/core/errors/ConflictError.ts` / `UnprocessableEntityError.ts` structure exactly.
- MUST add `src/core/usecases/orders/order-status-transitions.ts` exporting `assertOrderTransition(from: OrderStatus, to: OrderStatus, actor: 'seller' | 'courier', fulfillmentType: FulfillmentType): void` that throws `InvalidOrderStatusTransitionError` for any move not in the table.
- MUST implement exactly the transition table in the TechSpec ("Core Interfaces"):
  - seller, any fulfillment: `PENDING→PREPARING`, `PREPARING→READY`, `{PENDING,PREPARING,READY}→CANCELED`.
  - seller, `PICKUP` only: `READY→PICKED_UP`.
  - courier, `DELIVERY` only: `READY→ACCEPTED`, `ACCEPTED→READY`, `ACCEPTED→PICKED_UP`, `PICKED_UP→DELIVERED`.
- MUST NOT itself check ownership or the `deliveryPersonId`-null condition for `READY→CANCELED` — those are use-case concerns; this module only validates the `(from,to,actor,fulfillmentType)` shape.
- MUST be a pure function — no repository, no I/O, no Prisma.
- MUST keep `npm run build` passing.
</requirements>

## Subtasks
- [x] 4.1 Add `InvalidOrderStatusTransitionError` (422).
- [x] 4.2 Add `order-status-transitions.ts` with the full table.
- [x] 4.3 Exhaustively sanity-check every legal move passes and a sample of illegal moves throw.

## Implementation Details
A `Record` keyed by `actor` → `fulfillmentType` → `from` → allowed `to[]`, or a flat list of tuples filtered — either is fine; keep it readable and total. `AppError` subclasses take `(message = default, statusCode)` per `ConflictError.ts`. There is already an `UnprocessableEntityError` (422) in `src/core/errors/` — a distinct named class is still preferred here so callers/tests can assert the specific failure, but reusing `UnprocessableEntityError` with a specific message is acceptable if you note the choice.

### Relevant Files
- `src/core/errors/ConflictError.ts`, `UnprocessableEntityError.ts` — structural reference.
- `src/core/entities/orders.ts` — `OrderStatus`, `FulfillmentType` (from task_03).

### Dependent Files
- `src/core/usecases/orders/update-order-status-by-seller.ts` (task_12).
- `src/core/usecases/orders/update-orders.ts` (task_16).

### Related ADRs
- [ADR-003](adrs/adr-003.md).

## Deliverables
- `order-status-transitions.ts` + `InvalidOrderStatusTransitionError.ts`.
- Manual verification **(REQUIRED)**.

## Tests
- Manual verification (scratch script calling `assertOrderTransition`, run via `ts-node --transpile-only`, then deleted):
  - [x] Every row in the TechSpec table returns without throwing — all 15 legal moves (10 seller-any, 1 seller-pickup, 4 courier-delivery) passed.
  - [x] `assertOrderTransition('PENDING','READY','seller','DELIVERY')` throws `InvalidOrderStatusTransitionError` (422).
  - [x] `assertOrderTransition('READY','ACCEPTED','seller','DELIVERY')` throws (courier-only move).
  - [x] `assertOrderTransition('READY','PICKED_UP','seller','DELIVERY')` throws (pickup-only move).
  - [x] `assertOrderTransition('READY','PICKED_UP','seller','PICKUP')` passes.
  - [x] `assertOrderTransition('DELIVERED','PENDING','courier','DELIVERY')` throws.
  - Plus 4 extra illegal edges checked for good measure (wrong-fulfillment courier move, seller attempting a courier move, transition out of a terminal state, skipping `READY`) — all correctly threw.
- Coverage target: N/A.

## Success Criteria
- One module is the single source of truth for legal transitions. ✅
- Illegal moves raise a 422 `AppError` subclass caught by existing controller error handling. ✅ (`InvalidOrderStatusTransitionError extends AppError`, statusCode 422, same shape as `ConflictError`/`UnprocessableEntityError`).
