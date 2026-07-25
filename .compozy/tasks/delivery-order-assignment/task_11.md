---
status: pending
title: "ReleaseOrderUseCase"
type: backend
complexity: medium
dependencies:
  - task_01
  - task_08
---

# Task 11: ReleaseOrderUseCase

## Overview
Implements the use case behind `POST /orders/:id/release`: lets the courier who claimed an order return it to the pool while it is still `ACCEPTED`, and notifies other couriers in real time via the existing SSE channel so the order reappears in their available feed.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include verification in deliverables
</critical>

<requirements>
- MUST create `src/core/usecases/orders/release-order.ts` exporting `ReleaseOrderUseCase`, constructor-injected with `SubscribeRepository` and `DeliveryUserRepository`.
- MUST accept `(orderId: number, supabaseUserId: string)` as `execute`'s parameters.
- MUST resolve the caller via `deliveryUserRepository.findBySupabaseUserId`; throw `NotFoundError` if `null`.
- MUST fetch the order via `subscribeRepository.getSubscribeById(orderId)` before releasing, to distinguish failure cases; throw `NotFoundError` if the order doesn't exist.
- MUST throw `ForbiddenError` (task_01) if the fetched order's `deliveryPersonId` does not match the resolved courier's `id`.
- MUST throw `ConflictError` if the fetched order's `status` is not `ACCEPTED` (e.g., already `PICKED_UP`) — per PRD, release is only allowed before pickup.
- MUST call `subscribeRepository.release(orderId, courier.id)` only after the above checks pass, and treat a `false` return (lost race with a status change) the same as the `ConflictError` case above.
- MUST emit an `order-available` SSE event via the existing `sseService` (`src/infra/sse/sse-service.ts`) after a successful release, with a payload containing at least `orderId`/`subscriptionId`, `bakeryId`, and `serviceDate`, per ADR-005.
</requirements>

## Subtasks
- [ ] 11.1 Create `ReleaseOrderUseCase` with `SubscribeRepository` and `DeliveryUserRepository` injected.
- [ ] 11.2 Resolve caller and fetch order, rejecting with `NotFoundError` for either missing case.
- [ ] 11.3 Reject with `ForbiddenError` if not the owning courier.
- [ ] 11.4 Reject with `ConflictError` if status is not `ACCEPTED`.
- [ ] 11.5 Call `release`, and emit `order-available` via `sseService` on success.

## Implementation Details
See TechSpec "Core Interfaces", "Integration Points" (SSE reuse), and ADR-005 (why this is the only SSE trigger point in this feature). Follow `OrdersController.updateOrder`'s existing pattern for calling `sseService.emit(...)` after a successful write — that call currently lives in the controller (task_13 will move/add the equivalent call there, or this use case can emit directly; see task_13 for the final decision on where the emit call lives, to avoid duplicating it in two layers).

### Relevant Files
- `src/infra/sse/sse-service.ts` — `sseService.emit(event, data)`, the existing SSE mechanism to reuse.
- `src/infra/controllers/orders-controller.ts` — shows the existing `order-status-updated` emit call pattern (`sseService.emit('order-status-updated', {...})` after `updateOrdersUseCase.execute`).
- `src/core/errors/ForbiddenError.ts` (task_01), `src/core/errors/ConflictError.ts`, `src/core/errors/NotFoundError.ts` — errors thrown by this use case.
- `src/core/ports/subscribe-repository.ts` (task_07) — `release`, `getSubscribeById`.

### Dependent Files
- `src/infra/controllers/orders-controller.ts` (task_13) — will add a `releaseOrder` handler calling this use case.
- `src/main/factories/order-controller-factory.ts` (task_15) — will instantiate this use case.

### Related ADRs
- [ADR-004: Dedicated Accept/Release Endpoints with Optimistic Concurrency Control](adrs/adr-004.md)
- [ADR-005: SSE Availability Notification Scoped to Release Events Only](adrs/adr-005.md)

## Deliverables
- New file `src/core/usecases/orders/release-order.ts`.
- Manual verification **(REQUIRED)**.

## Tests
- Manual verification:
  - [ ] The owning courier can release an order in `ACCEPTED` status; it becomes unassigned and reappears in `GET /orders/available`.
  - [ ] A different courier (not the owner) attempting to release throws `ForbiddenError`.
  - [ ] Releasing an order already in `PICKED_UP` status throws `ConflictError`.
  - [ ] A connected SSE client (`GET /events`) receives an `order-available` event on successful release.
  - [ ] Releasing a nonexistent order ID throws `NotFoundError`.
- Test coverage target: N/A — no automated test framework in this project.
- All manual verification scenarios passing.

## Success Criteria
- `ReleaseOrderUseCase` enforces ownership and status preconditions correctly and emits the SSE event on success.