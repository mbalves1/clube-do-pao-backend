---
status: completed
title: "Prisma schema: Subscription/Order split, OrderItem + SubscriptionItem, FulfillmentType, PREPARING/READY"
type: backend
complexity: high
dependencies: []
---

# Task 1: Prisma schema — Subscription/Order split + new models & enums

## Overview
Reshapes the persistence model so `Order` is the per-service-date instance and `Subscription` is the recurring template ([ADR-001](adrs/adr-001.md)). Adds the `PREPARING`/`READY` states, a `FulfillmentType` enum, per-order line items, and a template basket. This is the schema-only foundation; data backfill is task_02 and all code changes come later.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include verification in deliverables
</critical>

<requirements>
- MUST add `PREPARING` and `READY` to the `OrderStatus` enum in `prisma/schema.prisma`, ordered `PENDING, PREPARING, READY, ACCEPTED, PICKED_UP, DELIVERED, CANCELED`.
- MUST add a new `FulfillmentType` enum with `PICKUP` and `DELIVERY`.
- MUST extend `Order` with: `bakeryId String` + relation to `Bakery`, `fulfillmentType FulfillmentType @default(DELIVERY)`, `preparingAt DateTime?`, `readyAt DateTime?`, `items OrderItem[]`, and `@@unique([subscriptionId, serviceDate])`.
- MUST add `OrderItem` model per the TechSpec "Data Models" block (`orderId`, `itemId`, `nameSnapshot`, `priceCentsSnapshot Int`, `quantity Int`, relations, `onDelete: Cascade` from `Order`, `@@map("order_items")`).
- MUST add `SubscriptionItem` model per the TechSpec (`subscriptionId`, `itemId`, `quantity Int`, relations, `@@unique([subscriptionId, itemId])`, `@@map("subscription_items")`).
- MUST extend `Subscription` with `fulfillmentType FulfillmentType @default(DELIVERY)`, `active Boolean @default(true)`, and `items SubscriptionItem[]`. MUST NOT remove `serviceDate`, `status`, or `deliveryPersonId` from `Subscription` — they stay as documented legacy columns.
- MUST add the back-relations Prisma requires on `Bakery`, `Item`, and `DeliveryPerson` (`orders`, `orderItems`, `subscriptionItems` as applicable).
- MUST generate a migration under `prisma/migrations/` (`npx prisma migrate dev --name seller_order_fulfillment`) that is additive (no column drops, no data loss).
- MUST keep `npm run build` and `npx prisma generate` passing.
</requirements>

## Subtasks
- [x] 1.1 Update `OrderStatus`; add `FulfillmentType`.
- [x] 1.2 Extend `Order` (fields, relations, unique constraint).
- [x] 1.3 Add `OrderItem` and `SubscriptionItem` models + back-relations.
- [x] 1.4 Extend `Subscription` (fulfillmentType, active, items); leave legacy columns intact.
- [x] 1.5 Create the migration; run `prisma generate`; `npm run build`.

## Implementation Details
See TechSpec "Data Models" for the exact model bodies. Follow the schema style already in `prisma/schema.prisma` (`@@map` snake_case table names, `@default(now())`, `@updatedAt`). The `@@unique([subscriptionId, serviceDate])` on `Order` is what makes generation (task_09) idempotent — do not omit it. Existing `Order` rows in a dev DB may violate the new unique constraint if duplicates exist; the migration for a fresh dev DB is clean, and production has effectively no `Order` rows (they are only lazily created today) — note any dev-data cleanup needed in the migration notes.

### Relevant Files
- `prisma/schema.prisma` — all model/enum changes.
- `prisma/migrations/` — new migration directory.
- `prisma/migrations/20260829120000_add_items/` — most recent migration, style reference.

### Dependent Files
- `src/core/entities/orders.ts` (task_03) — domain types mirror this schema.
- `src/infra/repositories/prisma-orders-repository.ts` (task_07), `prisma-subscribe-repository.ts` (task_08).
- Backfill script (task_02) depends on the new `Order` columns existing.

### Related ADRs
- [ADR-001](adrs/adr-001.md), [ADR-002](adrs/adr-002.md), [ADR-003](adrs/adr-003.md).

## Deliverables
- Updated `prisma/schema.prisma` + a new additive migration.
- Manual verification **(REQUIRED — no automated test framework, see TechSpec "Testing Approach")**.

## Tests
- Manual verification:
  - [x] `npx prisma migrate dev` applies cleanly on a fresh dev DB.
  - [x] `npx prisma generate` succeeds; generated client exposes `orderItem`, `subscriptionItem`, `FulfillmentType`, and `OrderStatus.PREPARING`/`READY`.
  - [x] `npm run build` compiles.
  - [x] Inspecting the DB shows `orders.bakery_id`, `orders.fulfillment_type`, `orders.preparing_at`, `orders.ready_at`, the `order_items` and `subscription_items` tables, and the `orders(subscription_id, service_date)` unique index.
- Coverage target: N/A.

## Success Criteria
- Schema reflects the instance/template split with the two new tables and enum values.
- Migration is additive and reversible; no existing column dropped.
- `npm run build` + `prisma generate` pass.
