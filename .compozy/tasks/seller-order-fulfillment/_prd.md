# PRD: Seller Order Fulfillment

## Overview

Today a bakery (`company` role) in Clube do Pão can register itself and manage its items for sale, but it has no way to see the orders it needs to prepare, no way to signal that an order is ready, and no order-level notion of "this one is pickup, that one is delivery". Orders barely exist as first-class data: the per-service-date rows live in the `subscription` table, the `Order` table is written only as a lazy side effect of a courier status update, and every lifecycle transition today is a courier action. The seller side of the order lifecycle is missing entirely.

This feature gives a bakery a self-service order queue: it sees the orders due for a given day, itemized (which products, how much of each), moves each one through **preparing → ready**, and — the moment it marks an order **ready** — that order becomes available for pickup by the customer or for a courier to claim, depending on the order's fulfillment type.

Delivering this requires first making `Order` a real per-date instance generated from a recurring `Subscription` template (see [ADR-001](adrs/adr-001.md)), because the current `subscription`-row-as-order model cannot carry line items, a fulfillment type, or a seller-owned status range without collapsing under its own ambiguity.

It is for **bakeries** (`company` role), who currently have zero order visibility, and indirectly for **customers and couriers**, who today have no reliable signal that an order is actually ready to hand over or collect.

## Goals

- Give a bakery a single place to see every order it must prepare for a given day, with the exact items and quantities for each.
- Let a bakery advance an order it owns through a clear lifecycle (`preparing`, `ready`) and no further — handover and delivery stay outside the seller's control.
- Make "ready" the single event that releases an order downstream: to the customer for a pickup order, to the courier available-orders pool for a delivery order.
- Establish `Order` as the per-service-date system of record for a fulfillment, generated from a `Subscription` template, so line items, fulfillment type, and lifecycle status all have one unambiguous home.
- Migrate the existing courier claim/release/status flow off `subscription` rows and onto `Order` in the same effort, so there is one order model, not two.

## User Stories

**Primary persona: Bakery (`company`)**
- As a bakery, I want to see the orders I need to prepare for today, so that I know what to bake and for whom without an outside spreadsheet.
- As a bakery, I want each order to show its items and quantities, so that I can prepare it correctly.
- As a bakery, I want to mark an order as being prepared, so that its state reflects reality and the customer/courier knows it has been started.
- As a bakery, I want to mark an order as ready, so that a pickup customer knows they can come get it and a delivery order becomes claimable by a courier.
- As a bakery, I want to cancel an order that I cannot fulfill before it has been picked up, so that nobody shows up for something that isn't coming.
- As a bakery, I want to be unable to touch orders that belong to another bakery, so that a mistake or a bad actor can't disrupt someone else's queue.

**Secondary persona: Customer / Courier**
- As a customer with a pickup order, I benefit from a real "ready" signal so I don't arrive to wait.
- As a courier, I benefit from only seeing delivery orders that a bakery has actually finished preparing, instead of orders that aren't ready yet.

## Core Features

1. **Order generation from subscriptions**
   - An explicit operation generates the concrete orders for a target service date from the active recurring subscription templates whose schedule (weekday / frequency) matches that date.
   - Each generated order copies the subscription's basket into its own line items, snapshotting each item's name and price at generation time so later menu/price edits never rewrite a past order.
   - Generation is idempotent: running it twice for the same date does not create duplicates.
   - In this phase the operation is triggered explicitly (endpoint); automatic scheduling is a later phase (see [ADR-004](adrs/adr-004.md)).

2. **Bakery order queue**
   - A bakery sees the orders for its own bakery, filterable by status and by service date, each with its line items and quantities and its fulfillment type.
   - A bakery never sees another bakery's orders; ownership is resolved from the authenticated user, the same way item management already resolves it.

3. **Seller-owned lifecycle transitions**
   - A bakery can move an order `PENDING → PREPARING → READY`, and can `CANCEL` an order any time before a courier has picked it up.
   - A bakery cannot move an order into or past the courier-owned states (`ACCEPTED`, `PICKED_UP`, `DELIVERED`) — for a delivery order those remain courier actions; for a pickup order, marking the customer's collection is a seller confirmation that closes the order.
   - Invalid transitions (e.g. `READY → PENDING`, or a courier-only step) are rejected with a clear error, not silently applied.

