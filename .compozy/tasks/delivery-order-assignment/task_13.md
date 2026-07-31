---
status: completed
title: "OrdersController: listAvailable/acceptOrder/releaseOrder handlers + updateOrder caller id"
type: backend
complexity: medium
dependencies:
  - task_09
  - task_10
  - task_11
  - task_12
---

# Task 13: OrdersController: listAvailable/acceptOrder/releaseOrder handlers + updateOrder caller id

## Overview
Wires the four use cases from tasks 09-12 into `OrdersController`: three new handlers for the available-orders feed and the accept/release actions, plus updating the existing `updateOrder` handler to pass the authenticated caller's ID through for the new ownership check.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include verification in deliverables
</critical>

<requirements>
- MUST add `listAvailable(req, res)` calling `ListAvailableOrdersUseCase.execute()` and returning `200` with the result, following `OrdersController.list`'s existing try/catch shape.
- MUST add `acceptOrder(req, res)` calling `AcceptOrderUseCase.execute(Number(req.params.id), req.user.id)`, returning `200` on success.
- MUST add `releaseOrder(req, res)` calling `ReleaseOrderUseCase.execute(Number(req.params.id), req.user.id)`, returning `200` on success.
- MUST update `updateOrder` to pass `req.user.id` as the new `callerSupabaseUserId` argument to `UpdateOrdersUseCase.execute` (task_12's signature change).
- MUST use the existing `AppError`-aware catch pattern already present in `updateOrder` (checks `error instanceof AppError`, returns `error.statusCode`) for all three new handlers — this is what correctly maps `NotFoundError`/`ConflictError`/`ForbiddenError` to their respective status codes. Do NOT use the `formatBadRequest`-only pattern from `list`/`create`, which flattens every error to `400`.
- MUST keep the existing `sseService.emit('order-status-updated', ...)` call in `updateOrder` unchanged.
- MUST call `sseService.emit('order-available', ...)` inside `releaseOrder` (controller layer), using the data `ReleaseOrderUseCase.execute` returns (task_11 deliberately does not emit from within the use case, to keep `src/core/usecases/` free of infra imports) — matching where `order-status-updated` is already emitted from `updateOrder` today.
</requirements>

## Subtasks
- [x] 13.1 Add `listAvailable` handler.
- [x] 13.2 Add `acceptOrder` handler with `AppError`-aware error mapping.
- [x] 13.3 Add `releaseOrder` handler with `AppError`-aware error mapping and the SSE emit (reconciling with task_11's placement, per the requirement above — exactly one emit call must remain).
- [x] 13.4 Update `updateOrder` to pass `req.user.id` to `UpdateOrdersUseCase.execute`.
- [x] 13.5 Update the constructor to accept the three new use cases.

## Implementation Details
See TechSpec "API Endpoints" for the four routes this controller now backs, and "Core Interfaces" for the use cases' shapes. `req.user` is the Supabase `User` object already attached by `authMiddleware` (see `src/middlewares/auth.ts`) — `req.user.id` is the Supabase user ID to pass as `supabaseUserId`/`callerSupabaseUserId`.

### Relevant Files
- `src/infra/controllers/orders-controller.ts` — file to modify; add three methods, update `updateOrder` and the constructor.
- `src/middlewares/auth.ts` — confirms `req.user` shape (`User` from `@supabase/supabase-js`, `.id` is the Supabase user ID).
- `src/core/errors/AppError.ts` — base class the existing `updateOrder` catch block already checks with `instanceof`.

### Dependent Files
- `src/infra/http/routes/orders-routes.ts` (task_14) — will register the routes calling these new handlers.
- `src/main/factories/order-controller-factory.ts` (task_15) — will construct `OrdersController` with all five use cases.

## Deliverables
- Updated `src/infra/controllers/orders-controller.ts` with three new handlers and the updated `updateOrder`/constructor.
- Manual verification **(REQUIRED)**.

## Tests
- Manual verification (fully exercised once task_14/15 land, since routes/wiring are needed to reach these handlers over HTTP):
  - [ ] `listAvailable` returns `200` with the available-orders array.
  - [ ] `acceptOrder` returns `200` on a successful claim, `404` for a non-courier caller or nonexistent order, `409` for an already-claimed order.
  - [ ] `releaseOrder` returns `200` on success, `403` for a non-owner, `409` for a non-`ACCEPTED` order, and exactly one `order-available` SSE event fires per successful call (not zero, not two).
  - [ ] `updateOrder` returns `403` when `deliveryId` doesn't match the authenticated courier, and unchanged `200` behavior for the legitimate owner.
- Test coverage target: N/A — no automated test framework in this project.
- All manual verification scenarios passing.

## Success Criteria
- All four endpoints correctly map their use case's errors to HTTP status codes via the `AppError`-aware pattern.
- Exactly one `order-available` SSE emit per successful release — no duplication between this task and task_11.