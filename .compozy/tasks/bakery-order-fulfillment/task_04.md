---
status: pending
title: "Mover resolveOwnerBakeryId para usecases/shared/ e repontar Item"
type: backend
complexity: low
dependencies: []
---

# Task 4: Mover resolveOwnerBakeryId para usecases/shared/

## Overview
`resolveOwnerBakeryId` (hoje em `src/core/usecases/item/`) é o padrão de autorização do lojista: `supabaseUserId → User → BakeryPerson → bakeryId`. O módulo de pedidos vai reutilizá-lo em vários use cases. Mover para um local compartilhado e repontar os imports do Item, sem mudar comportamento.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include verification in deliverables
</critical>

<requirements>
- MUST mover `src/core/usecases/item/resolve-owner-bakery-id.ts` para `src/core/usecases/shared/resolve-owner-bakery-id.ts`, mantendo assinatura, mensagens de erro e comportamento idênticos.
- MUST atualizar os imports em `create-item.ts`, `update-item.ts`, `delete-item.ts`, `list-items.ts`.
- MUST NOT alterar a lógica (mesma cadeia de lookup, mesmos `NotFoundError`/`ForbiddenError`).
- SHOULD conferir com `grep -rn "resolve-owner-bakery-id" src/` que não sobrou referência ao caminho antigo.
</requirements>

## Subtasks
- [ ] 4.1 Criar `src/core/usecases/shared/` e mover o arquivo.
- [ ] 4.2 Repontar os 4 imports do Item.
- [ ] 4.3 `npm run build`.

## Implementation Details
Ver TechSpec "usecases/shared/resolve-owner-bakery-id.ts". É um move + update de import; nenhum novo parâmetro. Manter o comentário do topo do arquivo (referência ao mesmo lookup do `GET /auth/me`).

### Relevant Files
- `src/core/usecases/item/resolve-owner-bakery-id.ts` — origem.
- `src/core/usecases/item/{create,update,delete,list}-item*.ts` — consumidores a repontar.

### Dependent Files
- `src/core/usecases/orders/list-bakery-orders.ts` (task_09)
- `src/core/usecases/orders/advance-order-by-bakery.ts` (task_10)
- `src/infra/http/routes/sse-routes.ts` (task_07) — pode usar para resolver `bakeryId` do cliente SSE.

## Deliverables
- Arquivo movido para `src/core/usecases/shared/`.
- Imports do Item atualizados.
- Verificação manual **(OBRIGATÓRIO)**.

## Tests
- Verificação manual:
  - [ ] `npm run build` compila.
  - [ ] Exercitar `GET /items` e `POST /items` autenticado como `company` → continua 200/201.
  - [ ] `GET /items` autenticado como usuário sem `BakeryPerson` → 403 "Usuário não está vinculado a uma padaria" (mensagem inalterada).
- Sem framework de teste automatizado no projeto.

## Success Criteria
- Nenhuma referência ao caminho antigo; Item funciona igual.
- Helper disponível em `src/core/usecases/shared/` para os use cases de pedido.
