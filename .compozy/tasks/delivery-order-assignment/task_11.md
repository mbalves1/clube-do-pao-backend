---
status: completed
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
- MUST NOT emit the `order-available` SSE event from within this use case — `sseService` lives under `src/infra/sse/`, and this use case lives under `src/core/usecases/`; importing it here would violate the "core does not import infra" rule (`docs/architecture.md`). The emit call belongs in `OrdersController.releaseOrder` (task_13), matching how `order-status-updated` is emitted from `OrdersController.updateOrder` today, not from `UpdateOrdersUseCase`.
- MUST return enough information from `execute` (e.g., the released order/subscription's `id`, `bakeryId`, `serviceDate`) for the controller (task_13) to build the SSE payload without a second fetch.
</requirements>

## Subtasks
- [x] 11.1 Create `ReleaseOrderUseCase` with `SubscribeRepository` and `DeliveryUserRepository` injected.
- [x] 11.2 Resolve caller and fetch order, rejecting with `NotFoundError` for either missing case.
- [x] 11.3 Reject with `ForbiddenError` if not the owning courier.
- [x] 11.4 Reject with `ConflictError` if status is not `ACCEPTED`.
- [x] 11.5 Call `release` and return the released order's data on success — no SSE emit in this file (see task_13).

## Implementation Details
See TechSpec "Core Interfaces", "Integration Points" (SSE reuse), and ADR-005 (why release is the only SSE trigger point in this feature). This use case stays framework/infra-agnostic, consistent with every other file under `src/core/usecases/` — the SSE side effect is wired at the controller boundary in task_13, exactly where `order-status-updated` already lives for `updateOrder`.

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
- Manual verification (executed via `ts-node` against in-memory fake `SubscribeRepository`/`DeliveryUserRepository` implementations):
  - [x] Owning courier releases an `ACCEPTED` order → resolves, returns `{"id":42,"bakeryId":"bakery-1","serviceDate":"2026-07-26T00:00:00.000Z"}`. (Reappearing in `GET /orders/available` is `findAvailable`'s behavior, verified in task_08 — this use case's job is just to clear the claim via `release`.)
  - [x] Non-owner attempts release → threw `ForbiddenError`: "Você não tem permissão para esta ação".
  - [x] Order already `PICKED_UP` → threw `ConflictError`: "Pedido não está mais aceito".
  - [x] Nonexistent order → threw `NotFoundError`: "Pedido não encontrado".
  - [x] Return value confirmed to carry `id`, `bakeryId`, `serviceDate` (see scenario 1 output above) — sufficient for task_13's SSE payload with no second fetch.
  - [x] Bonus scenario also verified: checks pass but `release()` itself returns `false` (lost race) → threw `ConflictError`, same as the status-mismatch case, per requirement.
- Test coverage target: N/A — no automated test framework in this project.
- All manual verification scenarios passing. (End-to-end SSE delivery is verified in task_13, where the emit call actually lives.)

## Success Criteria
- `ReleaseOrderUseCase` enforces ownership and status preconditions correctly and returns the data task_13 needs to notify other couriers.