---
status: done
title: "CreateSubscribeUseCase + validator: accept items[] basket and fulfillmentType"
type: backend
complexity: medium
dependencies:
  - task_06
  - task_08
  - task_17
---

# Task 18: Subscription creation persists a basket + fulfillment type

## Overview
Generation (task_09) snapshots a subscription's basket into order line items — but nothing writes that basket today. Extend subscription creation to accept `items: [{ itemId, quantity }]` and `fulfillmentType`, validate the items belong to the subscription's bakery, and persist them via `setItems`.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include verification in deliverables
</critical>

<requirements>
- MUST extend `src/infra/http/validators/subscription-validator.ts` `createSubscriptionSchema.subscribe` with:
  - `fulfillmentType: z.enum(['PICKUP', 'DELIVERY']).optional()` (default `DELIVERY` applied in the use case).
  - `items: z.array(z.object({ itemId: z.string().min(1), quantity: z.number().int().positive() })).optional()`.
- MUST extend `CreateSubscribeUseCase.execute`'s `subscribe` input type with `fulfillmentType?` and `items?`.
- MUST pass `fulfillmentType` (defaulted to `'DELIVERY'`) into each `subscribeRepository.create(...)` call (both the `daily` and `weekly` loops).
- MUST, when `items` is non-empty, validate every `itemId` belongs to `idBakery` before persisting — use `ItemRepository` (inject it; `findByBakeryId(idBakery)` already exists) and reject with `BadRequestError`/`Error` (match the file's current error style — it currently throws plain `Error`) if any `itemId` is not in that bakery's items.
- MUST call `subscribeRepository.setItems(subscription.id, items)` for each subscription row it creates (dedupe by `itemId`; `setItems` also dedupes).
- MUST NOT change the existing date-expansion behavior (one subscription row per matching date) — the basket is attached to each created row.
- MUST keep `npm run build` passing.
</requirements>

## Subtasks
- [x] 18.1 Validator: `items` + `fulfillmentType`.
- [x] 18.2 Use case: thread `fulfillmentType` into `create`; inject `ItemRepository`.
- [x] 18.3 Validate `itemId`s against the bakery; call `setItems` per created row.
- [x] 18.4 Build.

## Implementation Details
`CreateSubscribeUseCase` already injects `userRepository`, `bakeryRepository`, `subscribeRepository`; add `itemRepository`. The subscription rows are created inside `while` loops — capture each created row's `id` (the repo `create` returns the Prisma row) and call `setItems` right after. `SubscribeCreateData` gained `fulfillmentType` in task_06.

### Relevant Files
- `src/core/usecases/subscribe/create-subscribe.ts` — modified.
- `src/infra/http/validators/subscription-validator.ts` — modified.
- `src/core/ports/item-repository.ts` — `findByBakeryId`.

### Dependent Files
- `src/main/factories/subscribe-controller-factory.ts` (task_21) — inject `PrismaItemRepository`.
- `src/core/usecases/orders/generate-orders-from-subscriptions.ts` (task_09) — consumes the basket.

### Related ADRs
- [ADR-002](adrs/adr-002.md), [ADR-003](adrs/adr-003.md).

## Deliverables
- Modified `create-subscribe.ts` + `subscription-validator.ts`.
- Manual verification **(REQUIRED)**.

## Tests
- Manual verification (via the use case directly against the dev DB — real `POST /subscribe` request pending real Supabase creds, see note below):
  - [x] `POST` a subscription with `items: [{itemId, quantity: 2}]` + `fulfillmentType: 'PICKUP'` → subscription rows created, each with a `subscription_items` row; `fulfillment_type = PICKUP`. Verified.
  - [x] `items` referencing an item from another bakery → rejected (400/error). Verified with a temp item on a second real bakery — rejected with `Item não pertence à padaria informada`.
  - [x] Omitting `items`/`fulfillmentType` → still works; `fulfillment_type` defaults `DELIVERY`, no basket rows. Verified.
  - [x] `listActiveTemplatesForDate` (task_08) then returns that subscription with snapshot-shaped items. Verified.
- Coverage target: N/A.

Note: exercised `CreateSubscribeUseCase.execute` directly with the real Prisma repositories against the dev DB (same approach as tasks 07-09), not through the live HTTP route — creating a fresh `company`/`customer` Supabase credential to drive this through `POST /subscribe` end-to-end hits the same standing blocker `docs/architecture.md` already documents (company/delivery signup doesn't create a Supabase credential). The controller itself is unchanged by this task (it already forwarded `payload.subscribe` as-is, and the validator now types `fulfillmentType`/`items` on that object), so the use-case-level verification covers the actual behavior change.

## Success Criteria
- A subscription can carry a validated basket and a fulfillment type; generation has real data to snapshot.
