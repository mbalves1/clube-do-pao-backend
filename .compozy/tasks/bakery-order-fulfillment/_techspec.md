# TechSpec: Bakery Order Fulfillment

## Contexto do código atual

- **`Order`** (`prisma/schema.prisma`) existe mas quase não é usada: só `UpdateOrdersUseCase` faz um write duplo nela. Não tem `bakeryId` nem back-relation em `Bakery`.
- **Pool de entregadores** (`ListAvailableOrdersUseCase`, `AcceptOrderUseCase`, `ReleaseOrderUseCase`, `UpdateOrdersUseCase`) opera 100% sobre `subscription` via `PrismaSubscribeRepository` (`findAvailable`/`claim`/`release`/`updateOrder`). `claim`/`release` usam `updateMany` guardado (à prova de corrida) — **manter essa técnica** ao migrar para `Order`.
- **`OrderStatus`** enum Prisma: `PENDING, ACCEPTED, PICKED_UP, DELIVERED, CANCELED`. Entidade `src/core/entities/orders.ts` tem uma união com um `'ACTIVE'` inválido a remover.
- **`resolveOwnerBakeryId`** (`src/core/usecases/item/resolve-owner-bakery-id.ts`): `supabaseUserId → User → BakeryPerson → bakeryId`, lança `NotFoundError`/`ForbiddenError`. Padrão a reutilizar para todos os endpoints do lojista.
- **SSE** (`src/infra/sse/sse-service.ts`): `addClient(id, res)` + `emit(event, data)` faz broadcast para **todos** os clientes. Sem segmentação.
- **Erros disponíveis**: `AppError`, `BadRequestError`, `ConflictError`, `ForbiddenError`, `NotFoundError`, `UnprocessableEntityError` — importados diretamente do arquivo (sem barrel).
- **Sem runner de testes** no projeto. CI só roda `prisma generate` + `npm run build`. Verificação é **manual** (mesma abordagem de `delivery-order-assignment`).

## Mudanças de schema (`prisma/schema.prisma`)

```prisma
enum OrderStatus {
  PENDING
  PREPARING   // novo
  READY       // novo
  ACCEPTED
  PICKED_UP
  DELIVERED
  CANCELED
}

model Order {
  id               Int         @id @default(autoincrement())
  subscriptionId   Int
  bakeryId         String      // novo — desnormalizado (ADR-002)
  deliveryPersonId String?
  serviceDate      DateTime
  status           OrderStatus @default(PENDING)
  preparingAt      DateTime?   // novo
  readyAt          DateTime?   // novo
  acceptedAt       DateTime?
  pickedUpAt       DateTime?
  deliveredAt      DateTime?
  canceledAt       DateTime?
  createdAt        DateTime    @default(now())
  updatedAt        DateTime    @updatedAt
  bakery           Bakery      @relation(fields: [bakeryId], references: [id])   // novo
  deliveryPerson   DeliveryPerson? @relation(fields: [deliveryPersonId], references: [id])
  subscription     Subscription    @relation(fields: [subscriptionId], references: [id])

  @@unique([subscriptionId, serviceDate])   // novo — idempotência da geração
  @@index([bakeryId, status])               // novo — feed do lojista + pool
  @@map("orders")
}

model Bakery {
  // ...
  orders Order[]   // novo — back-relation
}
```

Migração: `npx prisma migrate dev --name bakery_order_fulfillment`. Tabela `orders` hoje tem pouquíssimas linhas (fluxo real usa `subscription`); `bakeryId` `NOT NULL` é aceitável — se houver linhas legadas, backfill via `subscription.bakeryId` no mesmo migration ou truncate combinado com o time.

## Domínio (`src/core`)

### `entities/orders.ts`
União `OrderStatus` alinhada ao enum Prisma (sem `'ACTIVE'`). `Order` ganha `bakeryId: string`, `preparingAt?`, `readyAt?`.

### `usecases/orders/order-status-machine.ts` (novo, função pura)
```ts
type Actor = 'company' | 'delivery';
export function canTransition(from: OrderStatus, to: OrderStatus, actor: Actor): boolean;
export function assertTransition(from, to, actor): void; // lança ConflictError/ForbiddenError
```
Tabela de transições conforme PRD. `claim`/`release`/pickup/delivered = `delivery`; preparing/ready/cancel = `company`.

### `usecases/shared/resolve-owner-bakery-id.ts` (movido de `usecases/item/`)
Sem mudança de assinatura. `create-item.ts`, `update-item.ts`, `delete-item.ts`, `list-items.ts` repontam o import.

### `ports/orders-repository.ts` (estendido)
```ts
interface OrdersRepository {
  create(data: CreateOrderData): Promise<Order>;                 // geração (status default PENDING)
  existsForSubscriptionOnDate(subscriptionId: number, serviceDate: Date): Promise<boolean>;
  findById(id: number): Promise<Order | null>;
  findByBakeryId(bakeryId: string, filter: { status?: OrderStatus[]; from?: Date; to?: Date }): Promise<Order[]>;
  findAvailableForPickup(from: Date, to: Date): Promise<Order[]>; // status READY, deliveryPersonId null
  claim(id: number, deliveryPersonId: string): Promise<boolean>; // READY -> ACCEPTED, guardado
  release(id: number, deliveryPersonId: string): Promise<boolean>;// ACCEPTED -> READY, guardado, dono
  updateStatus(id: number, status: OrderStatus, stamps: Partial<Pick<Order,
    'preparingAt'|'readyAt'|'acceptedAt'|'pickedUpAt'|'deliveredAt'|'canceledAt'>>): Promise<Order>;
}
```
`CreateOrderData` = `{ subscriptionId, bakeryId, serviceDate, status? }`. Remover a assinatura atual `create(order, deliveryId)` e o `UpdateOrderData` genérico.

