---
status: completed
title: "auth-routes.ts + auth-controller-factory.ts"
type: backend
complexity: medium
dependencies:
  - task_03
  - task_05
  - task_07
  - task_08
  - task_15
---

# Task 16: auth-routes.ts + auth-controller-factory.ts

## Overview
Wires all the auth feature's pieces together: instantiates the concrete `SupabaseAuthGateway` and all three role repositories, builds the use cases and `AuthController`, and defines the Express router for `/auth/login` and `/auth/refresh` — following the project's existing factory + routes-file pattern (see `docs/architecture.md` steps 8-9).

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include verification in deliverables
</critical>

<requirements>
- MUST create `src/main/factories/auth-controller-factory.ts` exporting `makeAuthController()`, which instantiates `SupabaseAuthGateway`, `PrismaUserRepository`, `PrismaBakeryRepository`, `PrismaDeliveryUserRepository`, `LoginUseCase`, `RefreshSessionUseCase`, and `AuthController`, following the plain-factory-function pattern used by `user-controller-factory.ts` (no DI container).
- MUST create `src/infra/http/routes/auth-routes.ts` exporting `makeAuthRoutes(authController)`, registering `POST /auth/login` and `POST /auth/refresh`.
- MUST NOT apply `authMiddleware` to either route — both are explicitly unauthenticated entry points per TechSpec "Impact Analysis" (`src/infra/http/routes/auth-routes.ts | New | Registers /auth/login and /auth/refresh, unauthenticated`).
- SHOULD add Swagger JSDoc comments for both routes, consistent with `user-routes.ts`'s existing style, since the project's manual verification relies on the Swagger UI (`/docs`).
</requirements>

## Subtasks
- [x] 16.1 Create `auth-controller-factory.ts`, wiring gateway + three repositories + two use cases + controller.
- [x] 16.2 Create `auth-routes.ts` with `POST /auth/login` and `POST /auth/refresh`, no `authMiddleware`.
- [x] 16.3 Add Swagger JSDoc annotations for both routes.

## Implementation Details
See TechSpec "Impact Analysis" rows for `src/main/factories/auth-controller-factory.ts` and `src/infra/http/routes/auth-routes.ts", and "API Endpoints" for the exact paths/methods.

### Relevant Files
- `src/main/factories/user-controller-factory.ts` — factory-wiring pattern to mirror.
- `src/infra/http/routes/user-routes.ts` — routes-file pattern (including Swagger JSDoc style) to mirror.
- `src/infra/gateways/supabase-auth-gateway.ts` (task_03), `src/infra/repositories/prisma-user-repository.ts` (task_05), `src/infra/repositories/prisma-delivery-user-repository.ts` (task_07), `src/infra/repositories/prisma-bakery-repository.ts` (task_08), `src/infra/controllers/auth-controller.ts` (task_15) — pieces this factory wires together.

### Dependent Files
- `src/infra/http/routes.ts` and `src/main/app.ts` (task_17) — register `makeAuthRoutes`/`makeAuthController` into the app.

### Related ADRs
- [ADR-002: Single Unified Login Flow for All User Roles](adrs/adr-002.md) — one route pair, no persona-specific routes.

## Deliverables
- `src/main/factories/auth-controller-factory.ts`.
- `src/infra/http/routes/auth-routes.ts`.

## Tests
- Manual verification (project has no automated test framework — see TechSpec "Testing Approach"):
  - [x] `makeAuthController()` builds without runtime errors (all dependencies wired correctly).
  - [x] `makeAuthRoutes(authController)` returns a router exposing `POST /auth/login` and `POST /auth/refresh`.
  - [x] Neither route requires an `Authorization` header to be reached (confirms `authMiddleware` is not applied).
- Test coverage target: N/A — no automated test framework in this project.
- Verified via `npx tsc --noEmit` (clean) plus a throwaway `ts-node` script (deleted after use, not committed), run with real env vars (`node --env-file=.env -r ts-node/register`) so `SupabaseAuthGateway`'s module-level `createClient` call doesn't throw for missing config. It called `makeAuthController()` for real (no mocking) and inspected the returned Express router's internal `.stack` — confirmed both routes are registered at the expected paths/methods and each has exactly one handler layer (i.e., no `authMiddleware` inserted). This did not make any real Supabase/DB network call — `PrismaClient` is lazily initialized (only connects on first query) and `createClient` doesn't connect at construction time, so this check is safe to run in this sandbox despite the DB being otherwise unreachable here.
- Not verified: this factory/router mounted into the actual running app (`routes.ts`/`app.ts`), since that's task_17.

## Success Criteria
- `makeAuthController()` and `makeAuthRoutes()` exist and are ready to be registered in `routes.ts`/`app.ts` (task_17) without further changes. ✅ (verified — real factory call succeeds, router shape confirmed)
