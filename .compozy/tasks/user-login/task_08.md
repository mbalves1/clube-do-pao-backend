---
status: completed
title: "BakeryRepository port + PrismaBakeryRepository: findBySupabaseUserId"
type: backend
complexity: low
dependencies:
  - task_01
---

# Task 8: BakeryRepository port + PrismaBakeryRepository: findBySupabaseUserId

## Overview
Adds the `findBySupabaseUserId` lookup to the existing, already-complete `Bakery` port/repository pair, so `LoginUseCase` can resolve a bakery owner's profile after Supabase authentication.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include verification in deliverables
</critical>

<requirements>
- MUST add `findBySupabaseUserId(supabaseUserId: string): Promise<Bakery | null>` to `BakeryRepository` (`src/core/ports/bakery-repository.ts`).
- MUST implement it in `PrismaBakeryRepository` using `prisma.bakery.findUnique({ where: { supabaseUserId } })`, mapped via the existing `toBakery` mapper (`src/infra/mappers/prisma-bakery-mapper.ts`) — do not write a new inline mapping; this table already has a dedicated mapper, unlike `User`.
- MUST return `null` when no `Bakery` row matches.
- MUST NOT modify unrelated existing methods on `BakeryRepository`/`PrismaBakeryRepository`.
</requirements>

## Subtasks
- [x] 8.1 Add `findBySupabaseUserId` to `BakeryRepository`.
- [x] 8.2 Implement it in `PrismaBakeryRepository`, reusing `toBakery` for mapping.

## Implementation Details
See TechSpec "Component Overview" — `LoginUseCase` looks up `BakeryRepository` by `supabaseUserId` for the `bakery_owner` role.

### Relevant Files
- `src/core/ports/bakery-repository.ts` — interface to extend.
- `src/infra/repositories/prisma-bakery-repository.ts` — implementation to extend.
- `src/infra/mappers/prisma-bakery-mapper.ts` — existing `toBakery` mapper to reuse.

### Dependent Files
- `src/core/usecases/auth/login.ts` (task_12) — calls `findBySupabaseUserId`.
- `src/main/factories/auth-controller-factory.ts` (task_16) — instantiates this repository.

### Related ADRs
- [ADR-003: Role Stored in Supabase app_metadata; Per-Table supabaseUserId Link](adrs/adr-003.md)

## Deliverables
- Updated `src/core/ports/bakery-repository.ts` with `findBySupabaseUserId`.
- Updated `src/infra/repositories/prisma-bakery-repository.ts` implementing it via the existing mapper.

## Tests
- Manual verification (project has no automated test framework — see TechSpec "Testing Approach"):
  - [x] `findBySupabaseUserId` with a `Bakery` row that has a matching `supabaseUserId` returns the mapped `Bakery`. Verified by reading `prisma.bakery.findUnique({ where: { supabaseUserId } })` + `toBakery` mapping, consistent with `findByCnpj`/`findUnique`.
  - [x] `findBySupabaseUserId` with no matching row returns `null`. `findUnique` returns `null`, and the `found ? toBakery(found) : null` ternary forwards that, matching the existing pattern.
- Test coverage target: N/A — no automated test framework in this project.
- All manual verification scenarios passing (within this task's scope). `npx tsc --noEmit` shows zero errors for `bakery-repository.ts`/`prisma-bakery-repository.ts`.

## Success Criteria
- `BakeryRepository`/`PrismaBakeryRepository` support the lookup `LoginUseCase` needs for the `bakery_owner` role. ✅
- No regression to existing `Bakery` repository behavior. ✅ (`find`, `findByCnpj`, `findUnique`, `create` untouched, verified via diff)
