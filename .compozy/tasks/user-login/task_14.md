---
status: completed
title: "auth-validator.ts (login + refresh schemas)"
type: backend
complexity: low
dependencies: []
---

# Task 14: auth-validator.ts (login + refresh schemas)

## Overview
Adds the Zod request schemas for the two new auth endpoints (login, refresh), following the same schema-definition style already used by `user-validator.ts` and the other resource validators.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include verification in deliverables
</critical>

<requirements>
- MUST create `src/infra/http/validators/auth-validator.ts` exporting a `loginSchema` (`{ email: string (email format), password: string }`) and a `refreshSchema` (`{ refreshToken: string }`), per TechSpec "API Endpoints".
- MUST follow the existing plain-`z.object` + manual-`.parse()`-in-controller pattern used by `user-validator.ts` (pattern 1 from the codebase, not the unused `validateSchema` middleware), so `AuthController` (task_15) can consume it the same way `UserController` consumes `createUserSchema`.
- MUST NOT impose a minimum password length on `loginSchema` beyond requiring a non-empty string — unlike registration, login must not reveal password-policy details through validation error messages (this schema only checks shape, not strength).
</requirements>

## Subtasks
- [x] 14.1 Create `src/infra/http/validators/auth-validator.ts`.
- [x] 14.2 Define `loginSchema`.
- [x] 14.3 Define `refreshSchema`.

## Implementation Details
See TechSpec "API Endpoints" for the exact request shapes for `POST /api/auth/login` and `POST /api/auth/refresh`.

### Relevant Files
- `src/infra/http/validators/user-validator.ts` — existing schema-style reference.
- `src/infra/http/validators/format-validation-error.ts` — existing helper for formatting `ZodError`s, to be reused by `AuthController`.

### Dependent Files
- `src/infra/controllers/auth-controller.ts` (task_15) — parses request bodies with these schemas.

## Deliverables
- `src/infra/http/validators/auth-validator.ts` exporting `loginSchema` and `refreshSchema`.

## Tests
- Manual verification (project has no automated test framework — see TechSpec "Testing Approach"):
  - [x] `loginSchema` rejects a payload missing `email` or `password`.
  - [x] `loginSchema` rejects a malformed email.
  - [x] `refreshSchema` rejects a payload missing `refreshToken`.
- Test coverage target: N/A — no automated test framework in this project.
- Verified via `npx tsc --noEmit` (clean) plus a throwaway `ts-node` script (deleted after use, not committed) running `.safeParse()` directly against both schemas — no server/DB/Supabase needed for this task. All 3 required scenarios passed, plus 2 extra checks: a short (1-char) password is accepted by `loginSchema` (confirms no strength check leaks policy info, per requirement), and both schemas accept a well-formed payload.

## Success Criteria
- Both schemas exist, compile, and validate the shapes described in TechSpec "API Endpoints". ✅ (verified via direct `safeParse` checks)
