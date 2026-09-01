---
status: pending
title: "OrdersController — handlers novos + rework dos existentes"
type: backend
complexity: medium
dependencies:
  - task_08
  - task_09
  - task_10
  - task_11
  - task_12
  - task_13
  - task_14
  - task_15
---

# Task 16: OrdersController — handlers novos + rework

## Overview
Liga os use cases ao HTTP. Adiciona `listBakeryOrders`, `advanceByBakery` e `generate`; converte `updateOrder` em `advanceByCourier` (sem `deliveryId` na URL); troca `sseService.emit` por `emitTo` filtrado nos handlers de release/advance.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include verification in deliverables
</critical>

<requirements>
- MUST atualizar `src/infra/controllers/orders-controller.ts`:
  - `listBakeryOrders(req, res)` — parseia query via `listBakeryOrdersQuerySchema`, chama `ListBakeryOrdersUseCase.execute(req.user.id, filter)`, 200 com a lista.
  - `advanceByBakery(req, res)` — `AdvanceOrderByBakeryUseCase.execute(req.user.id, Number(req.params.id), req.body.status)`, 200 com o pedido; emite `order-ready` (aqui ou no use case, conforme decisão da task_10) via `emitTo(role==='delivery')`.
  - `advanceByCourier(req, res)` — substitui `updateOrder`; `AdvanceOrderByCourierUseCase.execute(req.user.id, Number(req.params.id), req.body.status)`; emite `order-status-updated` via `emitTo` (padaria do pedido + entregador do pedido).
  - `generate(req, res)` — `GenerateOrdersFromSubscriptionsUseCase.execute()`, 200 com `{ created, skipped }`.
  - `acceptOrder` / `releaseOrder` / `listAvailable` — ajustar aos use cases reescritos; `releaseOrder` passa a usar `emitTo(role==='delivery', 'order-available', ...)`.
- MUST manter o padrão de erro atual (`instanceof AppError → error.statusCode`; senão 500 + `console.error`). Trocar o `catch` de `list`/`listAvailable` que hoje devolve 400/`formatBadRequest` por esse padrão.
- MUST tirar do construtor a dependência de `UpdateOrdersUseCase` e injetar os novos.
- MUST NOT ler `deliveryId` de `req.params` em nenhum handler.
</requirements>

## Subtasks
- [ ] 16.1 Atualizar o construtor e os campos de use case.
- [ ] 16.2 Implementar `listBakeryOrders`, `advanceByBakery`, `advanceByCourier`, `generate`.
- [ ] 16.3 Migrar os `emit` para `emitTo` com os filtros corretos.
- [ ] 16.4 Uniformizar o tratamento de erro.

## Implementation Details
Ver TechSpec "controllers/orders-controller.ts". Para `emitTo` de `order-status-updated`, o use case (task_14) deve retornar `bakeryId` e `deliveryPersonId` do pedido para montar o filtro.

### Relevant Files
- `src/infra/controllers/orders-controller.ts` — arquivo a atualizar.
- `src/infra/controllers/item-controller.ts` — `handleError` como padrão limpo de tratamento de erro.
- `src/infra/sse/sse-service.ts` (task_07) — `emitTo`.

### Dependent Files
- `src/infra/http/routes/orders-routes.ts` (task_17).
- `src/main/factories/order-controller-factory.ts` (task_18).

## Deliverables
- `orders-controller.ts` com os handlers novos e os existentes reworkados.
- Verificação manual **(OBRIGATÓRIO)**.

## Tests
- Verificação manual (com rotas da task_17 e factory da task_18):
  - [ ] `GET /orders/bakery` como `company` → 200 só com pedidos da padaria; como usuário sem `BakeryPerson` → 403.
  - [ ] `PATCH /orders/:id/status` `{status:'READY'}` → 200 e `order-ready` observado num SSE delivery.
  - [ ] `PATCH /orders/:id/delivery-status` `{status:'PICKED_UP'}` pelo dono → 200; por outro → 403.
  - [ ] `POST /orders/generate` → 200 `{created,skipped}`.
  - [ ] Erros de use case retornam o `statusCode` certo (403/404/409), nunca 400 genérico ou 500.
- Sem framework de teste automatizado no projeto.

## Success Criteria
- Todos os handlers do fluxo do lojista + entregador ligados aos use cases certos, com erros e SSE corretos.
