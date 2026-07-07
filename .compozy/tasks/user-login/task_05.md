---
status: completed
title: "PrismaUserRepository: persist supabaseUserId + findBySupabaseUserId"
type: backend
complexity: low
dependencies:
  - task_04
---

# Task 5: PrismaUserRepository: persist supabaseUserId + findBySupabaseUserId

## Overview
Implements the `UserRepository` changes from task_04 in the Prisma-backed repository: persisting `supabaseUserId` on creation and adding the lookup method the login flow needs.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include verification in deliverables
</critical>

<requirements>
- MUST update `PrismaUserRepository.create` to persist `supabaseUserId` via `prisma.user.create`.
- MUST implement `findBySupabaseUserId` using `prisma.user.findUnique({ where: { supabaseUserId } })`.
- MUST include `supabaseUserId` in every inline mapping from the Prisma record to the `User` domain type, consistent with this repository's existing inline-mapping style (there is no separate `prisma-user-mapper.ts` file — do not introduce one for this single field, per YAGNI).
- MUST return `null` (not throw) when `findBySupabaseUserId` finds no match, consistent with how `findByEmail`/`findById` behave today.
</requirements>

## Subtasks
- [x] 5.1 Update `create` to accept and persist `supabaseUserId`.
- [x] 5.2 Add `findBySupabaseUserId`, mapped to the `User` domain type inline.
- [x] 5.3 Verify every existing method's inline mapping still includes all `User` fields, now including `supabaseUserId`. (`create`, `update`, `findByEmail`, `findById`, `find` all updated.)

## Implementation Details
See TechSpec "Component Overview" for how `LoginUseCase` and `CreateUserUseCase` will call this repository. Follow the existing inline-mapping style already used for `findByEmail`/`findById`/`create` in this file — do not introduce a mapper file (Bakery has one, User does not; keep User's existing pattern).

### Relevant Files
- `src/infra/repositories/prisma-user-repository.ts` — file to modify; implements `UserRepository` with manual inline mapping per method.

### Dependent Files
- `src/core/usecases/user/create-user.ts` (task_09) — calls `create` with the new field.
- `src/core/usecases/auth/login.ts` (task_12) — calls `findBySupabaseUserId`.
- `src/main/factories/user-controller-factory.ts` (task_11), `src/main/factories/auth-controller-factory.ts` (task_16) — instantiate this repository.

### Related ADRs
- [ADR-003: Role Stored in Supabase app_metadata; Per-Table supabaseUserId Link](adrs/adr-003.md)

## Deliverables
- Updated `src/infra/repositories/prisma-user-repository.ts` implementing the full `UserRepository` interface from task_04.

## Tests
- Manual verification (project has no automated test framework — see TechSpec "Testing Approach"):
  - [x] Creating a user with a `supabaseUserId` persists it and it is readable back via `findById`.
  - [x] `findBySupabaseUserId` with an existing value returns the matching `User`, including all its fields.
  - [x] `findBySupabaseUserId` with a non-existent value returns `null` (does not throw).
- Test coverage target: N/A — no automated test framework in this project.
- All manual verification scenarios passing. Verified live against the real database via a temporary script (removed after use); the test row created was deleted after verification.

## Success Criteria
- `PrismaUserRepository` fully implements the `UserRepository` interface, including `supabaseUserId` support. ✅
- No regression in existing `create`/`update`/`findByEmail`/`findById`/`find` behavior. ✅ (only the remaining, out-of-scope `create-user.ts` error is task_09's)
