---
status: pending
title: "orders.ts entity + tipos de domínio alinhados ao enum"
type: backend
complexity: low
dependencies: []
---

# Task 2: orders.ts entity + tipos de domínio alinhados ao enum

## Overview
Alinha a entidade de domínio `Order` ao novo enum: união `OrderStatus` correta (hoje contém um `'ACTIVE'` que não existe no enum Prisma) e os campos `bakeryId`, `preparingAt`, `readyAt`.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include verification in deliverables
</critical>

<requirements>
- MUST atualizar a união `OrderStatus` em `src/core/entities/orders.ts` para exatamente: `'PENDING' | 'PREPARING' | 'READY' | 'ACCEPTED' | 'PICKED_UP' | 'DELIVERED' | 'CANCELED'`.
- MUST remover o membro `'ACTIVE'`.
- MUST adicionar ao tipo `Order`: `bakeryId: string`, `preparingAt?: Date | null`, `readyAt?: Date | null`.
- MUST manter `status?: OrderStatus | null` como está (o repо/mapper já lida com null).
- SHOULD remover o alias redundante `export type Orders = Order` se não houver consumidor — verificar com grep antes.
</requirements>

## Subtasks
- [ ] 2.1 Ajustar união `OrderStatus` e o tipo `Order`.
- [ ] 2.2 `grep -rn "'ACTIVE'" src/` e `grep -rn "entities/orders" src/` — corrigir quem quebrar.

## Implementation Details
Ver TechSpec seção "Domínio → entities/orders.ts". Consumidores atuais da união: `subscribe-repository.ts` (port), `order-validator.ts`, use cases de orders. O `'ACTIVE'` só é usado hoje em `SubscribeCreateData` (contexto de assinatura, não de pedido) — não mexer lá.

### Relevant Files
- `src/core/entities/orders.ts` — arquivo a editar.
- `src/core/ports/subscribe-repository.ts` — importa `OrderStatus`; conferir que continua compilando.

### Dependent Files
- `src/core/usecases/orders/order-status-machine.ts` (task_03) — tipa `from`/`to` por essa união.
- `src/core/ports/orders-repository.ts` (task_05) — usa `Order` e `OrderStatus`.

## Deliverables
- `src/core/entities/orders.ts` atualizado.
- Verificação manual **(OBRIGATÓRIO)**.

## Tests
- Verificação manual:
  - [ ] `npm run build` compila sem erro após o ajuste (corrigindo eventuais usos de `'ACTIVE'` no contexto de pedido).
  - [ ] `grep -rn "ACTIVE" src/core/entities/orders.ts` não retorna nada.
- Sem framework de teste automatizado no projeto.

## Success Criteria
- União `OrderStatus` idêntica ao enum Prisma da task_01.
- `Order` expõe `bakeryId`, `preparingAt`, `readyAt`.
