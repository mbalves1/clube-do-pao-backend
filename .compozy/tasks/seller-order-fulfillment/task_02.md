---
status: pending
title: "Data backfill: create one Order per existing subscription row"
type: backend
complexity: high
dependencies:
  - task_01
---

# Task 2: Backfill `Order` rows from legacy `subscription` rows

## Overview
Before any courier use case is switched from `SubscribeRepository` to `OrdersRepository` (tasks 13–16), every existing `subscription` row that represents a real dated occurrence must have a corresponding `Order` row, or the courier available/accept/release/status flow regresses ([ADR-001](adrs/adr-001.md) "Consequences"). This task provides an idempotent, additive backfill.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include verification in deliverables
</critical>

<requirements>
- MUST provide a runnable backfill (a `prisma/scripts/backfill-orders.ts` script run via `ts-node`/`tsx`, or a raw-SQL migration step — match whatever precedent exists in `prisma/`).
- MUST, for every `subscription` row, insert an `Order` when no `Order` exists for that `(subscriptionId, serviceDate)` pair; MUST skip rows that already have one (idempotent, safe to re-run).
- MUST copy `serviceDate`, `bakeryId`, and `deliveryPersonId` from the subscription row.
- MUST map `subscription.status` → `OrderStatus`: `'ACCEPTED'` → `ACCEPTED`; `'PICKED_UP'` → `PICKED_UP`; `'DELIVERED'` → `DELIVERED`; `'CANCELED'` → `CANCELED`; anything else (`'PENDING'`, `'pending'`, `'ACTIVE'`, null) → `PENDING`.
- MUST set `fulfillmentType = DELIVERY` for all backfilled orders (there is no pickup data historically).
- MUST NOT create `OrderItem` rows (historical baskets don't exist); backfilled orders have no line items.
- MUST NOT modify or delete any `subscription` row.
- MUST report a count of created vs skipped orders on completion.
- SHOULD be documented in `docs/architecture.md` or the migration notes as a one-off.
</requirements>

## Subtasks
- [ ] 2.1 Write the backfill script/step with the status mapping above.
- [ ] 2.2 Make it idempotent (guard on the `(subscriptionId, serviceDate)` unique constraint or an explicit existence check).
- [ ] 2.3 Run it against a dev DB seeded with representative `subscription` rows; confirm counts.
- [ ] 2.4 Document it as a one-off backfill.

## Implementation Details
The `Order(subscriptionId, serviceDate)` unique constraint from task_01 lets you rely on an upsert-style "create, ignore on conflict" or a pre-check. `deliveryPersonId` on a subscription row is already the courier id used by `delivery-order-assignment`'s `claim`/`release`, so copying it straight across preserves current claims. Keep the script dependency-light (direct `prisma` client, the singleton in `src/infra/database/prisma-client.ts`).

### Relevant Files
- `prisma/schema.prisma` — `Order` shape (from task_01).
- `src/infra/database/prisma-client.ts` — the client singleton to reuse.
- `src/infra/repositories/prisma-subscribe-repository.ts` — reference for how subscription rows are currently read.

### Dependent Files
- `src/core/usecases/orders/list-available-orders.ts`, `accept-order.ts`, `release-order.ts`, `update-orders.ts` (tasks 13–16) — must not run against an un-backfilled DB.

### Related ADRs
- [ADR-001](adrs/adr-001.md).

## Deliverables
- A committed, idempotent backfill script/step + a short run note.
- Manual verification **(REQUIRED)**.

## Tests
- Manual verification (dev DB seeded with a mix of subscription statuses, some already having an `Order`):
  - [ ] First run creates one `Order` per subscription row lacking one; status mapping is correct per row.
  - [ ] Second run creates zero, skips all.
  - [ ] No `subscription` row is altered; no `OrderItem` rows created.
  - [ ] A previously-claimed subscription (`deliveryPersonId` set, status `ACCEPTED`) produces an `Order` with the same `deliveryPersonId` and status `ACCEPTED`.
- Coverage target: N/A.

## Success Criteria
- After running, every `subscription` row has a matching `Order` for its `serviceDate`.
- Re-running is a no-op.
- Existing courier claims are preserved on the new `Order` rows.
