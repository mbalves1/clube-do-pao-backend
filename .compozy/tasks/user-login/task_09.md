---
status: pending
title: "CreateUserUseCase: require password, create Supabase credential, persist supabaseUserId"
type: backend
complexity: medium
dependencies:
  - task_02
  - task_04
---

# Task 9: CreateUserUseCase: require password, create Supabase credential, persist supabaseUserId

## Overview
Changes customer registration so it creates a real Supabase Auth credential (with `app_metadata.role = 'customer'`) alongside the existing local `User` profile row, closing the gap where no registered user currently has anything to log in with (ADR-001, PRD "Registration updated to require a password").

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include verification in deliverables
</critical>

<requirements>
- MUST extend `CreateUserDTO` with a required `password` field.
- MUST inject `AuthGateway` (task_02) into `CreateUserUseCase`'s constructor, alongside the existing `UserRepository`.
- MUST call `authGateway.createCredential(email, password, 'customer')` and persist the returned `supabaseUserId` on the created `User` row via `userRepository.create`.
- MUST keep the existing email-conflict check (`findByEmail` before creating) — this task does not need to fix its current use of a plain `Error` instead of an `AppError` subclass; that is a pre-existing inconsistency outside this feature's scope. Any **new** error path this task introduces (e.g., Supabase credential creation failure) SHOULD use an `AppError` subclass, per `docs/architecture.md`'s "Erros de domínio estendem AppError" convention.
- MUST NOT implement retry/compensation logic if the local `User` row creation fails after the Supabase credential was already created (accepted risk for this MVP — out of scope per YAGNI).
</requirements>

## Subtasks
- [ ] 9.1 Add `password` to `CreateUserDTO`.
- [ ] 9.2 Inject `AuthGateway` into `CreateUserUseCase`.
- [ ] 9.3 Call `createCredential` and persist the resulting `supabaseUserId` when creating the `User`.
- [ ] 9.4 Confirm the existing email-conflict check still runs before any Supabase call (avoid creating an orphaned Supabase credential for an email that's already taken locally).

## Implementation Details
See TechSpec "Core Interfaces" (`LoginUseCase`/DTO shapes) and "Development Sequencing" step 3 for this exact change and its ordering rationale (check email conflict locally first, then call Supabase, then persist).

### Relevant Files
- `src/core/usecases/user/create-user.ts` — file to modify; currently only creates the local `User` row after an email-conflict check.
- `src/core/ports/auth-gateway.ts` (task_02) — the new dependency to inject.
- `src/core/ports/user-repository.ts` / `src/core/entities/user.ts` (task_04) — `create` now expects `supabaseUserId`.

### Dependent Files
- `src/infra/http/validators/user-validator.ts` (task_10) — must accept `password` in the request payload.
- `src/infra/controllers/user-controller.ts` / `src/main/factories/user-controller-factory.ts` (task_11) — must forward `password` and wire the new `AuthGateway` dependency.

### Related ADRs
- [ADR-001: Use Supabase Auth as the Identity Provider](adrs/adr-001.md)

## Deliverables
- Updated `src/core/usecases/user/create-user.ts`: new DTO field, new constructor dependency, new Supabase credential creation call.

## Tests
- Manual verification (project has no automated test framework — see TechSpec "Testing Approach"):
  - [ ] Registering a new customer with `name`, `email`, `password` creates a Supabase Auth user with `app_metadata.role = 'customer'` and a local `User` row with matching `supabaseUserId`.
  - [ ] Registering with an email that already exists locally is rejected before any Supabase call is made (no orphaned Supabase credential created).
- Test coverage target: N/A — no automated test framework in this project.
- All manual verification scenarios must pass.

## Success Criteria
- Every newly registered customer ends registration with a working Supabase credential linked via `supabaseUserId`.
- No orphaned Supabase credentials created for emails that fail the local conflict check.
