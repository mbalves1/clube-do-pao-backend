# Arquitetura: Clean Architecture em 3 camadas

```
src/
├── core/          # Regras de negócio — sem dependência de framework ou banco
│   ├── entities/  # Tipos de domínio (User, Bakery, Order, etc.)
│   ├── ports/     # Interfaces de repositório (contratos)
│   ├── usecases/  # Casos de uso (uma pasta por recurso)
│   ├── errors/    # AppError e subclasses (NotFoundError, ConflictError, etc.)
│   └── mappers/   # Conversão entre entidade de domínio e dados externos
│
├── infra/         # Implementações externas
│   ├── controllers/    # Controladores Express (recebem req/res, chamam use cases)
│   ├── repositories/   # Implementações Prisma dos ports do core
│   ├── http/
│   │   ├── routes/     # Um arquivo de rotas por recurso
│   │   ├── routes.ts   # Agrega todas as rotas
│   │   ├── validators/ # Schemas Zod por recurso
│   │   └── swagger.ts
│   ├── mappers/        # Conversão de dados Prisma → entidade de domínio
│   ├── sse/            # SSEService (conexões ativas em memória)
│   └── database/       # prisma-client.ts (singleton com lazy init)
│
├── middlewares/
│   ├── auth.ts          # Valida JWT via Supabase, injeta req.user
│   └── validate-schema.ts
│
├── main/
│   ├── app.ts           # Configura Express, monta rotas via factories
│   ├── server.ts        # Conecta Prisma e sobe o servidor (não usado no Vercel)
│   └── factories/       # Wiring: instancia repositório → use case → controller
│
└── index.ts       # Entry point do Vercel — exporta o app Express
```

## Como adicionar um novo recurso

Siga sempre esta ordem (de dentro para fora):

1. **Entidade** — `src/core/entities/meuRecurso.ts`
2. **Port** — `src/core/ports/meu-recurso-repository.ts` (interface)
3. **Use cases** — `src/core/usecases/meuRecurso/` (um arquivo por operação)
4. **Repositório Prisma** — `src/infra/repositories/prisma-meu-recurso-repository.ts`
5. **Mapper** (se necessário) — `src/infra/mappers/prisma-meu-recurso-mapper.ts`
6. **Validadores Zod** — `src/infra/http/validators/meu-recurso-validator.ts`
7. **Controller** — `src/infra/controllers/meu-recurso-controller.ts`
8. **Rotas** — `src/infra/http/routes/meu-recurso-routes.ts`
9. **Factory** — `src/main/factories/meu-recurso-controller-factory.ts`
10. **Registrar** — adicionar em `src/infra/http/routes.ts` e `src/main/app.ts`
11. **Schema Prisma** — adicionar model em `prisma/schema.prisma` + `npx prisma migrate dev`

## Padrões obrigatórios

- **Core não importa nada de `infra/`** — a dependência sempre flui de fora para dentro
- **Factories** são o único lugar onde repositórios, use cases e controllers são instanciados juntos
- **Rotas protegidas** usam `authMiddleware` e acessam `req.user` para obter o usuário autenticado
- **Erros de domínio** estendem `AppError` (`src/core/errors/`) — controllers fazem catch e retornam o status correto
- **Prisma client** é singleton lazy em `src/infra/database/prisma-client.ts` — nunca instanciar `PrismaClient` diretamente

## Modelo de domínio

Entidades principais (`prisma/schema.prisma`):

- `User` — cliente (role `customer`)
- `Bakery` — padaria (role `company`)
- `DeliveryPerson` — entregador (role `delivery`)
- `Subscription` — **template** recorrente entre `User` e `Bakery`: dias da semana, frequência, janelas de atendimento/entrega, `fulfillmentType` padrão, `active`, e uma cesta via `SubscriptionItem[]`. As colunas legadas `serviceDate`/`status`/`deliveryPersonId` seguem no banco só para histórico/backfill — nenhum código novo escreve nelas (ver split abaixo).
- `Order` — **instância** por `serviceDate`, gerada a partir de uma `Subscription` ativa (`POST /orders/generate`). Carrega `bakeryId` denormalizado, `fulfillmentType`, uma cesta *snapshot* via `OrderItem[]`, e o ciclo de vida completo `PENDING → PREPARING → READY → ACCEPTED → PICKED_UP → DELIVERED` (+ `CANCELED`). `PENDING→PREPARING→READY` e o `CANCEL` pré-reivindicação são ações do lojista (`PATCH /orders/:id/status`); `ACCEPTED→PICKED_UP→DELIVERED` são ações do entregador (`PATCH /orders/:orderId/:deliveryId`); em pedidos `PICKUP`, `READY→PICKED_UP` é uma confirmação do próprio lojista, sem entregador. `READY` num pedido `DELIVERY` é o que libera o pedido para o pool de entregadores, via SSE `order-available` (ver ADR-003).
- `SubscriptionItem` — linha da cesta do **template**: `itemId` + `quantity`, referência viva ao `Item` (segue as edições do catálogo).
- `OrderItem` — linha da cesta **snapshot** de um `Order`: `nameSnapshot`/`priceCentsSnapshot` copiados do `Item` no momento da geração e nunca mais atualizados, mesmo que o `Item` mude depois (ver ADR-002).
- `FavoriteBakery` — relação N:N entre `User` e `Bakery`
- `Item` — item à venda (nome, descrição opcional, `priceCents` em centavos, `available`), pertence a uma `Bakery`. CRUD restrito ao `company` dono: as rotas `/items` resolvem a `bakeryId` do chamador via `BakeryPerson` (mesmo lookup do `GetMeUseCase`) e `update`/`delete` verificam que o item pertence a essa `bakeryId` antes de agir — não há endpoint público de listagem por padaria ainda.

