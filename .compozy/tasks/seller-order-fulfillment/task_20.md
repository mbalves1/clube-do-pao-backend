---
status: pending
title: "orders-routes.ts: register new routes + Swagger; literal paths before param paths"
type: backend
complexity: medium
dependencies:
  - task_17
  - task_19
---

# Task 20: Order routes + Swagger

## Overview
Registers `POST /orders/generate`, `GET /orders/bakery`, `PATCH /orders/:id/status`, updates Swagger for the migrated routes' new status semantics, and fixes the Express route-ordering pitfall.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include verification in deliverables
</critical>

<requirements>
- MUST add to `src/infra/http/routes/orders-routes.ts`, all behind `authMiddleware`:
  - `POST /orders/generate` — `validateSchema(generateOrdersSchema)` → `ordersController.generateOrders`.
  - `GET /orders/bakery` → `ordersController.listBakeryOrders`.
  - `PATCH /orders/:id/status` — `validateSchema(updateOrderStatusBySellerSchema)` → `ordersController.updateStatusBySeller`.
- MUST register the literal-path routes (`/orders/generate`, `/orders/bakery`, `/orders/available`) BEFORE the parameterized ones (`/orders/:id/accept`, `/orders/:id/release`, `/orders/:id/status`, `/orders/:orderId/:deliveryId`) so Express does not match `bakery`/`generate` as an `:id`.
- MUST add Swagger JSDoc blocks for the three new routes matching the existing style in this file (tags `Orders`, `security: bearerAuth`, request/response schemas, status codes incl. `403`/`404`/`422`).
- MUST update the Swagger for `PATCH /orders/:orderId/:deliveryId` to reflect the narrowed courier status set and the `Order`-based semantics; update `/orders/available` description to "READY, delivery, unclaimed".
- MUST keep the existing `updateOrderSchema` wired on the courier `PATCH /orders/:orderId/:deliveryId` route.
- MUST NOT change `src/infra/http/routes.ts` or `src/main/app.ts` (the controller is already registered there) — verify no change is needed.
- MUST keep `npm run build` passing.
</requirements>

## Subtasks
- [ ] 20.1 Add the three routes with their validators/handlers.
- [ ] 20.2 Reorder so literal paths precede param paths.
- [ ] 20.3 Swagger for new routes + updates to migrated routes.
- [ ] 20.4 Build; hit each route once.

## Implementation Details
`item-routes.ts` is the closest model for `router.route('/x').get(...).post(...)` + Swagger blocks. The current `orders-routes.ts` declares `/orders/available` before the `:id` routes already — keep that ordering discipline for the new literals.

### Relevant Files
- `src/infra/http/routes/orders-routes.ts` — modified.
- `src/infra/http/routes/item-routes.ts` — Swagger/route style.

### Dependent Files
- `src/main/factories/order-controller-factory.ts` (task_21) — must provide a controller with the new handlers.

### Related ADRs
- [ADR-003](adrs/adr-003.md), [ADR-004](adrs/adr-004.md).

## Deliverables
- Modified `orders-routes.ts` with routes + Swagger.
- Manual verification **(REQUIRED)**.

## Tests
- Manual verification:
  - [ ] `GET /orders/bakery` resolves to `listBakeryOrders` (not treated as `/orders/:id`).
  - [ ] `POST /orders/generate` rejects a malformed `date` with 400 (validator wired).
  - [ ] `PATCH /orders/:id/status` rejects a bad `status` with 400.
  - [ ] Swagger UI renders the three new routes under `Orders`.
  - [ ] Migrated routes still reachable.
- Coverage target: N/A.

## Success Criteria
- New routes are registered, validated, documented, and not shadowed by param routes.
