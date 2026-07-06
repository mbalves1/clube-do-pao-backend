---
status: pending
title: "User entity + port: supabaseUserId, findBySupabaseUserId"
type: backend
complexity: low
dependencies:
  - task_01
---

# Task 4: User entity + port: supabaseUserId, findBySupabaseUserId

## Overview
Extends the `User` domain entity and `UserRepository` port to carry and query by `supabaseUserId`, so the login and registration use cases can link a Supabase identity to its local profile row.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include verification in deliverables
</critical>

<requirements>
- MUST add `supabaseUserId: string` to the `User` type in `src/core/entities/user.ts`.
- MUST update `UserRepository.create` (and its associated data type, if separate) so callers can pass `supabaseUserId` when creating a user.
- MUST add `findBySupabaseUserId(supabaseUserId: string): Promise<User | null>` to `UserRepository` in `src/core/ports/user-repository.ts`.
- MUST NOT implement the Prisma-backed logic here — that is task_05. This task only changes the entity/interface layer.
- MUST NOT change unrelated existing fields or methods on `User`/`UserRepository`.
</requirements>

## Subtasks
- [ ] 4.1 Add `supabaseUserId` field to the `User` entity type.
- [ ] 4.2 Update the `create` method's input type on `UserRepository` to include `supabaseUserId`.
- [ ] 4.3 Add the `findBySupabaseUserId` method signature to `UserRepository`.

## Implementation Details
See TechSpec "Data Models" for the `User.supabaseUserId` field (required, unique) and "Component Overview" for how `findBySupabaseUserId` is used by `LoginUseCase`.

### Relevant Files
- `src/core/entities/user.ts` — current `User` type (no password/credential field today).
- `src/core/ports/user-repository.ts` — current `UserRepository` interface (`create`, `update`, `findByEmail`, `findById`, `find`).

### Dependent Files
- `src/infra/repositories/prisma-user-repository.ts` (task_05) — must implement the updated interface.
- `src/core/usecases/user/create-user.ts` (task_09) — will pass `supabaseUserId` on create.
- `src/core/usecases/auth/login.ts` (task_12) — will call `findBySupabaseUserId`.

### Related ADRs
- [ADR-003: Role Stored in Supabase app_metadata; Per-Table supabaseUserId Link](adrs/adr-003.md)

## Deliverables
- Updated `src/core/entities/user.ts` with `supabaseUserId`.
- Updated `src/core/ports/user-repository.ts` with the new field on create and the new `findBySupabaseUserId` method.
- Type-checks successfully **(REQUIRED)**.

## Tests
- Manual verification (project has no automated test framework — see TechSpec "Testing Approach"):
  - [ ] `User` type includes `supabaseUserId: string` and the project builds without type errors.
  - [ ] `UserRepository` interface includes `findBySupabaseUserId` with the correct signature.
- Test coverage target: N/A — no automated test framework in this project.
- All manual verification scenarios must pass.

## Success Criteria
- `User` entity and `UserRepository` port match the TechSpec's data model for `supabaseUserId`.
- task_05 can implement the updated interface without further changes to this task's files.
