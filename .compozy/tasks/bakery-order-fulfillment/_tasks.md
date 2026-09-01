# Bakery Order Fulfillment — Task List

Fluxo do lojista: pedido chega → lojista aceita e prepara → lojista marca **pronto** →
pedido entra no pool → entregador reivindica → entregador retira → entregador entrega.
Backbone: `Order` como fonte de verdade (ADR-001).

## Tasks

| # | Title | Status | Complexity | Dependencies |
|---|-------|--------|------------|--------------|
| 01 | `OrderStatus` enum (`PREPARING`/`READY`) + `Order`/`Bakery` schema + migration | pending | medium | — |
| 02 | `orders.ts` entity + tipos de domínio alinhados ao enum | pending | low | — |
| 03 | `order-status-machine.ts` — função pura de transições (ator explícito) | pending | medium | task_02 |
| 04 | Mover `resolveOwnerBakeryId` para `usecases/shared/` e repontar Item | pending | low | — |
| 05 | `OrdersRepository` port estendido (feed, pool, claim/release, updateStatus) | pending | low | task_02 |
| 06 | `PrismaOrdersRepository` — implementar o port novo (updateMany guardado) | pending | medium | task_01, task_05 |
| 07 | SSE segmentado — `addClient` com metadados + `emitTo` | pending | medium | — |
| 08 | `GenerateOrdersFromSubscriptionsUseCase` — cria `Order` PENDING idempotente | pending | medium | task_05, task_06 |
| 09 | `ListBakeryOrdersUseCase` — feed de pedidos da padaria do lojista | pending | medium | task_04, task_06 |
| 10 | `AdvanceOrderByBakeryUseCase` — PENDING→PREPARING→READY / CANCELED + SSE | pending | medium | task_03, task_04, task_06, task_07 |
| 11 | `ListAvailableOrdersUseCase` reescrito — pool lê `Order` READY | pending | medium | task_06 |
| 12 | `AcceptOrderUseCase` reescrito — `claim` no `Order` | pending | medium | task_03, task_06 |
| 13 | `ReleaseOrderUseCase` reescrito — `release` no `Order` | pending | medium | task_03, task_06, task_07 |
| 14 | `AdvanceOrderByCourierUseCase` — substitui `UpdateOrdersUseCase` (ACCEPTED→PICKED_UP→DELIVERED) | pending | medium | task_03, task_06, task_07 |
| 15 | `order-validator.ts` — schemas lojista / entregador / query do feed | pending | low | task_02 |
| 16 | `OrdersController` — handlers `listBakeryOrders`/`advanceByBakery` + rework dos existentes | pending | medium | task_08, task_09, task_10, task_11, task_12, task_13, task_14, task_15 |
| 17 | `orders-routes.ts` — rotas novas + swagger; substitui `/orders/:orderId/:deliveryId` | pending | medium | task_16 |
| 18 | `order-controller-factory.ts` + registro em `routes.ts` / `app.ts` | pending | low | task_16, task_17 |
| 19 | `docs/architecture.md` + swagger components + verificação ponta a ponta | pending | medium | task_17, task_18 |

## Notas de sequenciamento

- **Fundação (01–07)** pode ir em paralelo em parte: 02/04/07 não dependem de nada; 01→06 é o caminho crítico.
- **Use cases do lojista (08–10)** e **rework do pool (11–14)** dependem só de 03/04/06/07 — podem ser paralelizados entre si.
- **HTTP (15–18)** fecha o fluxo; 19 valida ponta a ponta e atualiza a doc.
- Sem runner de testes no projeto → verificação **manual** documentada em cada task (padrão de `delivery-order-assignment`).
