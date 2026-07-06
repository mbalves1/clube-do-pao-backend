---
status: pending
title: "user-validator.ts: require password in createUserSchema"
type: backend
complexity: low
dependencies:
  - task_09
---

# Task 10: user-validator.ts: require password in createUserSchema

## Overview
Updates the registration request schema to require a `password` field, matching the new `CreateUserUseCase` contract from task_09, so invalid/missing passwords are rejected at the HTTP boundary with a clear validation error.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include verification in deliverables
</critical>

<requirements>
- MUST add a required `password` field to `createUserSchema` in `src/infra/http/validators/user-validator.ts` using Zod, following the file's existing style.
- MUST choose a minimum length for the password. The PRD ("Open Questions") explicitly leaves password requirements undefined — use a reasonable default (e.g. `min(8)`) and note in the PR/commit description that this is a placeholder pending an explicit product decision, not a final requirement.
- MUST NOT change `updateUserSchema` — password is not part of the update flow per the TechSpec's scoped API surface.
</requirements>

## Subtasks
- [ ] 10.1 Add `password: z.string().min(8)` (or equivalent) to `createUserSchema`.
- [ ] 10.2 Leave `updateUserSchema` unchanged.

## Implementation Details
See TechSpec "API Endpoints" — `POST /api/users` now requires `{ name, email, password }`. See PRD "Open Questions" for the unresolved password-policy question this task's minimum-length choice is a placeholder for.

### Relevant Files
- `src/infra/http/validators/user-validator.ts` — file to modify.

### Dependent Files
- `src/infra/controllers/user-controller.ts` (task_11) — parses the request body with this schema before calling `CreateUserUseCase`.

## Deliverables
- Updated `src/infra/http/validators/user-validator.ts` with `password` required in `createUserSchema`.

## Tests
- Manual verification (project has no automated test framework — see TechSpec "Testing Approach"):
  - [ ] `POST /api/users` without a `password` field returns a 400 validation error.
  - [ ] `POST /api/users` with a `password` shorter than the chosen minimum returns a 400 validation error.
  - [ ] `POST /api/users` with a valid `password` passes schema validation.
- Test coverage target: N/A — no automated test framework in this project.
- All manual verification scenarios must pass.

## Success Criteria
- `createUserSchema` rejects registration requests without a valid password, matching the TechSpec's `POST /api/users` contract.
