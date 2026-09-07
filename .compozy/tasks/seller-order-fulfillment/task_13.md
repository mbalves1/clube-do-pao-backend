---
status: pending
title: "Migrate ListAvailableOrdersUseCase onto Order"
type: backend
complexity: low
dependencies:
  - task_02
  - task_07
---

# Task 13: `ListAvailableOrdersUseCase` reads `Order`, not `subscription`

## Overview
The courier available-orders feed currently queries `subscription` rows via `SubscribeRepository.findAvailable`. Switch it to `OrdersRepository.findAvailableForDelivery`, so it returns only real orders a bakery has marked `READY` ([ADR-001](adrs/adr-001.md), [ADR-003](adrs/adr-003.md)).

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include verification in deliverables
</critical>

<requirements>
- MUST change `src/core/usecases/orders/list-available-orders.ts` to depend on `OrdersRepository` instead of `SubscribeRepository`.
- MUST keep the existing date window (today → today+2, UTC) and call `ordersRepository.findAvailableForDelivery(startDate, endDate)`.
- MUST return `Order[]` (with items); update the use case's return type. The controller/route (task_19/task_20) adapts the response shape.
- MUST NOT reintroduce any `subscription`-table read here.
- MUST update `src/main/factories/order-controller-factory.ts` construction of this use case (or leave for task_21 and note it) so the build passes.
- MUST keep `npm run build` passing.
</requirements>

## Subtasks
- [ ] 13.1 Swap the injected repository and the call.
- [ ] 13.2 Update return type to `Order[]`.
- [ ] 13.3 Build (factory wiring in task_21 if needed).

## Implementation Details
`findAvailableForDelivery` already encodes `status: 'READY'`, `fulfillmentType: 'DELIVERY'`, `deliveryPersonId: null` (task_07) — the use case just supplies the date window, exactly as it does now. The `AvailableOrder` read-model type from `delivery-order-assignment` is superseded by the domain `Order`.

### Relevant Files
- `src/core/usecases/orders/list-available-orders.ts` — modified.
- `src/core/ports/orders-repository.ts` — `findAvailableForDelivery`.

### Dependent Files
- `src/infra/controllers/orders-controller.ts` (task_19) — `listAvailable` handler response.
- `src/main/factories/order-controller-factory.ts` (task_21).

### Related ADRs
- [ADR-001](adrs/adr-001.md), [ADR-003](adrs/adr-003.md).

## Deliverables
- Modified `list-available-orders.ts`.
- Manual verification **(REQUIRED)**.

## Tests
- Manual verification (dev DB, backfill from task_02 applied):
  - [ ] With one `READY`+`DELIVERY`+unclaimed order in the window → returned.
  - [ ] A `PREPARING` order, a `PICKUP` order, and a claimed order → all excluded.
  - [ ] `GET /orders/available` via `request.http` returns the expected list.
- Coverage target: N/A.

## Success Criteria
- The courier feed reflects bakery-confirmed readiness, sourced from `Order`.
