# TechSpec: Seller Order Fulfillment

## Executive Summary

This feature promotes `Order` to the per-service-date system of record for a fulfillment, generated from a recurring `Subscription` template ([ADR-001](adrs/adr-001.md)). It adds a bakery-facing order queue (list by bakery + line items), a seller-owned lifecycle range (`PENDING → PREPARING → READY`, plus pre-pickup `CANCEL`, plus a `PICKUP` close), snapshotted line items ([ADR-002](adrs/adr-002.md)), a per-order `fulfillmentType` that branches the "ready" release behavior ([ADR-003](adrs/adr-003.md)), and an explicit idempotent generation endpoint ([ADR-004](adrs/adr-004.md)). In the same effort it migrates the existing courier available/accept/release/status flow off `subscription` rows and onto `Order`, so the codebase ends with one order model.

The primary trade-off: a data-model refactor with a backfill migration, touching the live `delivery-order-assignment` flow, in exchange for removing the `subscription`-row-as-order overload permanently. Risk is contained by sequencing: schema + backfill land before any courier use case is switched over.

All backend work follows the project's Clean Architecture order (`docs/architecture.md`): entity → port → use case → repository → mapper → validator → controller → route → factory. No automated test framework exists (`docs/infra.md`); verification is manual via `request.http` + `npm run build`, matching the sibling `delivery-order-assignment` TechSpec.

## System Architecture

### Component Overview

**New — domain / core**
- `src/core/entities/order-item.ts` — `OrderItem` (snapshot line).
- `src/core/entities/subscription-item.ts` — `SubscriptionItem` (template basket line).
- `src/core/entities/subscription.ts` — `Subscription` template shape (no entity file exists today).
- `src/core/usecases/orders/order-status-transitions.ts` — pure actor/fulfillment-aware transition table.
- `src/core/errors/InvalidOrderStatusTransitionError.ts` — 422 `AppError` subclass.
- `src/core/usecases/orders/generate-orders-from-subscriptions.ts` — `GenerateOrdersFromSubscriptionsUseCase`.
- `src/core/usecases/orders/list-bakery-orders.ts` — `ListBakeryOrdersUseCase`.
- `src/core/usecases/orders/update-order-status-by-seller.ts` — `UpdateOrderStatusBySellerUseCase`.
- `src/core/usecases/shared/resolve-owner-bakery-id.ts` — relocated from `usecases/item/`.

**New — infra**
- `src/infra/mappers/prisma-orders-mapper.ts` — Prisma order (+ items, + bakeryId) → domain `Order`.

**Modified — domain / core**
- `src/core/entities/orders.ts` — `OrderStatus` gains `PREPARING`/`READY`, drops unused `ACTIVE`; `Order` gains `bakeryId`, `fulfillmentType`, `items`, `preparingAt`, `readyAt`.
- `src/core/ports/orders-repository.ts` — rewritten around the instance model (see Core Interfaces).
- `src/core/ports/subscribe-repository.ts` — gains `listActiveTemplatesForDate`, `getItems`, `setItems`; loses `findAvailable`/`claim`/`release`/`updateOrder`/`getOrderByDay` (re-homed on `OrdersRepository`).
- `src/core/usecases/orders/list-available-orders.ts`, `accept-order.ts`, `release-order.ts`, `update-orders.ts` — migrated to `OrdersRepository`.
- `src/core/usecases/orders/list-orders.ts` — reads `Order` for the day window instead of `subscription`.
- `src/core/usecases/subscribe/create-subscribe.ts` — accepts `items` + `fulfillmentType`, persists the basket.
- `src/core/usecases/item/*` — import path for `resolveOwnerBakeryId` updated.

**Modified — infra**
- `src/infra/repositories/prisma-orders-repository.ts` — implements the new port.
- `src/infra/repositories/prisma-subscribe-repository.ts` — implements template/basket methods, drops legacy order methods.
- `src/infra/controllers/orders-controller.ts` — new `generateOrders`, `listBakeryOrders`, `updateStatusBySeller`; existing handlers adapted.
- `src/infra/http/validators/order-validator.ts` — new schemas; courier `updateOrderSchema` narrowed.
- `src/infra/http/validators/subscription-validator.ts` — `items` + `fulfillmentType` on create.
- `src/infra/http/routes/orders-routes.ts` — new routes + Swagger; literal paths before param paths.
- `src/main/factories/order-controller-factory.ts`, `subscribe-controller-factory.ts` — wiring.
- `prisma/schema.prisma` + a new migration + a backfill script.
- `docs/architecture.md` — domain model section.

