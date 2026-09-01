---
status: pending
title: "AdvanceOrderByCourierUseCase — substitui UpdateOrdersUseCase"
type: backend
complexity: medium
dependencies:
  - task_03
  - task_06
  - task_07
---

# Task 14: AdvanceOrderByCourierUseCase — substitui UpdateOrdersUseCase

## Overview
Substitui o `UpdateOrdersUseCase` atual (que aceita qualquer status, faz write duplo em `Order` e `subscription`, e recebe `deliveryId` pela URL). O novo use case avança o pedido pelo entregador dono do claim: `ACCEPTED → PICKED_UP` (retirada na padaria) e `PICKED_UP → DELIVERED` (entrega ao cliente), sobre `Order` apenas.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include verification in deliverables
</critical>

<requirements>
- MUST criar `src/core/usecases/orders/advance-order-by-courier.ts` com `execute(callerSupabaseUserId: string, orderId: number, toStatus: 'PICKED_UP' | 'DELIVERED'): Promise<Order>`.
- MUST resolver `DeliveryPerson` do chamador (padrão das tasks 12/13). O `deliveryId` deixa de vir da URL — é sempre o do usuário autenticado.
- MUST carregar `Order` via `findById`; `NotFoundError` se não existir.
- MUST validar posse: `order.deliveryPersonId === courier.id` → senão `ForbiddenError('Você não tem permissão para esta ação')`.
- MUST `assertTransition(order.status, toStatus, 'delivery')` — rejeita `PICKED_UP` se não estiver `ACCEPTED`, `DELIVERED` se não estiver `PICKED_UP`.
- MUST `updateStatus` com `pickedUpAt`/`deliveredAt` (`new Date()`) conforme a etapa.
- MUST NOT escrever em `subscription`; MUST remover `UpdateOrdersUseCase` e seu uso do `ordersRepository.findBySubscriptionId`/`create(order, deliveryId)` legados.
- MUST devolver dados para o controller emitir `order-status-updated` para a padaria do pedido + o entregador do pedido (`emitTo` — task_07).
</requirements>

## Subtasks
- [ ] 14.1 Implementar o novo use case.
- [ ] 14.2 Remover `update-orders.ts` e limpar referências (controller, factory, port).
- [ ] 14.3 `npm run build`.

## Implementation Details
Ver TechSpec "AdvanceOrderByCourierUseCase" e ADR-003. A dupla escrita atual (`ordersRepository.update` + `subscribeRepository.updateOrder`) some. `constructor(ordersRepository, deliveryUserRepository, userRepository)`.

### Relevant Files
- `src/core/usecases/orders/update-orders.ts` — a ser removido/substituído.
- `src/core/usecases/orders/order-status-machine.ts` (task_03).
- `src/core/ports/orders-repository.ts` (task_05) — `findById`, `updateStatus`.

### Dependent Files
- `src/infra/controllers/orders-controller.ts` (task_16) — `updateOrder` vira `advanceByCourier`.
- `src/infra/http/routes/orders-routes.ts` (task_17) — `PATCH /orders/:id/delivery-status` substitui `PATCH /orders/:orderId/:deliveryId`.
- `src/main/factories/order-controller-factory.ts` (task_18).

## Deliverables
- Novo `advance-order-by-courier.ts`; `update-orders.ts` removido.
- Verificação manual **(OBRIGATÓRIO)**.

## Tests
- Verificação manual:
  - [ ] Entregador dono: `ACCEPTED → PICKED_UP` grava `pickedUpAt`; `PICKED_UP → DELIVERED` grava `deliveredAt`; `order-status-updated` chega ao lojista da padaria e ao entregador.
  - [ ] `ACCEPTED → DELIVERED` (pulo) → `ConflictError` (409).
  - [ ] Entregador que não é dono → `ForbiddenError` (403).
  - [ ] Após todo o fluxo, a `subscription` correspondente está intacta (status/deliveryPersonId inalterados).
- Sem framework de teste automatizado no projeto.

## Success Criteria
- Avanço do entregador restrito ao dono e às transições legais; zero escrita em `subscription`; `UpdateOrdersUseCase` eliminado.
