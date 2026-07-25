# TechSpec: Delivery Order Assignment

## Executive Summary

This feature adds self-service order claiming for delivery persons on top of the existing `Subscription`/`Order` model. The "available orders" feed queries `Subscription` (not `Order`) for a 3-day window, because `Order` rows are only lazily created as a side effect of the existing generic status-update flow and would miss most genuinely-unclaimed work. Two new endpoints (`accept`, `release`) handle claiming with an optimistic conditional update to prevent double-claims, and the existing generic `PATCH /orders/:orderId/:deliveryId` gains an ownership check so only the claiming courier can advance an order's status.

The primary trade-off: this design layers new behavior on the existing `Subscription`-as-source-of-truth pattern rather than migrating delivery-task state fully into `Order`. That migration would be a larger, separate refactor: this feature works within the current data model to minimize risk and blast radius. A hard prerequisite blocks this feature end-to-end today — delivery-person registration (`CreateDeliveryUserUseCase`) never creates a Supabase credential, so no `DeliveryPerson` has a `supabaseUserId` to resolve identity against (see Technical Dependencies).

## System Architecture

### Component Overview

- **`AcceptOrderUseCase`** (new) — resolves the caller's `DeliveryPerson`, attempts the conditional claim, throws `ConflictError` if already claimed.
- **`ReleaseOrderUseCase`** (new) — resolves the caller's `DeliveryPerson`, verifies ownership and `ACCEPTED` status, clears the claim, emits `order-available` over SSE.
- **`ListAvailableOrdersUseCase`** (new) — resolves the 3-day window, delegates to `SubscribeRepository.findAvailable`.
- **`UpdateOrdersUseCase`** (modified) — gains an ownership check before allowing a status transition.
- **`SubscribeRepository`** (port, modified) — gains `findAvailable(startDate, endDate)`.
- **`OrdersController`** (modified) — gains `acceptOrder`, `releaseOrder`, `listAvailable` handlers; existing `updateOrder` handler passes the resolved `DeliveryPerson` through.
- **`sseService`** (existing, reused) — gains a second event type, `order-available`, emitted from `ReleaseOrderUseCase`.

Data flow: `orders-routes.ts` → `OrdersController` → use case → `SubscribeRepository`/`DeliveryUserRepository` (Prisma) → response. `ReleaseOrderUseCase` additionally pushes to `sseService`, which fans out to connected `/events` SSE clients — the same path `order-status-updated` already uses.

## Implementation Design

### Core Interfaces

```typescript
// src/core/ports/subscribe-repository.ts (extended)
export interface SubscribeRepository {
  // ...existing methods unchanged
  findAvailable(startDate: Date, endDate: Date): Promise<SubscriptionRecord[]>;
  claim(id: number, deliveryPersonId: string): Promise<boolean>; // false if already claimed
  release(id: number, deliveryPersonId: string): Promise<boolean>; // false if not owner/not ACCEPTED
}
```

```typescript
// src/core/usecases/orders/accept-order.ts
export class AcceptOrderUseCase {
  constructor(
    private subscribeRepository: SubscribeRepository,
    private deliveryUserRepository: DeliveryUserRepository,
  ) {}

  async execute(orderId: number, supabaseUserId: string): Promise<void> {
    const courier = await this.deliveryUserRepository.findBySupabaseUserId(supabaseUserId);
    if (!courier) throw new NotFoundError('Entregador não encontrado');

    const claimed = await this.subscribeRepository.claim(orderId, courier.id);
    if (!claimed) throw new ConflictError('Pedido já foi reivindicado');
  }
}
```

Error handling: `NotFoundError` (404) when the caller isn't a registered courier; `ConflictError` (409) when a claim/release precondition fails — both already exist under `src/core/errors/` and are caught by the existing `AppError` handling pattern in controllers.

### Data Models

No Prisma schema changes — `Subscription.deliveryPersonId` and `Subscription.status` (both already nullable/present) are sufficient to represent claim state. No migration required.

```typescript
// Minimal typed shape for the available-orders response
// (SubscribeRepository currently returns `any`; this is the first typed read model)
export type AvailableOrder = {
  id: number;
  bakeryId: string;
  serviceDate: Date;
  serviceStartAt: string;
  serviceEndAt: string;
  deliveryStartAt: string;
  deliveryEndAt: string;
  status: string;
};
```

