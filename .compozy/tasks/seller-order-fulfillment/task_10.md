---
status: pending
title: "Relocate resolveOwnerBakeryId to usecases/shared/"
type: backend
complexity: low
dependencies: []
---

# Task 10: Move `resolveOwnerBakeryId` to a shared location

## Overview
`resolveOwnerBakeryId` (User → `BakeryPerson` → `bakeryId`, with 404/403) currently lives in `src/core/usecases/item/resolve-owner-bakery-id.ts`. The seller order use cases (tasks 11, 12) need the same helper. Move it to `src/core/usecases/shared/` so neither feature imports across the other's folder.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include verification in deliverables
</critical>

<requirements>
- MUST create `src/core/usecases/shared/resolve-owner-bakery-id.ts` with the exact current implementation (signature, error messages, JSDoc unchanged).
- MUST update the imports in `src/core/usecases/item/list-items.ts`, `create-item.ts`, `update-item.ts`, `delete-item.ts` to the new path.
- MUST delete `src/core/usecases/item/resolve-owner-bakery-id.ts`.
- MUST NOT change the function's behavior, messages, or error types (`NotFoundError` 'Usuário não encontrado', `ForbiddenError` 'Usuário não está vinculado a uma padaria').
- MUST keep `npm run build` passing.
</requirements>

## Subtasks
- [ ] 10.1 Create the file under `usecases/shared/` (verbatim copy).
- [ ] 10.2 Repoint the 4 item use case imports.
- [ ] 10.3 Delete the old file; `npm run build`.
- [ ] 10.4 `grep` for any other importer of the old path.

## Implementation Details
Pure move + re-import. If `usecases/shared/` does not exist yet, create it. No barrel file — direct imports, consistent with the rest of the codebase.

### Relevant Files
- `src/core/usecases/item/resolve-owner-bakery-id.ts` — source (to move).
- `src/core/usecases/item/{list,create,update,delete}-item.ts` — importers to repoint.

### Dependent Files
- `src/core/usecases/orders/list-bakery-orders.ts` (task_11), `update-order-status-by-seller.ts` (task_12) — will import from the new path.

### Related ADRs
- none.

## Deliverables
- `src/core/usecases/shared/resolve-owner-bakery-id.ts`; old file deleted; item imports updated.
- Manual verification **(REQUIRED)**.

## Tests
- Manual verification:
  - [ ] `grep -rn "item/resolve-owner-bakery-id" src/` returns nothing.
  - [ ] `npm run build` compiles.
  - [ ] The item endpoints (`GET/POST /items`) still resolve the bakery correctly via `request.http` (spot check one).
- Coverage target: N/A.

## Success Criteria
- One shared helper, imported by both features from `usecases/shared/`.
- No behavior change to item management.
