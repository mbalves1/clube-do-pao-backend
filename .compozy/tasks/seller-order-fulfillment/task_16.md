---
status: pending
title: "Migrate UpdateOrdersUseCase (courier status) onto Order + transition module"
type: backend
complexity: medium
dependencies:
  - task_02
  - task_04
  - task_07
---

# Task 16: `UpdateOrdersUseCase` — courier status updates on `Order`

## Overview
The generic courier status update (`PATCH /orders/:orderId/:deliveryId`) currently does a confusing double-write across `subscription` and a lazily-created `Order`. Rewrite it to operate solely on `Order`, with the ownership check and the task_04 transition module ([ADR-001](adrs/adr-001.md), [ADR-003](adrs/adr-003.md)).

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include verification in deliverables
</critical>

<requirements>
- MUST rewrite `src/core/usecases/orders/update-orders.ts` so `execute(orderId, deliveryId, status, callerSupabaseUserId)`:
  - resolves the courier (`findBySupabaseUserId` → `findByUserId`), `NotFoundError('Entregador não encontrado')` on miss.
  - `ForbiddenError('Você não tem permissão para esta ação')` if `courier.id !== deliveryId`.
  - loads the order via `ordersRepository.findByIdWithItems(orderId)`; `NotFoundError('Pedido não encontrado')` if absent.
  - `ForbiddenError` if `order.deliveryPersonId !== courier.id` (courier must own the claim).
  - calls `assertOrderTransition(order.status, status, 'courier', order.fulfillmentType)` (422 on illegal move — this naturally rejects `CANCELED` and any seller-only target for a courier).
  - persists via `ordersRepository.updateStatus(orderId, status, patch)` with `PICKED_UP → { pickedUpAt: now }`, `DELIVERED → { deliveredAt: now }`.
  - returns the updated `Order`.
- MUST NOT write to `subscription` at all — remove `subscribeRepository.updateOrder` and `ordersRepository.create/findBySubscriptionId` usage.
- MUST keep the controller's `sseService.emit('order-status-updated', { orderId, deliveryId, status })` working (unchanged).
- MUST drop unused constructor deps (`SubscribeRepository`); keep `OrdersRepository`, `DeliveryUserRepository`, `UserRepository`.
- MUST keep the route path `PATCH /orders/:orderId/:deliveryId` (task_20 keeps it; `orderId` now = `Order.id`).
- MUST keep `npm run build` passing.
</requirements>

## Subtasks
- [ ] 16.1 Rewrite around `OrdersRepository` + `assertOrderTransition`.
- [ ] 16.2 Ownership (courier id == `deliveryId` == `order.deliveryPersonId`).
- [ ] 16.3 Timestamp patch; remove all `subscription` writes.
- [ ] 16.4 Trim deps; build.

## Implementation Details
This deletes the "if `orderAllocate` exists update else create" branch entirely — with a real `Order` per fulfillment (backfill task_02 + generation task_09), the order always exists. The transition module supersedes the current unchecked status assignment.

### Relevant Files
- `src/core/usecases/orders/update-orders.ts` — rewritten.
- `src/core/usecases/orders/order-status-transitions.ts` (task_04).
- `src/core/usecases/orders/update-order-status-by-seller.ts` (task_12) — sibling pattern for the seller side.

### Dependent Files
- `src/infra/controllers/orders-controller.ts` (task_19) — `updateOrder` handler (already passes the 4 args).
- `src/main/factories/order-controller-factory.ts` (task_21).
- `src/infra/http/validators/order-validator.ts` (task_17) — `updateOrderSchema` narrowed to courier statuses.

### Related ADRs
- [ADR-001](adrs/adr-001.md), [ADR-003](adrs/adr-003.md).

## Deliverables
- Rewritten `update-orders.ts`.
- Manual verification **(REQUIRED)**.

## Tests
- Manual verification:
  - [ ] Owner courier `ACCEPTED→PICKED_UP→DELIVERED` → 200 each; timestamps set; no `subscription` row touched.
  - [ ] `deliveryId` in the URL ≠ authenticated courier → 403.
  - [ ] Courier not owning the claim → 403.
  - [ ] Illegal move (`ACCEPTED→DELIVERED` skipping `PICKED_UP`, or `→CANCELED`) → 422.
  - [ ] `order-status-updated` still emitted on `/events`.
- Coverage target: N/A.

## Success Criteria
- Courier status updates are single-write on `Order`, ownership-checked, transition-validated.
- No `subscription` mutation remains anywhere in the order flow (grep clean).