### API Endpoints

| Method | Path | Description | Auth |
|---|---|---|---|
| GET | `/orders/available` | List unassigned orders, `serviceDate` in [today, today+2] | `authMiddleware` |
| POST | `/orders/:id/accept` | Claim an unassigned order | `authMiddleware` + resolved `DeliveryPerson` |
| POST | `/orders/:id/release` | Release a claimed, not-yet-picked-up order | `authMiddleware` + resolved `DeliveryPerson`, must be owner |
| PATCH | `/orders/:orderId/:deliveryId` | Existing status update — now requires `deliveryId` to match the resolved `DeliveryPerson` | `authMiddleware` + ownership check |

Responses:
- `GET /orders/available` → `200` with `AvailableOrder[]`.
- `POST /orders/:id/accept` → `200` on success; `404` if caller isn't a courier; `409` if already claimed.
- `POST /orders/:id/release` → `200` on success; `403` if caller doesn't own the claim; `409` if status is already `PICKED_UP` or later.
- `PATCH /orders/:orderId/:deliveryId` → unchanged `200`/`400`/`404`, plus new `403` if `deliveryId` doesn't match the authenticated courier.

## Integration Points

- **Supabase Auth**: identity resolution reuses `req.user.id` (already populated by `authMiddleware`) against `DeliveryUserRepository.findBySupabaseUserId` — no new integration, but see Technical Dependencies for why this currently always misses.
- **SSE (`sseService`)**: new `order-available` event, same transport and client connection (`GET /events`) already used for `order-status-updated`. No new channel.

## Impact Analysis

| Component | Impact Type | Description and Risk | Required Action |
|---|---|---|---|
| `SubscribeRepository` / `PrismaSubscribeRepository` | Modified | Adds `findAvailable`, `claim`, `release`. Low risk — additive methods. | Implement + verify against `prisma.subscription` |
| `UpdateOrdersUseCase` | Modified | Adds ownership check before status change. Medium risk — could break any existing client relying on unrestricted PATCH. | Confirm with product owner that tightening this is acceptable before shipping (already approved in PRD) |
| `OrdersController` / `orders-routes.ts` | Modified | Three new handlers/routes, one modified handler. Low risk — additive + one new validation branch. | Implement, update swagger docs |
| `sseService` | Modified (usage only) | New event type on existing service; no interface change. Very low risk. | None beyond calling `.emit()` |
| `CreateDeliveryUserUseCase` | Blocking dependency (not modified by this feature) | No `DeliveryPerson` can be resolved via `findBySupabaseUserId` until this creates a Supabase credential. High risk — feature is unusable without it. | Must ship before or alongside this feature; separate work item |
| `docs/architecture.md` | Documentation | Already documents the credential gap; should gain a note once resolved. | Update when the blocking dependency ships |

## Testing Approach

The project currently has no test runner or `test`/`lint` npm scripts configured (`docs/infra.md`) — CI only runs `prisma generate` + `npm run build`. This feature does not introduce a test framework unilaterally; verification for this phase relies on:

### Manual verification
- `request.http` (already used in this project for manual endpoint checks) should get new entries for `GET /orders/available`, `POST /orders/:id/accept`, `POST /orders/:id/release`, and the ownership-rejection case on the existing `PATCH`.
- Concurrency check: manually fire two near-simultaneous `accept` requests for the same order (e.g., two terminal `curl` calls) and confirm exactly one succeeds with `200` and the other returns `409`.

### Noted gap
- The optimistic-concurrency claim logic (ADR-004) is exactly the kind of code that benefits most from an automated test, since manual race-condition testing is unreliable. Flagged under Known Risks — introducing a minimal test runner is a decision for the project owner, out of scope for this TechSpec to impose.

## Development Sequencing

### Build Order

