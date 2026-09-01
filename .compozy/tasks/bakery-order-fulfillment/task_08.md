---
status: pending
title: "GenerateOrdersFromSubscriptionsUseCase"
type: backend
complexity: medium
dependencies:
  - task_05
  - task_06
---

# Task 8: GenerateOrdersFromSubscriptionsUseCase

## Overview
Cria os `Order` `PENDING` que o lojista vai ver. Para uma data alvo, varre as assinaturas devidas nesse dia e cria um `Order` por assinatura que ainda não tem pedido na data. Idempotente — rodar duas vezes não duplica.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include verification in deliverables
</critical>

<requirements>
- MUST criar `src/core/usecases/orders/generate-orders-from-subscriptions.ts` com `execute(targetDate?: Date): Promise<{ created: number; skipped: number }>` (default: hoje, normalizado com `setUTCHours(0,0,0,0)` como o resto do código).
- MUST selecionar assinaturas devidas na data: `status` ativo e (`frequency === 'daily'`) OU (`daysWeek` contém o dia da semana da data). Reusar/estender `SubscribeRepository` para essa consulta (ex.: `findDueOn(date)`), sem escrever nada em `subscription`.
- MUST pular assinatura cujo `existsForSubscriptionOnDate(subscription.id, serviceDate)` seja `true`.
- MUST criar `Order` com `{ subscriptionId, bakeryId: subscription.bakeryId, serviceDate, status: 'PENDING' }`.
- MUST tolerar corrida com a `@@unique([subscriptionId, serviceDate])`: se o `create` violar unique, contar como `skipped`, não propagar erro.
- MUST NOT disparar SSE aqui (o evento `order-created` para o lojista pode ser emitido pelo controller na task_16, opcional).
</requirements>

## Subtasks
- [ ] 8.1 Adicionar consulta de assinaturas devidas ao `SubscribeRepository` + impl Prisma.
- [ ] 8.2 Implementar o use case com o loop idempotente e o catch de unique.
- [ ] 8.3 Retornar `{ created, skipped }`.

## Implementation Details
Ver TechSpec "GenerateOrdersFromSubscriptionsUseCase" e ADR-004 (sem pedidos gerados, o pool fica vazio — este use case é pré-requisito do fluxo). O agendamento (cron/Vercel) que chama isso é operacional e está fora de escopo; a task entrega o use case + endpoint idempotente (endpoint na task_17).

### Relevant Files
- `src/core/ports/subscribe-repository.ts` / `src/infra/repositories/prisma-subscribe-repository.ts` — consulta de assinaturas devidas.
- `src/core/ports/orders-repository.ts` (task_05) — `existsForSubscriptionOnDate`, `create`.
- `src/core/usecases/orders/list-available-orders.ts` — referência de normalização de data (`setUTCHours`).

### Dependent Files
- `src/infra/controllers/orders-controller.ts` (task_16) — handler `generate`.
- `src/infra/http/routes/orders-routes.ts` (task_17) — `POST /orders/generate`.

## Deliverables
- Novo use case + método de consulta em `SubscribeRepository`.
- Verificação manual **(OBRIGATÓRIO)**.

## Tests
- Verificação manual:
  - [ ] Com 1 assinatura `daily` e nenhum `Order` no dia → `execute()` retorna `{ created: 1, skipped: 0 }` e cria `Order` `PENDING`.
  - [ ] Segunda chamada no mesmo dia → `{ created: 0, skipped: 1 }`, sem novo `Order`.
  - [ ] Assinatura `weekly` cujo `daysWeek` não inclui o dia → não gera.
  - [ ] `Order.bakeryId` == `subscription.bakeryId`.
- Sem framework de teste automatizado no projeto.

## Success Criteria
- Geração idempotente por `(subscriptionId, serviceDate)`; nenhum write em `subscription`.
