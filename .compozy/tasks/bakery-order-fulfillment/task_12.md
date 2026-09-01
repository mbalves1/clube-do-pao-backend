---
status: pending
title: "AcceptOrderUseCase reescrito — claim no Order"
type: backend
complexity: medium
dependencies:
  - task_03
  - task_06
---

# Task 12: AcceptOrderUseCase reescrito — claim no Order

## Overview
O entregador reivindica um pedido do pool. `claim` passa a operar sobre `Order` (`READY → ACCEPTED`, seta `deliveryPersonId`/`acceptedAt`) com o `updateMany` guardado. Corrida perdida continua sendo `ConflictError` (409), não 500.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include verification in deliverables
</critical>

<requirements>
- MUST reescrever `src/core/usecases/orders/accept-order.ts` para depender de `OrdersRepository` + `DeliveryUserRepository` + `UserRepository` (remover `SubscribeRepository`).
- MUST resolver `DeliveryPerson` do chamador: `userRepository.findBySupabaseUserId` → `deliveryUserRepository.findByUserId`; `NotFoundError('Entregador não encontrado')` se faltar.
- MUST carregar o `Order` via `findById`; `NotFoundError('Pedido não encontrado')` se não existir.
- MUST chamar `assertTransition(order.status, 'ACCEPTED', 'delivery')` antes do `claim` (rejeita pedido que não está `READY`).
- MUST chamar `ordersRepository.claim(orderId, courier.id)`; se retornar `false` → `ConflictError('Pedido já foi reivindicado')`.
- MUST NOT tocar em `subscription`.
</requirements>

## Subtasks
- [ ] 12.1 Trocar dependências e a resolução de identidade do entregador.
- [ ] 12.2 `assertTransition` + `claim` + tratamento de corrida.

## Implementation Details
Ver TechSpec "AcceptOrderUseCase" e ADR-004 de `delivery-order-assignment` (a guarda de concorrência é o `where` do `updateMany`, não a máquina de estados). A estrutura de resolução do entregador já existe no arquivo atual — só muda o repositório-alvo.

### Relevant Files
- `src/core/usecases/orders/accept-order.ts` — arquivo a reescrever (versão atual usa `subscribeRepository.claim`).
- `src/core/usecases/orders/order-status-machine.ts` (task_03).
- `src/core/ports/orders-repository.ts` (task_05) — `findById`, `claim`.
- `src/core/ports/delivery-user-repository.ts` — resolução do entregador.

### Dependent Files
- `src/infra/controllers/orders-controller.ts` (task_16) — `acceptOrder`.
- `src/main/factories/order-controller-factory.ts` (task_18).

## Deliverables
- `accept-order.ts` reescrito sobre `OrdersRepository`.
- Verificação manual **(OBRIGATÓRIO)**.

## Tests
- Verificação manual:
  - [ ] `POST /orders/:id/accept` num pedido `READY` → 200, `Order` vira `ACCEPTED` com `deliveryPersonId` e `acceptedAt`.
  - [ ] Dois entregadores aceitando o mesmo `Order READY` quase juntos → um 200, outro 409 "Pedido já foi reivindicado".
  - [ ] `accept` num pedido `PREPARING` → `ConflictError` (409) pela máquina de estados.
  - [ ] `accept` sem `DeliveryPerson` → 404.
- Cobertura alvo: corrida de claim exercitada.

## Success Criteria
- Claim atômico sobre `Order`; corrida perdida = 409; sem escrita em `subscription`.
