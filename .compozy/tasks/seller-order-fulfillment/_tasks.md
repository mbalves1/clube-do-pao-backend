# Seller Order Fulfillment — Task List

## Tasks

| # | Title | Status | Complexity | Dependencies |
|---|-------|--------|------------|--------------|
| 01 | Prisma schema: Subscription/Order split, OrderItem + SubscriptionItem, FulfillmentType, PREPARING/READY | done | high | — |
| 02 | Data backfill: create one Order per existing subscription row | done | high | task_01 |
| 03 | Domain entities: Order (reworked), OrderItem, SubscriptionItem, Subscription | done | medium | task_01 |
| 04 | `order-status-transitions.ts` module + `InvalidOrderStatusTransitionError` | done | medium | task_03 |
| 05 | `OrdersRepository` port: rewrite around the instance model | done | medium | task_03 |
| 06 | `SubscribeRepository` port: template query + basket; drop order-ish methods | done | medium | task_03 |
| 07 | `PrismaOrdersRepository`: implement the new port + `prisma-orders-mapper` | done | high | task_01, task_05 |
| 08 | `PrismaSubscribeRepository`: `listActiveTemplatesForDate` + `getItems`/`setItems`; remove legacy order methods | done | medium | task_01, task_06 |
| 09 | `GenerateOrdersFromSubscriptionsUseCase` | done | medium | task_05, task_06, task_07, task_08 |
| 10 | Relocate `resolveOwnerBakeryId` to `usecases/shared/` | done | low | — |
| 11 | `ListBakeryOrdersUseCase` | done | low | task_05, task_07, task_10 |
| 12 | `UpdateOrderStatusBySellerUseCase` (+ SSE on READY) | done | medium | task_04, task_05, task_07, task_10 |
| 13 | Migrate `ListAvailableOrdersUseCase` onto Order | done | low | task_02, task_07 |
| 14 | Migrate `AcceptOrderUseCase` onto `Order.claim` | done | medium | task_02, task_07 |
| 15 | Migrate `ReleaseOrderUseCase` onto `Order.release` | done | medium | task_02, task_07 |
| 16 | Migrate `UpdateOrdersUseCase` (courier status) onto Order + transition module | done | medium | task_02, task_04, task_07 |
| 17 | Zod validators: generate, seller status update, bakery-orders query; narrow courier `updateOrderSchema` | done | low | task_03 |
| 18 | `CreateSubscribeUseCase` + validator: accept `items[]` basket and `fulfillmentType` | done | medium | task_06, task_08, task_17 |
| 19 | `OrdersController`: new handlers + adapt migrated handlers | done | medium | task_09, task_11, task_12, task_13, task_14, task_15, task_16, task_17 |
| 20 | `orders-routes.ts`: register new routes + Swagger; literal paths before param paths | done | medium | task_17, task_19 |
| 21 | Factories: wire new repos + use cases into order and subscribe controllers | done | low | task_09, task_11, task_12, task_13, task_14, task_15, task_16, task_18, task_19 |
| 22 | `docs/architecture.md`: document the Subscription/Order split and order lifecycle | done | low | task_16, task_20 |

## Notes

- **Feature:** gives a bakery (`company`) an order queue — generated from subscription templates, itemized — and a seller-owned lifecycle (`PENDING → PREPARING → READY`, pre-claim `CANCEL`, pickup close), while migrating the existing courier available/accept/release/status flow off `subscription` rows and onto `Order`.
- **Blocking sequence:** task_01 → task_02 (backfill) must both land before tasks 13–16 switch the courier use cases to `OrdersRepository`, or `delivery-order-assignment` regresses.
- **Standing external blocker (not owned here):** `company` / `delivery` account registration still doesn't create a Supabase credential, so those roles can't log in in production — same gap `delivery-order-assignment` documents. Verifiable with manually-provisioned credentials.
- No automated test framework in this repo — every task verifies manually via `request.http` + `npm run build` + `npx prisma generate` (see `_techspec.md` "Testing Approach").
- See `_prd.md`, `_techspec.md`, and `adrs/adr-001..004.md` for full rationale.
