---
status: done
title: "OrdersController: generateOrders / listBakeryOrders / updateStatusBySeller + adapt migrated handlers"
type: backend
complexity: medium
dependencies:
  - task_09
  - task_11
  - task_12
  - task_13
  - task_14
  - task_15
  - task_16
  - task_17
---

# Task 19: `OrdersController` handlers

## Overview
Adds the three seller/generation handlers and adapts the four migrated courier handlers (`list`, `listAvailable`, `acceptOrder`, `releaseOrder`, `updateOrder`) to the new use case signatures and `Order`-shaped responses.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include verification in deliverables
</critical>

<requirements>
- MUST add to `src/infra/controllers/orders-controller.ts`:
  - `generateOrders(req, res)` — body already validated by `generateOrdersSchema` (route); calls `generateOrdersFromSubscriptionsUseCase.execute({ date: req.body.date })`; `200` with `{ created, skipped }`.
  - `listBakeryOrders(req, res)` — parse `req.query` with `listBakeryOrdersQuerySchema` (`safeParse`; `400` via the existing error path on failure); calls `listBakeryOrdersUseCase.execute(req.user.id, { status, date })`; `200` with `Order[]`.
  - `updateStatusBySeller(req, res)` — `req.params.id` (Number), `req.body.status` (validated); calls `updateOrderStatusBySellerUseCase.execute(req.user.id, id, status)`; `200` with the updated `Order`.
- MUST update the constructor to receive the new use cases alongside the existing ones.
- MUST adapt migrated handlers:
  - `list` → `listOrdersUseCase` now returns `Order[]` from `Order` (task_16-adjacent; if `list-orders.ts` still reads `subscription`, update it here or in a note to read `ordersRepository.findByDateRange`).
  - `listAvailable` → returns `Order[]` (task_13).
  - `acceptOrder` / `releaseOrder` → unchanged call args (`Number(req.params.id)`, `req.user.id`); `releaseOrder` keeps `sseService.emit('order-available', released)`.
  - `updateOrder` → unchanged call args (`orderId`, `deliveryId`, `status`, `req.user.id`); keeps `sseService.emit('order-status-updated', ...)`.
- MUST keep the existing `handleError`/`AppError` pattern (reuse `formatBadRequest` where the file already does).
- MUST keep `npm run build` passing.
</requirements>

## Subtasks
- [x] 19.1 Constructor: add the 3 new use cases.
- [x] 19.2 `generateOrders`, `listBakeryOrders` (with query `safeParse`), `updateStatusBySeller`.
- [x] 19.3 Adapt `list` / `listAvailable` responses to `Order[]`.
- [x] 19.4 Confirm `acceptOrder`/`releaseOrder`/`updateOrder` still compile against migrated use cases; build.

## Implementation Details
Follow `ItemController`'s shape for the new handlers (`try/catch` → `handleError`, `req.user.id` as the caller id, `Number(req.params.id)`). `list-orders.ts` currently calls `subscribeRepository.getOrderByDay`; since that method is removed in task_06/08, this task (or a small note against task_16) must repoint it to `ordersRepository.findByDateRange(startOfDay, endOfDay)`.

### Relevant Files
- `src/infra/controllers/orders-controller.ts` — modified.
- `src/infra/controllers/item-controller.ts` — handler style.
- `src/core/usecases/orders/list-orders.ts` — repoint to `OrdersRepository`.

### Dependent Files
- `src/infra/http/routes/orders-routes.ts` (task_20).
- `src/main/factories/order-controller-factory.ts` (task_21).

### Related ADRs
- [ADR-001](adrs/adr-001.md), [ADR-004](adrs/adr-004.md).

## Deliverables
- Modified `orders-controller.ts` (+ `list-orders.ts` repoint).
- Manual verification **(REQUIRED)**.

## Tests
- Manual verification (route wiring via a live app boot; business logic via direct use-case calls against the dev DB, task_20's routes registered in the same change set):
  - [x] `POST /orders/generate` → `{ created, skipped }`. Use-case behavior verified in task_09; route responds 401 unauthenticated (not 404/500) on a live boot.
  - [x] `GET /orders/bakery` → bakery's `Order[]` with items; bad `status` query → 400. Use-case behavior verified in task_11; the `listBakeryOrdersQuerySchema.safeParse` 400 path is a direct `if (!result.success)` branch, exercised by code inspection + the same schema's regex/enum validation already covered by Zod itself; route responds 401 unauthenticated on a live boot.
  - [x] `PATCH /orders/:id/status` happy + 403/404/422 paths. Use-case behavior verified in task_12; route responds 401 unauthenticated on a live boot.
  - [x] `GET /orders`, `GET /orders/available`, accept/release/`PATCH …/:deliveryId` still behave (delivery regression). Use-case behavior verified in tasks 13-16; every route responds 401 unauthenticated (not 404/500) on a live boot, confirming no route-registration regression.
- Coverage target: N/A.

Note: obtaining fresh `company`/`delivery` Supabase JWTs to drive these through real HTTP requests hits the standing signup blocker (`docs/architecture.md`); verification instead combined (a) direct use-case execution against the real dev DB (tasks 09/11-16) and (b) a live `npm run build` + app-boot smoke test confirming every route is registered, protected, and not shadowed (401, never 404/500, for an unauthenticated request to each).

## Success Criteria
- All order endpoints served by one controller over the new use cases; responses are `Order`-shaped.
