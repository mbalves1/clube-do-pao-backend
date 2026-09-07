---
status: pending
title: "OrdersRepository port: rewrite around the instance model"
type: backend
complexity: medium
dependencies:
  - task_03
---

# Task 5: Rewrite the `OrdersRepository` port

## Overview
Replaces the current `OrdersRepository` interface (built around lazy `create`/`update`/`findBySubscriptionId`) with the instance-model contract every order use case in this feature needs: generation, bakery-scoped listing, status updates with timestamp patches, the courier available/claim/release reads, and the admin day list.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include verification in deliverables
</critical>

<requirements>
- MUST rewrite `src/core/ports/orders-repository.ts` to the interface in the TechSpec "Core Interfaces" — `createFromSubscription`, `existsForSubscriptionAndDate`, `findByIdWithItems`, `listByBakery`, `findByDateRange`, `findAvailableForDelivery`, `updateStatus`, `claim`, `release` — plus the supporting types `OrderStatusPatch`, `GenerateOrderInput`, `BakeryOrderFilters`.
- MUST define `claim` and `release` to return `Promise<boolean>` (false = lost race / precondition not met), matching the existing `SubscribeRepository.claim`/`release` contract that `delivery-order-assignment` relies on.
- MUST remove the obsolete `create(order, deliveryId)`, `update(order)`, `findBySubscriptionId` from the interface (their only callers — `update-orders.ts` — are migrated in task_16; if strict ordering is a problem, keep `findBySubscriptionId` temporarily and delete it in task_16, noting it here).
- MUST keep the port free of Prisma types — use domain `Order`, `OrderStatus`, `FulfillmentType` from `src/core/entities/`.
- MUST keep `npm run build` green for the port file itself; the Prisma implementation is task_07.
</requirements>

## Subtasks
- [ ] 5.1 Replace the interface body with the new method set + supporting types.
- [ ] 5.2 Decide and document the fate of `findBySubscriptionId` (remove now vs. remove in task_16).
- [ ] 5.3 `npm run build` (impl breakage in `prisma-orders-repository.ts` is expected and owned by task_07).

## Implementation Details
Copy the exact signatures from the TechSpec. `GenerateOrderInput.items` carries the already-snapshotted `nameSnapshot`/`priceCentsSnapshot` (the snapshot happens in the template query, task_08 / use case, task_09) — the repo just persists what it's given. `updateStatus(id, status, patch)` takes the new `status` plus only the timestamp/`deliveryPersonId` fields that change for that transition; the use cases decide which patch fields to send.

### Relevant Files
- `src/core/ports/orders-repository.ts` — rewritten.
- `src/core/ports/subscribe-repository.ts` — `claim`/`release` boolean-return precedent.
- `src/core/ports/item-repository.ts` — port style reference.

### Dependent Files
- `src/infra/repositories/prisma-orders-repository.ts` (task_07).
- All `src/core/usecases/orders/*` (tasks 09, 11, 12, 13, 14, 15, 16).

### Related ADRs
- [ADR-001](adrs/adr-001.md).

## Deliverables
- Rewritten `orders-repository.ts` port.
- Manual verification **(REQUIRED)**.

## Tests
- Manual verification:
  - [ ] Port compiles in isolation; no Prisma import.
  - [ ] Every method the TechSpec API table implies has a corresponding port method.
  - [ ] `claim`/`release` return `Promise<boolean>`.
- Coverage target: N/A.

## Success Criteria
- The port expresses the full instance-model contract the feature needs.
- No framework types leak into `core/ports`.
