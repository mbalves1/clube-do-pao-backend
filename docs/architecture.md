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
- `Subscription` — assinatura recorrente entre `User` e `Bakery` (dias da semana, frequência, janela de entrega)
- `Order` — pedido pontual gerado a partir de uma `Subscription`, com status `PENDING → PREPARING → READY → ACCEPTED → PICKED_UP → DELIVERED`/`CANCELED` (ver detalhes e ADR-003 na seção de split abaixo)
- `FavoriteBakery` — relação N:N entre `User` e `Bakery`
- `Item` — item à venda (nome, descrição opcional, `priceCents` em centavos, `available`), pertence a uma `Bakery`. CRUD restrito ao `company` dono: as rotas `/items` resolvem a `bakeryId` do chamador via `BakeryPerson` (mesmo lookup do `GetMeUseCase`) e `update`/`delete` verificam que o item pertence a essa `bakeryId` antes de agir — não há endpoint público de listagem por padaria ainda.

### Split `Subscription` / `Order` (em andamento — `seller-order-fulfillment`)

O schema Prisma já reflete a separação template/instância descrita na [ADR-001](../.compozy/tasks/seller-order-fulfillment/adrs/adr-001.md): `Subscription` é o template recorrente (`fulfillmentType` padrão, `active`, basket via `SubscriptionItem[]`); `Order` passa a ser a instância por `serviceDate` (`bakeryId` denormalizado, `fulfillmentType`, status estendido com `PREPARING`/`READY`, timestamps de ciclo de vida, basket snapshot via `OrderItem[]`), com unique em `(subscriptionId, serviceDate)` garantindo geração idempotente.

As colunas legadas de `Subscription` (`serviceDate`, `status`, `deliveryPersonId`) permanecem no banco só para histórico/backfill — nenhum código novo escreve nelas.

**Backfill one-off:** `prisma/scripts/backfill-orders.ts` (`npm run backfill:orders`) cria um `Order` por `subscription` existente que ainda não tem um, copiando `serviceDate`/`bakeryId`/`deliveryPersonId` e mapeando `subscription.status` → `OrderStatus` (`ACCEPTED`/`PICKED_UP`/`DELIVERED`/`CANCELED` mantidos, qualquer outro valor → `PENDING`); `fulfillmentType` fixo em `DELIVERY` (não há dado histórico de pickup) e sem `OrderItem`. Usa `createMany({ skipDuplicates: true })` sobre o unique de `Order`, então é seguro rodar mais de uma vez (reexecuções não criam duplicata). Já rodado no banco de dev em 2026-09-12 (17 `subscription` → 17 `Order` criados, 0 pulados na primeira execução; reexecução confirmou 0 criados / 17 pulados).

`src/core/entities/orders.ts` e `src/core/ports/orders-repository.ts` (port) já foram migrados para o modelo novo (`bakeryId`, `fulfillmentType`, `updateStatus`, `findAvailableForDelivery`, `claim`/`release` por `deliveryPersonId`). `src/core/usecases/orders/order-status-transitions.ts` já implementa as regras de transição do modelo novo (ADR-003), mas ainda não está chamado por nenhum use case.

**⚠️ Estado atualmente quebrado (build falha):** os use cases de entregador (`list-available-orders`, `accept-order`, `release-order`, `update-orders`, `list-orders`) e os repositórios Prisma (`prisma-orders-repository.ts`, `prisma-subscribe-repository.ts`) ainda chamam o shape antigo dos ports (`SubscribeRepository.claim/release/findAvailable/getOrderByDay/updateOrder`, `OrdersRepository.create/update/findBySubscriptionId`) — métodos que não existem mais nas interfaces atuais. `npx tsc --noEmit` falha com ~20 erros nesses arquivos, então `npm run build` (e portanto o CI) está quebrado no `master` até essa camada ser migrada — o restante das tasks de `seller-order-fulfillment`.

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
