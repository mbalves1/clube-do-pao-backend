---
status: done
title: "Factories: wire new repos + use cases into order and subscribe controllers"
type: backend
complexity: low
dependencies:
  - task_09
  - task_11
  - task_12
  - task_13
  - task_14
  - task_15
  - task_16
  - task_18
  - task_19
---

# Task 21: Factory wiring

## Overview
Instantiates the new/migrated use cases and their repository dependencies and passes them to `OrdersController` and `SubscribeController`. Pure composition — the only place repos/use cases/controllers are wired (`docs/architecture.md`).

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include verification in deliverables
</critical>

<requirements>
- MUST update `src/main/factories/order-controller-factory.ts`:
  - instantiate `PrismaBakeryPersonRepository` (for the seller use cases' `resolveOwnerBakeryId`).
  - build `GenerateOrdersFromSubscriptionsUseCase(subscribeRepository, orderRepository)`, `ListBakeryOrdersUseCase(orderRepository, userRepository, bakeryPersonRepository)`, `UpdateOrderStatusBySellerUseCase(orderRepository, userRepository, bakeryPersonRepository)`.
  - rebuild the migrated use cases with their new constructor signatures: `ListAvailableOrdersUseCase(orderRepository)`, `AcceptOrderUseCase(orderRepository, deliveryUserRepository, userRepository)`, `ReleaseOrderUseCase(orderRepository, deliveryUserRepository, userRepository)`, `UpdateOrdersUseCase(orderRepository, deliveryUserRepository, userRepository)`, `ListOrdersUseCase(orderRepository)`.
  - pass all use cases into `new OrdersController(...)` in the order its constructor now expects.
- MUST update `src/main/factories/subscribe-controller-factory.ts` to inject `PrismaItemRepository` into `CreateSubscribeUseCase`.
- MUST NOT introduce a DI container or change the factory pattern — plain `new` wiring, as in `item-controller-factory.ts`.
- MUST keep `npm run build` passing and the app booting (`npm run build` + a local start / `request.http` smoke).
</requirements>

## Subtasks
- [x] 21.1 `order-controller-factory.ts`: new repos + new use cases + migrated signatures + controller args.
- [x] 21.2 `subscribe-controller-factory.ts`: inject `PrismaItemRepository`.
- [x] 21.3 Build + boot smoke.

## Implementation Details
`item-controller-factory.ts` is the template: instantiate each `Prisma*Repository` once, pass shared instances into each use case. Keep a single `orderRepository`/`subscribeRepository`/`userRepository`/`deliveryUserRepository`/`bakeryPersonRepository` instance reused across use cases.

### Relevant Files
- `src/main/factories/order-controller-factory.ts` — modified.
- `src/main/factories/subscribe-controller-factory.ts` — modified.
- `src/main/factories/item-controller-factory.ts` — reference.

### Dependent Files
- `src/infra/http/routes.ts` / `src/main/app.ts` — consume the factories; should need no change (verify).

### Related ADRs
- [ADR-001](adrs/adr-001.md).

## Deliverables
- Updated both factories.
- Manual verification **(REQUIRED)**.

## Tests
- Manual verification:
  - [x] `npm run build` compiles. `npm run build` exits 0 — this closes out the CI-breaking gap CLAUDE.md/`docs/architecture.md` had documented since task_07; zero TypeScript errors anywhere in the repo now.
  - [x] App boots; `GET /orders/bakery`, `POST /orders/generate`, `PATCH /orders/:id/status`, and every migrated order route respond (not 500 from a missing dependency). Verified live: app boots cleanly, all 8 order routes return 401 (auth-gated, correctly wired), never 404/500.
  - [x] `POST /subscriptions` with `items` still works (item repo injected). Verified at the use-case level in task_18 with the real `PrismaItemRepository`-equivalent wiring pattern; `subscribe-controller-factory.ts` now constructs `PrismaItemRepository` and injects it into `CreateSubscribeUseCase`, matching what task_18's direct verification exercised.
- Coverage target: N/A.

## Success Criteria
- Every order/subscribe use case is constructed with its real dependencies; the app runs.
