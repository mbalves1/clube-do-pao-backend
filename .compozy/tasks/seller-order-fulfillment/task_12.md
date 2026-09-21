---
status: done
title: "UpdateOrderStatusBySellerUseCase (+ SSE on READY)"
type: backend
complexity: medium
dependencies:
  - task_04
  - task_05
  - task_07
  - task_10
---

# Task 12: `UpdateOrderStatusBySellerUseCase`

## Overview
The seller's single write path for an order's lifecycle: `PENDING → PREPARING → READY`, pre-pickup `CANCEL`, and the `PICKUP` close (`READY → PICKED_UP`). Enforces bakery ownership, validates the transition via task_04's module, sets the right timestamps, and emits SSE so a `READY` delivery order enters the courier pool ([ADR-003](adrs/adr-003.md)).

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include verification in deliverables
</critical>

<requirements>
- MUST add `src/core/usecases/orders/update-order-status-by-seller.ts` with `execute(callerSupabaseUserId: string, orderId: number, targetStatus: OrderStatus): Promise<Order>`.
- MUST resolve the caller's bakery via the shared `resolveOwnerBakeryId`.
- MUST load the order via `ordersRepository.findByIdWithItems(orderId)`; throw `NotFoundError('Pedido não encontrado')` if absent; throw `ForbiddenError('Você não tem permissão para esta ação')` if `order.bakeryId !== resolvedBakeryId`.
- MUST call `assertOrderTransition(order.status, targetStatus, 'seller', order.fulfillmentType)` (throws 422 on illegal move).
- MUST additionally reject `targetStatus === 'CANCELED'` when the order is a `DELIVERY` order that already has `deliveryPersonId` set — throw `ConflictError('Pedido já foi reivindicado por um entregador')` (the seller's cancel window closes once a courier claims it).
- MUST set timestamps in the status patch: `PREPARING → { preparingAt: now }`, `READY → { readyAt: now }`, `CANCELED → { canceledAt: now }`, `PICKED_UP → { pickedUpAt: now }`. MUST call `ordersRepository.updateStatus(orderId, targetStatus, patch)` and return the updated order.
- MUST emit on `sseService` after a successful update: always `order-status-updated` `{ orderId, status: targetStatus }`; additionally, when `targetStatus === 'READY' && order.fulfillmentType === 'DELIVERY'`, emit `order-available` `{ id: orderId, bakeryId: order.bakeryId, serviceDate: order.serviceDate }` (same event name/shape `ReleaseOrderUseCase` already emits).
- MUST inject `OrdersRepository`, `UserRepository`, `BakeryPersonRepository` (constructor); import `sseService` directly like `OrdersController` does today.
- MUST keep `npm run build` passing.
</requirements>

## Subtasks
- [x] 12.1 Ownership resolution + order load + 404/403.
- [x] 12.2 `assertOrderTransition` + the extra `READY→CANCELED` claimed-order guard.
- [x] 12.3 Timestamp patch per target status; persist; return.
- [x] 12.4 SSE emit (always `order-status-updated`; `order-available` on READY+DELIVERY).

## Implementation Details
Ownership/resolution mirrors `update-item.ts`. The transition module (task_04) handles the shape of the move; this use case layers the two stateful preconditions it can't know: bakery ownership and "not yet claimed" for the cancel case. `sseService` is a singleton imported from `src/infra/sse/sse-service` — the controller already imports it that way; a core use case importing an infra singleton is the existing pattern here (`OrdersController` does it), acceptable per the sibling feature.

### Relevant Files
- `src/core/usecases/item/update-item.ts` — ownership/resolution shape.
- `src/core/usecases/orders/order-status-transitions.ts` (task_04).
- `src/infra/controllers/orders-controller.ts` — `sseService.emit` usage precedent.
- `src/core/usecases/orders/release-order.ts` — `order-available` event shape.

### Dependent Files
- `src/infra/controllers/orders-controller.ts` (task_19).
- `src/main/factories/order-controller-factory.ts` (task_21).

### Related ADRs
- [ADR-003](adrs/adr-003.md).

## Deliverables
- `update-order-status-by-seller.ts`.
- Manual verification **(REQUIRED)**.

## Tests
- Manual verification:
  - [x] `PENDING→PREPARING→READY` on an owned order succeeds; `preparingAt`/`readyAt` set. Verified live against the dev DB with temp `Order` fixtures on the real `BakeryPerson`'s bakery.
  - [x] `PENDING→READY` (skip) → 422. Verified (`InvalidOrderStatusTransitionError`).
  - [x] Order id from another bakery → 403. Verified with a fixture on a second real bakery.
  - [x] Delivery order at `READY`: emits `order-available` on `/events`; pickup order at `READY`: no `order-available`. Code path verified directly (the `sseService.emit` call is gated on `fulfillmentType === 'DELIVERY'`); no SSE client was attached during the DB-level check, so the emitted payload itself wasn't observed over `/events` in this run — the gating logic was exercised for both fulfillment types.
  - [x] `READY→CANCELED` on an unclaimed delivery order → success; on a claimed one → 409. Verified both.
  - [x] Pickup order `READY→PICKED_UP` via this use case → success; delivery order `READY→ACCEPTED` via this use case → 422. Verified both.
- Coverage target: N/A.

## Success Criteria
- Seller can drive an order to `READY` (and close a pickup) and no further into courier territory.
- `READY` on a delivery order releases it into the courier pool via the existing SSE event.
