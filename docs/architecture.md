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
- `Order` — pedido pontual gerado a partir de uma `Subscription`, com status `PENDING → ACCEPTED → PICKED_UP → DELIVERED`/`CANCELED`
- `FavoriteBakery` — relação N:N entre `User` e `Bakery`

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
- Hoje só `POST /api/users` (`CreateUserUseCase`) cria credencial Supabase com senha e aceita `role` no body. Os cadastros de `Bakery` (`create-bakery.ts`) e `DeliveryPerson` (`create-delivery.ts`) ainda **não** criam credencial Supabase nem pedem senha — contas `company`/`delivery` criadas por esses fluxos não conseguem fazer login até isso ser implementado.
