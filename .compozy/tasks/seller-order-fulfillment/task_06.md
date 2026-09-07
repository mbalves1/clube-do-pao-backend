---
status: pending
title: "SubscribeRepository port: template query + basket; drop order-ish methods"
type: backend
complexity: medium
dependencies:
  - task_03
---

# Task 6: `SubscribeRepository` port — templates and baskets, not orders

## Overview
Refocuses `SubscribeRepository` on the recurring template: add the query generation needs (`listActiveTemplatesForDate`) and basket accessors (`getItems`/`setItems`), and remove the methods that treated subscription rows as orders — those move to `OrdersRepository`.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include verification in deliverables
</critical>

<requirements>
- MUST add to `src/core/ports/subscribe-repository.ts`:
  - `listActiveTemplatesForDate(date: Date): Promise<SubscriptionTemplateForDate[]>` — returns subscriptions with `active = true` whose schedule matches `date`, each with an `items` array already joined to `Item` and shaped as `{ itemId, nameSnapshot, priceCentsSnapshot, quantity }` (name/price read from the live `Item` at query time — the snapshot per [ADR-002](adrs/adr-002.md)).
  - `getItems(subscriptionId: number): Promise<SubscriptionItem[]>`
  - `setItems(subscriptionId: number, items: { itemId: string; quantity: number }[]): Promise<void>`
  - the `SubscriptionTemplateForDate` type per the TechSpec.
- MUST add `fulfillmentType` to `SubscribeCreateData`.
- MUST remove `findAvailable`, `claim`, `release`, `updateOrder`, `getOrderByDay` and the `AvailableOrder` type from this port. Their callers (`list-available-orders.ts`, `accept-order.ts`, `release-order.ts`, `update-orders.ts`, `list-orders.ts`) are migrated in tasks 13–16 — if build-ordering forces it, keep them as `@deprecated` stubs and delete in those tasks, noting it here.
- MUST NOT remove `create`, `getList`, `getSubscribeById`, `getAll`.
- MUST keep the port Prisma-free.
</requirements>

## Subtasks
- [ ] 6.1 Add `listActiveTemplatesForDate` + `SubscriptionTemplateForDate`.
- [ ] 6.2 Add `getItems` / `setItems`; add `fulfillmentType` to `SubscribeCreateData`.
- [ ] 6.3 Remove (or `@deprecate`-stub) the order-ish methods + `AvailableOrder`.
- [ ] 6.4 `npm run build` (impl in task_08; courier use case breakage owned by tasks 13–16).

## Implementation Details
The weekday match for `listActiveTemplatesForDate` reuses the `weekMap` idea from `create-subscribe.ts` (`daysWeek` holds day names). "Schedule matches `date`" = the date's weekday name is in `daysWeek` (for `weekly`) or `frequency === 'daily'`. Richer `frequency` handling is an open question in the PRD — match whatever `create-subscribe.ts` currently produces.

### Relevant Files
- `src/core/ports/subscribe-repository.ts` — modified.
- `src/core/usecases/subscribe/create-subscribe.ts` — `weekMap` / `daysWeek` semantics.

### Dependent Files
- `src/infra/repositories/prisma-subscribe-repository.ts` (task_08).
- `src/core/usecases/orders/generate-orders-from-subscriptions.ts` (task_09).
- `src/core/usecases/subscribe/create-subscribe.ts` (task_18).
- Courier use cases (tasks 13–16) — lose their `SubscribeRepository` order methods.

### Related ADRs
- [ADR-001](adrs/adr-001.md), [ADR-002](adrs/adr-002.md).

## Deliverables
- Modified `subscribe-repository.ts` port.
- Manual verification **(REQUIRED)**.

## Tests
- Manual verification:
  - [ ] Port compiles; no Prisma import.
  - [ ] `listActiveTemplatesForDate` return type carries snapshot-shaped `items`.
  - [ ] `findAvailable`/`claim`/`release`/`updateOrder`/`getOrderByDay` are gone (or `@deprecated` with a note pointing to tasks 13–16).
- Coverage target: N/A.

## Success Criteria
- `SubscribeRepository` describes templates and baskets, not order lifecycle.
- Generation has the single query it needs.
