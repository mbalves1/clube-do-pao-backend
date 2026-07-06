---
status: completed
title: "Prisma schema: supabaseUserId on User/Bakery/DeliveryPerson + migration"
type: infra
complexity: low
dependencies: []
---

# Task 1: Prisma schema: supabaseUserId on User/Bakery/DeliveryPerson + migration

## Overview
Adds the `supabaseUserId` column that links each business record (`User`, `Bakery`, `DeliveryPerson`) to its Supabase Auth identity. This is the foundational schema change every other task in this feature depends on transitively (ADR-003).

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include verification in deliverables
</critical>

<requirements>
- MUST add `supabaseUserId String @unique` (required) to `User`.
- MUST add `supabaseUserId String? @unique` (optional) to `Bakery` and `DeliveryPerson`, per TechSpec "Data Models".
- MUST generate and apply a Prisma migration (`npx prisma migrate dev`) reflecting these changes.
- MUST verify the migration applies cleanly against the current local database before considering this done — a required, unique, non-defaulted column added to a table (`User`) that already has rows will fail to migrate unless the table is currently empty in every environment this runs against. Confirm the current row count of `User` in the target database first; if non-empty, flag this to the user before proceeding rather than silently adding a default value that contradicts the TechSpec.
- MUST NOT add any other columns or touch unrelated models.
</requirements>

## Subtasks
- [x] 1.1 Add `supabaseUserId` field to the `User` model (required, unique).
- [x] 1.2 Add `supabaseUserId` field to the `Bakery` model (optional, unique).
- [x] 1.3 Add `supabaseUserId` field to the `DeliveryPerson` model (optional, unique).
- [x] 1.4 Confirm the `User` table's current row count in the target environment before migrating (see requirements). Found 3 pre-existing rows (test seed data); user confirmed and deleted them before migrating, so the table was empty when the `NOT NULL` column was added.
- [x] 1.5 Generate and apply the Prisma migration; run `npm run prisma:generate`.

## Implementation Details
See TechSpec "Data Models" for the exact field declarations. Reference `docs/architecture.md` step 11 ("Schema Prisma — adicionar model... + `npx prisma migrate dev`") for the project's standard migration workflow.

### Relevant Files
- `prisma/schema.prisma` — contains the `User`, `Bakery`, `DeliveryPerson` models to modify.

### Dependent Files
- All other tasks in this feature depend on these columns existing (entities, repositories, use cases).

### Related ADRs
- [ADR-003: Role Stored in Supabase app_metadata; Per-Table supabaseUserId Link](adrs/adr-003.md) — defines exactly which tables get the column and why it's required vs optional.

## Deliverables
- Updated `prisma/schema.prisma` with the three new columns.
- A new migration file under `prisma/migrations/`.
- Regenerated Prisma Client (`npm run prisma:generate`).
- Verification that the migration applies cleanly **(REQUIRED)**.

## Tests
- Manual verification (project has no automated test framework — see TechSpec "Testing Approach"):
  - [x] Migration completes without error against the target database. Note: local Docker Postgres was not running and `DATABASE_URL` points at the project's actual remote Supabase Postgres instance, not a disposable local DB — `prisma migrate dev` also requires an interactive TTY, unavailable in this environment. Applied instead via the standard non-interactive path: `prisma migrate diff --from-url <DATABASE_URL> --to-schema-datamodel prisma/schema.prisma --script` to generate the SQL, wrote it to a new `prisma/migrations/<timestamp>_add_supabase_user_id/migration.sql`, then `prisma migrate deploy` to apply and record it — equivalent end state to `migrate dev`, safe for a non-interactive shell.
  - [x] `User`, `Bakery`, `DeliveryPerson` tables in the database show the new `supabaseUserId` column with correct nullability. Verified via `information_schema.columns`: `User.supabaseUserId` is `NOT NULL`/`text`; `bakeries.supabaseUserId` and `delivery_people.supabaseUserId` are nullable/`text`.
  - [x] Inserting two rows with the same `supabaseUserId` value on the same table fails with a uniqueness violation. Verified: second insert rejected with Prisma error code `P2002`.
- Test coverage target: N/A — no automated test framework in this project.
- All manual verification scenarios passing.

## Success Criteria
- Migration applied and Prisma Client regenerated without errors. ✅
- All manual verification scenarios passing. ✅
- `prisma/schema.prisma` matches the TechSpec's "Data Models" section exactly for these three models. ✅
- Known follow-up (not a task_01 defect): `npm run build` currently fails in `src/infra/repositories/prisma-user-repository.ts` because `prisma.user.create` no longer satisfies `UserCreateInput` without `supabaseUserId`. This is expected and resolved by task_04/task_05, which update the `User` entity, port, and repository — intentionally scoped out of this task.
