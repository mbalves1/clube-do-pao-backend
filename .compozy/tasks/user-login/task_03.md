---
status: pending
title: "SupabaseAuthGateway implementation"
type: backend
complexity: medium
dependencies:
  - task_02
---

# Task 3: SupabaseAuthGateway implementation

## Overview
Implements the `AuthGateway` port using `@supabase/supabase-js`, providing sign-in, refresh, and admin credential creation. This is the only place in the codebase that talks to Supabase Auth for these three operations, and it carries the one empirically-uncertain risk called out in ADR-003.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include verification in deliverables
</critical>

<requirements>
- MUST implement `AuthGateway` (from task_02) in `src/infra/gateways/supabase-auth-gateway.ts`.
- MUST initialize its own Supabase client using `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (same env vars as `src/middlewares/auth.ts`) — per TechSpec Impact Analysis, `src/middlewares/auth.ts` is explicitly unmodified, so this gateway creates its own client rather than importing/refactoring the middleware's.
- MUST implement `signInWithPassword` using Supabase's password-grant sign-in, returning an `AuthSession` (including `role` read from `app_metadata`).
- MUST implement `refreshSession` using Supabase's session-refresh call.
- MUST implement `createCredential` using `supabase.auth.admin.createUser` with `app_metadata.role` set to the given `Role`.
- MUST empirically verify, early in implementation, that `signInWithPassword` succeeds when the client is initialized with the service-role key (ADR-003 risk). If it fails, add `SUPABASE_ANON_KEY` as a new env var (document it in `docs/infra.md`) and use it only for the sign-in call, per ADR-003's stated mitigation.
- MUST translate Supabase errors (invalid credentials, expired refresh token) into thrown errors the calling use case can catch — do not swallow errors silently.
</requirements>

## Subtasks
- [ ] 3.1 Create `src/infra/gateways/supabase-auth-gateway.ts` with its own Supabase client instance.
- [ ] 3.2 Implement `signInWithPassword` (email/password → `AuthSession` with role from `app_metadata`).
- [ ] 3.3 Implement `refreshSession` (refresh token → new session).
- [ ] 3.4 Implement `createCredential` (email/password/role → Supabase user with `app_metadata.role` set).
- [ ] 3.5 Verify the service-role-key risk (ADR-003) against the project's actual Supabase instance; apply the `SUPABASE_ANON_KEY` fallback only if verification fails.

## Implementation Details
See TechSpec "Core Interfaces" for the `AuthGateway` contract and "Integration Points" for how Supabase errors should be surfaced. Reference `src/middlewares/auth.ts` for the existing `createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)` pattern to mirror (not import).

### Relevant Files
- `src/middlewares/auth.ts` — existing Supabase client instantiation pattern to mirror.
- `src/core/ports/auth-gateway.ts` (task_02) — interface this file implements.
- `docs/infra.md` — update only if the `SUPABASE_ANON_KEY` fallback is needed.

### Dependent Files
- `src/main/factories/user-controller-factory.ts` (task_11) and `src/main/factories/auth-controller-factory.ts` (task_16) — instantiate this gateway.

### Related ADRs
- [ADR-001: Use Supabase Auth as the Identity Provider](adrs/adr-001.md)
- [ADR-003: Role Stored in Supabase app_metadata; Per-Table supabaseUserId Link](adrs/adr-003.md) — the service-role-key risk and its fallback.

## Deliverables
- `src/infra/gateways/supabase-auth-gateway.ts` implementing all three `AuthGateway` methods.
- Confirmation (in the PR/commit description) of whether the service-role key worked for `signInWithPassword` or whether the `SUPABASE_ANON_KEY` fallback was needed.
- Updated `docs/infra.md` **only if** the fallback was needed.

## Tests
- Manual verification (project has no automated test framework — see TechSpec "Testing Approach"):
  - [ ] Calling `signInWithPassword` with a real Supabase test user's correct credentials returns a session with a non-empty `accessToken`, `refreshToken`, and the expected `role`.
  - [ ] Calling `signInWithPassword` with a wrong password throws/rejects.
  - [ ] Calling `refreshSession` with a valid refresh token returns a new `accessToken`.
  - [ ] Calling `refreshSession` with an invalid/expired refresh token throws/rejects.
  - [ ] Calling `createCredential` creates a Supabase user whose `app_metadata.role` matches the role passed in.
- Test coverage target: N/A — no automated test framework in this project.
- All manual verification scenarios must pass.

## Success Criteria
- All three `AuthGateway` methods work against the project's real Supabase instance.
- The ADR-003 service-role-key risk is resolved one way or the other, with the outcome documented.
- No changes made to `src/middlewares/auth.ts`.
