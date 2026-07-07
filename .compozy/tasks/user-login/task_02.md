---
status: completed
title: "AuthGateway port"
type: backend
complexity: low
dependencies: []
---

# Task 2: AuthGateway port

## Overview
Defines the `AuthGateway` interface that all authentication use cases will depend on, following the existing `core/ports` pattern (e.g. `UserRepository`). This decouples business logic from the Supabase SDK per Clean Architecture rules (core never imports from infra).

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include verification in deliverables
</critical>

<requirements>
- MUST define the `Role` type (`'customer' | 'bakery_owner' | 'courier'`) and `AuthSession` type exactly as specified in TechSpec "Core Interfaces".
- MUST define the `AuthGateway` interface with `signInWithPassword`, `refreshSession`, and `createCredential` methods, matching the TechSpec signatures.
- MUST NOT import anything from `src/infra/` — this file lives in `src/core/ports/` and must have zero framework/SDK dependencies, consistent with `src/core/ports/user-repository.ts`.
- MUST NOT include any implementation logic — interface/types only.
</requirements>

## Subtasks
- [x] 2.1 Create `src/core/ports/auth-gateway.ts`.
- [x] 2.2 Define `Role` and `AuthSession` types.
- [x] 2.3 Define the `AuthGateway` interface with its three methods.

## Implementation Details
See TechSpec "Core Interfaces" for the exact type/interface shape to implement. Follow the file/naming style of `src/core/ports/user-repository.ts` (plain TypeScript `type`/`interface`, no decorators, no framework imports).

### Relevant Files
- `src/core/ports/user-repository.ts` — existing port to mirror in style and structure.

### Dependent Files
- `src/infra/gateways/supabase-auth-gateway.ts` (task_03) — implements this interface.
- `src/core/usecases/user/create-user.ts` (task_09), `src/core/usecases/auth/login.ts` (task_12), `src/core/usecases/auth/refresh-session.ts` (task_13) — depend on this interface via constructor injection.

### Related ADRs
- [ADR-001: Use Supabase Auth as the Identity Provider](adrs/adr-001.md) — the reason this abstraction exists instead of a project-owned credentials system.

## Deliverables
- `src/core/ports/auth-gateway.ts` with `Role`, `AuthSession`, and `AuthGateway` exported.
- Type-checks successfully (`tsc --noEmit` or equivalent build step) **(REQUIRED)**.

## Tests
- Manual verification (project has no automated test framework — see TechSpec "Testing Approach"):
  - [x] File compiles with no TypeScript errors.
  - [x] `Role`, `AuthSession`, and `AuthGateway` are all exported and match the TechSpec signatures exactly.
- Test coverage target: N/A — no automated test framework in this project.
- All manual verification scenarios must pass. Verified via `npx tsc --noEmit`: zero errors in `auth-gateway.ts`; the one remaining project-wide error is the pre-existing, documented follow-up in `prisma-user-repository.ts` (see task_01), unrelated to this file.

## Success Criteria
- `AuthGateway` interface and its supporting types exist and compile.
- No `infra/` imports in this file.
- Signatures match TechSpec "Core Interfaces" exactly, so task_03/09/12/13 can implement/consume it without modification.