4. **"Ready" as the downstream release point**
   - Marking a **delivery** order `READY` puts it into the courier available-orders pool and fires the existing real-time availability event.
   - Marking a **pickup** order `READY` signals the customer can collect it; when they do, the bakery confirms collection, which closes the order.

5. **One order model**
   - The courier available-orders / accept / release / status-update flow, which today reads and mutates `subscription` rows, is migrated to operate on `Order`.
   - The `Order` lifecycle status enum gains `PREPARING` and `READY`; the fulfillment type (`PICKUP` / `DELIVERY`) is carried on both the subscription (as the template's default) and each generated order (as the instance's own value).

## User Experience

**Primary flow — preparing a day's orders:**
1. Orders for the day are generated from active subscriptions (explicit trigger this phase).
2. The bakery opens its order queue and sees the day's orders, each itemized, each `PENDING`.
3. The bakery marks an order `PREPARING` when it starts it, then `READY` when it's done.
4. A delivery order, on `READY`, appears in the courier pool; a pickup order, on `READY`, is now collectable by the customer.
5. For a pickup order, when the customer collects it, the bakery confirms collection and the order is closed.

**Secondary flow — can't fulfill an order:**
1. The bakery realizes it can't fulfill an order (out of an ingredient, etc.) before it's been picked up.
2. It cancels the order; the order leaves the active queue and, if it was a claimable delivery order, is removed from the courier pool.

**Edge cases:**
- Generation is run twice for the same date → the second run creates nothing and reports zero created.
- A bakery tries to act on an order id that isn't its bakery's → rejected as not permitted.
- A bakery tries an out-of-order transition (e.g. `PENDING → READY` skipping `PREPARING`, or `READY → DELIVERED`) → rejected with a transition error.
- A delivery order is marked `READY`, a courier claims it, then the bakery tries to cancel it → rejected because it is past the seller-cancelable point.

## High-Level Technical Constraints

- Must reuse the existing real-time channel (`sseService`) for the "order became available" signal rather than adding a new mechanism.
- Must reuse the existing authenticated-user → bakery resolution used by item management (`resolveOwnerBakeryId`) for ownership checks, not invent a second path.
- Must keep all backend structure within the project's Clean Architecture conventions (`docs/architecture.md`): entity → port → use case → repository → validator → controller → route → factory.
- The Subscription/Order split must include a data migration that backfills `Order` rows for existing `subscription` rows so the courier flow does not regress.
- No automated test framework exists in this repo (`docs/infra.md`); verification is manual via `request.http` and `npm run build`, consistent with the sibling `delivery-order-assignment` feature.

## Non-Goals (Out of Scope)

- Automatic/scheduled order generation (cron, queue worker) — this phase triggers generation explicitly; automation is a later phase.
- A customer-facing "build your order" flow — order line items come from the subscription basket, not a per-order customer selection (that was explicitly deferred).
- Subscription basket management UI/endpoints beyond accepting `items` at subscription creation — editing a subscription's basket later is not in this phase.
- Payment, invoicing, or totals/settlement on orders — line items carry a price snapshot for display and future use, but no charging happens here.
- Courier assignment logic changes (matching, proximity, fairness) — that is owned by `delivery-order-assignment`; this feature only changes what feeds that pool and moves it onto `Order`.
- Role-based route guards — the repo has no per-role authorization middleware today (`docs/architecture.md`); ownership is enforced in the use case, not by a role guard. Hardening auth by role is out of scope.
- Notifications to the customer for pickup readiness beyond what the existing SSE channel already provides.

## Phased Rollout Plan

