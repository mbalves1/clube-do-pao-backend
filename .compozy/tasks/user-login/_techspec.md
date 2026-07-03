# TechSpec: User Login (Sign In)

## Executive Summary

Login is implemented as a new `auth` slice following the project's existing Clean Architecture conventions (entity/port/usecase → Prisma repository → controller → routes → factory). Supabase Auth is the identity backend (ADR-001); a single `POST /api/auth/login` endpoint serves all three personas (ADR-002). Because `User`, `Bakery`, and `DeliveryPerson` are three independent Prisma models with no shared identity today, each gets a new unique `supabaseUserId` column, and role is resolved from the Supabase user's `app_metadata` rather than stored redundantly in Postgres (ADR-003). Token refresh is proxied through the Express backend rather than exposing Supabase credentials to clients (ADR-004).

The primary trade-off: this design adds one column to three existing tables and a small amount of cross-cutting "resolve business record by role" logic, in exchange for not merging three distinct domain concepts into one table and not building a second, project-owned credential system.

## System Architecture

### Component Overview

- **`AuthGateway`** (new, `src/infra/gateways/supabase-auth-gateway.ts`): wraps the Supabase client for the three auth operations this feature needs — sign in, refresh, and admin credential creation. Implements a `core/ports` interface so use cases depend on an abstraction, consistent with how `UserRepository` is used today.
- **`LoginUseCase`** (new): authenticates email/password via `AuthGateway`, resolves the caller's business profile via role-specific repositories, returns a login result.
- **`RefreshSessionUseCase`** (new): exchanges a refresh token for a new session via `AuthGateway`.
- **`CreateUserUseCase`** (modified): now also creates the Supabase credential via `AuthGateway` and persists the returned `supabaseUserId` on the `User` row.
- **`AuthController`** (new): HTTP handlers for login and refresh.
- **`UserController`** (modified): the existing `create` handler now requires and forwards `password`.
- **`authMiddleware`** (unchanged): still verifies Supabase-issued JWTs; nothing about token verification changes.

Data flow for login: `AuthController` → `LoginUseCase` → `AuthGateway.signInWithPassword` (Supabase) → role read from `app_metadata` → matching repository (`UserRepository` / `BakeryRepository` / `DeliveryUserRepository`) looked up by `supabaseUserId` → combined result returned to the client.

## Implementation Design

### Core Interfaces

```typescript
// src/core/ports/auth-gateway.ts
export type Role = 'customer' | 'bakery_owner' | 'courier';

export type AuthSession = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  supabaseUserId: string;
  role: Role;
};

export interface AuthGateway {
  signInWithPassword(email: string, password: string): Promise<AuthSession>;
  refreshSession(refreshToken: string): Promise<Omit<AuthSession, 'supabaseUserId' | 'role'>>;
  createCredential(email: string, password: string, role: Role): Promise<{ supabaseUserId: string }>;
}
```

```typescript
// src/core/usecases/auth/login.ts
export type LoginDTO = { email: string; password: string };

export class LoginUseCase {
  constructor(
    private authGateway: AuthGateway,
    private userRepository: UserRepository,
    private bakeryRepository: BakeryRepository,
    private deliveryUserRepository: DeliveryUserRepository,
  ) {}

  async execute(data: LoginDTO): Promise<LoginResult> { /* see Data Models */ }
}
```

Role → repository resolution is a small `switch` inside `LoginUseCase` (three cases); no strategy-pattern abstraction is introduced, per YAGNI — three cases do not justify one.

### Data Models

**Prisma schema changes** (additive, one column per table):

```prisma
model User {
  // ...existing fields
  supabaseUserId String @unique
}

model Bakery {
  // ...existing fields
  supabaseUserId String? @unique
}

model DeliveryPerson {
  // ...existing fields
  supabaseUserId String? @unique
}
```

`User.supabaseUserId` is required because, going forward, every customer registration creates the Supabase credential in the same request (see Impact Analysis). `Bakery` and `DeliveryPerson` keep it optional: existing rows have no credential, and linking them is out of scope for this MVP (see PRD Non-Goals).

**Request/response shapes:**

```typescript
// POST /api/auth/login response
type LoginResult = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  role: Role;
  profile: { id: string; name: string; email: string };
};

// POST /api/auth/refresh response
type RefreshResult = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
};
```

### API Endpoints

