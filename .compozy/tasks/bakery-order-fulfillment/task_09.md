---
status: pending
title: "ListBakeryOrdersUseCase — feed de pedidos da padaria"
type: backend
complexity: medium
dependencies:
  - task_04
  - task_06
---

# Task 9: ListBakeryOrdersUseCase — feed de pedidos da padaria

## Overview
Use case que o lojista chama para ver os pedidos da sua própria padaria, com filtro por status e data. Resolve a `bakeryId` do chamador pelo helper compartilhado — um lojista nunca vê pedidos de outra padaria.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include verification in deliverables
</critical>

<requirements>
- MUST criar `src/core/usecases/orders/list-bakery-orders.ts` com `execute(callerSupabaseUserId: string, filter: { status?: OrderStatus[]; date?: Date }): Promise<Order[]>`.
- MUST resolver `bakeryId` via `resolveOwnerBakeryId` (`src/core/usecases/shared/`), propagando seus `NotFoundError`/`ForbiddenError`.
- MUST traduzir `filter.date` para janela do dia (`from`/`to` com `setUTCHours`) antes de chamar `ordersRepository.findByBakeryId`; sem `date`, default = hoje.
- MUST retornar os pedidos ordenados por `serviceDate` asc (ordem vem do repо).
- SHOULD deixar previsto (comentário) que enriquecer com dados da assinatura/cliente/itens é um passo futuro — nesta task retorna a entidade `Order`.
- MUST NOT aceitar `bakeryId` do request — sempre derivado do usuário autenticado.
</requirements>

## Subtasks
- [ ] 9.1 Implementar o use case chamando `resolveOwnerBakeryId` + `findByBakeryId`.
- [ ] 9.2 Normalização de `date` → janela do dia.

## Implementation Details
Ver TechSpec "ListBakeryOrdersUseCase". Mesmo padrão dos use cases de Item (`list-items.ts`), trocando o repositório. `constructor(ordersRepository, userRepository, bakeryPersonRepository)`.

### Relevant Files
- `src/core/usecases/item/list-items.ts` — padrão estrutural a espelhar.
- `src/core/usecases/shared/resolve-owner-bakery-id.ts` (task_04).
- `src/core/ports/orders-repository.ts` (task_05) — `findByBakeryId`.

### Dependent Files
- `src/infra/controllers/orders-controller.ts` (task_16) — handler `listBakeryOrders`.
- `src/main/factories/order-controller-factory.ts` (task_18).

## Deliverables
- Novo use case `list-bakery-orders.ts`.
- Verificação manual **(OBRIGATÓRIO)**.

## Tests
- Verificação manual (após HTTP ligado):
  - [ ] Lojista da padaria A recebe só `Order` com `bakeryId === A`.
  - [ ] `filter.status = ['PENDING','PREPARING']` retorna só esses; sem filtro retorna todos do dia.
  - [ ] `filter.date` de ontem retorna pedidos de ontem; sem `date` retorna os de hoje.
  - [ ] Usuário sem `BakeryPerson` → `ForbiddenError` (403).
- Sem framework de teste automatizado no projeto.

## Success Criteria
- Feed sempre escopado à padaria do usuário autenticado, com filtros de status e data.
