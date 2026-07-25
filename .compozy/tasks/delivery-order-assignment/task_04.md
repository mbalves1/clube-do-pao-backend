---
status: pending
title: "CreateDeliveryUserUseCase: require password, create Supabase credential, persist supabaseUserId"
type: backend
complexity: medium
dependencies:
  - task_02
  - task_03
---

# Task 4: CreateDeliveryUserUseCase: require password, create Supabase credential, persist supabaseUserId

## Overview
Closes the blocking gap identified in the TechSpec: today `CreateDeliveryUserUseCase.execute` only inserts a DB row and never creates a Supabase Auth credential, so delivery persons can never log in and can never be resolved by `findBySupabaseUserId`. This task mirrors the existing `CreateUserUseCase` pattern (`src/core/usecases/user/create-user.ts`), which already does this correctly for customers with `role: 'customer'` — this task does the same with `role: 'delivery'`.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include verification in deliverables
</critical>

<requirements>
- MUST change the constructor to depend on the `DeliveryUserRepository` port (from `src/core/ports/delivery-user-repository.ts`) instead of the concrete `PrismaDeliveryUserRepository` class it currently imports directly — this is an existing violation of the "core does not import infra" rule (`docs/architecture.md`) and must be fixed as part of this change, not left in place.
- MUST add an `AuthGateway` constructor dependency, matching `CreateUserUseCase`'s constructor shape.
- MUST require `password: string` in the use case's input DTO.
- MUST call `authGateway.createCredential(data.email, data.password, 'delivery')` before creating the DB row, exactly as `CreateUserUseCase` does with `'customer'`.
- MUST catch a credential-creation failure and throw `UnprocessableEntityError`, matching `CreateUserUseCase`'s error handling for the same failure mode.
- MUST pass the resulting `supabaseUserId` into `deliveryUserRepository.create(...)`.
- MUST NOT add email-uniqueness checking or any other behavior beyond what `CreateUserUseCase` already does for the equivalent case — this task closes the credential gap only, per YAGNI.
</requirements>

## Subtasks
- [ ] 4.1 Change constructor to take `DeliveryUserRepository` (port) and `AuthGateway`.
- [ ] 4.2 Add `password` and keep existing fields in the use case's input DTO.
- [ ] 4.3 Call `authGateway.createCredential(email, password, 'delivery')`, handling failure the same way `CreateUserUseCase` does.
- [ ] 4.4 Pass `supabaseUserId` through to `deliveryUserRepository.create`.

## Implementation Details
See TechSpec "Technical Dependencies" and "Impact Analysis" for why this task exists. Mirror `src/core/usecases/user/create-user.ts` structurally — same constructor shape, same try/catch around `createCredential`, same `role` parameter usage, just with `'delivery'` instead of `'customer'` and the delivery-specific fields (`document`, `phone`, `modal`) instead of the user ones.

### Relevant Files
- `src/core/usecases/delivery/create-delivery.ts` — file to modify; currently `constructor(private deliveryRepository: PrismaDeliveryUserRepository)` and `execute(data: any)`.
- `src/core/usecases/user/create-user.ts` — structural model for this change (constructor shape, credential-creation try/catch, error type).
- `src/core/ports/auth-gateway.ts` — `AuthGateway` interface and `Role` type (`'customer' | 'delivery' | 'company'`), already supports `'delivery'`.
- `src/core/errors/UnprocessableEntityError.ts` — error thrown on credential-creation failure.

### Dependent Files
- `src/infra/http/validators/delivery-user-validator.ts` (task_05) — `createDeliverySchema` must require `password`.
- `src/infra/controllers/delivery-users-controller.ts` + `src/main/factories/devlivery-user-controller-factory.ts` (task_06) — factory must now inject `AuthGateway` and the `DeliveryUserRepository` port.

## Deliverables
- Updated `src/core/usecases/delivery/create-delivery.ts` depending on the port (not the concrete class) plus `AuthGateway`, creating a real Supabase credential with `role: 'delivery'`.
- Manual verification **(REQUIRED)**.

## Tests
- Manual verification:
  - [ ] Calling `execute` with valid data (including `password`) creates a Supabase user with `app_metadata.role === 'delivery'` and a `DeliveryPerson` row with matching `supabaseUserId`.
  - [ ] A Supabase credential-creation failure (e.g., temporarily invalid Supabase env vars) results in `UnprocessableEntityError`, not an unhandled exception.
  - [ ] The delivery person created this way can subsequently log in via the existing `POST /api/auth/login` and is resolved as role `delivery`.
- Test coverage target: N/A — no automated test framework in this project.
- All manual verification scenarios passing.

## Success Criteria
- `CreateDeliveryUserUseCase` depends only on the `DeliveryUserRepository` port and `AuthGateway` — no direct import of `PrismaDeliveryUserRepository`.
- A delivery person created through this use case can log in.