---
paths:
  - "prisma/**"
---

# Prisma: schema, migrations e scripts

## Migrations

- **Nunca editar uma migration já existente** em `prisma/migrations/`. Elas já foram aplicadas em dev e/ou produção. Para mudar o schema, gere uma migration nova com `npx prisma migrate dev --name <descricao>`
- Depois de alterar `schema.prisma`: `npm run prisma:format` e `npm run prisma:generate`
- Produção usa `npm run prisma:deploy` (`migrate deploy`). Nunca rodar `migrate reset` ou `db push` contra um banco que não seja local
- Migration que muda dados (além de estrutura) precisa funcionar sobre dados existentes: coluna nova obrigatória precisa de `@default` ou de um passo de backfill

## Invariantes do modelo, que não podem ser quebradas

- **`Subscription` é template, `Order` é instância** (ADR-001). As colunas legadas `serviceDate`, `status` e `deliveryPersonId` de `Subscription` existem só para histórico/backfill. Não adicione código que escreva nelas, nem crie colunas novas de "estado do dia" em `Subscription`
- **`@@unique([subscriptionId, serviceDate])` em `Order`** é o que torna `POST /orders/generate` idempotente. Não remover nem alterar
- **`OrderItem` é snapshot** (ADR-002): `nameSnapshot` e `priceCentsSnapshot` são copiados do `Item` na geração e nunca são atualizados. Não troque por relação viva com `Item`
- **`SubscriptionItem` é referência viva** ao `Item` (segue o catálogo), com `@@unique([subscriptionId, itemId])`
- **Dinheiro é sempre `Int` em centavos** (`priceCents`, `priceCentsSnapshot`). Nunca `Float` ou `Decimal`
- `Order.bakeryId` é denormalizado de propósito, para as consultas do lojista (`@@index([bakeryId, status])`)
- Não existe coluna `role`: o papel é estrutural (`User`, `Bakery` + `BakeryPerson`, `DeliveryPerson`). Não crie uma

## Scripts em `prisma/scripts/`

- Usam o singleton `prisma` de `src/infra/database/prisma-client`. Nunca `new PrismaClient()`
- Precisam ser **seguros para rodar mais de uma vez**: `createMany({ skipDuplicates: true })` sobre um unique, `upsert`, ou filtrar o que já existe
- Cada script tem um comando `npm run` próprio no `package.json` e um comentário no topo explicando o que faz e por que é idempotente

### Histórico: `backfill-orders.ts`

`npm run backfill:orders` criou um `Order` por `Subscription` que ainda não tinha um, copiando `serviceDate`/`bakeryId`/`deliveryPersonId` e mapeando `subscription.status` → `OrderStatus` (`ACCEPTED`/`PICKED_UP`/`DELIVERED`/`CANCELED` mantidos, qualquer outro valor → `PENDING`). O `fulfillmentType` ficou fixo em `DELIVERY` (não há dado histórico de pickup) e nenhum `OrderItem` foi criado. Já rodado no banco de dev em 2026-09-12 (17 `Subscription` → 17 `Order`).
