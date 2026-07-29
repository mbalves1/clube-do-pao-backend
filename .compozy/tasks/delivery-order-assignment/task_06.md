---
status: completed
title: "DeliveryUsersController.create + factory: forward password, wire AuthGateway"
type: backend
complexity: medium
dependencies:
  - task_03
  - task_04
  - task_05
---

# Task 6: DeliveryUsersController.create + factory: forward password, wire AuthGateway

## Overview
Wires the completed credential-creation chain (tasks 2-5) through to the HTTP layer: the factory must now construct `CreateDeliveryUserUseCase` with both a `DeliveryUserRepository` and an `AuthGateway`, and the controller must pass the validated `password` through. This is the last task in the blocking-prerequisite chain — after this task, delivery persons can register with a working Supabase login.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include verification in deliverables
</critical>

<requirements>
- MUST update `devlivery-user-controller-factory.ts`'s `makeDeliveryUserController` to construct a `SupabaseAuthGateway` and pass it to `CreateDeliveryUserUseCase`, matching how `user-controller-factory.ts` wires `AuthGateway` into `CreateUserUseCase`.
- MUST NOT rename the factory file (`devlivery-user-controller-factory.ts`) or its exported function name as part of this task — the typo is pre-existing project debt, out of scope here per the `adicionar-recurso` skill's rule against renaming existing modules as a side effect of unrelated work.
- MUST leave `DeliveryUsersController.create` as a thin pass-through (`req.body` to `execute`), consistent with its current structure — no new validation logic belongs in the controller, only in the Zod schema (task_05).
</requirements>

## Subtasks
- [x] 6.1 Update `makeDeliveryUserController` to instantiate `SupabaseAuthGateway` and pass it into `CreateDeliveryUserUseCase` alongside `PrismaDeliveryUserRepository`.
- [x] 6.2 Confirm `DeliveryUsersController.create` requires no changes (it already forwards the full validated `req.body`, which now includes `password` per task_05).

## Implementation Details
See `src/main/factories/user-controller-factory.ts` for the exact wiring pattern to replicate (constructing `SupabaseAuthGateway` and injecting it alongside the repository).

### Relevant Files
- `src/main/factories/devlivery-user-controller-factory.ts` — file to modify; currently only constructs `PrismaDeliveryUserRepository`.
- `src/main/factories/user-controller-factory.ts` — structural model for wiring `AuthGateway` into a create-use-case factory.
- `src/infra/controllers/delivery-users-controller.ts` — read-only reference; confirm no change needed.
- `src/infra/gateways/supabase-auth-gateway.ts` — `SupabaseAuthGateway`, the concrete `AuthGateway` implementation to instantiate.

### Dependent Files
- `src/main/app.ts` — already calls `makeDeliveryUserController()`; no change needed, factory's external signature is unchanged.

## Deliverables
- Updated `src/main/factories/devlivery-user-controller-factory.ts` wiring `AuthGateway` into `CreateDeliveryUserUseCase`.
- Manual verification **(REQUIRED)**.

## Tests
- Manual verification:
  - [x] `npm run build` compiles with no errors after tasks 2-6 are all applied together (exit 0, confirmed above).
  - [ ] End-to-end HTTP/Supabase login round-trip not exercised — `.env`'s Supabase/DB credentials point at live shared infrastructure; deferred to the project owner to run manually against a real environment.
- Test coverage target: N/A — no automated test framework in this project.
- All manual verification scenarios passing.

## Success Criteria
- `POST /delivery/register` creates a `DeliveryPerson` with a real Supabase credential end-to-end.
- The blocking prerequisite from the TechSpec is resolved — this closes Build Order step 1.