---
status: pending
title: "AdvanceOrderByBakeryUseCase — PENDING→PREPARING→READY / CANCELED"
type: backend
complexity: medium
dependencies:
  - task_03
  - task_04
  - task_06
  - task_07
---

# Task 10: AdvanceOrderByBakeryUseCase

## Overview
Use case central do lojista: aceitar o pedido (`PENDING → PREPARING`), marcar pronto (`PREPARING → READY`) ou cancelar (`PENDING|PREPARING|READY → CANCELED`). Valida posse da padaria e a transição pela máquina de estados. Ao entrar em `READY`, emite SSE para os entregadores.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include verification in deliverables
</critical>

<requirements>
- MUST criar `src/core/usecases/orders/advance-order-by-bakery.ts` com `execute(callerSupabaseUserId: string, orderId: number, toStatus: 'PREPARING' | 'READY' | 'CANCELED'): Promise<Order>`.
- MUST resolver `bakeryId` via `resolveOwnerBakeryId`; carregar o `Order` via `findById`; `NotFoundError` se não existir.
- MUST validar `order.bakeryId === bakeryId` → senão `ForbiddenError('Você não tem permissão para este pedido')`.
- MUST chamar `assertTransition(order.status, toStatus, 'company')` (task_03) antes de persistir.
- MUST persistir via `updateStatus` com o timestamp da etapa: `PREPARING`→`preparingAt`, `READY`→`readyAt`, `CANCELED`→`canceledAt` (todos `new Date()`).
- MUST emitir `sseService.emitTo((m) => m.role === 'delivery', 'order-ready', { orderId, bakeryId, serviceDate })` **somente** quando `toStatus === 'READY'`.
- MUST NOT permitir `CANCELED` se o pedido já estiver `ACCEPTED`/`PICKED_UP`/`DELIVERED` (garantido pela máquina de estados — não reimplementar).
</requirements>

## Subtasks
- [ ] 10.1 Implementar resolução de padaria + carga do pedido + checagem de posse.
- [ ] 10.2 `assertTransition` + `updateStatus` com o timestamp correto.
- [ ] 10.3 Emissão SSE condicional a `READY`.

## Implementation Details
Ver TechSpec "AdvanceOrderByBakeryUseCase" e ADR-004 (só a ação `READY` abre o pedido para o pool). `constructor(ordersRepository, userRepository, bakeryPersonRepository)` — `sseService` é importado direto como singleton, como já é feito em `orders-controller.ts`; se preferir manter o use case puro, emitir no controller (task_16) e deixar só a decisão de status aqui. Decidir e registrar a escolha no PR.

### Relevant Files
- `src/core/usecases/orders/order-status-machine.ts` (task_03).
- `src/core/usecases/shared/resolve-owner-bakery-id.ts` (task_04).
- `src/core/ports/orders-repository.ts` (task_05) — `findById`, `updateStatus`.
- `src/infra/sse/sse-service.ts` (task_07) — `emitTo`.
- `src/core/usecases/item/update-item.ts` — padrão de checagem de posse (`item.bakeryId !== bakeryId`).

### Dependent Files
- `src/infra/controllers/orders-controller.ts` (task_16) — handler `advanceByBakery`.
- `src/infra/http/routes/orders-routes.ts` (task_17) — `PATCH /orders/:id/status`.

## Deliverables
- Novo use case `advance-order-by-bakery.ts`.
- Verificação manual **(OBRIGATÓRIO)**.

## Tests
- Verificação manual:
  - [ ] `PENDING → PREPARING` grava `preparingAt`; `PREPARING → READY` grava `readyAt` e dispara `order-ready` (visível num `curl -N` autenticado como delivery).
  - [ ] `PENDING → READY` (pulo) → `ConflictError` (409).
  - [ ] Pedido de outra padaria → `ForbiddenError` (403); `order-ready` NÃO é emitido.
  - [ ] `ACCEPTED → CANCELED` → `ConflictError`.
- Sem framework de teste automatizado no projeto.

## Success Criteria
- Transições do lojista validadas e persistidas com timestamp; `order-ready` só em `READY`; cross-bakery bloqueado.