1. **Blocking prerequisite** — `CreateDeliveryUserUseCase` creates a Supabase credential (`authGateway.createCredential`) and persists `supabaseUserId` on `DeliveryPerson`, mirroring `CreateUserUseCase`. No dependencies. *(Not part of this feature's PRD scope, but this feature cannot be verified end-to-end without it — see Technical Dependencies.)*
2. **`SubscribeRepository.findAvailable`, `.claim`, `.release`** — depends on step 1 only for end-to-end testing, not for the code itself to compile/exist.
3. **`AcceptOrderUseCase`, `ReleaseOrderUseCase`, `ListAvailableOrdersUseCase`** — depends on step 2.
4. **`UpdateOrdersUseCase` ownership check** — depends on `DeliveryUserRepository.findBySupabaseUserId` (already exists, no new dependency).
5. **`OrdersController` handlers + `orders-routes.ts` wiring** — depends on steps 3 and 4.
6. **`order-controller-factory.ts` wiring** — depends on step 5.
7. **SSE `order-available` emit in `ReleaseOrderUseCase`** — depends on step 3 (can be added in the same pass as `ReleaseOrderUseCase`).
8. **Swagger documentation for new/modified endpoints** — depends on step 5.

### Technical Dependencies

- **Blocking**: delivery-person Supabase credential creation (step 1 above) must exist before this feature has any real courier to test against. This is a prerequisite work item, not a task within this feature.
- No external service or infrastructure dependency beyond what's already provisioned (Postgres, Supabase, existing SSE transport).

## Monitoring and Observability

The project has no structured logging or metrics infrastructure today — errors are caught and `console.error`'d in controllers (see `OrdersController`, `app.ts` error handler). This feature follows the same pattern: `ConflictError`/`NotFoundError` cases return their mapped status code without server-side logging (expected client-driven cases); unexpected errors fall through to the existing `console.error` + 500 handler. No new monitoring infrastructure is introduced.

## Technical Considerations

### Key Decisions

See ADRs below for full rationale. Summary:
- Available-orders feed reads `Subscription`, not `Order` (ADR-002) — because `Order` rows don't exist until a status update has happened at least once.
- Delivery-person identity resolved via existing repository lookup, not new middleware (ADR-003) — YAGNI at current scale of two courier-restricted routes.
- Dedicated `accept`/`release` endpoints, not overloaded PATCH (ADR-004) — keeps claim-specific rules out of the generic status-update use case.
- Optimistic conditional update for claim concurrency (ADR-004) — Postgres's atomic `UPDATE ... WHERE` already closes the race window without manual locking.
- SSE `order-available` fires only on release, not on subscription creation (ADR-005) — keeps this feature's write-path changes isolated from `create-subscribe.ts`.

### Known Risks

- **Blocking dependency risk**: shipping this feature without also shipping delivery-person credential creation means it ships unusable. High likelihood of confusion if not sequenced correctly — mitigated by listing it as Build Order step 1.
- **Concurrency logic without automated tests**: the claim race-condition handling is the highest-risk piece of new logic and has no automated regression protection given the project's current lack of a test runner. Mitigated short-term by the manual dual-request check in Testing Approach; flagged for future investment in test infrastructure.
- **No cap on concurrent claims** (per PRD Non-Goals): a courier could over-claim; this is a product-level risk already accepted in the PRD, not something this TechSpec attempts to solve.

## Architecture Decision Records

- [ADR-001: Self-Service Pull-Based Order Claiming with Real-Time Availability Feed](adrs/adr-001.md) — Chose pull-based claiming with an SSE-driven feed over push-with-timeout or polling-only.
- [ADR-002: Available Orders Feed Sourced from Subscription, 3-Day Window](adrs/adr-002.md) — Query `Subscription`, not `Order`, since `Order` rows are only lazily created.
- [ADR-003: Resolve Delivery Person Identity via Repository Lookup](adrs/adr-003.md) — Reuse existing `findBySupabaseUserId` instead of new authorization middleware; surfaces the blocking credential-creation dependency.
- [ADR-004: Dedicated Accept/Release Endpoints with Optimistic Concurrency Control](adrs/adr-004.md) — New endpoints instead of overloading the generic PATCH; atomic conditional update prevents double-claims.
- [ADR-005: SSE Availability Notification Scoped to Release Events Only](adrs/adr-005.md) — `order-available` fires only from release, not from subscription creation.