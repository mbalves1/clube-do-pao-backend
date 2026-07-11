---
status: completed
title: "DeliveryUser entity + port: findBySupabaseUserId"
type: backend
complexity: low
dependencies:
  - task_01
---

# Task 6: DeliveryUser entity + port: findBySupabaseUserId

## Overview
Gives the `DeliveryUser` domain type its first real fields (it is currently an empty stub) so `LoginUseCase` can return a courier's profile, and adds the lookup method the login flow needs on `DeliveryUserRepository`.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include verification in deliverables
</critical>

<requirements>
- MUST replace the empty `DeliveryUser` type (`src/core/entities/delivery.ts`, currently `export type DeliveryUser = {}`) with a type carrying, at minimum, `id`, `name`, `email`, and `supabaseUserId` — the fields `LoginResult.profile` needs (per TechSpec "Data Models") plus the linking column.
- MUST add `findBySupabaseUserId(supabaseUserId: string): Promise<DeliveryUser | null>` to `DeliveryUserRepository` (`src/core/ports/delivery-user-repository.ts`).
- MUST NOT change the existing `create(user: any)` method's signature or behavior — retyping it is out of scope for this feature (YAGNI; it is not on the login/registration path this PRD covers, since couriers are not self-registering here per PRD Non-Goals).
- MUST NOT implement the Prisma-backed logic here — that is task_07.
</requirements>

## Subtasks
- [x] 6.1 Replace the empty `DeliveryUser` stub with a typed shape (`id`, `name`, `email`, `supabaseUserId`).
- [x] 6.2 Add `findBySupabaseUserId` to `DeliveryUserRepository`.
- [x] 6.3 Confirm the existing `create(user: any)` method is left untouched. Verified via `git diff` — zero changes to `prisma-delivery-user-repository.ts`.

## Implementation Details
See TechSpec "Data Models" (`LoginResult.profile` shape: `{ id, name, email }`) and ADR-003 (`DeliveryPerson.supabaseUserId` is optional). Note the Prisma model backing this entity is `DeliveryPerson`, not `DeliveryUser` — the domain type name (`DeliveryUser`) intentionally differs from the Prisma model name, matching the existing naming already used in the port/repository files.

### Relevant Files
- `src/core/entities/delivery.ts` — currently `export type DeliveryUser = {}`.
- `src/core/ports/delivery-user-repository.ts` — currently `create(user: any): Promise<any>` only.

### Dependent Files
- `src/infra/repositories/prisma-delivery-user-repository.ts` (task_07) — implements the updated interface.
- `src/core/usecases/auth/login.ts` (task_12) — calls `findBySupabaseUserId` for the `courier` role.

### Related ADRs
- [ADR-003: Role Stored in Supabase app_metadata; Per-Table supabaseUserId Link](adrs/adr-003.md)

## Deliverables
- Updated `src/core/entities/delivery.ts` with a typed `DeliveryUser`.
- Updated `src/core/ports/delivery-user-repository.ts` with `findBySupabaseUserId` added alongside the existing `create`.

## Tests
- Manual verification (project has no automated test framework — see TechSpec "Testing Approach"):
  - [x] `DeliveryUser` type includes `id`, `name`, `email`, `supabaseUserId`. `npx tsc --noEmit` shows zero errors in `delivery.ts`/`delivery-user-repository.ts` themselves; remaining errors are the expected, documented follow-up scoped to task_07/task_09.
  - [x] `DeliveryUserRepository` interface includes `findBySupabaseUserId` with the correct signature, and the existing `create` method is unchanged.
- Test coverage target: N/A — no automated test framework in this project.
- All manual verification scenarios passing (within this task's scope).

## Success Criteria
- `DeliveryUser` and `DeliveryUserRepository` support the fields and lookup `LoginUseCase` needs for the courier role. ✅
- No change to the existing `create` method's contract. ✅
