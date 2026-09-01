---
status: pending
title: "PrismaOrdersRepository — implementar o port novo"
type: backend
complexity: medium
dependencies:
  - task_01
  - task_05
---

# Task 6: PrismaOrdersRepository — implementar o port novo

## Overview
Reimplementa `PrismaOrdersRepository` contra o contrato da task_05, usando os campos de schema da task_01. `claim`/`release` usam `updateMany` condicional (mesma técnica à prova de corrida de `PrismaSubscribeRepository`).

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include verification in deliverables
</critical>

<requirements>
- MUST implementar todos os métodos do port novo em `src/infra/repositories/prisma-orders-repository.ts`.
- MUST `create` gravar `subscriptionId`, `bakeryId`, `serviceDate`, `status` (default `PENDING`) — sem `deliveryPersonId`, sem `acceptedAt`.
- MUST `existsForSubscriptionOnDate` usar `count`/`findFirst` por `(subscriptionId, serviceDate)`.
- MUST `findByBakeryId` aplicar `where: { bakeryId, status: { in }, serviceDate: { gte: from, lte: to } }` (campos opcionais), `orderBy: { serviceDate: 'asc' }`.
- MUST `findAvailableForPickup` filtrar `status: 'READY', deliveryPersonId: null, serviceDate: { gte: from, lte: to }`.
- MUST `claim` = `prisma.order.updateMany({ where: { id, status: 'READY', deliveryPersonId: null }, data: { deliveryPersonId, status: 'ACCEPTED', acceptedAt: new Date() } })` → `count === 1`.
- MUST `release` = `updateMany({ where: { id, deliveryPersonId, status: 'ACCEPTED' }, data: { deliveryPersonId: null, status: 'READY', acceptedAt: null } })` → `count === 1`.
- MUST `updateStatus` aplicar `status` + só os timestamps recebidos em `stamps` (não zerar os demais).
- MUST estender o `mapOrder` local para incluir `bakeryId`, `preparingAt`, `readyAt`.
- MUST NOT escrever em `subscription` em nenhum método.
</requirements>

## Subtasks
- [ ] 6.1 Reescrever a classe conforme o port.
- [ ] 6.2 Atualizar `mapOrder`.
- [ ] 6.3 `npm run build`.

## Implementation Details
Ver TechSpec "repositories/prisma-orders-repository.ts" e ADR-003 (a máquina de estados valida a legalidade; o `where` do `updateMany` garante a exclusão mútua). O `create` atual seta `acceptedAt: new Date()` incondicionalmente — remover isso.

### Relevant Files
- `src/infra/repositories/prisma-orders-repository.ts` — arquivo a reescrever.
- `src/infra/repositories/prisma-subscribe-repository.ts` — `claim`/`release` como modelo do `updateMany` guardado (linhas ~141-157).
- `src/infra/database/prisma-client.ts` — singleton `prisma`.

### Dependent Files
- `src/core/usecases/orders/*` (task_08, task_11–14) — consomem esta implementação via factory.

## Deliverables
- `src/infra/repositories/prisma-orders-repository.ts` reescrito.
- Verificação manual **(OBRIGATÓRIO)**.

## Tests
- Verificação manual (via `ts-node` script ou endpoints já ligados nas tasks de HTTP):
  - [ ] `create` gera `Order` `PENDING` com `bakeryId` e sem `deliveryPersonId`.
  - [ ] `existsForSubscriptionOnDate` retorna `true` após `create` e `false` para outra data.
  - [ ] `claim` no mesmo `Order READY` chamado duas vezes em paralelo → um retorna `true`, outro `false` (rodar 2 `updateMany` concorrentes).
  - [ ] `release` por quem não é o dono → `false`; pelo dono com status `ACCEPTED` → `true` e volta a `READY`.
  - [ ] `updateStatus(id,'PREPARING',{preparingAt})` não apaga `readyAt`/outros.
  - [ ] `npm run build` compila.
- Cobertura alvo: corrida de `claim` e ownership de `release` exercitadas.

## Success Criteria
- Todos os métodos do port implementados; `claim`/`release` à prova de corrida; nenhum write em `subscription`.
