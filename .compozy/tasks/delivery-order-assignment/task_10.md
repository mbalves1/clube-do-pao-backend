---
status: pending
title: "AcceptOrderUseCase"
type: backend
complexity: medium
dependencies:
  - task_08
---

# Task 10: AcceptOrderUseCase

## Overview
Implements the use case behind `POST /orders/:id/accept`: resolves the authenticated caller's `DeliveryPerson` record, verifies the order exists, and attempts the atomic claim — returning distinct errors for "not a courier," "order doesn't exist," and "already claimed by someone else."

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include verification in deliverables
</critical>

<requirements>
- MUST create `src/core/usecases/orders/accept-order.ts` exporting `AcceptOrderUseCase`, constructor-injected with `SubscribeRepository` and `DeliveryUserRepository`.
- MUST accept `(orderId: number, supabaseUserId: string)` as `execute`'s parameters.
- MUST resolve the caller via `deliveryUserRepository.findBySupabaseUserId(supabaseUserId)`; if `null`, throw `NotFoundError` (the authenticated account is not a registered courier).
- MUST verify the order exists via `subscribeRepository.getSubscribeById(orderId)` before attempting the claim; if `null`, throw `NotFoundError`.
- MUST call `subscribeRepository.claim(orderId, courier.id)`; if it returns `false`, throw `ConflictError` (order was claimed by someone else between the feed read and this request — this is the PRD's "race to claim" edge case).
- MUST NOT enforce any cap on how many orders one courier can hold concurrently — explicitly out of scope per PRD Non-Goals.
</requirements>

## Subtasks
- [ ] 10.1 Create `AcceptOrderUseCase` with `SubscribeRepository` and `DeliveryUserRepository` injected.
- [ ] 10.2 Resolve the caller's `DeliveryPerson`, rejecting with `NotFoundError` if not a courier.
- [ ] 10.3 Verify the order exists, rejecting with `NotFoundError` if not.
- [ ] 10.4 Attempt the claim, rejecting with `ConflictError` if it was already taken.

## Implementation Details
See TechSpec "Core Interfaces" for the sketch of this use case's shape. Use `ConflictError` (`src/core/errors/ConflictError.ts`) and `NotFoundError` (`src/core/errors/NotFoundError.ts`), both already existing in this codebase — no new error class needed for this task (unlike task_11/12, which need `ForbiddenError` from task_01).

### Relevant Files
- `src/core/usecases/user/create-user.ts` — reference for how a use case in this codebase catches a specific failure and maps it to a specific `AppError` subclass.
- `src/core/ports/subscribe-repository.ts` (task_07) — `claim`, `getSubscribeById`.
- `src/core/ports/delivery-user-repository.ts` — `findBySupabaseUserId`, already implemented.
- `src/core/errors/ConflictError.ts`, `src/core/errors/NotFoundError.ts` — errors thrown by this use case.

### Dependent Files
- `src/infra/controllers/orders-controller.ts` (task_13) — will add an `acceptOrder` handler calling this use case, passing `req.user.id` as `supabaseUserId`.
- `src/main/factories/order-controller-factory.ts` (task_15) — will instantiate this use case with both repositories.

### Related ADRs
- [ADR-001: Self-Service Pull-Based Order Claiming](adrs/adr-001.md) — why claiming is self-service/pull-based.
- [ADR-004: Dedicated Accept/Release Endpoints with Optimistic Concurrency Control](adrs/adr-004.md) — the `ConflictError`-on-lost-race behavior this task implements.

## Deliverables
- New file `src/core/usecases/orders/accept-order.ts`.
- Manual verification **(REQUIRED)**.

## Tests
- Manual verification:
  - [ ] A registered courier can claim an existing, unassigned order.
  - [ ] A non-courier account (e.g., a `customer`) attempting to accept throws `NotFoundError`.
  - [ ] Accepting a nonexistent order ID throws `NotFoundError`.
  - [ ] Accepting an order already claimed by another courier throws `ConflictError`.
- Test coverage target: N/A — no automated test framework in this project.
- All manual verification scenarios passing.

## Success Criteria
- `AcceptOrderUseCase` correctly distinguishes not-a-courier, not-found, and already-claimed cases with the right error types.