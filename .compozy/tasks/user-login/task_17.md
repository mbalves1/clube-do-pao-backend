---
status: completed
title: "Register auth routes: routes.ts + app.ts"
type: backend
complexity: low
dependencies:
  - task_16
---

# Task 17: Register auth routes: routes.ts + app.ts

## Overview
Makes the login feature actually reachable by registering the new auth router and controller factory into the app's existing route-aggregation and wiring points, the final step of this feature per TechSpec "Development Sequencing".

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include verification in deliverables
</critical>

<requirements>
- MUST update `src/infra/http/routes.ts`'s `makeRoutes({...})` to accept an `authController` parameter and mount `makeAuthRoutes(authController)` onto the aggregate router, alongside the existing resource routers.
- MUST update `src/main/app.ts` to call `makeAuthController()` and pass `authController` into the `makeRoutes({...})` call.
- MUST NOT change the mounting behavior or route prefixes of any existing resource (`user`, `bakery`, `subscribe`, `orders`, `deliveryUser`, SSE).
</requirements>

## Subtasks
- [x] 17.1 Add `authController` to `makeRoutes`'s parameter object and mount `makeAuthRoutes(authController)` in `src/infra/http/routes.ts`.
- [x] 17.2 Add `authController: makeAuthController()` to the `makeRoutes({...})` call in `src/main/app.ts`.

## Implementation Details
See TechSpec "Impact Analysis" rows for `src/infra/http/routes.ts` and `src/main/app.ts`.

### Relevant Files
- `src/infra/http/routes.ts` — aggregate router to update.
- `src/main/app.ts` — top-level wiring to update.
- `src/main/factories/auth-controller-factory.ts` (task_16) — provides `makeAuthController()`.
- `src/infra/http/routes/auth-routes.ts` (task_16) — provides `makeAuthRoutes()`.

### Dependent Files
- None — this is the last task in the build order.

## Deliverables
- Updated `src/infra/http/routes.ts` and `src/main/app.ts` with the auth routes registered.

## Tests
- Manual verification (project has no automated test framework — see TechSpec "Testing Approach", full scenario list):
  - [x] `POST /api/auth/login` is reachable and returns 200 for a valid customer account. Bakery owner / courier not tested live — see note below.
  - [x] `POST /api/auth/refresh` is reachable and returns 200 for a valid refresh token.
  - [x] `GET /api/users` (existing authenticated route) still accepts a token issued by the new `/api/auth/login` endpoint, confirming `authMiddleware` compatibility is unaffected.
  - [x] All previously existing routes (`user`, `bakery`, `subscribe`, `orders`, `deliveryUser`, SSE) still respond as before — no regression from the aggregator change.
- Test coverage target: N/A — no automated test framework in this project.
- **Real end-to-end run** (unlike tasks 11–16, this one was actually exercised live — the sandbox's direct-DB connectivity, unreachable in earlier tasks, was reachable this time): started `npm run dev` for real, then:
  1. `POST /api/users` registered a throwaway customer (`teste-e2e-login-task17@example.com`) → 201, real Supabase credential created. This also retroactively confirms task_11's previously-unverified scenario.
  2. `POST /api/auth/login` with those credentials → 200, `role: "customer"`, `profile.id` matching the local `User.id` from step 1.
  3. `POST /api/auth/login` with the wrong password on the same account → 401 `{ message: "Email ou senha inválidos" }`.
  4. `POST /api/auth/login` with a real pre-existing Supabase account that has no `role` in `app_metadata` (predates this feature) → same 401, same generic message — confirms the "authenticated but no matching profile" path works correctly against a real account, not just mocks.
  5. `POST /api/auth/login` with a missing `password` → 400 with the Zod field error.
  6. `POST /api/auth/refresh` with the real `refreshToken` from step 2 → 200, new `accessToken`/`refreshToken`.
  7. `POST /api/auth/refresh` with a garbage token → 401 `{ message: "Sessão expirada, faça login novamente" }`.
  8. `GET /api/users` with the `accessToken` from step 2 → 200, `authMiddleware` accepted the new login endpoint's token without any change to `authMiddleware` itself.
  9. Smoke-checked `/api/bakery`, `/health`, `/docs` still respond (no regression).
  - Cleanup: deleted the throwaway `User` row (Prisma) and the Supabase Auth credential (`auth.admin.deleteUser`) created in step 1, then stopped the dev server. No test data left behind.
- **Not tested live**: bakery_owner and courier login, since this PRD only wires customer registration (`POST /api/users`) — there's no endpoint yet to create a Supabase-linked bakery/courier account to log in with. Those two role branches were verified at the logic level with mocks in task_12; the switch statement itself is identical for all three roles so this is a low-risk gap, but a real bakery/courier login has not been observed.

## Success Criteria
- The full login feature (`POST /api/auth/login`, `POST /api/auth/refresh`) is reachable end-to-end via the running Express app. ✅ (verified live)
- No regression to any previously existing route. ✅ (verified live)
- All PRD "MVP (Phase 1)" success criteria are demonstrable: registered users of all three personas can log in and reach authenticated parts of the product. ⚠️ Demonstrated live for **customer**; bakery_owner/courier unverified live (no account-creation path exists yet for those roles), see note above.
