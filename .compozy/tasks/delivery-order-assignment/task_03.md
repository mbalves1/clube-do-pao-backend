---
status: pending
title: "PrismaDeliveryUserRepository.create: persist supabaseUserId"
type: backend
complexity: low
dependencies:
  - task_02
---

# Task 3: PrismaDeliveryUserRepository.create: persist supabaseUserId

## Overview
Implements the port change from task_02 in the Prisma-backed repository: `create()` now writes `supabaseUserId` to the `DeliveryPerson` row, which is what makes `findBySupabaseUserId` (already implemented) able to resolve a real courier during login and during this feature's accept/release flows.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include verification in deliverables
</critical>

<requirements>
- MUST update `PrismaDeliveryUserRepository.create` to pass `supabaseUserId` through to `prisma.deliveryPerson.create`.
- MUST use the typed input from task_02 instead of `data: any`.
- MUST NOT modify `findBySupabaseUserId`, which already correctly reads and maps `supabaseUserId`.
</requirements>

## Subtasks
- [ ] 3.1 Update `create`'s parameter type to match task_02's port change.
- [ ] 3.2 Pass `supabaseUserId` into the `prisma.deliveryPerson.create({ data: { ... } })` call.
- [ ] 3.3 Verify the return type/mapping is consistent with `findBySupabaseUserId`'s existing mapping shape.

## Implementation Details
Follow the same shape `PrismaUserRepository.create` already uses for persisting `supabaseUserId` (added in the prior `user-login` feature) — this repository already has `findBySupabaseUserId` implemented with a manual inline mapping; `create` just needs the same field added to its `data` object.

### Relevant Files
- `src/infra/repositories/prisma-delivery-user-repository.ts` — file to modify; `create` currently omits `supabaseUserId` entirely.
- `src/infra/repositories/prisma-user-repository.ts` — reference for how `supabaseUserId` is persisted on `create` elsewhere in this codebase.

### Dependent Files
- `src/core/usecases/delivery/create-delivery.ts` (task_04) — calls `create` and will pass the Supabase-issued `supabaseUserId`.

## Deliverables
- Updated `src/infra/repositories/prisma-delivery-user-repository.ts` implementing the full updated `DeliveryUserRepository` interface.
- Manual verification **(REQUIRED)**.

## Tests
- Manual verification:
  - [ ] Creating a delivery person with a `supabaseUserId` persists it and it is readable back via `findBySupabaseUserId`.
  - [ ] `npm run build` compiles with no type errors once this task and task_02 are both applied.
- Test coverage target: N/A — no automated test framework in this project.
- All manual verification scenarios passing.

## Success Criteria
- `PrismaDeliveryUserRepository` fully implements the updated `DeliveryUserRepository` interface.
- No regression to `findBySupabaseUserId` behavior.