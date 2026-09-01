---
status: pending
title: "order-validator.ts — schemas lojista / entregador / query do feed"
type: backend
complexity: low
dependencies:
  - task_02
---

# Task 15: order-validator.ts — schemas de request

## Overview
Adiciona os schemas Zod que o HTTP usa para validar o body/query dos novos endpoints antes de chegar ao controller. Hoje só existe `updateOrderSchema` (enum de status completo, sem distinção de ator).

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include verification in deliverables
</critical>

<requirements>
- MUST adicionar a `src/infra/http/validators/order-validator.ts`:
  - `advanceOrderByBakerySchema = z.object({ status: z.enum(['PREPARING','READY','CANCELED']) })`
  - `advanceOrderByCourierSchema = z.object({ status: z.enum(['PICKED_UP','DELIVERED']) })`
  - `listBakeryOrdersQuerySchema` — `status` opcional (aceitar CSV `?status=PENDING,PREPARING` → `string[]` de valores válidos do enum) e `date` opcional (`YYYY-MM-DD`, transformar em `Date`).
- MUST manter `updateOrderSchema` só se ainda houver consumidor após a task_17; caso contrário, removê-lo.
- SHOULD reaproveitar o mesmo estilo/mensagens dos validators existentes (`item-validator.ts`).
- MUST NOT validar `bakeryId`/`deliveryId` no body — identidade vem do token.
</requirements>

## Subtasks
- [ ] 15.1 Escrever os três schemas.
- [ ] 15.2 Definir os tipos `z.infer` correspondentes se o controller for consumi-los.
- [ ] 15.3 Conferir se `validateSchema` do projeto valida `req.query` ou só `req.body` — se só body, tratar a query no controller e deixar o schema como helper de `safeParse`.

## Implementation Details
Ver TechSpec "HTTP → validators/order-validator.ts". `validateSchema` (`src/middlewares/validate-schema.ts`) hoje é usado para body em todas as rotas — verificar seu comportamento com query antes de plugar `listBakeryOrdersQuerySchema` na rota.

### Relevant Files
- `src/infra/http/validators/order-validator.ts` — arquivo a estender.
- `src/infra/http/validators/item-validator.ts` — estilo de referência.
- `src/middlewares/validate-schema.ts` — o que o middleware valida.

### Dependent Files
- `src/infra/http/routes/orders-routes.ts` (task_17) — usa `advanceOrderByBakerySchema` / `advanceOrderByCourierSchema`.
- `src/infra/controllers/orders-controller.ts` (task_16) — pode usar `listBakeryOrdersQuerySchema.safeParse(req.query)`.

## Deliverables
- `order-validator.ts` com os três schemas.
- Verificação manual **(OBRIGATÓRIO)**.

## Tests
- Verificação manual (via `safeParse`):
  - [ ] `advanceOrderByBakerySchema` rejeita `{ status: 'PICKED_UP' }` e aceita `{ status: 'READY' }`.
  - [ ] `advanceOrderByCourierSchema` rejeita `{ status: 'READY' }` e aceita `{ status: 'DELIVERED' }`.
  - [ ] `listBakeryOrdersQuerySchema` parseia `?status=PENDING,PREPARING&date=2026-09-01` em `{ status: ['PENDING','PREPARING'], date: Date }`; rejeita `status` inválido e `date` malformada.
- Sem framework de teste automatizado no projeto.

## Success Criteria
- HTTP rejeita status fora do papel do ator antes do controller; query do feed tipada.