**Reused unchanged**
- `resolveOwnerBakeryId` logic (moved, not changed), `authMiddleware`, `validateSchema`, `sseService` (`order-available` event already defined by the delivery feature), `AppError` handling pattern in controllers.

Data flow (seller): `orders-routes` → `OrdersController` → use case → `resolveOwnerBakeryId` (User→BakeryPerson) + `OrdersRepository` (Prisma) → response; `UpdateOrderStatusBySeller` additionally calls `sseService.emit`.
Data flow (generation): `POST /orders/generate` → `OrdersController.generateOrders` → `GenerateOrdersFromSubscriptionsUseCase` → `SubscribeRepository.listActiveTemplatesForDate` + `OrdersRepository.createFromSubscription` / `existsForSubscriptionAndDate`.

## Implementation Design

### Core Interfaces

```typescript
// src/core/entities/orders.ts
export type OrderStatus =
  | 'PENDING' | 'PREPARING' | 'READY'
  | 'ACCEPTED' | 'PICKED_UP' | 'DELIVERED'
  | 'CANCELED';

export type FulfillmentType = 'PICKUP' | 'DELIVERY';

export type Order = {
  id: number;
  subscriptionId: number;
  bakeryId: string;
  deliveryPersonId?: string | null;
  serviceDate: Date;
  fulfillmentType: FulfillmentType;
  status: OrderStatus;
  items: OrderItem[];
  preparingAt?: Date | null;
  readyAt?: Date | null;
  acceptedAt?: Date | null;
  pickedUpAt?: Date | null;
  deliveredAt?: Date | null;
  canceledAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
};
```

```typescript
// src/core/entities/order-item.ts
export type OrderItem = {
  id: number;
  orderId: number;
  itemId: string;
  nameSnapshot: string;
  priceCentsSnapshot: number;
  quantity: number;
};

// src/core/entities/subscription-item.ts
export type SubscriptionItem = {
  id: number;
  subscriptionId: number;
  itemId: string;
  quantity: number;
};
```

```typescript
// src/core/ports/orders-repository.ts (rewritten)
export type OrderStatusPatch = Partial<Pick<Order,
  'preparingAt' | 'readyAt' | 'acceptedAt' | 'pickedUpAt' | 'deliveredAt' | 'canceledAt' | 'deliveryPersonId'
>>;

export type GenerateOrderInput = {
  subscriptionId: number;
  bakeryId: string;
  serviceDate: Date;
  fulfillmentType: FulfillmentType;
  items: { itemId: string; nameSnapshot: string; priceCentsSnapshot: number; quantity: number }[];
};

export type BakeryOrderFilters = {
  status?: OrderStatus;
  serviceDateFrom?: Date;
  serviceDateTo?: Date;
};

export interface OrdersRepository {
  createFromSubscription(input: GenerateOrderInput): Promise<Order>;
  existsForSubscriptionAndDate(subscriptionId: number, serviceDate: Date): Promise<boolean>;
  findByIdWithItems(id: number): Promise<Order | null>;
  listByBakery(bakeryId: string, filters: BakeryOrderFilters): Promise<Order[]>;
  findByDateRange(from: Date, to: Date): Promise<Order[]>;            // GET /orders (admin)
  findAvailableForDelivery(from: Date, to: Date): Promise<Order[]>;   // status READY, DELIVERY, unclaimed
  updateStatus(id: number, status: OrderStatus, patch: OrderStatusPatch): Promise<Order>;
  claim(id: number, deliveryPersonId: string): Promise<boolean>;     // where status READY, deliveryPersonId null -> ACCEPTED
  release(id: number, deliveryPersonId: string): Promise<boolean>;   // where owner, status ACCEPTED -> READY, null
}
```

