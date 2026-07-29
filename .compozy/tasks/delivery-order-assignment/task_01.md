---
status: completed
title: "ForbiddenError error class"
type: backend
complexity: low
dependencies: []
---

# Task 1: ForbiddenError error class

## Overview
Adds a `ForbiddenError` (HTTP 403) to `src/core/errors/`, following the exact pattern of the existing `ConflictError`/`NotFoundError` classes. This feature needs a 403 response for "you don't own this order" cases (release, status update), and no error class in this status range exists yet.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include verification in deliverables
</critical>

<requirements>
- MUST create `src/core/errors/ForbiddenError.ts` extending `AppError`, with status code `403` and a default Portuguese message consistent with the tone of existing error messages (e.g., `ConflictError`'s `'Conflito de dados'`, `NotFoundError`'s `'Recurso não encontrado'`).
- MUST NOT modify any other error class or the generic `AppError` base.
</requirements>

## Subtasks
- [x] 1.1 Create `src/core/errors/ForbiddenError.ts` with a 403 status code and default message.
- [x] 1.2 Confirm it extends `AppError` and is constructed the same way as `ConflictError`/`NotFoundError` (message-optional constructor).

## Implementation Details
Mirror `src/core/errors/ConflictError.ts` and `src/core/errors/NotFoundError.ts` exactly — same structure, just a different status code and default message (e.g., `'Acesso não permitido'` or `'Você não tem permissão para esta ação'`). No index/barrel file exists for errors; each error is imported directly from its file by consumers (see `update-orders.ts` importing `ConflictError` directly).

### Relevant Files
- `src/core/errors/ConflictError.ts` — structural model for the new file (409, one constructor arg with default).
- `src/core/errors/NotFoundError.ts` — second reference example of the same pattern.
- `src/core/errors/AppError.ts` — base class being extended.

### Dependent Files
- `src/core/usecases/orders/release-order.ts` (task_11) — will throw `ForbiddenError` when the caller doesn't own the claimed order.
- `src/core/usecases/orders/update-orders.ts` (task_12) — will throw `ForbiddenError` when `deliveryId` doesn't match the authenticated courier.

## Deliverables
- New file `src/core/errors/ForbiddenError.ts`.
- Manual verification (no automated test framework in this project — see TechSpec "Testing Approach") **(REQUIRED)**.

## Tests
- Manual verification:
  - [x] Constructing `new ForbiddenError()` produces `statusCode === 403` and the default message.
  - [x] Constructing `new ForbiddenError('custom message')` overrides the message while keeping `statusCode === 403`.
- Test coverage target: N/A — no automated test framework in this project.
- All manual verification scenarios passing.

## Success Criteria
- `ForbiddenError` exists, extends `AppError`, and returns status 403.
- `npm run build` compiles with no new TypeScript errors.