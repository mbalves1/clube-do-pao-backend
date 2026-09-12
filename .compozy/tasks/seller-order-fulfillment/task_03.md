---
status: completed
title: "Domain entities: Order (reworked), OrderItem, SubscriptionItem, Subscription"
type: backend
complexity: medium
dependencies:
  - task_01
---

# Task 3: Domain entities for the instance/template model

## Overview
Brings the `src/core/entities/` types in line with the task_01 schema: reworks `Order`, adds `OrderItem`, `SubscriptionItem`, and a `Subscription` template entity (none exists today). Pure types, no logic.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include verification in deliverables
</critical>

<requirements>
- MUST update `src/core/entities/orders.ts`:
  - `OrderStatus` union becomes `'PENDING' | 'PREPARING' | 'READY' | 'ACCEPTED' | 'PICKED_UP' | 'DELIVERED' | 'CANCELED'`.
  - Remove the unused `'ACTIVE'` member — MUST grep the codebase for `'ACTIVE'` / `"ACTIVE"` first and confirm no consumer depends on it (the `delivery-order-assignment` code paths use `'ACCEPTED'`/`'PENDING'`, not `'ACTIVE'`).
  - Add `FulfillmentType = 'PICKUP' | 'DELIVERY'`.
  - `Order` type: add `bakeryId: string`, `fulfillmentType: FulfillmentType`, `items: OrderItem[]`, `preparingAt?: Date | null`, `readyAt?: Date | null`. Make `status` non-optional `OrderStatus` (it is always set now).
- MUST add `src/core/entities/order-item.ts` exporting `OrderItem` per the TechSpec "Core Interfaces".
- MUST add `src/core/entities/subscription-item.ts` exporting `SubscriptionItem` per the TechSpec.
- MUST add `src/core/entities/subscription.ts` exporting a `Subscription` template type (id, userId, bakeryId, frequency, daysWeek, service/delivery windows, notes, `fulfillmentType`, `active`, `items: SubscriptionItem[]`). Keep the legacy `serviceDate`/`status`/`deliveryPersonId` as optional fields marked `@deprecated` in a comment.
- MUST NOT put any framework/Prisma import in `src/core/entities/**` (Clean Architecture rule, `docs/architecture.md`).
- MUST keep `npm run build` passing (downstream files that break from the `Order` shape change are fixed in their own later tasks — if the build cannot pass in isolation, note exactly which files and defer, but prefer keeping `Order['status']` assignable).
</requirements>

## Subtasks
- [x] 3.1 Rework `orders.ts` (status union, `FulfillmentType`, new `Order` fields).
- [x] 3.2 Grep-confirm `'ACTIVE'` is unused, then remove it.
- [x] 3.3 Add `order-item.ts`, `subscription-item.ts`, `subscription.ts`.
- [x] 3.4 `npm run build`; record any downstream break for its owning task.

## Implementation Details
Match the style of the existing entity files (plain `export type`, `Date` for timestamps, `?: T | null` for nullable). The `Order` shape change will ripple into `prisma-orders-repository.ts` and the order use cases — those are handled in tasks 07 and 13–16; if the repo file won't compile after this task, it's acceptable for it to be fixed in task_07 as long as you list it in this task's completion notes.

### Relevant Files
- `src/core/entities/orders.ts` — reworked.
- `src/core/entities/item.ts`, `bakery.ts` — style reference.

### Dependent Files
- `src/core/ports/orders-repository.ts` (task_05), `subscribe-repository.ts` (task_06).
- `src/core/usecases/orders/order-status-transitions.ts` (task_04) — imports `OrderStatus`, `FulfillmentType`.

### Related ADRs
- [ADR-001](adrs/adr-001.md), [ADR-003](adrs/adr-003.md).

## Deliverables
- Updated `orders.ts` + three new entity files.
- Manual verification **(REQUIRED)**.

## Tests
- Manual verification:
  - [x] `grep -rn "'ACTIVE'\|\"ACTIVE\"" src/` returns nothing order-related before removal — only hit is `subscribe-repository.ts:24`'s unrelated `Subscription`-lifecycle status union (`'ACTIVE'|'PAUSED'|'CANCELED'|'PENDING'`, not `OrderStatus`).
  - [x] `npm run build` compiles, with exactly one deferred error: `src/infra/repositories/prisma-orders-repository.ts(11,2)` — `mapOrder`'s return object is "missing bakeryId, fulfillmentType, items" from the new `Order` shape. This is the file task_07 (`PrismaOrdersRepository` rewrite) owns; no other file broke. Deferred as instructed by this task's Implementation Details.
  - [x] Importing `Order`, `OrderItem`, `SubscriptionItem`, `FulfillmentType`, `Subscription` from their entity files type-checks in a scratch file (constructed one instance of each, `tsc --noEmit` clean).
- Coverage target: N/A.

## Success Criteria
- Entities mirror the task_01 schema; no Prisma import in `core/entities`. ✅
- `'ACTIVE'` removed with grep evidence it was dead. ✅

## Completion Notes
- Downstream break (expected, deferred to task_07): `src/infra/repositories/prisma-orders-repository.ts` — `mapOrder()` no longer satisfies `Order` (missing `bakeryId`, `fulfillmentType`, `items`). `PrismaOrdersRepository` is rewritten wholesale in task_07 against the new `OrdersRepository` port (task_05), so no partial fix was applied here.
- `export type Orders = Order;` kept as-is for backward compat (unused today, `grep` found no importer of `Orders`) — not in this task's scope to remove.
