---
status: pending
title: "docs/architecture.md + swagger components + verificação ponta a ponta"
type: docs
complexity: medium
dependencies:
  - task_17
  - task_18
---

# Task 19: Documentação + verificação ponta a ponta

## Overview
Fecha a feature: atualiza a doc de arquitetura (hoje descreve o pool lendo `subscription` e não menciona o fluxo do lojista), adiciona os components Swagger de `Order`, e roda a verificação manual do fluxo inteiro.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include verification in deliverables
</critical>

<requirements>
- MUST atualizar `docs/architecture.md`:
  - Seção "Modelo de domínio": `Order` agora tem `bakeryId`, `preparingAt`, `readyAt` e a máquina de estados `PENDING → PREPARING → READY → ACCEPTED → PICKED_UP → DELIVERED` / `CANCELED`, com quem dispara cada transição.
  - Registrar que `Order` (não `subscription`) é a fonte de verdade do pedido pontual e que `Order` é gerado a partir de `Subscription` (`POST /orders/generate`, idempotente).
  - Remover/ajustar qualquer texto que diga que o pool de entregadores lê `subscription`.
- MUST adicionar os schemas Swagger em `src/infra/http/swagger.ts` (ou onde os `components.schemas` vivem): `Order`, `OrderStatus`, e o shape do feed do lojista.
- MUST executar e registrar (no PR) a verificação ponta a ponta abaixo.
- SHOULD atualizar a nota sobre Item em `docs/architecture.md` se algo mudou de caminho (ex.: `resolveOwnerBakeryId` movido para `usecases/shared/`).
- MUST NOT introduzir runner de testes nesta task (decisão fora de escopo); a verificação é manual.
</requirements>

## Subtasks
- [ ] 19.1 Editar `docs/architecture.md`.
- [ ] 19.2 Adicionar `components.schemas` de `Order`/`OrderStatus`.
- [ ] 19.3 Rodar o roteiro de verificação ponta a ponta e anexar o resultado ao PR.

## Implementation Details
Ver PRD "Status model" e TechSpec "Testing Approach". O roteiro cobre os dois papéis e a integridade da `subscription`.

### Relevant Files
- `docs/architecture.md` — seções "Modelo de domínio" e a nota sobre Item.
- `src/infra/http/swagger.ts` — definição do OpenAPI / `components`.

### Dependent Files
- Nenhum — task final.

## Deliverables
- `docs/architecture.md` e Swagger atualizados.
- Registro da verificação ponta a ponta no PR.

## Tests
- Verificação manual ponta a ponta (dois usuários: `company` da padaria A, `delivery`):
  - [ ] `POST /orders/generate` → cria `Order` `PENDING` para a assinatura devida; segunda chamada não duplica.
  - [ ] `GET /orders/bakery` (company A) → mostra o pedido `PENDING`; company B não o vê.
  - [ ] `PATCH /orders/:id/status {PREPARING}` → `preparingAt` setado; `{READY}` → `readyAt` setado + `order-ready` chega no SSE do delivery.
  - [ ] `GET /orders/available` (delivery) → só aparece depois de `READY`.
  - [ ] `POST /orders/:id/accept` → `ACCEPTED`, some do pool; segundo entregador → 409.
  - [ ] `POST /orders/:id/release` → volta a `READY`, reaparece no pool.
  - [ ] `PATCH /orders/:id/delivery-status {PICKED_UP}` pelo dono → `pickedUpAt`; `{DELIVERED}` → `deliveredAt`; `order-status-updated` chega ao lojista e ao entregador.
  - [ ] Transições inválidas → 409; cross-bakery / não-dono → 403.
  - [ ] A `subscription` da ponta a ponta permanece com `status`/`deliveryPersonId` inalterados.
  - [ ] `npm run build` limpo; `GET /docs` mostra `Order`/`OrderStatus`.

## Success Criteria
- Doc reflete o novo modelo; Swagger tem `Order`; o fluxo completo passa na verificação manual sem tocar em `subscription`.
