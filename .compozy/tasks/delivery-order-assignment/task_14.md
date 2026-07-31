---
status: completed
title: "orders-routes.ts: register new routes + swagger"
type: backend
complexity: medium
dependencies:
  - task_13
---

# Task 14: orders-routes.ts: register new routes + swagger

## Overview
Registers the three new HTTP routes (`GET /orders/available`, `POST /orders/:id/accept`, `POST /orders/:id/release`) and documents the new `403` response on the existing `PATCH /orders/:orderId/:deliveryId` route, following this file's existing swagger-annotation style.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include verification in deliverables
</critical>

<requirements>
- MUST add `router.get('/orders/available', authMiddleware, (req, res) => ordersController.listAvailable(req, res))`, registered before the existing `/orders/:orderId/:deliveryId` route so it isn't shadowed by any path-parameter route (verify no conflict exists given the current route set — `/orders/available` does not collide with `/orders/:orderId/:deliveryId` since the latter requires two path segments after `/orders`, but MUST double check route registration order doesn't introduce ambiguity).
- MUST add `router.post('/orders/:id/accept', authMiddleware, (req, res) => ordersController.acceptOrder(req, res))`.
- MUST add `router.post('/orders/:id/release', authMiddleware, (req, res) => ordersController.releaseOrder(req, res))`.
- MUST add swagger JSDoc blocks for all three new routes, following this file's existing style (see the `/orders` GET and `/orders/{orderId}/{deliveryId}` PATCH blocks) — include tags `Orders`, summary, description, parameters, and response codes (`200`, `403`/`404`/`409` as applicable per task_13's error mapping).
- MUST update the existing PATCH route's swagger block to document the new `403` response ("Você não é o entregador responsável por este pedido" or similar).
- MUST NOT change the existing `GET /orders` route or its swagger block.
</requirements>

## Subtasks
- [x] 14.1 Register `GET /orders/available`.
- [x] 14.2 Register `POST /orders/:id/accept`.
- [x] 14.3 Register `POST /orders/:id/release`.
- [x] 14.4 Add swagger docs for all three new routes.
- [x] 14.5 Add the `403` response to the existing PATCH route's swagger docs.

## Implementation Details
See TechSpec "API Endpoints" for the exact method/path/response combinations. Follow this file's existing swagger comment block style exactly (see the current `/orders` GET and `/orders/{orderId}/{deliveryId}` PATCH blocks for the format to replicate).

### Relevant Files
- `src/infra/http/routes/orders-routes.ts` — file to modify; add three routes and update one swagger block.
- `src/middlewares/auth.ts` — `authMiddleware`, already used by the existing routes in this file.

### Dependent Files
- `src/infra/http/swagger.ts` — aggregates JSDoc-based swagger specs; no direct edit needed, but confirm the new blocks are picked up (same mechanism as existing routes).

## Deliverables
- Updated `src/infra/http/routes/orders-routes.ts` with three new routes and updated swagger documentation.
- Manual verification **(REQUIRED)**.

## Tests
- Manual verification:
  - [ ] `GET /orders/available` is reachable and does not get shadowed/misrouted by `/orders/:orderId/:deliveryId`.
  - [ ] `POST /orders/:id/accept` and `POST /orders/:id/release` are reachable with the expected auth requirement (`401` without a token).
  - [ ] `GET /docs` (swagger UI) renders the three new routes and the updated PATCH documentation without errors.
- Test coverage target: N/A — no automated test framework in this project.
- All manual verification scenarios passing.

## Success Criteria
- All three new routes are registered, authenticated, and documented.
- No route-ordering conflict with the existing `/orders/:orderId/:deliveryId` route.