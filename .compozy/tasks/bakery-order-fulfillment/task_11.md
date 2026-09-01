---
status: pending
title: "ListAvailableOrdersUseCase reescrito — pool lê Order READY"
type: backend
complexity: medium
dependencies:
  - task_06
---

# Task 11: ListAvailableOrdersUseCase reescrito

## Overview
O pool do entregador passa a listar `Order` com `status = READY` e sem entregador, em vez de qualquer `subscription` na janela de data (ADR-004). É o gate que garante que o entregador só vê pedidos que a padaria marcou como prontos.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include verification in deliverables
</critical>

<requirements>
- MUST reescrever `src/core/usecases/orders/list-available-orders.ts` para depender de `OrdersRepository` (não mais `SubscribeRepository`).
- MUST manter a janela de data atual (hoje 00:00 UTC até +2 dias) e passá-la a `ordersRepository.findAvailableForPickup(from, to)`.
- MUST retornar dados suficientes para o entregador decidir: `id`, `bakeryId`, `serviceDate` e, se disponível via join no repо, a janela de entrega da assinatura (`deliveryStartAt`/`deliveryEndAt`). Se o join não for trivial nesta task, retornar a `Order` e registrar follow-up.
- MUST NOT retornar pedidos `PENDING`/`PREPARING`/`ACCEPTED`/etc. — só `READY` sem `deliveryPersonId`.
</requirements>

## Subtasks
- [ ] 11.1 Trocar a dependência do use case para `OrdersRepository`.
- [ ] 11.2 Ajustar `AvailableOrder` (mover o tipo para junto do port de orders ou reutilizar `Order`).
- [ ] 11.3 `npm run build`.

## Implementation Details
Ver TechSpec "ListAvailableOrdersUseCase" e ADR-004. O tipo `AvailableOrder` hoje vive em `subscribe-repository.ts`; movê-lo para `orders-repository.ts` (ou substituir por `Order`) e remover do port de subscribe se não houver outro consumidor.

### Relevant Files
- `src/core/usecases/orders/list-available-orders.ts` — arquivo a reescrever.
- `src/core/ports/subscribe-repository.ts` — origem do tipo `AvailableOrder` e do `findAvailable` antigo.
- `src/core/ports/orders-repository.ts` (task_05) — `findAvailableForPickup`.

### Dependent Files
- `src/infra/controllers/orders-controller.ts` (task_16) — `listAvailable`.
- `src/main/factories/order-controller-factory.ts` (task_18) — injeção passa a ser `PrismaOrdersRepository`.

## Deliverables
- `list-available-orders.ts` reescrito sobre `OrdersRepository`.
- Verificação manual **(OBRIGATÓRIO)**.

## Tests
- Verificação manual:
  - [ ] Pedido `PREPARING` → não aparece em `GET /orders/available`.
  - [ ] Após lojista marcar `READY` → aparece.
  - [ ] Após `accept` (vira `ACCEPTED`) → some do pool.
  - [ ] Pedido `READY` com `serviceDate` fora da janela (+3 dias) → não aparece.
- Sem framework de teste automatizado no projeto.

## Success Criteria
- Pool = `Order` `READY` sem entregador dentro da janela; nenhum outro status vaza.
