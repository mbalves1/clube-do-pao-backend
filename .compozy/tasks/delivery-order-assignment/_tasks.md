# Delivery Order Assignment — Task List

## Tasks

| # | Title | Status | Complexity | Dependencies |
|---|-------|--------|------------|--------------|
| 01 | `ForbiddenError` error class | pending | low | — |
| 02 | `DeliveryUser` entity + `DeliveryUserRepository` port: `create()` includes `supabaseUserId` | pending | low | — |
| 03 | `PrismaDeliveryUserRepository.create`: persist `supabaseUserId` | pending | low | task_02 |
| 04 | `CreateDeliveryUserUseCase`: require password, create Supabase credential, persist `supabaseUserId` | pending | medium | task_02, task_03 |
| 05 | `delivery-user-validator.ts`: require `password` in `createDeliverySchema` | pending | low | task_04 |
| 06 | `DeliveryUsersController.create` + factory: forward password, wire `AuthGateway` | pending | medium | task_03, task_04, task_05 |
| 07 | `SubscribeRepository` port: `findAvailable`, `claim`, `release` + `AvailableOrder` type | pending | low | — |
| 08 | `PrismaSubscribeRepository`: implement `findAvailable`, `claim`, `release` | pending | medium | task_07 |
| 09 | `ListAvailableOrdersUseCase` | pending | low | task_08 |
| 10 | `AcceptOrderUseCase` | pending | medium | task_08 |
| 11 | `ReleaseOrderUseCase` | pending | medium | task_01, task_08 |
| 12 | `UpdateOrdersUseCase`: ownership check | pending | medium | task_01 |
| 13 | `OrdersController`: `listAvailable`/`acceptOrder`/`releaseOrder` handlers + `updateOrder` caller id | pending | medium | task_09, task_10, task_11, task_12 |
| 14 | `orders-routes.ts`: register new routes + swagger | pending | medium | task_13 |
| 15 | `order-controller-factory.ts`: wire new use cases | pending | low | task_09, task_10, task_11, task_12, task_13 |