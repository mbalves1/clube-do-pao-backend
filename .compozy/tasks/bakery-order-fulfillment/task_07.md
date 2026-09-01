---
status: pending
title: "SSE segmentado — addClient com metadados + emitTo"
type: backend
complexity: medium
dependencies: []
---

# Task 7: SSE segmentado — addClient com metadados + emitTo

## Overview
Hoje `sseService.emit` faz broadcast para todos os clientes. O módulo do lojista exige que a padaria receba eventos só dos seus pedidos e os entregadores recebam os eventos de pool. Adiciona metadados por conexão e emissão filtrada, mantendo `emit` (broadcast) para retrocompatibilidade.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include verification in deliverables
</critical>

<requirements>
- MUST estender `src/infra/sse/sse-service.ts`:
  - `type ClientMeta = { role?: string; bakeryId?: string; deliveryPersonId?: string }`
  - `addClient(id: string, res: Response, meta?: ClientMeta)` — guarda `meta` junto do cliente.
  - `emitTo(filter: (m: ClientMeta) => boolean, event: string, data: unknown)` — envia só para clientes cujo `meta` passa no filtro.
  - `emit(event, data)` — mantém broadcast (não quebrar `releaseOrder`/`updateOrder` atuais até serem migrados).
- MUST atualizar `src/infra/http/routes/sse-routes.ts` para resolver e passar `meta` a partir de `req.user`: `role` de `req.user.app_metadata.role`; `bakeryId` via `resolveOwnerBakeryId` (task_04) quando `role === 'company'`; `deliveryPersonId` via `DeliveryUserRepository.findByUserId` quando `role === 'delivery'`. Falha de lookup não deve derrubar a conexão — apenas omite o campo.
- MUST NOT mudar o formato do payload SSE (`event: <x>\ndata: <json>\n\n`).
</requirements>

## Subtasks
- [ ] 7.1 Adicionar `ClientMeta`, guardar meta no array de clientes, implementar `emitTo`.
- [ ] 7.2 Resolver `meta` em `sse-routes.ts` (reusando helpers existentes).
- [ ] 7.3 `npm run build`.

## Implementation Details
Ver TechSpec "sse/sse-service.ts". Filtros previstos (usados nas tasks 10/13/14):
- `order-ready` / `order-available` → `(m) => m.role === 'delivery'`
- `order-status-updated` / `order-created` → `(m) => m.bakeryId === order.bakeryId || m.deliveryPersonId === order.deliveryPersonId`

### Relevant Files
- `src/infra/sse/sse-service.ts` — serviço a estender.
- `src/infra/http/routes/sse-routes.ts` — injeta `meta`.
- `src/infra/repositories/prisma-delivery-user-repository.ts` — `findByUserId` para `deliveryPersonId`.
- `src/core/usecases/shared/resolve-owner-bakery-id.ts` (task_04) — `bakeryId` do lojista.

### Dependent Files
- `src/core/usecases/orders/advance-order-by-bakery.ts` (task_10) — emite `order-ready`.
- `src/core/usecases/orders/release-order.ts` (task_13) — emite `order-available`.
- `src/infra/controllers/orders-controller.ts` (task_16) — emite `order-status-updated` com filtro.

## Deliverables
- `sse-service.ts` com `emitTo` + `ClientMeta`; `sse-routes.ts` passando `meta`.
- Verificação manual **(OBRIGATÓRIO)**.

## Tests
- Verificação manual (dois `curl -N` no endpoint SSE, um como `company`, outro como `delivery`):
  - [ ] `emitTo((m)=>m.role==='delivery', 'x', {})` chega só no cliente delivery.
  - [ ] `emitTo((m)=>m.bakeryId===B, ...)` chega só no lojista da padaria B.
  - [ ] `emit(...)` (broadcast) ainda chega nos dois.
  - [ ] Cliente SSE sem `BakeryPerson`/`DeliveryPerson` conecta normalmente (meta parcial), sem 500.
- Sem framework de teste automatizado no projeto.

## Success Criteria
- Emissão filtrada por papel e por padaria funcionando; broadcast preservado.
