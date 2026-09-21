---
status: done
title: "ListBakeryOrdersUseCase"
type: backend
complexity: low
dependencies:
  - task_05
  - task_07
  - task_10
---

# Task 11: `ListBakeryOrdersUseCase`

## Overview
Returns the orders for the authenticated bakery, with line items, optionally filtered by status and service date — the read behind `GET /orders/bakery`.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include verification in deliverables
</critical>

<requirements>
- MUST add `src/core/usecases/orders/list-bakery-orders.ts` with `execute(callerSupabaseUserId: string, filters: { status?: OrderStatus; date?: string }): Promise<Order[]>`.
- MUST resolve the bakery via `resolveOwnerBakeryId(callerSupabaseUserId, userRepository, bakeryPersonRepository)` (shared helper from task_10) — same ownership path as item management.
- MUST translate `filters.date` (`dd-mm-yyyy`) into `serviceDateFrom`/`serviceDateTo` (start/end of that UTC day) and pass `filters.status` straight through to `ordersRepository.listByBakery(bakeryId, {...})`.
- MUST return orders including their `items`.
- MUST let `resolveOwnerBakeryId`'s `ForbiddenError` (no `BakeryPerson`) propagate — do not swallow it.
- MUST inject `OrdersRepository`, `UserRepository`, `BakeryPersonRepository` via constructor (mirror `ListItemsUseCase`).
- MUST keep `npm run build` passing.
</requirements>

## Subtasks
- [x] 11.1 Create the use case; wire `resolveOwnerBakeryId`.
- [x] 11.2 Date → range translation; pass status through.
- [x] 11.3 `npm run build`.

## Implementation Details
Structurally identical to `src/core/usecases/item/list-items.ts` plus filter handling. Date parsing reuses the `dd-mm-yyyy` split used elsewhere. No validation here — the controller validates query params (task_17/task_19).

### Relevant Files
- `src/core/usecases/item/list-items.ts` — near-identical shape.
- `src/core/usecases/shared/resolve-owner-bakery-id.ts` (task_10).
- `src/core/ports/orders-repository.ts` — `listByBakery`, `BakeryOrderFilters`.

### Dependent Files
- `src/infra/controllers/orders-controller.ts` (task_19).
- `src/main/factories/order-controller-factory.ts` (task_21).

### Related ADRs
- [ADR-001](adrs/adr-001.md).

## Deliverables
- `list-bakery-orders.ts`.
- Manual verification **(REQUIRED)**.

## Tests
- Manual verification (via `request.http` once the route exists, or a scratch call):
  - [x] As a `company` user with orders → returns only that bakery's orders, each with `items`. Verified directly against the real dev DB (real `BakeryPerson`/bakery fixture) with temp `Order` fixtures.
  - [x] `status=PREPARING` filter → only preparing orders. Verified.
  - [x] `date=<dd-mm-yyyy>` filter → only that day's orders. Verified.
  - [x] As a user with no `BakeryPerson` → `ForbiddenError` (403) propagates. Verified with a temp courier user (has `User`, no `BakeryPerson`).
- Coverage target: N/A.

## Success Criteria
- Bakery-scoped, item-inclusive listing with status/date filters.
- Ownership resolution reuses the shared helper.
