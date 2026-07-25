---
status: pending
title: "UpdateOrdersUseCase: ownership check"
type: backend
complexity: medium
dependencies:
  - task_01
---

# Task 12: UpdateOrdersUseCase: ownership check

## Overview
Closes the security gap the TechSpec/PRD identified: today `PATCH /orders/:orderId/:deliveryId` accepts `deliveryId` directly from the URL with no verification, so any authenticated user can update any order's status. This task makes `UpdateOrdersUseCase` verify the caller is the courier who actually owns the claim before allowing the transition.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include verification in deliverables
</critical>

<requirements>
- MUST add a `callerSupabaseUserId: string` parameter to `UpdateOrdersUseCase.execute` (in addition to the existing `orderId`, `deliveryId`, `status`), and inject `DeliveryUserRepository` into the constructor alongside the existing `SubscribeRepository`/`OrdersRepository`.
- MUST resolve the caller via `deliveryUserRepository.findBySupabaseUserId(callerSupabaseUserId)`; throw `NotFoundError` if `null` (caller is not a registered courier).
- MUST throw `ForbiddenError` (task_01) if the resolved courier's `id` does not equal the `deliveryId` path parameter — i.e., a courier can only update orders assigned to themselves, never impersonate another `deliveryId` value.
- MUST perform this check before any existing logic in `execute` runs (the lookup via `subscribeRepository.getSubscribeById`, the `ordersRepository.findBySubscriptionId` branch, etc.) — reject early on ownership mismatch.
- MUST NOT change the existing status-transition logic itself (the `orderAllocate` branch vs. the `create` branch) — this task only adds the ownership guard in front of it.
- MUST NOT restrict which `status` values a courier can set beyond what `updateOrderSchema` already validates — this task is about *who* can call this endpoint for a given order, not which transitions are valid.
</requirements>

## Subtasks
- [ ] 12.1 Add `DeliveryUserRepository` to the constructor.
- [ ] 12.2 Add `callerSupabaseUserId` to `execute`'s parameters.
- [ ] 12.3 Resolve the caller and reject with `NotFoundError` if not a courier.
- [ ] 12.4 Reject with `ForbiddenError` if the resolved courier's `id` doesn't match the `deliveryId` parameter.
- [ ] 12.5 Confirm the existing update logic (unchanged) runs only after the ownership check passes.

## Implementation Details
See TechSpec "API Endpoints" (`PATCH /orders/:orderId/:deliveryId` row) for the intended new `403` response. This changes `UpdateOrdersUseCase.execute`'s signature, so its caller (`OrdersController.updateOrder`, task_13) must be updated in the same feature to pass `req.user.id` — do not implement this task without also completing task_13, or the codebase will not compile.

### Relevant Files
- `src/core/usecases/orders/update-orders.ts` — file to modify; add the ownership check before the existing `getSubscribeById`/`findBySubscriptionId` logic.
- `src/core/ports/delivery-user-repository.ts` — `findBySupabaseUserId`, already implemented.
- `src/core/errors/ForbiddenError.ts` (task_01), `src/core/errors/NotFoundError.ts` — errors thrown by this check.

### Dependent Files
- `src/infra/controllers/orders-controller.ts` (task_13) — `updateOrder` handler must pass `req.user.id` as the new `callerSupabaseUserId` argument.
- `src/main/factories/order-controller-factory.ts` (task_15) — must inject `DeliveryUserRepository` into `UpdateOrdersUseCase`'s constructor.

### Related ADRs
- [ADR-001: Self-Service Pull-Based Order Claiming with Real-Time Availability Feed](adrs/adr-001.md) — states ownership-restricted status updates as a core requirement.

## Deliverables
- Updated `src/core/usecases/orders/update-orders.ts` with the ownership check.
- Manual verification **(REQUIRED)**.

## Tests
- Manual verification (exercised once task_13/15 wire the controller/factory changes):
  - [ ] The courier who owns an order's claim can update its status (e.g., `ACCEPTED` → `PICKED_UP`) successfully.
  - [ ] A different courier attempting to update the same order via `PATCH /orders/:orderId/:otherDeliveryId` receives `403`.
  - [ ] A non-courier authenticated account attempting this endpoint receives `404` (not a registered courier).
  - [ ] Existing successful-update behavior (status transitions, `Order` row creation/update) is unchanged for the legitimate owner.
- Test coverage target: N/A — no automated test framework in this project.
- All manual verification scenarios passing.

## Success Criteria
- Only the owning courier can advance an order's status through this endpoint.
- No regression to the existing status-transition logic for the legitimate owner.