| Method | Path | Description | Request | Response |
|---|---|---|---|---|
| POST | `/api/auth/login` | Authenticate with email + password | `{ email, password }` | 200 `LoginResult` / 401 `{ message: "Email ou senha inválidos" }` |
| POST | `/api/auth/refresh` | Exchange a refresh token for a new session | `{ refreshToken }` | 200 `RefreshResult` / 401 `{ message: "Sessão expirada, faça login novamente" }` |
| POST | `/api/users` | Register a customer (modified) | `{ name, email, password }` | 201 `User` / 400 (existing validation errors) / 409 if email in use |

401 responses use one generic message regardless of whether the email exists or the password is wrong, per the PRD's UX requirement.

## Integration Points

- **Supabase Auth**: `signInWithPassword` (login), auth session refresh (token renewal), `admin.createUser` with `app_metadata.role` (credential creation during registration). Errors from Supabase (invalid credentials, expired refresh token) are caught in the use cases and translated to the project's existing `AppError` subclasses (`UnprocessableEntityError` for bad credentials, mapped to 401 at the controller).

## Impact Analysis

| Component | Impact Type | Description and Risk | Required Action |
|---|---|---|---|
| `prisma/schema.prisma` | Modified | Adds `supabaseUserId` to `User` (required), `Bakery` and `DeliveryPerson` (optional). Low risk — additive columns. | Write and run a migration. |
| `src/core/ports/auth-gateway.ts` | New | Defines the `AuthGateway` contract. | Create file. |
| `src/infra/gateways/supabase-auth-gateway.ts` | New | Implements `AuthGateway` using `@supabase/supabase-js`. Reuses the client pattern from `src/middlewares/auth.ts`. | Create file. |
| `src/core/usecases/auth/login.ts` | New | `LoginUseCase`. | Create file. |
| `src/core/usecases/auth/refresh-session.ts` | New | `RefreshSessionUseCase`. | Create file. |
| `src/core/usecases/user/create-user.ts` | Modified | Now requires `password`, calls `AuthGateway.createCredential`, persists `supabaseUserId`. Medium risk — changes an existing use case's contract. | Update DTO, implementation, and validator. |
| `src/core/entities/user.ts` | Modified | Adds `supabaseUserId: string`. | Update type. |
| `src/core/ports/user-repository.ts` / `src/infra/repositories/prisma-user-repository.ts` | Modified | `create` persists `supabaseUserId`; add `findBySupabaseUserId`. | Update interface and implementation. |
| `src/core/ports/bakery-repository.ts` / `src/infra/repositories/prisma-bakery-repository.ts` | Modified | Add `findBySupabaseUserId`. Optional field, no risk to existing behavior. | Add method. |
| `src/core/ports/delivery-user-repository.ts` / `src/infra/repositories/prisma-delivery-user-repository.ts` | Modified | Add `findBySupabaseUserId`. | Add method. |
| `src/infra/http/validators/user-validator.ts` | Modified | `createUserSchema` requires `password` (min length TBD, see Open Questions in PRD). | Update schema. |
| `src/infra/http/validators/auth-validator.ts` | New | Zod schemas for login and refresh payloads. | Create file. |
| `src/infra/controllers/auth-controller.ts` | New | `login`, `refresh` handlers, following the try/catch + `formatBadRequest` pattern used in `user-controller.ts`. | Create file. |
| `src/infra/controllers/user-controller.ts` | Modified | `create` handler forwards `password`. | Update handler. |
| `src/infra/http/routes/auth-routes.ts` | New | Registers `/auth/login` and `/auth/refresh`, unauthenticated (no `authMiddleware`). | Create file. |
| `src/main/factories/auth-controller-factory.ts` | New | Wires `AuthGateway`, repositories, use cases, controller. | Create file. |
| `src/infra/http/routes.ts` | Modified | Adds `router.use(makeAuthRoutes(authController))`. | Update aggregator. |
| `src/main/app.ts` | Modified | Adds `authController: makeAuthController()` to the `makeRoutes` call. | Update wiring. |
| `src/middlewares/auth.ts` | Unmodified | Already verifies Supabase JWTs; no change needed for login itself. | None. |
| `docs/infra.md` | Modified | No new required env vars for MVP (ADR-004 avoids adding `SUPABASE_ANON_KEY`). | None, unless the ADR-003 risk materializes. |

## Testing Approach

The project has no automated test framework configured today (no test runner in `package.json`). Adding one is out of scope for this feature. Verification for this MVP is manual, via the existing Swagger UI (`/docs`) or a REST client, covering:

### Manual verification scenarios

