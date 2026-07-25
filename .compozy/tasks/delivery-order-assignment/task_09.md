---
status: pending
title: "ListAvailableOrdersUseCase"
type: backend
complexity: low
dependencies:
  - task_08
---

# Task 9: ListAvailableOrdersUseCase

## Overview
Implements the use case behind `GET /orders/available`: computes the 3-day window (today through today + 2) and delegates to `SubscribeRepository.findAvailable`, following the same date-window computation style already used in `ListOrdersUseCase`.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include verification in deliverables
</critical>

<requirements>
- MUST create `src/core/usecases/orders/list-available-orders.ts` exporting `ListAvailableOrdersUseCase`, constructor-injected with `SubscribeRepository`.
- MUST compute `startDate` as the start of today (UTC midnight, matching `ListOrdersUseCase`'s existing `setUTCHours(0, 0, 0, 0)` convention) and `endDate` as `startDate + 2 days` (inclusive 3-day window: today, today+1, today+2), per PRD clarification and ADR-002.
- MUST call `subscribeRepository.findAvailable(startDate, endDate)` and return its result directly — no additional filtering or transformation in this use case.
- MUST NOT accept a configurable window size — the PRD clarification fixed this at 3 days for this phase.
</requirements>

## Subtasks
- [ ] 9.1 Create `ListAvailableOrdersUseCase` with `SubscribeRepository` injected.
- [ ] 9.2 Compute the fixed 3-day UTC window, following `ListOrdersUseCase`'s existing date-math style.
- [ ] 9.3 Call and return `findAvailable(startDate, endDate)`.

## Implementation Details
Structurally mirror `src/core/usecases/orders/list-orders.ts` — same constructor-injection pattern, same UTC date-window computation style, just with a 3-day range instead of a single day and calling `findAvailable` instead of `getOrderByDay`.

### Relevant Files
- `src/core/usecases/orders/list-orders.ts` — structural model for date-window computation and use case shape.
- `src/core/ports/subscribe-repository.ts` (task_07) — `findAvailable` signature and `AvailableOrder` return type.

### Dependent Files
- `src/infra/controllers/orders-controller.ts` (task_13) — will add a `listAvailable` handler calling this use case.
- `src/main/factories/order-controller-factory.ts` (task_15) — will instantiate this use case.

## Deliverables
- New file `src/core/usecases/orders/list-available-orders.ts`.
- Manual verification **(REQUIRED)**.

## Tests
- Manual verification:
  - [ ] `execute()` returns only orders with `serviceDate` within today through today+2, with no assigned `deliveryPersonId` (verified once task_13/14 expose it over HTTP).
- Test coverage target: N/A — no automated test framework in this project.
- All manual verification scenarios passing.

## Success Criteria
- `ListAvailableOrdersUseCase` exists, correctly windowed, and typed against `AvailableOrder[]`.