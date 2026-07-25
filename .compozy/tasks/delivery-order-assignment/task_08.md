---
status: pending
title: "PrismaSubscribeRepository: implement findAvailable, claim, release"
type: backend
complexity: medium
dependencies:
  - task_07
---

# Task 8: PrismaSubscribeRepository: implement findAvailable, claim, release

## Overview
Implements the three new `SubscribeRepository` methods against Prisma. `claim` is the highest-risk piece of logic in this feature: it must use an atomic conditional update to guarantee exactly one of two simultaneous claim attempts succeeds (ADR-004), with no explicit transaction or row lock needed.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include verification in deliverables
</critical>

<requirements>
- MUST implement `findAvailable(startDate, endDate)` as `prisma.subscription.findMany({ where: { serviceDate: { gte: startDate, lte: endDate }, deliveryPersonId: null } })`, mapped to `AvailableOrder[]`.
- MUST implement `claim(id, deliveryPersonId)` using `prisma.subscription.updateMany({ where: { id, deliveryPersonId: null }, data: { deliveryPersonId, status: 'ACCEPTED' } })` and return `true` only if `count === 1`, `false` if `count === 0`. MUST NOT throw for the "already claimed" case — that is the use case's responsibility (per ADR-004 and task_07).
- MUST implement `release(id, deliveryPersonId)` using `prisma.subscription.updateMany({ where: { id, deliveryPersonId, status: 'ACCEPTED' }, data: { deliveryPersonId: null, status: 'PENDING' } })` and return `true`/`false` on `count`, same convention as `claim`.
- MUST reuse the existing `getSubscribeById` method (already implemented) as the read path use cases will call first to distinguish "not found" from "already claimed"/"not owner" — no new read method is needed for that distinction.
- MUST follow this file's existing `Promise<any>` return convention only where already used; the three new methods should use their properly typed signatures from task_07 (`AvailableOrder[]`, `boolean`, `boolean`) rather than `any`.
</requirements>

## Subtasks
- [ ] 8.1 Implement `findAvailable` with the date-range + `deliveryPersonId: null` filter.
- [ ] 8.2 Implement `claim` with the atomic conditional `updateMany`, returning a boolean from the affected count.
- [ ] 8.3 Implement `release` with the atomic conditional `updateMany` (ownership + status guard), returning a boolean from the affected count.
- [ ] 8.4 Map `findAvailable`'s Prisma results to the `AvailableOrder` type from task_07.

## Implementation Details
See TechSpec "Core Interfaces" and ADR-002 (why `Subscription`, not `Order`) and ADR-004 (why an atomic conditional update instead of a transaction/lock). Follow this file's existing style — plain async methods on the class, no separate mapper file for this module (consistent with how `getOrderByDay`/`getAll` are written today, no intermediate mapping function needed beyond the `AvailableOrder` shape for `findAvailable`).

### Relevant Files
- `src/infra/repositories/prisma-subscribe-repository.ts` — file to modify; implements `SubscribeRepository`.
- `src/core/ports/subscribe-repository.ts` (task_07) — interface being implemented.
- `prisma/schema.prisma` — `Subscription` model, confirms `deliveryPersonId` and `status` are already nullable/present fields, no migration needed.

### Dependent Files
- `src/core/usecases/orders/list-available-orders.ts` (task_09) — calls `findAvailable`.
- `src/core/usecases/orders/accept-order.ts` (task_10) — calls `claim` and `getSubscribeById`.
- `src/core/usecases/orders/release-order.ts` (task_11) — calls `release` and `getSubscribeById`.

### Related ADRs
- [ADR-002: Available Orders Feed Sourced from Subscription, 3-Day Window](adrs/adr-002.md) — why this reads `Subscription`, not `Order`.
- [ADR-004: Dedicated Accept/Release Endpoints with Optimistic Concurrency Control](adrs/adr-004.md) — why `claim`/`release` use conditional updates instead of transactions.

## Deliverables
- Updated `src/infra/repositories/prisma-subscribe-repository.ts` implementing all three new methods.
- Manual verification, including a concurrency check **(REQUIRED)**.

## Tests
- Manual verification:
  - [ ] `findAvailable` with a 3-day window returns only `Subscription` rows with `deliveryPersonId: null` in that range, excluding already-assigned ones.
  - [ ] `claim` on an unassigned order sets `deliveryPersonId`/`status` and returns `true`.
  - [ ] `claim` on an already-assigned order returns `false` and does not modify the row.
  - [ ] `release` by the owning delivery person while `status === 'ACCEPTED'` clears `deliveryPersonId`, resets `status` to `PENDING`, and returns `true`.
  - [ ] `release` attempted by a non-owner, or when `status !== 'ACCEPTED'` (e.g., already `PICKED_UP`), returns `false` and does not modify the row.
  - [ ] Concurrency: two near-simultaneous `claim` calls for the same order (e.g., two terminal `curl`/script calls fired back to back) result in exactly one `true` and one `false`.
- Test coverage target: N/A — no automated test framework in this project.
- All manual verification scenarios passing, including the concurrency check.

## Success Criteria
- All three methods implemented and manually verified, including the double-claim race condition.
- `npm run build` compiles with no errors.