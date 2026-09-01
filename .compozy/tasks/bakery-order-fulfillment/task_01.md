---
status: pending
title: "OrderStatus enum + Order/Bakery schema + migration"
type: backend
complexity: medium
dependencies: []
---

# Task 1: OrderStatus enum + Order/Bakery schema + migration

## Overview
Adiciona os estados `PREPARING` e `READY` ao enum `OrderStatus` e faz de `Order` uma entidade de pedido completa: `bakeryId` desnormalizado (ADR-002), timestamps por etapa, back-relation em `Bakery` e as constraints que garantem idempotência da geração e performance do feed.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include verification in deliverables
</critical>

<requirements>
- MUST adicionar `PREPARING` e `READY` ao enum `OrderStatus` na ordem do ciclo: `PENDING, PREPARING, READY, ACCEPTED, PICKED_UP, DELIVERED, CANCELED`.
- MUST adicionar em `model Order`: `bakeryId String`, `preparingAt DateTime?`, `readyAt DateTime?`, relation `bakery Bakery @relation(fields: [bakeryId], references: [id])`.
- MUST adicionar `@@unique([subscriptionId, serviceDate])` e `@@index([bakeryId, status])` em `Order`.
- MUST adicionar `orders Order[]` em `model Bakery`.
- MUST gerar a migration com `npx prisma migrate dev --name bakery_order_fulfillment` e rodar `npm run prisma:generate`.
- MUST tratar linhas legadas de `orders` (poucas, fluxo real usa `subscription`): backfill de `bakeryId` via `subscription.bakeryId` no SQL da migration OU limpeza combinada — não deixar a migration falhar por `NOT NULL`.
- MUST NOT alterar o enum/campos de `Subscription`.
</requirements>

## Subtasks
- [ ] 1.1 Editar `prisma/schema.prisma`: enum, `Order`, `Bakery`.
- [ ] 1.2 Criar migration e revisar o SQL gerado (constraint unique, índice, coluna NOT NULL + backfill).
- [ ] 1.3 `npm run prisma:generate` e `npm run build`.

## Implementation Details
Ver TechSpec seção "Mudanças de schema" para o bloco Prisma completo. `serviceDate` em `Order` já existe; só entram os campos novos. O índice `[bakeryId, status]` cobre tanto o feed do lojista (`findByBakeryId`) quanto o pool (`findAvailableForPickup` filtra por `status`).

### Relevant Files
- `prisma/schema.prisma` — `model Order` (linhas ~116-132), `model Bakery` (~29-52), `enum OrderStatus` (~154-160).
- `prisma/migrations/` — pasta destino da migration.

### Dependent Files
- `src/core/entities/orders.ts` (task_02) — união de tipos alinhada ao enum.
- `src/infra/repositories/prisma-orders-repository.ts` (task_06) — usa os campos novos.

## Deliverables
- `prisma/schema.prisma` atualizado + nova migration aplicada.
- Prisma Client regenerado (`@prisma/client` com `OrderStatus.PREPARING`/`READY`).
- Verificação manual **(OBRIGATÓRIO)**.

## Tests
- Verificação manual:
  - [ ] `npx prisma migrate status` → sem migrations pendentes.
  - [ ] `npx prisma studio` (ou psql): tabela `orders` tem `bakeryId`, `preparingAt`, `readyAt`; constraint unique `(subscriptionId, serviceDate)` existe.
  - [ ] Inserir dois `Order` com mesmo `(subscriptionId, serviceDate)` → o segundo falha por unique.
  - [ ] `npm run build` compila (Prisma Client tipando os novos enums).
- Sem framework de teste automatizado no projeto.

## Success Criteria
- Enum, colunas, unique e índice presentes no banco e no client gerado.
- `npm run build` sem novos erros de TypeScript.
