---
status: pending
title: "SubscribeRepository port: findAvailable, claim, release + AvailableOrder type"
type: backend
complexity: low
dependencies: []
---

# Task 7: SubscribeRepository port: findAvailable, claim, release + AvailableOrder type

## Overview
Extends the `SubscribeRepository` port with the three methods this feature needs: listing unassigned orders in a date window, claiming one, and releasing one. This is the contract task_08 (Prisma implementation) and tasks 09-11 (use cases) build on.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include verification in deliverables
</critical>

<requirements>
- MUST add `findAvailable(startDate: Date, endDate: Date): Promise<AvailableOrder[]>` to `SubscribeRepository`, matching TechSpec "Core Interfaces" and ADR-002 (queries `Subscription`, not `Order`).
- MUST add `claim(id: number, deliveryPersonId: string): Promise<boolean>` — returns `false` when the order is already claimed (per ADR-004's optimistic-concurrency approach), `true` on success.
- MUST add `release(id: number, deliveryPersonId: string): Promise<boolean>` — returns `false` when the caller does not currently own the claim or the order is no longer in `ACCEPTED` status, `true` on success.
- MUST define the `AvailableOrder` type in this file (or a location the port imports from), with the fields listed in TechSpec "Data Models": `id`, `bakeryId`, `serviceDate`, `serviceStartAt`, `serviceEndAt`, `deliveryStartAt`, `deliveryEndAt`, `status`.
- MUST NOT change any existing method on `SubscribeRepository` (`create`, `getList`, `getOrderByDay`, `updateOrder`, `getSubscribeById`, `getAll`) — this is a purely additive change.
</requirements>

## Subtasks
- [ ] 7.1 Define the `AvailableOrder` type.
- [ ] 7.2 Add `findAvailable(startDate, endDate)` to the interface.
- [ ] 7.3 Add `claim(id, deliveryPersonId)` to the interface, documented as returning `false` (not throwing) on a lost race.
- [ ] 7.4 Add `release(id, deliveryPersonId)` to the interface, documented as returning `false` (not throwing) when not owner or wrong status.

## Implementation Details
See TechSpec "Core Interfaces" for the exact method shapes and ADR-002/ADR-004 for the rationale behind querying `Subscription` and using boolean-returning conditional updates instead of throwing from the repository layer (error mapping to `ConflictError`/`ForbiddenError`/`NotFoundError` happens in the use cases, tasks 09-11, which can distinguish these cases using `getSubscribeById` before calling `claim`/`release`).

### Relevant Files
- `src/core/ports/subscribe-repository.ts` — file to modify; currently has `SubscribeCreateData` and the six existing methods.
- `src/core/entities/orders.ts` — `OrderStatus` type, reused for `AvailableOrder.status` typing.

### Dependent Files
- `src/infra/repositories/prisma-subscribe-repository.ts` (task_08) — implements the three new methods.
- `src/core/usecases/orders/list-available-orders.ts` (task_09) — calls `findAvailable`.
- `src/core/usecases/orders/accept-order.ts` (task_10) — calls `claim`.
- `src/core/usecases/orders/release-order.ts` (task_11) — calls `release`.

## Deliverables
- Updated `src/core/ports/subscribe-repository.ts` with the three new methods and `AvailableOrder` type.
- Manual verification **(REQUIRED)**.

## Tests
- Manual verification:
  - [ ] `npm run build` shows the expected "not implemented" type errors at `PrismaSubscribeRepository` (confirms the interface change is picked up; resolved by task_08).
- Test coverage target: N/A — no automated test framework in this project.
- All manual verification scenarios passing.

## Success Criteria
- `SubscribeRepository` declares `findAvailable`, `claim`, `release`, and `AvailableOrder` is defined.
- No existing method signature changed.