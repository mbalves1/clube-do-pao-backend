---
status: completed
title: "RefreshSessionUseCase"
type: backend
complexity: low
dependencies:
  - task_02
---

# Task 13: RefreshSessionUseCase

## Overview
Implements the use case behind token refresh, letting a client exchange a refresh token for a new access token without the user having to log in again, per the PRD's "session persistence" requirement and ADR-004's backend-proxied refresh design.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include verification in deliverables
</critical>

<requirements>
- MUST implement `RefreshSessionUseCase` in `src/core/usecases/auth/refresh-session.ts`, constructor-injected with `AuthGateway` only (per TechSpec "Core Interfaces" — no repository lookups needed for refresh).
- MUST call `authGateway.refreshSession(refreshToken)` and return its result (`accessToken`, `refreshToken`, `expiresIn`), matching the `RefreshResult` shape in TechSpec "Data Models".
- MUST throw an `UnprocessableEntityError` when Supabase rejects the refresh token (expired/invalid) — the controller (task_15) maps this to the PRD's session-expired 401 message.
</requirements>

## Subtasks
- [x] 13.1 Implement `RefreshSessionUseCase` with its single `AuthGateway` dependency.
- [x] 13.2 Call `AuthGateway.refreshSession` and return the `RefreshResult`.
- [x] 13.3 Translate a Supabase refresh failure into `UnprocessableEntityError`.

## Implementation Details
See TechSpec "Data Models" for the exact `RefreshResult` shape and "API Endpoints" for the `POST /api/auth/refresh` contract this use case backs.

### Relevant Files
- `src/core/ports/auth-gateway.ts` (task_02) — the only dependency this use case needs.
- `src/core/errors/UnprocessableEntityError.ts` — error type to throw on refresh failure.

### Dependent Files
- `src/infra/controllers/auth-controller.ts` (task_15) — calls this use case and maps its thrown error to a 401 response.
- `src/main/factories/auth-controller-factory.ts` (task_16) — instantiates this use case.

### Related ADRs
- [ADR-004: Backend-Proxied Token Refresh](adrs/adr-004.md)

## Deliverables
- `src/core/usecases/auth/refresh-session.ts` implementing `RefreshSessionUseCase` per the TechSpec contract.

## Tests
- Manual verification (project has no automated test framework — see TechSpec "Testing Approach"):
  - [x] Refreshing with a valid refresh token returns a new `accessToken`, `refreshToken`, and `expiresIn`.
  - [x] Refreshing with an invalid or expired refresh token throws the expected error.
- Test coverage target: N/A — no automated test framework in this project.
- Verified via `npx tsc --noEmit` (clean) plus a throwaway `ts-node` script exercising `RefreshSessionUseCase` with a mocked `AuthGateway` (deleted after use, not committed) — same network limitation as tasks 11/12, no real Supabase call made from this environment. Both scenarios passed: valid token returns the new session fields unchanged from the gateway; invalid token throws `UnprocessableEntityError("Sessão expirada, faça login novamente")`, 422.
- Not verified: a real refresh call against live Supabase (unreachable from this sandbox). Recommended once task_15–17 wire up `POST /api/auth/refresh`.

## Success Criteria
- A valid refresh token yields a new working access token without requiring re-login. ✅ (verified via mocked use-case run)
- Invalid/expired refresh tokens are rejected with a translatable error. ✅ (verified)
