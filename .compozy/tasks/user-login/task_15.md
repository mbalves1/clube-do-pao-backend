---
status: completed
title: "AuthController (login, refresh)"
type: backend
complexity: medium
dependencies:
  - task_12
  - task_13
  - task_14
---

# Task 15: AuthController (login, refresh)

## Overview
Exposes `LoginUseCase` and `RefreshSessionUseCase` as HTTP handlers, translating validation failures to 400 and credential/session failures to the PRD's single generic 401 message — the last piece of business logic before routes (task_16) make this feature reachable.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include verification in deliverables
</critical>

<requirements>
- MUST implement `AuthController` in `src/infra/controllers/auth-controller.ts` with `login` and `refresh` handlers, constructor-injected with `LoginUseCase` and `RefreshSessionUseCase`.
- MUST parse request bodies with `loginSchema`/`refreshSchema` (task_14) using the same try/catch + `formatBadRequest` pattern as `UserController`, returning 400 on schema validation failure.
- MUST catch `UnprocessableEntityError` thrown by the use cases and return **401** (not the error class's own default 422 status code) with the exact generic messages from TechSpec "API Endpoints": `{ message: "Email ou senha inválidos" }` for `login`, `{ message: "Sessão expirada, faça login novamente" }` for `refresh`. This is a deliberate per-endpoint override of the error's default status, not a change to `UnprocessableEntityError` itself.
- MUST return 200 with the `LoginResult`/`RefreshResult` shape on success.
- MUST NOT let any unexpected (non-credential) error surface details to the client — log it via `console.error` (matching the project's current baseline error-handling style, per TechSpec "Monitoring and Observability") and return a generic 500.
</requirements>

## Subtasks
- [x] 15.1 Implement the `login` handler: validate → call `LoginUseCase` → 200 or 401.
- [x] 15.2 Implement the `refresh` handler: validate → call `RefreshSessionUseCase` → 200 or 401.
- [x] 15.3 Add the `console.error` log for unexpected failures, consistent with existing error-handling style.

## Implementation Details
See TechSpec "API Endpoints" for exact status codes and messages, and "Integration Points" for how Supabase errors are expected to already arrive as `UnprocessableEntityError` from the use case layer by the time they reach this controller.

### Relevant Files
- `src/infra/controllers/user-controller.ts` — existing try/catch + `formatBadRequest` pattern to mirror.
- `src/core/usecases/auth/login.ts` (task_12), `src/core/usecases/auth/refresh-session.ts` (task_13) — use cases this controller calls.
- `src/infra/http/validators/auth-validator.ts` (task_14) — schemas this controller parses with.
- `src/core/errors/UnprocessableEntityError.ts` — error type caught here and mapped to 401.

### Dependent Files
- `src/infra/http/routes/auth-routes.ts` (task_16) — wires this controller's handlers to routes.
- `src/main/factories/auth-controller-factory.ts` (task_16) — instantiates this controller.

### Related ADRs
- [ADR-002: Single Unified Login Flow for All User Roles](adrs/adr-002.md)
- [ADR-004: Backend-Proxied Token Refresh](adrs/adr-004.md)

## Deliverables
- `src/infra/controllers/auth-controller.ts` with `login` and `refresh` handlers.

## Tests
- Manual verification (project has no automated test framework — see TechSpec "Testing Approach"):
  - [x] `POST /api/auth/login` with valid credentials returns 200 with the full `LoginResult`.
  - [x] `POST /api/auth/login` with a wrong password returns 401 with `{ message: "Email ou senha inválidos" }`.
  - [x] `POST /api/auth/login` with a non-existent email returns the identical 401 response as a wrong password.
  - [x] `POST /api/auth/login` with a malformed body (missing `password`) returns 400.
  - [x] `POST /api/auth/refresh` with a valid refresh token returns 200 with a new `RefreshResult`.
  - [x] `POST /api/auth/refresh` with an invalid/expired refresh token returns 401 with `{ message: "Sessão expirada, faça login novamente" }`.
- Test coverage target: N/A — no automated test framework in this project.
- Verified via `npx tsc --noEmit` (clean) plus a throwaway `ts-node` script (deleted after use, not committed) that calls `AuthController.login`/`.refresh` directly with a mocked Express `res` (capturing `.status()`/`.json()`) and mocked use cases — no real HTTP server, DB, or Supabase call needed for this task, since the controller only depends on the use cases (already unit-verified in tasks 12/13) and the schemas (task 14). All 6 required scenarios passed, plus an extra check that an unexpected error returns a generic 500 without leaking the underlying error detail.
- Not verified: a real HTTP request through Express (unreachable end-to-end without the routes from task_16/17 and live Supabase/DB, per the same sandbox network limitation as prior tasks).

## Success Criteria
- Both endpoints return exactly the status codes and messages specified in TechSpec "API Endpoints". ✅ (verified via direct handler invocation)
- The 401 responses for login are indistinguishable regardless of which credential was wrong. ✅ (verified — identical body for both cases)