```typescript
// src/core/ports/subscribe-repository.ts (delta)
export type SubscriptionTemplateForDate = {
  id: number;
  bakeryId: string;
  userId: string;
  serviceDate: Date;          // the target date, echoed back for convenience
  fulfillmentType: FulfillmentType;
  items: { itemId: string; nameSnapshot: string; priceCentsSnapshot: number; quantity: number }[];
};

export interface SubscribeRepository {
  create(data: SubscribeCreateData): Promise<any>;   // data now includes fulfillmentType
  getList(userId: string): Promise<any>;
  getSubscribeById(id: number): Promise<any>;
  getAll(page: number, limit: number, serviceDate?: string): Promise<any>;
  listActiveTemplatesForDate(date: Date): Promise<SubscriptionTemplateForDate[]>;
  getItems(subscriptionId: number): Promise<SubscriptionItem[]>;
  setItems(subscriptionId: number, items: { itemId: string; quantity: number }[]): Promise<void>;
  // REMOVED: findAvailable, claim, release, updateOrder, getOrderByDay
}
```

```typescript
// src/core/usecases/orders/order-status-transitions.ts
export type OrderActor = 'seller' | 'courier';
export function assertOrderTransition(
  from: OrderStatus, to: OrderStatus, actor: OrderActor, fulfillmentType: FulfillmentType,
): void;  // throws InvalidOrderStatusTransitionError (422) on an illegal move
```

Transition table (the only legal moves):

| from | to | actor | fulfillment |
|---|---|---|---|
| PENDING | PREPARING | seller | any |
| PREPARING | READY | seller | any |
| PENDING / PREPARING / READY | CANCELED | seller | any (READY→CANCELED only if unclaimed — checked in the use case) |
| READY | PICKED_UP | seller | PICKUP |
| READY | ACCEPTED | courier | DELIVERY |
| ACCEPTED | READY | courier | DELIVERY |
| ACCEPTED | PICKED_UP | courier | DELIVERY |
| PICKED_UP | DELIVERED | courier | DELIVERY |

### Data Models

Prisma changes (`prisma/schema.prisma`):

```prisma
enum OrderStatus {
  PENDING
  PREPARING   // new
  READY       // new
  ACCEPTED
  PICKED_UP
  DELIVERED
  CANCELED
}

enum FulfillmentType {   // new
  PICKUP
  DELIVERY
}

model Order {
  id               Int             @id @default(autoincrement())
  subscriptionId   Int
  bakeryId         String          // new — denormalized for bakery-scoped queries
  deliveryPersonId String?
  serviceDate      DateTime
  fulfillmentType  FulfillmentType @default(DELIVERY)  // new
  status           OrderStatus     @default(PENDING)
  preparingAt      DateTime?       // new
  readyAt          DateTime?       // new
  acceptedAt       DateTime?
  pickedUpAt       DateTime?
  deliveredAt      DateTime?
  canceledAt       DateTime?
  createdAt        DateTime        @default(now())
  updatedAt        DateTime        @updatedAt
  subscription     Subscription    @relation(fields: [subscriptionId], references: [id])
  bakery           Bakery          @relation(fields: [bakeryId], references: [id])
  deliveryPerson   DeliveryPerson? @relation(fields: [deliveryPersonId], references: [id])
  items            OrderItem[]
  @@unique([subscriptionId, serviceDate])   // idempotent generation
  @@map("orders")
}

model OrderItem {                    // new
  id                 Int      @id @default(autoincrement())
  orderId            Int
  itemId             String
  nameSnapshot       String
  priceCentsSnapshot Int
  quantity           Int
  order              Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  item               Item     @relation(fields: [itemId], references: [id])
  @@map("order_items")
}

model SubscriptionItem {            // new
  id             Int          @id @default(autoincrement())
  subscriptionId Int
  itemId         String
  quantity       Int
  subscription   Subscription @relation(fields: [subscriptionId], references: [id], onDelete: Cascade)
  item           Item         @relation(fields: [itemId], references: [id])
  @@unique([subscriptionId, itemId])
  @@map("subscription_items")
}

model Subscription {
  // ...existing fields unchanged...
  fulfillmentType FulfillmentType   @default(DELIVERY)  // new
  active          Boolean           @default(true)      // new
  items           SubscriptionItem[]                    // new
  // serviceDate, status, deliveryPersonId: retained, LEGACY — not written by new-flow code
}
// Bakery, Item, DeliveryPerson gain the back-relations (orders / orderItems / subscriptionItems) Prisma requires.
```

