---
status: pending
title: "docs/architecture.md: document the Subscription/Order split and order lifecycle"
type: backend
complexity: low
dependencies:
  - task_16
  - task_20
---

# Task 22: Update architecture docs

## Overview
`docs/architecture.md`'s "Modelo de domínio" section still describes `Subscription` as "assinatura recorrente" that spawns `Order` with a purely courier status flow. Update it to the shipped model so the next contributor isn't misled.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include verification in deliverables
</critical>

<requirements>
- MUST update the `Subscription` and `Order` bullets in `docs/architecture.md` "Modelo de domínio":
  - `Subscription` = recurring template (customer↔bakery, cadence, windows, `fulfillmentType` default, `active`, `SubscriptionItem[]` basket). Note `serviceDate`/`status`/`deliveryPersonId` are legacy columns no longer written.
  - `Order` = per-service-date instance generated from a `Subscription`, with `bakeryId`, `fulfillmentType`, `OrderItem[]` snapshot lines, and the full lifecycle `PENDING → PREPARING → READY → ACCEPTED → PICKED_UP → DELIVERED` (+ `CANCELED`).
  - state ownership: `PENDING→PREPARING→READY` and pre-claim `CANCEL` are seller actions; `ACCEPTED→PICKED_UP→DELIVERED` are courier actions; for `PICKUP` orders `READY→PICKED_UP` is a seller-confirmed close (no courier).
  - `READY` on a `DELIVERY` order is what puts it in the courier available pool (SSE `order-available`).
- MUST add `OrderItem` and `SubscriptionItem` to the entities list with a one-line "snapshot line vs template basket line" distinction ([ADR-002](adrs/adr-002.md)).
- MUST note the generation trigger is an explicit endpoint for now (`POST /orders/generate`), scheduled generation deferred ([ADR-004](adrs/adr-004.md)).
- MUST add a one-line pointer to `.compozy/tasks/seller-order-fulfillment/` for the full rationale.
- SHOULD note the one-off `Order` backfill (task_02) happened.
- MUST NOT restructure the doc or touch unrelated sections.
</requirements>

## Subtasks
- [ ] 22.1 Rewrite the `Subscription` / `Order` bullets.
- [ ] 22.2 Add `OrderItem` / `SubscriptionItem` entries.
- [ ] 22.3 Note the generation trigger + backfill + link the feature folder.

## Implementation Details
Keep the existing Portuguese prose style and bullet format of "Modelo de domínio". This is documentation only — no code, no build impact.

### Relevant Files
- `docs/architecture.md` — "Modelo de domínio" section.

### Dependent Files
- none.

### Related ADRs
- [ADR-001](adrs/adr-001.md), [ADR-002](adrs/adr-002.md), [ADR-003](adrs/adr-003.md), [ADR-004](adrs/adr-004.md).

## Deliverables
- Updated `docs/architecture.md`.
- Manual verification **(REQUIRED)**.

## Tests
- Manual verification:
  - [ ] The doc no longer implies `Order` status transitions are courier-only.
  - [ ] `Subscription` is described as a template with a basket; legacy columns called out.
  - [ ] `OrderItem`/`SubscriptionItem` and the generation endpoint are documented.
- Coverage target: N/A.

## Success Criteria
- `docs/architecture.md` matches the shipped model; a new contributor can tell `Subscription` (template) from `Order` (instance).
