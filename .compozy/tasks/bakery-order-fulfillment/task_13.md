---
status: pending
title: "ReleaseOrderUseCase reescrito — release no Order"
type: backend
complexity: medium
dependencies:
  - task_03
  - task_06
  - task_07
---

# Task 13: ReleaseOrderUseCase reescrito — release no Order

## Overview
O entregador devolve ao pool um pedido que reivindicou mas não vai retirar (só antes do `PICKED_UP`). `release` passa a operar sobre `Order` (`ACCEPTED → READY`, limpa `deliveryPersonId`) e reemite o evento de disponibilidade para os entregadores.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include verification in deliverables
</critical>

<requirements>
- MUST reescrever `src/core/usecases/orders/release-order.ts` para depender de `OrdersRepository` (remover `SubscribeRepository`).
- MUST resolver `DeliveryPerson` do chamador (mesmo padrão da task_12).
- MUST carregar o `Order` via `findById`; `NotFoundError` se não existir.
- MUST validar posse: `order.deliveryPersonId === courier.id` → senão `ForbiddenError('Você não tem permissão para esta ação')`.
- MUST chamar `assertTransition(order.status, 'READY', 'delivery')` (só é legal a partir de `ACCEPTED`).
- MUST chamar `ordersRepository.release(orderId, courier.id)`; se `false` → `ConflictError('Pedido não está mais aceito')`.
- MUST retornar `{ id, bakeryId, serviceDate }` para o controller emitir `order-available` via `emitTo((m) => m.role === 'delivery', ...)`.
</requirements>

## Subtasks
- [ ] 13.1 Trocar dependências e resolução do entregador.
- [ ] 13.2 Posse + `assertTransition` + `release`.
- [ ] 13.3 Ajustar o payload de retorno para o SSE.

## Implementation Details
Ver TechSpec "ReleaseOrderUseCase". A versão atual já retorna `ReleasedOrder { id, bakeryId, serviceDate }` e o controller já faz `sseService.emit('order-available', released)` — trocar `emit` por `emitTo` filtrando `role === 'delivery'` (task_07). Estrutura de posse/transição já existe no arquivo; muda o alvo para `Order`.

### Relevant Files
- `src/core/usecases/orders/release-order.ts` — arquivo a reescrever.
- `src/infra/controllers/orders-controller.ts` — `releaseOrder` já emite `order-available` (linha ~84).
- `src/core/ports/orders-repository.ts` (task_05) — `findById`, `release`.

### Dependent Files
- `src/infra/controllers/orders-controller.ts` (task_16) — passa a usar `emitTo`.
- `src/main/factories/order-controller-factory.ts` (task_18).

## Deliverables
- `release-order.ts` reescrito sobre `OrdersRepository`.
- Verificação manual **(OBRIGATÓRIO)**.

## Tests
- Verificação manual:
  - [ ] Entregador dono libera pedido `ACCEPTED` → 200, `Order` volta a `READY` sem `deliveryPersonId`, reaparece em `GET /orders/available`, `order-available` chega nos clientes delivery.
  - [ ] Outro entregador tenta liberar → 403.
  - [ ] Liberar pedido já `PICKED_UP` → `ConflictError` (409).
- Sem framework de teste automatizado no projeto.

## Success Criteria
- Release restrito ao dono e a `ACCEPTED`; pedido reentra no pool; evento só para entregadores.