- Register a new customer with a password → confirm a Supabase Auth user is created with `app_metadata.role = 'customer'` and the `User` row stores `supabaseUserId`.
- Login with that customer's correct credentials → 200 with `accessToken`, `refreshToken`, `role: 'customer'`, and profile.
- Login with a wrong password → 401 with the generic message; login with a non-existent email → same generic 401 message.
- Refresh with a valid `refreshToken` → 200 with a new `accessToken`.
- Refresh with an invalid/expired `refreshToken` → 401.
- Confirm existing authenticated routes (e.g., `GET /api/users`) still accept tokens issued by the new login endpoint, since `authMiddleware` is unchanged.

### Integration tests

Not applicable — no integration test harness exists in the project today. If one is introduced later, this feature's `LoginUseCase` and `RefreshSessionUseCase` are the natural first targets, with `AuthGateway` mocked at the port boundary the same way `UserRepository` would be mocked.

## Development Sequencing

### Build Order

1. **Prisma migration** — add `supabaseUserId` to `User`, `Bakery`, `DeliveryPerson`. No dependencies.
2. **`AuthGateway` port + Supabase implementation** — sign-in, refresh, admin credential creation. No dependencies.
3. **Update `User` entity, port, and `CreateUserUseCase`** to require `password` and call `AuthGateway.createCredential`, persisting `supabaseUserId`. Depends on steps 1 and 2.
4. **`LoginUseCase` and `RefreshSessionUseCase`**, including the role-based repository lookup. Depends on steps 1 and 2.
5. **Validators** (`auth-validator.ts` for login/refresh; update `user-validator.ts` for `password`). Depends on step 3 for the field name/shape.
6. **`AuthController`** (login, refresh handlers) and update to `UserController.create`. Depends on steps 4 and 5.
7. **`auth-routes.ts` and `auth-controller-factory.ts`**. Depends on step 6.
8. **Register routes**: update `src/infra/http/routes.ts` and `src/main/app.ts`. Depends on step 7.

### Technical Dependencies

- None external — `@supabase/supabase-js` is already installed and the Supabase project already exists and is configured via `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY`.
- Must confirm during step 2 that `signInWithPassword` succeeds against a client initialized with the service role key (see ADR-003 risk). If it does not, add `SUPABASE_ANON_KEY` and use it only for that call.

## Monitoring and Observability

The project currently has no structured logging or metrics infrastructure — only `console.error` in the global Express error handler. Consistent with that baseline, this feature adds:
- A `console.error` log on unexpected (non-credential) failures in `LoginUseCase`/`RefreshSessionUseCase`, matching the existing error-handling style.
- No new dashboards, metrics pipelines, or alerting are introduced; this is a gap noted for future work, not solved here.

## Technical Considerations

### Key Decisions

- **Supabase Auth as sole identity provider** — see [ADR-001](adrs/adr-001.md).
- **One unified login flow for all personas** — see [ADR-002](adrs/adr-002.md).
- **Role in `app_metadata`, per-table `supabaseUserId`** — see [ADR-003](adrs/adr-003.md).
- **Backend-proxied refresh, no client-side Supabase key** — see [ADR-004](adrs/adr-004.md).

### Known Risks

- **Service-role client for `signInWithPassword`**: needs empirical verification against the project's Supabase instance early in implementation (step 2 of Build Order). If it fails, the fallback (add `SUPABASE_ANON_KEY`) is a small, contained change.
- **`Bakery` and `DeliveryPerson` accounts without `supabaseUserId`**: by design, out of scope for this MVP (see PRD Non-Goals); attempting to log in with an email that matches a `Bakery`/`DeliveryPerson` row lacking a linked credential simply fails Supabase authentication like any unregistered email, which is acceptable behavior for now.
- **No automated tests**: regressions in `authMiddleware` compatibility or token shape would only surface through manual verification; acceptable given the project's current baseline, but worth flagging as a standing gap.

## Architecture Decision Records

- [ADR-001: Use Supabase Auth as the Identity Provider](adrs/adr-001.md) — Login and future Google sign-in build on Supabase Auth rather than a project-owned credentials table.
- [ADR-002: Single Unified Login Flow for All User Roles](adrs/adr-002.md) — One login flow serves customers, bakery owners, and couriers.
- [ADR-003: Role Stored in Supabase app_metadata; Per-Table supabaseUserId Link](adrs/adr-003.md) — Resolves how login maps an authenticated identity to one of three independent tables.
- [ADR-004: Backend-Proxied Token Refresh](adrs/adr-004.md) — Refresh goes through the Express backend rather than exposing a Supabase key to clients.
