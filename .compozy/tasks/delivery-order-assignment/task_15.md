---
status: pending
title: "order-controller-factory.ts: wire new use cases"
type: backend
complexity: low
dependencies:
  - task_09
  - task_10
  - task_11
  - task_12
  - task_13
---

# Task 15: order-controller-factory.ts: wire new use cases

## Overview
Updates `makeOrdersController` to instantiate the three new use cases (`ListAvailableOrdersUseCase`, `AcceptOrderUseCase`, `ReleaseOrderUseCase`) and inject `DeliveryUserRepository` into `UpdateOrdersUseCase` (task_12's constructor change), then pass all five use cases into `OrdersController`. This is the final wiring step — after this task, the feature is reachable end-to-end.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include verification in deliverables
</critical>

<requirements>
- MUST instantiate `PrismaDeliveryUserRepository` in this factory (not currently constructed here) and pass it to `UpdateOrdersUseCase` (per task_12) and to `AcceptOrderUseCase`/`ReleaseOrderUseCase` (per tasks 10-11).
- MUST instantiate `ListAvailableOrdersUseCase`, `AcceptOrderUseCase`, and `ReleaseOrderUseCase`, each with the repositories their constructors require.
- MUST pass all five use cases (`list`, `updateOrders`, `listAvailable`, `acceptOrder`, `releaseOrder`) into `OrdersController`'s constructor, matching the parameter order task_13 defines.
- MUST NOT change how `PrismaSubscribeRepository`/`PrismaOrdersRepository` are constructed — only add the new use cases and the new repository instance.
</requirements>

## Subtasks
- [ ] 15.1 Instantiate `PrismaDeliveryUserRepository`.
- [ ] 15.2 Instantiate `ListAvailableOrdersUseCase`, `AcceptOrderUseCase`, `ReleaseOrderUseCase`.
- [ ] 15.3 Update `UpdateOrdersUseCase`'s construction to include `PrismaDeliveryUserRepository` (task_12's new dependency).
- [ ] 15.4 Pass all five use cases into `OrdersController`'s constructor.

## Implementation Details
See TechSpec "Development Sequencing" Build Order step 6. Follow this file's existing flat instantiation style (repository → use case → controller, all in one function body) — no new abstraction needed for five use cases instead of two.

### Relevant Files
- `src/main/factories/order-controller-factory.ts` — file to modify.
- `src/infra/repositories/prisma-delivery-user-repository.ts` — repository to instantiate here for the first time in this factory.
- `src/infra/controllers/orders-controller.ts` (task_13) — defines the constructor shape this factory must match.

### Dependent Files
- `src/main/app.ts` — already calls `makeOrdersController()`; no change needed, the factory's external signature is unchanged.

## Deliverables
- Updated `src/main/factories/order-controller-factory.ts` wiring all five use cases into `OrdersController`.
- Manual verification **(REQUIRED)**.

## Tests
- Manual verification:
  - [ ] `npm run build` compiles with no errors once all 15 tasks are applied.
  - [ ] Full end-to-end flow works via `request.http`/`curl`: register a delivery person (task_04-06) → log in → `GET /orders/available` → `POST /orders/:id/accept` → `PATCH .../:orderId/:deliveryId` (status update, owner succeeds) → `POST /orders/:id/release` on a different order → confirm SSE `order-available` fires.
- Test coverage target: N/A — no automated test framework in this project.
- All manual verification scenarios passing.

## Success Criteria
- `OrdersController` is fully wired with all five use cases.
- The entire delivery-order-assignment feature works end-to-end against a real (local) database and Supabase project.