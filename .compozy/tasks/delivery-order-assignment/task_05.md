---
status: completed
title: "delivery-user-validator.ts: require password in createDeliverySchema"
type: backend
complexity: low
dependencies:
  - task_04
---

# Task 5: delivery-user-validator.ts: require password in createDeliverySchema

## Overview
Adds `password` as a required field to `createDeliverySchema`, so the HTTP layer rejects registration requests missing a password before they ever reach `CreateDeliveryUserUseCase` (task_04), which now requires one to create the Supabase credential.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include verification in deliverables
</critical>

<requirements>
- MUST add `password: z.string().min(8, ...)` to `createDeliverySchema`, matching the minimum-length placeholder and message style already used in `user-validator.ts`'s `createUserSchema` (see its comment about this being a placeholder pending a real password policy).
- MUST NOT change `updateDeliverySchema` — password is not part of updates.
- SHOULD keep the same comment noting the minimum length is a placeholder, for consistency with `user-validator.ts`.
</requirements>

## Subtasks
- [x] 5.1 Add required `password` field to `createDeliverySchema`.
- [x] 5.2 Verify `CreateDeliveryDTO` (`z.infer<typeof createDeliverySchema>`) now includes `password`.

## Implementation Details
Copy the exact `password` field definition and its explanatory comment from `src/infra/http/validators/user-validator.ts`'s `createUserSchema` for consistency across the two registration validators.

### Relevant Files
- `src/infra/http/validators/delivery-user-validator.ts` — file to modify.
- `src/infra/http/validators/user-validator.ts` — source of the exact field/comment pattern to replicate.

### Dependent Files
- `src/infra/controllers/delivery-users-controller.ts` (task_06) — should validate against this schema before calling the use case (see task_06 for whether validation is wired at the route or controller level, matching the existing route pattern).
- `src/infra/http/routes/delivery-user-routes.ts` — already calls `validateSchema(createDeliverySchema)`; no route change needed, this task only changes the schema it uses.

## Deliverables
- Updated `src/infra/http/validators/delivery-user-validator.ts` with `password` required in `createDeliverySchema`.
- Manual verification **(REQUIRED)**.

## Tests
- Manual verification (via direct schema `safeParse`, equivalent to what `validateSchema` middleware runs against the request body — HTTP-level exercise deferred to task_06, where the controller path is fully wired):
  - [x] `createDeliverySchema.safeParse({...without password})` → `success: false`, issue on `path: ["password"]`, "Invalid input: expected string, received undefined".
  - [x] `createDeliverySchema.safeParse({...password: "123"})` → `success: false`, issue "Senha deve ter no mínimo 8 caracteres".
  - [x] `createDeliverySchema.safeParse({...password: "12345678"})` → `success: true`.
- Test coverage target: N/A — no automated test framework in this project.
- All manual verification scenarios passing.

## Success Criteria
- `createDeliverySchema` requires `password` with the same minimum-length rule as `createUserSchema`.
- `updateDeliverySchema` is unchanged.