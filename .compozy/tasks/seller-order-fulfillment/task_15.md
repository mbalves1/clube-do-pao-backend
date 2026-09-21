---
status: done
title: "Migrate ReleaseOrderUseCase onto Order.release"
type: backend
complexity: medium
dependencies:
  - task_02
  - task_07
---

# Task 15: `ReleaseOrderUseCase` releases an `Order`

## Overview
Courier release currently reads `subscribeRepository.getSubscribeById` + `subscribeRepository.release`. Move to `OrdersRepository` (`findByIdWithItems` + `release`), keeping ownership and the `ACCEPTED`-only precondition, and keep emitting `order-available` ([ADR-001](adrs/adr-001.md), [ADR-003](adrs/adr-003.md)).

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include verification in deliverables
</critical>

<requirements>
- MUST change `src/core/usecases/orders/release-order.ts` to load the order via `ordersRepository.findByIdWithItems(orderId)` and release via `ordersRepository.release(orderId, courier.id)`.
- MUST keep courier identity resolution unchanged (`findBySupabaseUserId` → `findByUserId`, `NotFoundError` on miss).
- MUST keep the checks and their errors:
  - order missing → `NotFoundError('Pedido não encontrado')`.
  - `order.deliveryPersonId !== courier.id` → `ForbiddenError('Você não tem permissão para esta ação')`.
  - `order.status !== 'ACCEPTED'` → `ConflictError('Pedido não está mais aceito')`.
  - `release` returns `false` → `ConflictError('Pedido não está mais aceito')`.
- MUST keep returning `ReleasedOrder { id, bakeryId, serviceDate }` — now sourced from the `Order` (`id` is `number`, `bakeryId` from `Order.bakeryId`).
- MUST keep the caller-side `sseService.emit('order-available', released)` in `OrdersController.releaseOrder` working (event shape unchanged).
- MUST drop the now-unused `SubscribeRepository` dependency; update the constructor.
- MUST keep `npm run build` passing (factory wiring may defer to task_21 with a note).
</requirements>

## Subtasks
- [x] 15.1 Swap the reads/writes to `OrdersRepository`.
- [x] 15.2 Preserve every check + error message.
- [x] 15.3 Trim unused deps; build.

## Implementation Details
`OrdersRepository.release` (task_07) is the conditional `updateMany` (`where owner + status ACCEPTED → status READY, deliveryPersonId null, acceptedAt null`) — the mirror of the current subscription version. The use case still does the explicit ownership/status checks first for clear error messages, then relies on `release`'s boolean for the race.

### Relevant Files
- `src/core/usecases/orders/release-order.ts` — modified.
- `src/core/ports/orders-repository.ts` — `release`, `findByIdWithItems`.
- `src/infra/controllers/orders-controller.ts` — `releaseOrder` emits `order-available`.

### Dependent Files
- `src/main/factories/order-controller-factory.ts` (task_21).

### Related ADRs
- [ADR-001](adrs/adr-001.md), [ADR-003](adrs/adr-003.md).

## Deliverables
- Modified `release-order.ts`.
- Manual verification **(REQUIRED)**.

## Tests
- Manual verification:
  - [x] Owner releases an `ACCEPTED` order → 200; order back to `READY`, `deliveryPersonId` null. Verified live against the dev DB. `order-available` emission is unchanged (`OrdersController.releaseOrder` still calls `sseService.emit`), not re-observed over `/events` in this run — no SSE client was attached during the DB-level check.
  - [x] Non-owner release → 403. Verified.
  - [x] Release of a `PICKED_UP` order → 409. Verified.
  - [x] Released order reappears in `GET /orders/available`. Implied by task_13's `findAvailableForDelivery` check (status `READY`+`DELIVERY`+unclaimed) — the release use case above puts the order back into exactly that state.
- Coverage target: N/A.

## Success Criteria
- Release operates on `Order`, ownership + `ACCEPTED` gate preserved, availability event still fires.
