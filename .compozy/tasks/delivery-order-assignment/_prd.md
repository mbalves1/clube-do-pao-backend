# PRD: Delivery Order Assignment

## Overview

Today, a `DeliveryPerson` in Clube do Pão has no way to see which orders need a courier or to claim one — the only mechanism that links an order to a courier is a generic internal endpoint with no self-service flow and no ownership check. This feature gives couriers a self-service way to browse unassigned orders, claim the ones they want to deliver, and manage their claim through to completion.

It is for **delivery persons** (the `DeliveryPerson` role) who currently have no in-product way to find work, and indirectly for **customers and bakeries**, who benefit from orders being picked up faster once couriers can self-serve instead of waiting on manual assignment.

This is valuable because order assignment is currently a gap, not just a rough edge: without it, every order requires a person outside the app to manually decide who delivers it. Removing that bottleneck is a precondition for the delivery side of the product to function at any scale beyond a handful of manually coordinated orders.

## Goals

- Let a delivery person go from "no assigned work" to "actively delivering an order" entirely inside the product, without manual coordination.
- Reduce the time between an order becoming ready for pickup and a courier claiming it.
- Ensure only the courier who claimed an order can update its delivery status, closing the current gap where any authenticated user can modify any order.
- Ship a first version scoped tightly enough to validate real courier behavior (claim volume, release frequency, concurrent claims) before investing in matching/fairness logic.

## User Stories

**Primary persona: Delivery person**
- As a delivery person, I want to see a list of orders that need a courier, so that I can choose work without waiting to be manually assigned.
- As a delivery person, I want to claim an order, so that it's reserved for me and other couriers stop seeing it as available.
- As a delivery person, I want to see new available orders appear in real time while I have the app open, so that I don't have to keep refreshing to find work.
- As a delivery person, I want to release an order I claimed but can no longer deliver (before I've picked it up), so that it goes back to the pool instead of being stuck with me.
- As a delivery person, I want to update the status of only the orders I claimed, so that my deliveries are tracked accurately and I'm not affected by other couriers' actions.

**Secondary persona: Customer / Bakery**
- As a customer or bakery, I benefit from orders being claimed and delivered faster, even though I don't interact with this feature directly.

## Core Features

1. **Available orders feed**
   - Shows all orders that do not yet have a courier assigned.
   - Not filtered by region, bakery, or proximity in this phase — every active courier sees the full unassigned pool.

2. **Claim an order**
   - A delivery person can claim any order from the available feed.
   - Once claimed, the order disappears from other couriers' available feed.
   - No limit on how many orders a single courier can hold at once in this phase.

3. **Real-time notification of new availability**
   - When an order becomes available, couriers with the app open are notified live (reusing the existing real-time notification channel), so the feed updates without a manual refresh.

4. **Release a claimed order**
   - A courier can release an order back to the pool while it is still in the "accepted, not yet picked up" state.
   - Once an order has been picked up, it can no longer be released — the claim is final from that point.

5. **Ownership-restricted status updates**
   - Only the courier holding the claim can advance that order's delivery status (picked up, delivered, etc.).
   - Other couriers and unrelated users can no longer modify an order they don't own.

## User Experience

**Primary flow — claiming and delivering:**
1. Delivery person opens the available orders feed.
2. Browses currently unassigned orders; new ones appear live as they become available.
3. Claims an order they want to deliver — it's removed from everyone else's feed.
4. Proceeds through the existing delivery flow (pickup → delivered), same as today, but now restricted to the courier who claimed it.

**Secondary flow — can't complete a claimed delivery:**
1. Delivery person claimed an order but can no longer deliver it (before pickup).
2. Releases it back to the pool.
3. It reappears in the available feed (and the real-time notification fires) for another courier to claim.

**Edge case — race to claim:**
- Two couriers view the same available order at the same time; only one claim succeeds. The other sees the order is no longer available when they try.

## High-Level Technical Constraints

- Must reuse the existing real-time notification channel already used for order status updates, rather than introducing a new delivery mechanism.
- Must not weaken the existing authentication requirement — claiming and status updates remain restricted to authenticated delivery persons.

## Non-Goals (Out of Scope)

- Matching or ranking orders by courier proximity, region, or delivery radius — the feed is unfiltered in this phase.
- Push-style offers to a specific courier with an acceptance timeout (the iFood/Rappi model) — deferred; this phase is pull-only.
- Any limit or quota on how many orders a courier can claim concurrently.
- Acceptance-rate tracking, courier scoring, or any penalty/reward system tied to claim or release behavior.
- Bakery- or admin-side tools to manually assign or reassign a courier — out of scope for this phase.
- Availability toggle (online/offline) for couriers — all active couriers see the feed regardless of whether they intend to work right now.

## Phased Rollout Plan

### MVP (Phase 1)
- Available orders feed (all unassigned orders, unfiltered).
- Claim and release (pre-pickup) actions.
- Real-time notification when new orders become available.
- Ownership restriction on status updates.
- Success criteria to proceed: couriers are able to claim and complete orders end-to-end without manual/external coordination for a full operating week.

### Phase 2
- Geographic or bakery-based filtering of the available feed, once there's enough order volume that an unfiltered pool becomes noisy or couriers are claiming orders far outside their area.
- Success criteria to proceed: observed evidence (from Phase 1 usage) that couriers are claiming orders they can't reasonably deliver, or that the feed has grown large enough to need filtering.

### Phase 3
- Push-style offers with proximity/fairness-aware matching and acceptance timeouts, informed by real claim/release/decline data gathered in Phases 1–2.
- Long-term success criteria: reduced time-to-claim and more balanced order distribution across active couriers compared to the pull-only model.

## Success Metrics

- Median time between an order becoming available and being claimed.
- Share of orders that reach "delivered" without ever needing manual/external reassignment.
- Release rate (claimed orders returned to the pool) as a share of all claims — a proxy for whether couriers are claiming responsibly.
- Reduction in support/coordination overhead currently spent manually assigning couriers to orders.

## Risks and Mitigations

- **Risk**: Without proximity filtering, a courier could claim an order far outside their practical delivery range. **Mitigation**: the release-before-pickup flow lets them back out before committing; Phase 2 adds filtering once real data shows this is a frequent problem.
- **Risk**: No cap on concurrent claims could let one courier over-claim and under-deliver, creating a backlog. **Mitigation**: monitored via the release rate and time-to-delivered success metrics; a cap can be introduced later if data supports it.
- **Risk**: Race conditions when multiple couriers try to claim the same order simultaneously could cause confusion if not handled cleanly at the product level (e.g., unclear error messaging). **Mitigation**: the experience must clearly communicate "this order was just claimed by someone else" rather than a generic error.

## Architecture Decision Records

- [ADR-001: Self-Service Pull-Based Order Claiming with Real-Time Availability Feed](adrs/adr-001.md) — Chose pull-based claiming with an SSE-driven real-time feed over push-with-timeout assignment or polling-only, given the lack of proximity/matching data today and the low incremental cost of reusing existing real-time infrastructure.

## Open Questions

- Should couriers be able to opt out of appearing "active" (i.e., an online/offline toggle) even though this phase doesn't filter the feed by courier state? Deferred — no toggle exists in the current `DeliveryPerson` model beyond a generic `status` field not currently used this way.
- At what order volume or courier count does the unfiltered feed become a real usability problem, triggering Phase 2? No current data to answer this — needs real usage after MVP launch.
- Should bakeries or admins have any visibility into which courier claimed their order, beyond what's already surfaced through existing order status? Not addressed in this phase.