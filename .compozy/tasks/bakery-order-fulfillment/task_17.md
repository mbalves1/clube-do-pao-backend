---
status: pending
title: "orders-routes.ts — rotas novas + swagger"
type: backend
complexity: medium
dependencies:
  - task_16
---

# Task 17: orders-routes.ts — rotas novas + swagger

## Overview
Registra as rotas do fluxo do lojista e ajusta as do entregador. Substitui `PATCH /orders/:orderId/:deliveryId` por `PATCH /orders/:id/delivery-status` (identidade do entregador vem do token, não da URL).

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include verification in deliverables
</critical>

<requirements>
- MUST atualizar `src/infra/http/routes/orders-routes.ts`:
  - `GET  /orders/bakery` → `authMiddleware` + `listBakeryOrders`.
  - `PATCH /orders/:id/status` → `authMiddleware` + `validateSchema(advanceOrderByBakerySchema)` + `advanceByBakery`.
  - `POST /orders/generate` → `authMiddleware` + `generate`.
  - `PATCH /orders/:id/delivery-status` → `authMiddleware` + `validateSchema(advanceOrderByCourierSchema)` + `advanceByCourier` (remove a rota `/orders/:orderId/:deliveryId`).
  - Mantém `GET /orders/available`, `POST /orders/:id/accept`, `POST /orders/:id/release`.
  - `GET /orders` (lista geral): manter, ou remover se não houver consumidor — decidir no PR e registrar.
- MUST ordenar as rotas estáticas (`/orders/bakery`, `/orders/available`, `/orders/generate`) antes das param (`/orders/:id/...`) para não colidir no matcher do Express.
- MUST escrever a anotação `@swagger` de cada rota nova no mesmo estilo das existentes (tags `Orders`, `security: bearerAuth`, respostas 200/403/404/409/500).
- MUST NOT deixar rota sem `authMiddleware`.
</requirements>

## Subtasks
- [ ] 17.1 Adicionar/rearranjar as rotas.
- [ ] 17.2 Remover `/orders/:orderId/:deliveryId` e ajustar imports de schema.
- [ ] 17.3 Escrever os blocos `@swagger`.

## Implementation Details
Ver TechSpec "http/routes/orders-routes.ts" (tabela de rotas). O arquivo atual já tem exemplos completos de `@swagger` para reaproveitar. Se `validateSchema` não cobrir `req.query`, `GET /orders/bakery` valida a query dentro do handler (task_16) e a rota não recebe `validateSchema`.

### Relevant Files
- `src/infra/http/routes/orders-routes.ts` — arquivo a atualizar.
- `src/infra/http/routes/item-routes.ts` — exemplo de `.route().get().post()` + swagger enxuto.
- `src/infra/http/validators/order-validator.ts` (task_15).

### Dependent Files
- `src/infra/http/routes.ts` — já agrega `makeOrdersRoutes`; sem mudança.
- `src/main/factories/order-controller-factory.ts` (task_18).

## Deliverables
- `orders-routes.ts` com as rotas do fluxo completo + swagger.
- Verificação manual **(OBRIGATÓRIO)**.

## Tests
- Verificação manual:
  - [ ] `GET /docs` renderiza as rotas novas sob a tag `Orders`.
  - [ ] `GET /orders/bakery` e `GET /orders/available` resolvem para os handlers certos (não caem em `/orders/:id`).
  - [ ] `PATCH /orders/:orderId/:deliveryId` retorna 404 (rota removida).
  - [ ] Toda rota exige `Authorization` (401 sem token).
- Sem framework de teste automatizado no projeto.

## Success Criteria
- Rotas do lojista e do entregador registradas, ordenadas corretamente, documentadas e todas autenticadas.
