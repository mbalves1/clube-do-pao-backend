# PRD: Bakery Order Fulfillment (módulo do lojista)

## Overview

Hoje o lojista (`Bakery` / role `company`) só consegue cadastrar itens à venda (`/items`). Não existe nenhum ponto no produto onde a padaria **veja os pedidos que chegaram**, **aceite e prepare** um pedido, ou **sinalize que ele está pronto para retirada**. O fluxo de entrega existente (`delivery-order-assignment`) opera diretamente sobre linhas de `subscription` e coloca no pool do entregador qualquer assinatura na janela de data — sem passar pela padaria.

Esta feature entrega o ciclo de vida do pedido do ponto de vista do lojista e conecta esse ciclo ao pool de entregadores:

> pedido chega → lojista aceita e prepara → lojista marca **pronto** → pedido entra no pool → entregador reivindica → entregador retira na padaria → entregador entrega.

## Decisão de arquitetura (definida com o time)

O **`Order`** passa a ser a fonte de verdade do pedido pontual. Pedidos `PENDING` são **gerados a partir de `Subscription`**; status, pool, `claim`/`release` e transições passam a operar sobre `Order`. `subscription.status`/`subscription.deliveryPersonId` deixam de ser escritos pelo fluxo de pedido e voltam a representar apenas o estado da assinatura recorrente.

## Goals

- Dar ao lojista uma forma self-service de ver, aceitar, preparar e liberar pedidos da sua padaria, sem coordenação manual.
- Garantir que **só pedidos marcados como `READY` pelo lojista** entrem no pool de entregadores.
- Restringir cada transição de status ao ator correto (lojista vs. entregador dono do claim) via uma máquina de estados única.
- Migrar o fluxo de entrega já existente para operar sobre `Order` sem regressão (pool, claim, release, pickup, delivered continuam funcionando).

## User Stories

**Lojista (`company`)**
- Como lojista, quero ver os pedidos da minha padaria do dia, com status e janela de entrega, para saber o que preparar.
- Como lojista, quero aceitar um pedido (`PENDING → PREPARING`), para sinalizar que estou produzindo.
- Como lojista, quero marcar um pedido como pronto (`PREPARING → READY`), para que ele fique disponível para um entregador retirar.
- Como lojista, quero cancelar um pedido antes de ele ser retirado, para casos de ruptura de estoque.
- Como lojista, quero receber em tempo real quando um novo pedido chega para a minha padaria.

**Entregador (`delivery`)**
- Como entregador, quero ver no pool apenas pedidos que a padaria já marcou como prontos, para não chegar antes da hora.
- Como entregador, quero reivindicar, liberar e avançar o status (`ACCEPTED → PICKED_UP → DELIVERED`) só dos pedidos que reivindiquei — comportamento já existente, agora sobre `Order`.

## Status model

`OrderStatus`: `PENDING → PREPARING → READY → ACCEPTED → PICKED_UP → DELIVERED`, com `CANCELED` a partir de `PENDING`/`PREPARING`/`READY` (nunca depois de `ACCEPTED`). `ACCEPTED` continua significando "reivindicado por um entregador".

| Transição | Ator |
|---|---|
| `PENDING → PREPARING` | lojista |
| `PREPARING → READY` | lojista |
| `PENDING/PREPARING/READY → CANCELED` | lojista |
| `READY → ACCEPTED` (claim) | entregador |
| `ACCEPTED → READY` (release) | entregador dono do claim |
| `ACCEPTED → PICKED_UP` | entregador dono do claim |
| `PICKED_UP → DELIVERED` | entregador dono do claim |

## Core Features

1. **Geração de pedidos** — a partir de `Subscription` due na data, cria `Order` `PENDING` idempotente por `(subscriptionId, serviceDate)`.
2. **Feed de pedidos da padaria** — lista `Order` da `bakeryId` do lojista autenticado, com filtro por status e data.
3. **Transições do lojista** — endpoint único de mudança de status restrito ao dono da padaria, validado pela máquina de estados.
4. **Pool do entregador sobre `Order`** — `/orders/available` passa a listar `Order` `READY` sem entregador; `claim`/`release`/status sobre `Order`.
5. **Tempo real segmentado** — SSE com metadados (`role`, `bakeryId`, `deliveryPersonId`); lojista recebe eventos só da própria padaria.

## Non-Goals

- Fluxo do cliente para **criar** pedido avulso fora de assinatura.
- Guard de autorização por role em middleware (mantém-se o padrão atual de resolver `bakeryId` no use case, como em `/items`).
- Múltiplos itens/quantidades por pedido com carrinho — o pedido herda o que a assinatura já define.
- Matching por proximidade / ranking de entregadores (Fase 2/3 do PRD de `delivery-order-assignment`).
- Job agendado (cron) de geração — a feature entrega o endpoint idempotente; o agendamento é operacional.

## Architecture Decision Records

- [ADR-001: `Order` como fonte de verdade do pedido pontual](adrs/adr-001.md)
- [ADR-002: `bakeryId` desnormalizado em `Order`](adrs/adr-002.md)
- [ADR-003: Máquina de estados única com ator explícito](adrs/adr-003.md)
- [ADR-004: Gate de `READY` antes do pool de entregadores](adrs/adr-004.md)

## Open Questions

- O lojista deve confirmar explicitamente a entrega ao entregador (dupla confirmação no `PICKED_UP`)? Fora de escopo nesta fase — `PICKED_UP` é ação só do entregador.
- Geração de pedidos considera fuso/UTC como o resto do código (`setUTCHours`)? Sim, manter a convenção atual até haver decisão de timezone.
