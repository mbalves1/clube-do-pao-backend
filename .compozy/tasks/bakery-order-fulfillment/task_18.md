---
status: pending
title: "order-controller-factory.ts + registro em routes.ts / app.ts"
type: backend
complexity: low
dependencies:
  - task_16
  - task_17
---

# Task 18: Wiring — factory + registro

## Overview
Instancia os repositórios e use cases novos e injeta no `OrdersController`. É o único lugar onde `PrismaOrdersRepository`, use cases e controller se encontram (padrão do projeto).

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include verification in deliverables
</critical>

<requirements>
- MUST atualizar `src/main/factories/order-controller-factory.ts`:
  - Instanciar `PrismaOrdersRepository`, `PrismaUserRepository`, `PrismaBakeryPersonRepository`, `PrismaDeliveryUserRepository`, `PrismaSubscribeRepository` (este só onde a geração lê assinaturas devidas).
  - Instanciar `GenerateOrdersFromSubscriptionsUseCase`, `ListBakeryOrdersUseCase`, `AdvanceOrderByBakeryUseCase`, `ListAvailableOrdersUseCase` (reworkado), `AcceptOrderUseCase` (reworkado), `ReleaseOrderUseCase` (reworkado), `AdvanceOrderByCourierUseCase`.
  - Remover `UpdateOrdersUseCase` e `PrismaOrdersRepository` sendo passado só pro write duplo antigo.
  - Passar todos ao construtor novo de `OrdersController` (task_16).
- MUST confirmar que `src/infra/http/routes.ts` e `src/main/app.ts` já cobrem `ordersController` (cobrem hoje) — nenhuma mudança esperada além de verificar.
- MUST `npm run build` limpo.
</requirements>

## Subtasks
- [ ] 18.1 Reescrever a factory com o novo grafo de dependências.
- [ ] 18.2 Verificar `routes.ts` / `app.ts`.
- [ ] 18.3 `npm run build`.

## Implementation Details
Ver TechSpec "main/factories/order-controller-factory.ts". A factory atual (`src/main/factories/order-controller-factory.ts`) é o ponto de partida — trocar `subscribeRepository` por `ordersRepository` na maioria dos use cases.

### Relevant Files
- `src/main/factories/order-controller-factory.ts` — arquivo a reescrever.
- `src/main/factories/item-controller-factory.ts` — exemplo de factory com repositório + vários use cases.
- `src/infra/http/routes.ts`, `src/main/app.ts` — pontos de registro (só verificação).

### Dependent Files
- Nenhum — esta task fecha o wiring.

## Deliverables
- `order-controller-factory.ts` atualizada; app sobe com o fluxo completo.
- Verificação manual **(OBRIGATÓRIO)**.

## Tests
- Verificação manual:
  - [ ] `npm run dev` sobe sem erro de injeção.
  - [ ] Smoke de cada rota nova (`/orders/bakery`, `/orders/:id/status`, `/orders/generate`, `/orders/:id/delivery-status`) retornando status coerente (não 500 por dependência faltando).
  - [ ] `npm run build` limpo.
- Sem framework de teste automatizado no projeto.

## Success Criteria
- `OrdersController` recebe todos os use cases do fluxo; app sobe; build limpo.
