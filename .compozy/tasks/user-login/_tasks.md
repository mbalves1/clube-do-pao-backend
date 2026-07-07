# User Login (Sign In) — Task List

## Tasks

| # | Title | Status | Complexity | Dependencies |
|---|-------|--------|------------|--------------|
| 01 | Prisma schema: `supabaseUserId` on User/Bakery/DeliveryPerson + migration | completed | low | — |
| 02 | `AuthGateway` port | completed | low | — |
| 03 | `SupabaseAuthGateway` implementation | completed | medium | task_02 |
| 04 | `User` entity + port: `supabaseUserId`, `findBySupabaseUserId` | completed | low | task_01 |
| 05 | `PrismaUserRepository`: persist `supabaseUserId` + `findBySupabaseUserId` | pending | low | task_04 |
| 06 | `DeliveryUser` entity + port: `findBySupabaseUserId` | pending | low | task_01 |
| 07 | `PrismaDeliveryUserRepository`: implement `findBySupabaseUserId` | pending | low | task_06 |
| 08 | `BakeryRepository` port + `PrismaBakeryRepository`: `findBySupabaseUserId` | pending | low | task_01 |
| 09 | `CreateUserUseCase`: require password, create Supabase credential, persist `supabaseUserId` | pending | medium | task_02, task_04 |
| 10 | `user-validator.ts`: require `password` in `createUserSchema` | pending | low | task_09 |
| 11 | `UserController.create` + `user-controller-factory.ts`: forward password, wire `AuthGateway` | pending | medium | task_03, task_05, task_09, task_10 |
| 12 | `LoginUseCase` | pending | medium | task_02, task_04, task_06, task_08 |
| 13 | `RefreshSessionUseCase` | pending | low | task_02 |
| 14 | `auth-validator.ts` (login + refresh schemas) | pending | low | — |
| 15 | `AuthController` (login, refresh) | pending | medium | task_12, task_13, task_14 |
| 16 | `auth-routes.ts` + `auth-controller-factory.ts` | pending | medium | task_03, task_05, task_07, task_08, task_15 |
| 17 | Register auth routes: `routes.ts` + `app.ts` | pending | low | task_16 |
