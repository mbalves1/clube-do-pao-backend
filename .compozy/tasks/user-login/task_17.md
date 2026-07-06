---
status: pending
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
- [ ] 17.1 Add `authController` to `makeRoutes`'s parameter object and mount `makeAuthRoutes(authController)` in `src/infra/http/routes.ts`.
- [ ] 17.2 Add `authController: makeAuthController()` to the `makeRoutes({...})` call in `src/main/app.ts`.

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
  - [ ] `POST /api/auth/login` is reachable and returns 200 for a valid customer, bakery owner, and courier account.
  - [ ] `POST /api/auth/refresh` is reachable and returns 200 for a valid refresh token.
  - [ ] `GET /api/users` (or another existing authenticated route) still accepts a token issued by the new `/api/auth/login` endpoint, confirming `authMiddleware` compatibility is unaffected.
  - [ ] All previously existing routes (`user`, `bakery`, `subscribe`, `orders`, `deliveryUser`, SSE) still respond as before — no regression from the aggregator change.
- Test coverage target: N/A — no automated test framework in this project.
- All manual verification scenarios must pass.

## Success Criteria
- The full login feature (`POST /api/auth/login`, `POST /api/auth/refresh`) is reachable end-to-end via the running Express app.
- No regression to any previously existing route.
- All PRD "MVP (Phase 1)" success criteria are demonstrable: registered users of all three personas can log in and reach authenticated parts of the product.
