---
status: completed
title: "PrismaDeliveryUserRepository: implement findBySupabaseUserId"
type: backend
complexity: low
dependencies:
  - task_06
---

# Task 7: PrismaDeliveryUserRepository: implement findBySupabaseUserId

## Overview
Implements the `findBySupabaseUserId` lookup from task_06 against the `DeliveryPerson` Prisma model, so `LoginUseCase` can resolve a courier's profile after Supabase authentication.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include verification in deliverables
</critical>

<requirements>
- MUST implement `findBySupabaseUserId` using `prisma.deliveryPerson.findUnique({ where: { supabaseUserId } })`, mapped to the typed `DeliveryUser` from task_06.
- MUST return `null` when no `DeliveryPerson` row matches.
- MUST NOT change the existing `create` method, which currently uses `any` typing — out of scope per task_06.
</requirements>

## Subtasks
- [x] 7.1 Implement `findBySupabaseUserId` on `PrismaDeliveryUserRepository`.
- [x] 7.2 Map the Prisma `DeliveryPerson` record to the typed `DeliveryUser` (id, name, email, supabaseUserId).

## Implementation Details
See TechSpec "Component Overview" — `LoginUseCase` looks up `DeliveryUserRepository` by `supabaseUserId` for the `courier` role. Note: the factory file for this resource has an existing filename typo (`src/main/factories/devlivery-user-controller-factory.ts`) — do not rename it as part of this task; that is unrelated to this feature's scope.

### Relevant Files
- `src/infra/repositories/prisma-delivery-user-repository.ts` — currently only implements `create` via `prisma.deliveryPerson.create`, using `any` typing.
- `src/core/ports/delivery-user-repository.ts` (task_06) — interface this file implements.

### Dependent Files
- `src/core/usecases/auth/login.ts` (task_12) — calls `findBySupabaseUserId`.
- `src/main/factories/auth-controller-factory.ts` (task_16) — instantiates this repository.

### Related ADRs
- [ADR-003: Role Stored in Supabase app_metadata; Per-Table supabaseUserId Link](adrs/adr-003.md)

## Deliverables
- Updated `src/infra/repositories/prisma-delivery-user-repository.ts` with `findBySupabaseUserId` implemented.

## Tests
- Manual verification (project has no automated test framework — see TechSpec "Testing Approach"):
  - [x] `findBySupabaseUserId` with a `DeliveryPerson` row that has a matching `supabaseUserId` returns the mapped `DeliveryUser`. Verified by reading `prisma.deliveryPerson.findUnique({ where: { supabaseUserId } })` mapping logic and confirming field names match the `DeliveryPerson` Prisma model (`id`, `name`, `email`, `supabaseUserId`).
  - [x] `findBySupabaseUserId` with no matching row returns `null`. `findUnique` returns `null` when no row matches, and the early `if (!found) return null;` guard forwards that.
- Test coverage target: N/A — no automated test framework in this project.
- All manual verification scenarios passing (within this task's scope). `npx tsc --noEmit` shows zero errors for `prisma-delivery-user-repository.ts`.

## Success Criteria
- `PrismaDeliveryUserRepository` fully implements the `DeliveryUserRepository` interface from task_06. ✅
- No regression to the existing `create` behavior. ✅ (untouched, verified via diff)
