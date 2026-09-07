---
status: pending
title: "PrismaOrdersRepository: implement the new port + prisma-orders-mapper"
type: backend
complexity: high
dependencies:
  - task_01
  - task_05
---

# Task 7: `PrismaOrdersRepository` implementation + orders mapper

## Overview
Implements the rewritten `OrdersRepository` (task_05) against Prisma, and adds `src/infra/mappers/prisma-orders-mapper.ts` to convert a Prisma order (with `items` and `bakeryId`) into the domain `Order`.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include verification in deliverables
</critical>

<requirements>
- MUST add `src/infra/mappers/prisma-orders-mapper.ts` exporting a `toOrder(prismaOrder)` that maps all `Order` fields incl. `items: OrderItem[]`, `bakeryId`, `fulfillmentType`, `preparingAt`, `readyAt`. Follow the style of `src/infra/mappers/prisma-item-mapper.ts`.
- MUST implement every method of the new `OrdersRepository` in `src/infra/repositories/prisma-orders-repository.ts`:
  - `createFromSubscription` — single `prisma.order.create` with nested `items: { create: [...] }`; returns the mapped order with items.
  - `existsForSubscriptionAndDate` — `prisma.order.count`/`findUnique` on the `(subscriptionId, serviceDate)` unique.
  - `findByIdWithItems` — `findUnique` with `include: { items: true }`.
  - `listByBakery` — `where: { bakeryId, ...status?, serviceDate range? }`, `include: { items: true }`, ordered by `serviceDate` then `createdAt`.
  - `findByDateRange` — day-window query for `GET /orders`, `include: { items: true }`.
  - `findAvailableForDelivery` — `where: { status: 'READY', fulfillmentType: 'DELIVERY', deliveryPersonId: null, serviceDate: {gte,lte} }`.
  - `updateStatus(id, status, patch)` — `prisma.order.update` setting `status` + only the provided patch fields.
  - `claim(id, deliveryPersonId)` — conditional `updateMany({ where: { id, status: 'READY', deliveryPersonId: null }, data: { deliveryPersonId, status: 'ACCEPTED', acceptedAt: new Date() } })`; return `count === 1`.
  - `release(id, deliveryPersonId)` — conditional `updateMany({ where: { id, deliveryPersonId, status: 'ACCEPTED' }, data: { deliveryPersonId: null, status: 'READY', acceptedAt: null } })`; return `count === 1`.
- MUST use the `prisma` singleton from `src/infra/database/prisma-client.ts` — never `new PrismaClient()`.
- MUST remove the now-dead `create`/`update`/`findBySubscriptionId`/`mapOrder`-inline in the old file (the old `mapOrder` is replaced by the mapper).
- MUST keep `npm run build` + `npx prisma generate` passing.
</requirements>

## Subtasks
- [ ] 7.1 Add `prisma-orders-mapper.ts`.
- [ ] 7.2 Implement `createFromSubscription`, `existsForSubscriptionAndDate`, `findByIdWithItems`.
- [ ] 7.3 Implement `listByBakery`, `findByDateRange`, `findAvailableForDelivery`.
- [ ] 7.4 Implement `updateStatus`, `claim`, `release` (conditional `updateMany`).
- [ ] 7.5 Delete the obsolete methods; `npm run build`.

## Implementation Details
The `claim`/`release` conditional-`updateMany` pattern is a direct port of what `PrismaSubscribeRepository.claim`/`release` do today on `subscription` — same optimistic-concurrency approach (`delivery-order-assignment` ADR-004), just on the `order` table. `createFromSubscription`'s nested `items.create` receives objects already carrying `nameSnapshot`/`priceCentsSnapshot` — do not re-read `Item` here.

### Relevant Files
- `src/infra/repositories/prisma-orders-repository.ts` — rewritten.
- `src/infra/repositories/prisma-subscribe-repository.ts` — `claim`/`release` `updateMany` reference.
- `src/infra/mappers/prisma-item-mapper.ts` — mapper style.

### Dependent Files
- `src/main/factories/order-controller-factory.ts` (task_21).
- All order use cases (tasks 09, 11–16).

### Related ADRs
- [ADR-001](adrs/adr-001.md), [ADR-002](adrs/adr-002.md).

## Deliverables
- `prisma-orders-repository.ts` implementing the new port + `prisma-orders-mapper.ts`.
- Manual verification **(REQUIRED)**.

## Tests
- Manual verification (dev DB, via a scratch script or `request.http` once controllers exist):
  - [ ] `createFromSubscription` with 2 items creates 1 order + 2 `order_items`; returned order has `items.length === 2` with snapshot values.
  - [ ] `existsForSubscriptionAndDate` is true after creation, false for a different date.
  - [ ] `listByBakery` returns only the given bakery's orders; `status`/date filters narrow correctly.
  - [ ] `claim` returns true once, then false on a second call for the same order; `release` returns true only for the owner on an `ACCEPTED` order.
  - [ ] `updateStatus(id, 'READY', { readyAt })` sets both fields, leaves others intact.
  - [ ] `npm run build` + `prisma generate` pass.
- Coverage target: N/A.

## Success Criteria
- Every port method is implemented against the `order`/`order_items` tables via the singleton client.
- `claim`/`release` are atomic conditional updates returning a boolean.
