---
status: pending
title: "Zod validators: generate, seller status update, bakery-orders query; narrow courier updateOrderSchema"
type: backend
complexity: low
dependencies:
  - task_03
---

# Task 17: Order validators

## Overview
Adds the Zod schemas for the three new endpoints and narrows the existing courier `updateOrderSchema` to only courier-reachable statuses.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include verification in deliverables
</critical>

<requirements>
- MUST add to `src/infra/http/validators/order-validator.ts`:
  - `generateOrdersSchema = z.object({ date: z.string().regex(/^\d{2}-\d{2}-\d{4}$/, ...).optional() })`.
  - `updateOrderStatusBySellerSchema = z.object({ status: z.enum(['PREPARING', 'READY', 'CANCELED', 'PICKED_UP']) })`.
  - `listBakeryOrdersQuerySchema = z.object({ status: z.enum([...all 7 OrderStatus]).optional(), date: z.string().regex(/^\d{2}-\d{2}-\d{4}$/).optional() })`.
- MUST change the existing `updateOrderSchema` (courier `PATCH /orders/:orderId/:deliveryId`) `status` enum from `['PENDING','ACCEPTED','PICKED_UP','DELIVERED','CANCELED']` to `['PICKED_UP','DELIVERED','CANCELED']` — the only targets a courier reaches through that route (claim/release have their own endpoints).
- MUST keep messages in Portuguese, consistent with the tone of `item-validator.ts` / `subscription-validator.ts`.
- MUST NOT wire these into routes here — that is task_20; this task only defines the schemas.
- MUST keep `npm run build` passing.
</requirements>

## Subtasks
- [ ] 17.1 Add the three new schemas.
- [ ] 17.2 Narrow `updateOrderSchema`.
- [ ] 17.3 `safeParse` sanity checks; build.

## Implementation Details
`date` format `dd-mm-yyyy` matches what `create-subscribe.ts` / the use cases parse. `validateSchema` (the middleware) runs `schema.parse(req.body)` — query-param schemas (`listBakeryOrdersQuerySchema`) are parsed in the controller against `req.query` (task_19), not via the body middleware.

### Relevant Files
- `src/infra/http/validators/order-validator.ts` — modified.
- `src/infra/http/validators/item-validator.ts` — message/style reference.

### Dependent Files
- `src/infra/http/routes/orders-routes.ts` (task_20).
- `src/infra/controllers/orders-controller.ts` (task_19) — uses `listBakeryOrdersQuerySchema` on `req.query`.

### Related ADRs
- [ADR-003](adrs/adr-003.md), [ADR-004](adrs/adr-004.md).

## Deliverables
- Updated `order-validator.ts`.
- Manual verification **(REQUIRED)**.

## Tests
- Manual verification (`safeParse`):
  - [ ] `generateOrdersSchema.safeParse({})` → ok; `{ date: '2026-9-7' }` → fail; `{ date: '07-09-2026' }` → ok.
  - [ ] `updateOrderStatusBySellerSchema.safeParse({ status: 'ACCEPTED' })` → fail; `{ status: 'READY' }` → ok.
  - [ ] `updateOrderSchema.safeParse({ status: 'PENDING' })` → fail; `{ status: 'DELIVERED' }` → ok.
- Coverage target: N/A.

## Success Criteria
- Each new endpoint has a matching schema; the courier schema no longer accepts non-courier statuses.
