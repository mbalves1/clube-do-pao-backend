---
status: completed
title: "LoginUseCase"
type: backend
complexity: medium
dependencies:
  - task_02
  - task_04
  - task_06
  - task_08
---

# Task 12: LoginUseCase

## Overview
Implements the core business logic of this feature: authenticate email + password via `AuthGateway`, resolve the caller's role from `app_metadata`, look up the matching business profile in the right table, and return a combined login result (PRD "Email + password login", "Role identification on login").

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include verification in deliverables
</critical>

<requirements>
- MUST implement `LoginUseCase` in `src/core/usecases/auth/login.ts`, constructor-injected with `AuthGateway`, `UserRepository`, `BakeryRepository`, `DeliveryUserRepository` (per TechSpec "Core Interfaces").
- MUST call `authGateway.signInWithPassword(email, password)` and read `role` from the returned `AuthSession`.
- MUST resolve the business profile via a plain `switch` on role → repository (`customer` → `UserRepository`, `bakery_owner` → `BakeryRepository`, `courier` → `DeliveryUserRepository`), each looked up by `supabaseUserId`. Per TechSpec: "no strategy-pattern abstraction is introduced, per YAGNI — three cases do not justify one."
- MUST throw an `UnprocessableEntityError` (from `src/core/errors/`) when Supabase rejects the credentials, or when no matching business record is found for the authenticated identity — the controller (task_15) is responsible for translating this into the PRD's single generic 401 message; this use case must not leak which part failed.
- MUST return a `LoginResult` shaped exactly as specified in TechSpec "Data Models" (`accessToken`, `refreshToken`, `expiresIn`, `role`, `profile: { id, name, email }`).
- MUST NOT reveal in any thrown error or log message whether the failure was "email not found" vs "wrong password" vs "no linked business record" — all three must be indistinguishable to the caller, per PRD's generic-error requirement.
</requirements>

## Subtasks
- [x] 12.1 Implement `LoginUseCase` with its four constructor dependencies.
- [x] 12.2 Call `AuthGateway.signInWithPassword` and handle its failure as a generic credential error.
- [x] 12.3 Implement the three-case role → repository switch, looked up by `supabaseUserId`.
- [x] 12.4 Handle "authenticated but no matching business record" as the same generic credential error (do not distinguish it from a wrong password).
- [x] 12.5 Assemble and return the `LoginResult`.

## Implementation Details
See TechSpec "Core Interfaces" for `LoginDTO`/`LoginResult` shapes and "Component Overview" for the exact data flow (`AuthController` → `LoginUseCase` → `AuthGateway.signInWithPassword` → role from `app_metadata` → repository lookup by `supabaseUserId` → combined result).

### Relevant Files
- `src/core/ports/auth-gateway.ts` (task_02), `src/core/ports/user-repository.ts` (task_04), `src/core/ports/delivery-user-repository.ts` (task_06), `src/core/ports/bakery-repository.ts` (task_08) — the four ports this use case depends on.
- `src/core/errors/UnprocessableEntityError.ts` — error type to throw on any credential/lookup failure.

### Dependent Files
- `src/infra/controllers/auth-controller.ts` (task_15) — calls this use case and maps its thrown error to a 401 response.
- `src/main/factories/auth-controller-factory.ts` (task_16) — instantiates this use case with concrete repositories/gateway.

### Related ADRs
- [ADR-001: Use Supabase Auth as the Identity Provider](adrs/adr-001.md)
- [ADR-002: Single Unified Login Flow for All User Roles](adrs/adr-002.md)
- [ADR-003: Role Stored in Supabase app_metadata; Per-Table supabaseUserId Link](adrs/adr-003.md)

## Deliverables
- `src/core/usecases/auth/login.ts` implementing `LoginUseCase` per the TechSpec contract.

## Tests
- Manual verification (project has no automated test framework — see TechSpec "Testing Approach"):
  - [x] Login with a correct customer email/password returns `role: 'customer'` and the correct `profile`.
  - [x] Login with a correct bakery-owner email/password returns `role: 'bakery_owner'` and the correct `profile`.
  - [x] Login with a correct courier email/password returns `role: 'courier'` and the correct `profile`.
  - [x] Login with a wrong password throws the generic credential error.
  - [x] Login with a non-existent email throws the same generic credential error (indistinguishable from a wrong password).
  - [x] Login with valid Supabase credentials but no matching row in the role-implied table throws the same generic credential error.
- Test coverage target: N/A — no automated test framework in this project.
- Verified via `npx tsc --noEmit` (clean) plus a throwaway `ts-node` script exercising `LoginUseCase` directly with mocked `AuthGateway`/repositories (deleted after use, not committed) — this project has no test harness so no `AuthGateway` call ever reaches real Supabase/DB from this environment (same network limitation noted in task_11). All 6 scenarios above passed, including confirming all 3 failure paths throw the exact same error message (`"Email ou senha inválidos"`, `UnprocessableEntityError` 422).
- Not verified: a real end-to-end run against live Supabase/DB (unreachable from this sandbox). Recommended before relying on this in production: exercise `POST /api/auth/login` once task_15–17 wire it up, against real customer/bakery/courier accounts.

## Success Criteria
- All three personas can log in and receive the correct role and profile. ✅ (verified via mocked use-case run)
- No error path distinguishes "wrong email," "wrong password," or "missing linked record" from one another. ✅ (verified — single shared error message across all 3 failure paths)