### Use cases
| Use case | Substitui / novo | Responsabilidade |
|---|---|---|
| `GenerateOrdersFromSubscriptionsUseCase` | novo | Para cada `Subscription` due na data alvo sem `Order` no dia, cria `Order` `PENDING`. Idempotente. |
| `ListBakeryOrdersUseCase` | novo | `resolveOwnerBakeryId` + `findByBakeryId` com filtros. |
| `AdvanceOrderByBakeryUseCase` | novo | Valida posse (`order.bakeryId === bakeryId`), `assertTransition(actor:'company')`, `updateStatus` com timestamp. Emite SSE `order-ready` quando vai para `READY`. |
| `ListAvailableOrdersUseCase` | reescrito | `findAvailableForPickup` (Order READY), janela hoje..+2d (`setUTCHours`). |
| `AcceptOrderUseCase` | reescrito | `supabaseUserId → DeliveryPerson`, `claim` no `Order`. Corrida perdida → `ConflictError`. Sem `SubscribeRepository`. |
| `ReleaseOrderUseCase` | reescrito | `release` no `Order`, posse do claim, `ACCEPTED → READY`. Retorna dados p/ SSE `order-available`. |
| `AdvanceOrderByCourierUseCase` | substitui `UpdateOrdersUseCase` | posse do claim no `Order`, `assertTransition(actor:'delivery')` p/ `PICKED_UP`/`DELIVERED`, timestamps. **Não escreve em `subscription`.** |

## Infra

### `repositories/prisma-orders-repository.ts`
Implementa o port novo. `claim`/`release` via `prisma.order.updateMany({ where: { id, status/ deliveryPersonId... }, data })` retornando `count === 1` (padrão de `PrismaSubscribeRepository.claim`). Mapper local `mapOrder` já existe — estender com `bakeryId`, `preparingAt`, `readyAt`.

### `sse/sse-service.ts`
```ts
type ClientMeta = { role?: string; bakeryId?: string; deliveryPersonId?: string };
addClient(id, res, meta: ClientMeta = {})
emitTo(filter: (m: ClientMeta) => boolean, event, data)
emit(event, data) // mantém broadcast p/ retrocompat
```
`sse-routes.ts` passa `role`/`bakeryId`/`deliveryPersonId` a partir de `req.user` + lookup (reutilizar `resolveOwnerBakeryId` / `deliveryUserRepository`). Eventos:
- `order-created` → `m.bakeryId === order.bakeryId`
- `order-ready` / `order-available` → `m.role === 'delivery'`
- `order-status-updated` → padaria do pedido + entregador do pedido.

### HTTP
`validators/order-validator.ts`:
- `advanceOrderByBakerySchema`: `{ status: z.enum(['PREPARING','READY','CANCELED']) }`
- `advanceOrderByCourierSchema`: `{ status: z.enum(['PICKED_UP','DELIVERED']) }`
- `listBakeryOrdersQuerySchema`: `{ status?: csv→enum[], date?: yyyy-mm-dd }`

`controllers/orders-controller.ts`: novos handlers `listBakeryOrders`, `advanceByBakery`; `updateOrder` vira `advanceByCourier`. `catch` já segue `instanceof AppError → statusCode`.

`http/routes/orders-routes.ts`:
| Método | Rota | Handler | Ator |
|---|---|---|---|
| GET | `/orders/bakery` | `listBakeryOrders` | company |
| PATCH | `/orders/:id/status` | `advanceByBakery` | company |
| POST | `/orders/generate` | `generate` | interno (auth) |
| GET | `/orders/available` | `listAvailable` | delivery *(mantida)* |
| POST | `/orders/:id/accept` | `acceptOrder` | delivery *(mantida)* |
| POST | `/orders/:id/release` | `releaseOrder` | delivery *(mantida)* |
| PATCH | `/orders/:id/delivery-status` | `advanceByCourier` | delivery *(substitui `/orders/:orderId/:deliveryId`)* |

`main/factories/order-controller-factory.ts`: injeta `PrismaOrdersRepository` em todos os use cases; remove `PrismaSubscribeRepository` do wiring de pedido (mantém só onde a geração lê assinaturas). Registrar `/orders/generate` já entra via `makeOrdersRoutes`.

## Testing Approach

Sem framework de teste no projeto → **verificação manual** documentada em cada task (padrão de `delivery-order-assignment`). Cenários-chave:
- `canTransition` cobre toda a matriz do PRD (inválidas retornam `false`).
- `claim` concorrente: dois `updateMany` no mesmo `Order READY` → só um `count === 1`.
- Fluxo ponta a ponta: `generate` → `PENDING` → `PREPARING` → `READY` (aparece em `/orders/available`) → `accept` (`ACCEPTED`, some do pool) → `delivery-status PICKED_UP` → `DELIVERED`.
- `403` cross-bakery (`/orders/:id/status` de padaria alheia); `409` transição inválida; `subscription` intacta após todo o fluxo.
- `npm run build` sem novos erros de TS.
