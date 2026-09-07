---
status: pending
title: "PrismaSubscribeRepository: listActiveTemplatesForDate + getItems/setItems; remove legacy order methods"
type: backend
complexity: medium
dependencies:
  - task_01
  - task_06
---

# Task 8: `PrismaSubscribeRepository` — template query + basket persistence

## Overview
Implements the task_06 port changes against Prisma: the active-templates-for-a-date query (with item snapshot join), basket read/replace, `fulfillmentType` on create, and removal of the subscription-as-order methods.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include verification in deliverables
</critical>

<requirements>
- MUST implement `listActiveTemplatesForDate(date)` in `src/infra/repositories/prisma-subscribe-repository.ts`:
  - `where: { active: true }` plus a weekday/frequency match (`frequency === 'daily'`, or the date's weekday name in `daysWeek`).
  - `include` the `SubscriptionItem[]` joined to `Item`; map each to `{ itemId, nameSnapshot: item.name, priceCentsSnapshot: item.priceCents, quantity }`.
  - skip basket lines whose `Item` is missing (deleted) — do not throw ([ADR-002](adrs/adr-002.md)).
  - return `SubscriptionTemplateForDate[]` with `serviceDate` set to the passed `date`.
- MUST implement `getItems(subscriptionId)` → `SubscriptionItem[]`.
- MUST implement `setItems(subscriptionId, items)` as a transaction: `deleteMany` existing `subscriptionItem` for that subscription, then `createMany` the new set; dedupe by `itemId`.
- MUST pass `fulfillmentType` through in `create(data)`.
- MUST delete `findAvailable`, `claim`, `release`, `updateOrder`, `getOrderByDay`, and the private `getOrder` duplicate from this file.
- MUST use the `prisma` singleton; keep `getSubscribeById`, `getList`, `getAll`, `create`.
- MUST keep `npm run build` + `prisma generate` passing (courier use case breakage is owned by tasks 13–16).
</requirements>

## Subtasks
- [ ] 8.1 Implement `listActiveTemplatesForDate` with the item snapshot join + weekday match.
- [ ] 8.2 Implement `getItems` / `setItems` (transactional replace).
- [ ] 8.3 Thread `fulfillmentType` into `create`.
- [ ] 8.4 Delete the legacy order methods; `npm run build`.

## Implementation Details
Reuse the `weekMap` name→index approach from `create-subscribe.ts` for the weekday match; `daysWeek` stores day names. `prisma.$transaction([...])` for `setItems`. The existing `getAll` date-window helper is a reference for date filtering.

### Relevant Files
- `src/infra/repositories/prisma-subscribe-repository.ts` — modified.
- `src/core/usecases/subscribe/create-subscribe.ts` — `weekMap`.

### Dependent Files
- `src/core/usecases/orders/generate-orders-from-subscriptions.ts` (task_09).
- `src/core/usecases/subscribe/create-subscribe.ts` (task_18) — calls `setItems`.
- `src/main/factories/*` (task_21).

### Related ADRs
- [ADR-001](adrs/adr-001.md), [ADR-002](adrs/adr-002.md).

## Deliverables
- Modified `prisma-subscribe-repository.ts`.
- Manual verification **(REQUIRED)**.

## Tests
- Manual verification (dev DB with 2+ active subscriptions, one with a Monday `daysWeek`, each with basket rows):
  - [ ] `listActiveTemplatesForDate(<a Monday>)` returns the Monday subscription with its items shaped as snapshots; a non-matching weekday excludes it.
  - [ ] An `active: false` subscription is never returned.
  - [ ] A basket line pointing at a deleted item is silently omitted.
  - [ ] `setItems` replaces the basket wholesale; `getItems` reflects it.
  - [ ] Legacy methods are gone; `npm run build` + `prisma generate` pass.
- Coverage target: N/A.

## Success Criteria
- Generation can fetch matching templates with snapshot-ready item data in one call.
- No subscription-as-order method remains in the repository.
