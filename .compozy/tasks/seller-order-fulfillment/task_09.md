---
status: pending
title: "GenerateOrdersFromSubscriptionsUseCase"
type: backend
complexity: medium
dependencies:
  - task_05
  - task_06
  - task_07
  - task_08
---

# Task 9: `GenerateOrdersFromSubscriptionsUseCase`

## Overview
For a target service date, materializes one `Order` per matching active subscription template, snapshotting the basket into `OrderItem`s, idempotently ([ADR-002](adrs/adr-002.md), [ADR-004](adrs/adr-004.md)).

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include verification in deliverables
</critical>

<requirements>
- MUST add `src/core/usecases/orders/generate-orders-from-subscriptions.ts` with `execute(input: { date?: string }): Promise<{ created: number; skipped: number }>`.
- MUST resolve the target date: parse `input.date` (`dd-mm-yyyy`, same format `create-subscribe.ts` parses) or default to "today" at UTC start-of-day.
- MUST call `subscribeRepository.listActiveTemplatesForDate(date)` and, for each template, call `ordersRepository.existsForSubscriptionAndDate(sub.id, date)`; skip (increment `skipped`) if it exists.
- MUST otherwise call `ordersRepository.createFromSubscription({ subscriptionId, bakeryId, serviceDate: date, fulfillmentType: sub.fulfillmentType, status: 'PENDING' implied, items: sub.items })` and increment `created`.
- MUST NOT read `ItemRepository` — item name/price come already-snapshotted from `listActiveTemplatesForDate`.
- MUST NOT throw when a template has an empty basket — create the order with zero items (a bakery can still see it); note this in the result if useful.
- MUST depend only on `SubscribeRepository` and `OrdersRepository` (constructor injection, matching sibling use case style).
- MUST keep `npm run build` passing.
</requirements>

## Subtasks
- [ ] 9.1 Date resolution (parse `dd-mm-yyyy` / default today, UTC start-of-day).
- [ ] 9.2 Loop templates: existence check → skip, else `createFromSubscription`.
- [ ] 9.3 Return `{ created, skipped }`.

## Implementation Details
Mirror the constructor-injection + plain-class style of `ListAvailableOrdersUseCase` / `AcceptOrderUseCase`. Date parsing: reuse the `parseDate` approach from `create-subscribe.ts` (`[day, month, year] = date.split('-')`). Keep it framework-free (no `req`), so a future scheduler can call `execute({ date })` directly ([ADR-004](adrs/adr-004.md)).

### Relevant Files
- `src/core/usecases/orders/list-available-orders.ts` — style reference.
- `src/core/usecases/subscribe/create-subscribe.ts` — `parseDate`.

### Dependent Files
- `src/infra/controllers/orders-controller.ts` (task_19) — `generateOrders` handler.
- `src/main/factories/order-controller-factory.ts` (task_21).

### Related ADRs
- [ADR-002](adrs/adr-002.md), [ADR-004](adrs/adr-004.md).

## Deliverables
- `generate-orders-from-subscriptions.ts`.
- Manual verification **(REQUIRED)**.

## Tests
- Manual verification (dev DB with 2 matching active subscriptions for a date, each with a 2-line basket):
  - [ ] First `execute({ date })` → `{ created: 2, skipped: 0 }`; DB has 2 orders, 4 `order_items` with snapshot name/price.
  - [ ] Second `execute({ date })` → `{ created: 0, skipped: 2 }`; no new rows.
  - [ ] `execute({})` defaults to today and behaves the same.
  - [ ] A template whose basket item was deleted still yields an order (fewer/zero lines), no throw.
- Coverage target: N/A.

## Success Criteria
- Idempotent generation with snapshotted line items, no `ItemRepository` dependency.
- Callable with a plain `{ date }` — scheduler-ready.