### MVP (Phase 1)
- Subscription/Order split with data backfill.
- Order generation endpoint (explicit trigger), idempotent, with snapshotted line items.
- Bakery order queue (list by bakery, filter by status/date, with line items).
- Seller transitions `PENDING → PREPARING → READY` and pre-pickup `CANCEL`, with a transition-validation module.
- `fulfillmentType` on subscription + order; `READY` releases the order downstream (courier pool for delivery, collectable for pickup); pickup collection confirmation by the seller.
- Courier available/accept/release/status-update flow migrated onto `Order`.
- Success criteria to proceed: a bakery can take a generated day of orders from `PENDING` to `READY`, a courier can claim and complete the delivery ones, and a pickup one can be closed on collection — all against `Order`, with no `subscription`-row order mutation remaining.

### Phase 2
- Scheduled/automatic generation once Phase 1 proves the generation logic against real subscription data.
- Subscription basket editing.
- Success criteria to proceed: Phase 1 generation has run correctly against real subscriptions for a full operating week.

### Phase 3
- Order totals/settlement and customer pickup notifications, informed by real fulfillment data.

## Success Metrics

- Every order a bakery needs to prepare for a day is visible in its queue with correct items/quantities (manual spot check against the source subscriptions).
- Zero `subscription`-row status/`deliveryPersonId` mutations remain in the codebase after migration (courier flow fully on `Order`).
- Generation run twice for a date yields zero duplicate orders.
- No cross-bakery order access is possible (ownership check rejects it).
- Median time from "bakery marks ready" to "courier claims" for delivery orders (baseline for later phases).

## Risks and Mitigations

- **Risk**: The Subscription/Order split is a data-model refactor touching the live courier flow; a bad migration regresses `delivery-order-assignment`. **Mitigation**: a dedicated backfill task creates `Order` rows for all existing `subscription` rows before any courier use case is switched over; the courier use cases are migrated in their own tasks after the data exists.
- **Risk**: Snapshotting line items duplicates item data and can drift from the catalog. **Mitigation**: this is intentional ([ADR-002](adrs/adr-002.md)) — a past order must not change when a price changes; the snapshot is display/record data, the live `Item` remains the catalog source of truth.
- **Risk**: The explicit generation endpoint could be called by anyone authenticated and flood the table. **Mitigation**: idempotency (unique on `subscriptionId + serviceDate`) caps damage to one row per subscription per date; restricting the trigger to an operator/cron identity is called out as an open question for Phase 2.
- **Risk**: `PICKUP` orders have no courier, so reusing the shared status enum could leave them in an ambiguous end state. **Mitigation**: [ADR-003](adrs/adr-003.md) defines the pickup path explicitly (`READY → PICKED_UP` as a seller-confirmed close, no `ACCEPTED`/`DELIVERED`).
- **Risk**: Express route matching — `/orders/bakery` and `/orders/generate` can be shadowed by `/orders/:id/...`. **Mitigation**: task for routes explicitly requires the literal paths to be registered before the parameterized ones.

## Architecture Decision Records

- [ADR-001: Split `Subscription` (recurring template) from `Order` (per-service-date instance)](adrs/adr-001.md)
- [ADR-002: Snapshot order line items at generation time](adrs/adr-002.md)
- [ADR-003: Seller-owned vs courier-owned status ranges on a shared `Order` lifecycle, with `fulfillmentType` branching](adrs/adr-003.md)
- [ADR-004: Explicit generation trigger for this phase, scheduled generation deferred](adrs/adr-004.md)

## Open Questions

- Who is allowed to call the generation endpoint? This phase gates it on `authMiddleware` only; a dedicated operator/cron identity (or an internal-only route) is deferred to Phase 2 alongside scheduled generation.
- Should a `PICKUP` order's collection be confirmed by the seller (assumed here) or by the customer via a customer-facing action (no such surface exists yet)? Assumed seller-confirmed for this phase.
- Biweekly / monthly frequency matching for generation: `create-subscribe.ts` only meaningfully expands `daily` and `weekly` today. Generation matching in this phase follows the same weekday/`daysWeek` logic; richer frequency handling tracks whatever `create-subscribe` supports.
- Does `GET /orders` (the existing unscoped admin list) stay as-is or also move behind bakery scoping? Kept as-is for now (admin/debug), reading from `Order`.
