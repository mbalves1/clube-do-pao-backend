---
status: pending
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
- [ ] 3.1 Rework `orders.ts` (status union, `FulfillmentType`, new `Order` fields).
- [ ] 3.2 Grep-confirm `'ACTIVE'` is unused, then remove it.
- [ ] 3.3 Add `order-item.ts`, `subscription-item.ts`, `subscription.ts`.
- [ ] 3.4 `npm run build`; record any downstream break for its owning task.

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
  - [ ] `grep -rn "'ACTIVE'\|\"ACTIVE\"" src/` returns nothing order-related before removal.
  - [ ] `npm run build` compiles (or the only errors are in files explicitly deferred to tasks 07/13–16, listed in notes).
  - [ ] Importing `Order`, `OrderItem`, `SubscriptionItem`, `FulfillmentType` from their entity files type-checks in a scratch file.
- Coverage target: N/A.

## Success Criteria
- Entities mirror the task_01 schema; no Prisma import in `core/entities`.
- `'ACTIVE'` removed with grep evidence it was dead.