Backfill migration (its own task): for every existing `subscription` row, insert an `Order` if `(subscriptionId, serviceDate)` is not already present — copying `serviceDate`, `bakeryId`, `deliveryPersonId`, and mapping `subscription.status` → `OrderStatus` (`'ACCEPTED'` → `ACCEPTED`, `'PENDING'`/`'pending'`/`'ACTIVE'` → `PENDING`, else `PENDING`), `fulfillmentType = DELIVERY`, no items. Idempotent; additive only.

### API Endpoints

| Method | Path | Description | Auth | Body / Query |
|---|---|---|---|---|
| POST | `/orders/generate` | Generate orders for a date from active subscriptions | `authMiddleware` | `{ date?: "dd-mm-yyyy" }` |
| GET | `/orders/bakery` | Orders for the caller's bakery | `authMiddleware` + `resolveOwnerBakeryId` | `?status=&date=` |
| PATCH | `/orders/:id/status` | Seller advances/cancels an order it owns | `authMiddleware` + ownership | `{ status: 'PREPARING'\|'READY'\|'CANCELED'\|'PICKED_UP' }` |
| GET | `/orders/available` | *(migrated)* READY + DELIVERY + unclaimed, in date window | `authMiddleware` | — |
| POST | `/orders/:id/accept` | *(migrated)* courier claims | `authMiddleware` + courier | — |
| POST | `/orders/:id/release` | *(migrated)* courier releases | `authMiddleware` + courier owner | — |
| PATCH | `/orders/:orderId/:deliveryId` | *(migrated)* courier status update on `Order` | `authMiddleware` + courier owner | `{ status: 'PICKED_UP'\|'DELIVERED'\|'CANCELED' }` |
| GET | `/orders` | *(migrated)* admin day list, reads `Order` | `authMiddleware` | — |

Responses: `POST /orders/generate` → `200 { created: number, skipped: number }`. `GET /orders/bakery` → `200 Order[]` (with `items`). `PATCH /orders/:id/status` → `200 Order`; `403` cross-bakery; `404` unknown id; `422` illegal transition; `409` `READY→CANCELED` on an already-claimed order. Migrated courier routes keep their existing status codes.

Route registration order in `orders-routes.ts`: `/orders/generate`, `/orders/bakery`, `/orders/available` (all literal) MUST be declared before `/orders/:id/accept`, `/orders/:id/release`, `/orders/:id/status`, `/orders/:orderId/:deliveryId`.

### SSE

