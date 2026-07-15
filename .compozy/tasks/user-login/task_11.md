---
status: completed
title: "UserController.create + user-controller-factory.ts: forward password, wire AuthGateway"
type: backend
complexity: medium
dependencies:
  - task_03
  - task_05
  - task_09
  - task_10
---

# Task 11: UserController.create + user-controller-factory.ts: forward password, wire AuthGateway

## Overview
Wires the updated `CreateUserUseCase` (task_09) into the HTTP layer: the controller forwards `password` from the request body, and the factory instantiates and injects the real `SupabaseAuthGateway` alongside the existing `PrismaUserRepository`. This is the final step that makes registration-with-credential actually reachable via `POST /api/users`.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include verification in deliverables
</critical>

<requirements>
- MUST update `UserController.create` to pass `password` (already validated by `createUserSchema`) through to `CreateUserUseCase.execute`.
- MUST update `src/main/factories/user-controller-factory.ts` to construct a `SupabaseAuthGateway` and pass it into `CreateUserUseCase`'s constructor alongside `PrismaUserRepository`.
- MUST NOT change the controller's existing try/catch + `formatBadRequest` error-handling pattern for this handler — keep it consistent with `list`/`update`.
- MUST NOT touch `list` or `update` handlers, which are unaffected by this change.
</requirements>

## Subtasks
- [x] 11.1 Update `UserController.create` to forward `password` to the use case. (Already satisfied: `createUserSchema.parse(req.body)` returns `{name, email, password}`, matching `CreateUserDTO` exactly — no code change needed.)
- [x] 11.2 Update `user-controller-factory.ts` to instantiate `SupabaseAuthGateway` and inject it into `CreateUserUseCase`.
- [x] 11.3 Route registration unchanged, confirmed by inspection of `src/infra/http/routes/user-routes.ts` (`POST /users` still unauthenticated, untouched). End-to-end HTTP response shape **not manually verified** — see Tests note below.

## Implementation Details
See TechSpec "Component Overview" (`CreateUserUseCase (modified)`, `UserController (modified)`) and Impact Analysis row for `src/main/factories/user-controller-factory.ts`... (note: TechSpec's Impact Analysis table does not list this factory explicitly, but wiring the new `AuthGateway` dependency into `CreateUserUseCase`'s constructor requires it — treat this as an implied consequence of the `CreateUserUseCase (modified)` row).

### Relevant Files
- `src/infra/controllers/user-controller.ts` — `create` handler to update.
- `src/main/factories/user-controller-factory.ts` — factory wiring to update.
- `src/infra/gateways/supabase-auth-gateway.ts` (task_03) — gateway to instantiate here.
- `src/infra/repositories/prisma-user-repository.ts` (task_05) — already instantiated here today.

### Dependent Files
- None outside this task — this is the last piece of the registration-side change.

### Related ADRs
- [ADR-001: Use Supabase Auth as the Identity Provider](adrs/adr-001.md)

## Deliverables
- Updated `src/infra/controllers/user-controller.ts` (`create` handler).
- Updated `src/main/factories/user-controller-factory.ts` (wiring).

## Tests
- Manual verification (project has no automated test framework — see TechSpec "Testing Approach"):
  - [ ] `POST /api/users` with `{ name, email, password }` returns 201 and the created user has a Supabase credential with `app_metadata.role = 'customer'`.
  - [ ] `POST /api/users` with an existing email returns the existing conflict behavior, unchanged.
  - [ ] `POST /api/users` without `password` returns 400 (via task_10's validator), and no Supabase call is attempted.
- Test coverage target: N/A — no automated test framework in this project.
- **NOT executed**: these 3 manual scenarios require a live server with real DB/Supabase connectivity, which is unreachable from the sandbox this task was executed in (the direct Supabase Postgres host times out — likely IPv6-only route not available here). Skipped per explicit user instruction to proceed without running them. Static validation performed instead: `npx tsc --noEmit` clean (pre-change baseline failed with `TS2554: Expected 2 arguments, but got 1` at the factory call site), plus manual code inspection of the DTO/schema match and route file.
- Recommended before relying on this in production: run the 3 scenarios above against a real environment (e.g. via `request.http`'s `POST http://localhost:3333/api/users` block) and confirm in the Supabase dashboard.

## Success Criteria
- Registration end-to-end (`POST /api/users`) produces a working Supabase credential and a linked local `User` row. **(code-complete, unverified live)**
- `list` and `update` handlers show no behavioral change. (confirmed — untouched)
