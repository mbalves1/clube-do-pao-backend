---
status: completed
title: "DeliveryUser entity + DeliveryUserRepository port: create() includes supabaseUserId"
type: backend
complexity: low
dependencies: []
---

# Task 2: DeliveryUser entity + DeliveryUserRepository port: create() includes supabaseUserId

## Overview
Updates the `DeliveryUserRepository` port so `create()` accepts and is expected to persist a `supabaseUserId`. This is the first step of the blocking prerequisite identified in the TechSpec: `DeliveryPerson` accounts currently never get a Supabase credential, so `findBySupabaseUserId` (already implemented) never matches anything real.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include verification in deliverables
</critical>

<requirements>
- MUST change `DeliveryUserRepository.create`'s parameter type from `any` to a typed shape that includes a required `supabaseUserId: string`, alongside the existing fields already used by `PrismaDeliveryUserRepository.create` (`name`, `document`, `email`, `phone`, `modal`).
- MUST NOT change `findBySupabaseUserId` — it is already correctly implemented and typed.
- SHOULD keep the `DeliveryUser` entity (`src/core/entities/delivery.ts`) as-is; it already has `id`, `name`, `email`, `supabaseUserId` and needs no field changes, only confirm it's consistent with the new `create()` input type.
</requirements>

## Subtasks
- [x] 2.1 Define a typed `CreateDeliveryUserData` (or equivalent) input type for `create()`, replacing the current `any` parameter, including `supabaseUserId: string` as required.
- [x] 2.2 Update `DeliveryUserRepository.create` signature to use this new type.
- [x] 2.3 Confirm `DeliveryUser` entity fields still match what `findBySupabaseUserId` returns (no change expected, verification only).

## Implementation Details
This only changes the port (interface); the Prisma implementation is task_03. See TechSpec "Technical Dependencies" for why this chain of tasks (2 through 6) exists — it is a prerequisite for the delivery-order-assignment feature itself, not part of its core scope.

### Relevant Files
- `src/core/ports/delivery-user-repository.ts` — file to modify; currently `create(user: any): Promise<any>`.
- `src/core/entities/delivery.ts` — `DeliveryUser` type; read-only reference, no change expected.

### Dependent Files
- `src/infra/repositories/prisma-delivery-user-repository.ts` (task_03) — implements the updated `create` signature.
- `src/core/usecases/delivery/create-delivery.ts` (task_04) — calls `create` with the new required field.

## Deliverables
- Updated `src/core/ports/delivery-user-repository.ts` with a typed `create()` input including `supabaseUserId`.
- Manual verification **(REQUIRED)**.

## Tests
- Manual verification:
  - [x] Ran `npm run build` after this change alone: it compiled with 0 errors, not the predicted failure. Root cause: `PrismaDeliveryUserRepository.create(data: any): Promise<any>` still type-checks against the new port signature because `any` is bidirectionally assignable (bypasses the parameter/return type check in both directions). The port type change is confirmed in place via source inspection (`src/core/ports/delivery-user-repository.ts`); task_03 replaces `any` with the real type and adds `supabaseUserId` to the Prisma write.
- Test coverage target: N/A — no automated test framework in this project.
- All manual verification scenarios passing.

## Success Criteria
- `DeliveryUserRepository.create` signature requires `supabaseUserId`.
- No change to `findBySupabaseUserId` or the `DeliveryUser` entity.