### Split `Subscription` / `Order`

O schema Prisma reflete a separação template/instância descrita na [ADR-001](../.compozy/tasks/seller-order-fulfillment/adrs/adr-001.md): `Subscription` é o template recorrente; `Order` é a instância por `serviceDate`, com unique em `(subscriptionId, serviceDate)` garantindo geração idempotente.

**Geração:** `POST /orders/generate` (autenticado, sem guard de papel nesta fase) materializa um `Order` por template ativo cujo dia da semana/frequência bate com a data informada (padrão: hoje), copiando a cesta em `OrderItem[]` (ADR-002) e pulando templates que já têm `Order` para aquela data. É um gatilho explícito por escolha — geração agendada (cron) foi deliberadamente adiada para uma fase 2, depois que essa lógica rodar contra assinaturas reais por uma semana completa (ver [ADR-004](../.compozy/tasks/seller-order-fulfillment/adrs/adr-004.md)).

**Backfill one-off:** `prisma/scripts/backfill-orders.ts` (`npm run backfill:orders`) criou um `Order` por `subscription` existente que ainda não tinha um, copiando `serviceDate`/`bakeryId`/`deliveryPersonId` e mapeando `subscription.status` → `OrderStatus` (`ACCEPTED`/`PICKED_UP`/`DELIVERED`/`CANCELED` mantidos, qualquer outro valor → `PENDING`); `fulfillmentType` fixo em `DELIVERY` (não há dado histórico de pickup) e sem `OrderItem`. Usa `createMany({ skipDuplicates: true })` sobre o unique de `Order`, então é seguro rodar mais de uma vez. Já rodado no banco de dev em 2026-09-12 (17 `subscription` → 17 `Order` criados).

Rationale completo, ADRs e o histórico task-a-task da migração: [`.compozy/tasks/seller-order-fulfillment/`](../.compozy/tasks/seller-order-fulfillment/).

## Autenticação e papéis (roles)

Não existe coluna `role` unificada no banco — o papel do usuário é **estrutural**: definido por em qual tabela o registro existe, não por um campo.

| Role (`app_metadata.role` no Supabase) | Tabela Prisma      |
|-----------------------------------------|--------------------|
| `customer`                              | `User`             |
| `company`                                | `Bakery`           |
| `delivery`                               | `DeliveryPerson`   |

- A role é definida na criação da credencial (`AuthGateway.createCredential`, implementado em `src/infra/gateways/supabase-auth-gateway.ts`) e fica salva **apenas** em `app_metadata.role` no Supabase Auth — não é persistida no Postgres.
- No login (`LoginUseCase.findProfile`, `src/core/usecases/auth/login.ts`), a role vinda da sessão Supabase decide em qual repositório buscar o perfil (`User`, `Bakery` ou `DeliveryPerson`).
- `authMiddleware` (`src/middlewares/auth.ts`) apenas valida o JWT e injeta `req.user` (objeto do Supabase, com `app_metadata`) — **não há guard de autorização por role** aplicado nas rotas hoje.
- `POST /api/users` (`CreateUserUseCase`) é o cadastro principal e único que cria credencial Supabase com senha, para os três roles: `customer`, `company` (cria também `Bakery` + `BakeryPerson`) e `delivery` (cria também `DeliveryPerson`). Não existe mais um `create-delivery.ts` separado — foi removido quando esse fluxo unificado em `CreateUserUseCase` foi implementado.
- `create-bakery.ts` (`POST /api/bakery`, autenticada) tem outro propósito: permite que um usuário **já logado** (com credencial Supabase existente) se vincule como dono de uma padaria nova, sem senha nova. Falha com `ConflictError` se o usuário já estiver vinculado a uma padaria ou se o CNPJ já existir.