`UpdateOrderStatusBySellerUseCase` emits on `sseService`:
- always: `order-status-updated` `{ orderId, status }` (mirrors the courier flow's existing event).
- when new status is `READY` and `fulfillmentType === 'DELIVERY'`: also `order-available` `{ id, bakeryId, serviceDate }` — the same event name/shape `ReleaseOrderUseCase` already emits, so existing SSE clients need no change.

## Impact Analysis

| Component | Impact | Risk | Required action |
|---|---|---|---|
| `prisma/schema.prisma` + migration | Modified | **High** — enum + 3 models + relations; migration must be additive and reversible | Add per Data Models; `npx prisma migrate dev`; verify `npm run build` + `prisma generate` |
| Backfill script | New | **High** — courier flow regresses if `Order` rows are missing when use cases switch over | Run before tasks 13–16; idempotent; additive only |
| `src/core/entities/orders.ts` | Modified | Medium — removing `ACTIVE` could break a consumer | Grep for `'ACTIVE'` usage first; it is unused |
| `OrdersRepository` port + Prisma impl | Rewritten | Medium — every order use case depends on it | Land port + impl before dependent use cases |
| `SubscribeRepository` port + Prisma impl | Modified | Medium — removing `findAvailable`/`claim`/`release` breaks courier use cases until they are migrated in the same feature | Sequence: remove only after tasks 13–16 land, or keep as thin throwing stubs until then |
| `list-available-orders` / `accept-order` / `release-order` / `update-orders` | Modified | Medium — live courier flow | Migrate each to `OrdersRepository`; manual `request.http` re-verification of the delivery feature |
| `create-subscribe.ts` + `subscription-validator.ts` | Modified | Low — additive optional `items` / `fulfillmentType` | Validate each `itemId` belongs to the subscription's bakery |
| `orders-controller.ts` / `orders-routes.ts` | Modified | Low — additive handlers + one migrated handler; route-order pitfall | Literal routes before param routes; Swagger for all |
| `order-controller-factory.ts` / `subscribe-controller-factory.ts` | Modified | Low — wiring | Inject new repos/use cases |
| `resolveOwnerBakeryId` | Moved | Low | Move to `usecases/shared/`; update 4 item use case imports |
| `docs/architecture.md` | Docs | — | Document Subscription=template / Order=instance, status ranges, `PICKED_UP` pickup semantics |
| `delivery-order-assignment` ADRs | Cross-feature | Low | Its optimistic-claim approach (its ADR-004) still holds; the conditional `updateMany` just moves to `order` |

## Testing Approach

No test runner or `test`/`lint` scripts (`docs/infra.md`); CI runs `prisma generate` + `npm run build`. This feature does not add a framework. Verification:

**Manual (`request.http`)** — new entries for:
- `POST /orders/generate` twice for the same date → first `{ created: N }`, second `{ created: 0, skipped: N }`.
- `GET /orders/bakery` as a `company` user → only that bakery's orders, each with `items`.
- `GET /orders/bakery` as a user with no `BakeryPerson` → `403`.
- `PATCH /orders/:id/status` happy path `PENDING→PREPARING→READY`; illegal `PENDING→READY` → `422`; cross-bakery id → `403`; `READY→CANCELED` after a courier claimed it → `409`.
- Pickup order: `…→READY→PICKED_UP` via the seller route succeeds; delivery order: seller `READY→ACCEPTED` → `422`.
- Delivery regression: `GET /orders/available` shows only `READY` unclaimed delivery orders; `accept` then `release` then courier `PATCH …/:deliveryId` `PICKED_UP→DELIVERED`, all against `Order`.
- SSE: subscribe to `/events`, mark a delivery order `READY`, observe `order-available`.

**Build**: `npm run build` + `npx prisma generate` clean after every task.

**Noted gap**: the `claim`/`release` conditional-update race (inherited from `delivery-order-assignment` ADR-004) is exactly what an automated test should cover; still manual here. Flagged, not resolved.

## Development Sequencing

### Build order
1. **task_01** schema + migration → **task_02** backfill → **task_03** entities → **task_04** transition module + error.
2. **task_05** `OrdersRepository` port → **task_06** `SubscribeRepository` port.
3. **task_07** `PrismaOrdersRepository` + mapper → **task_08** `PrismaSubscribeRepository`.
4. **task_09** generation UC → **task_10** relocate `resolveOwnerBakeryId` → **task_11** `ListBakeryOrders` → **task_12** `UpdateOrderStatusBySeller`.
5. **task_13** `ListAvailableOrders` → **task_14** `AcceptOrder` → **task_15** `ReleaseOrder` → **task_16** `UpdateOrders` (courier). (Backfill from task_02 must be done.)
6. **task_17** validators → **task_18** `CreateSubscribe` basket → **task_19** controller → **task_20** routes + Swagger → **task_21** factories.
7. **task_22** docs.

### Technical dependencies
None external. `sseService` and its `order-available` event already exist. Prisma migration is the only infra action. Same standing blocker as `delivery-order-assignment`: `company` and `delivery` accounts still can't log in until their registration creates a Supabase credential — this feature is verifiable with manually-provisioned credentials but not usable end-to-end in production until that is fixed (out of scope here).

## Monitoring and Observability

No logging framework / metrics exist (`docs/infra.md`). `console.error` in controller `handleError` is the only signal, unchanged. Generation returns `{ created, skipped }` as its observability surface. Note as a gap if structured logging is later adopted.
