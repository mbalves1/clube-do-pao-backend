---
name: adicionar-endpoint
description: Adiciona um endpoint a um recurso que já existe no backend do Clube do Pão (users, bakery, items, orders, subscribe, auth), passando por use case → port/repositório → validator Zod → controller → factory → rota com Swagger → request.http. Cobre autorização por dono do recurso, ordem de declaração das rotas e eventos SSE. Use sempre que o usuário pedir uma rota, endpoint ou ação nova em um módulo existente, mesmo sem dizer "endpoint" (ex. "o lojista precisa cancelar pedido", "listar as assinaturas do cliente", "filtrar itens disponíveis"). Não use para criar um módulo ou entidade de domínio nova (use adicionar-recurso) nem para corrigir um endpoint existente sem adicionar rota.
---

# Adicionar endpoint

Adiciona uma rota a um módulo existente, tocando só as camadas que a operação precisa. O risco aqui é diferente do de um módulo novo: a estrutura já existe, então os erros prováveis são copiar um padrão antigo do módulo, esquecer a autorização ou declarar a rota na posição errada.

## Passo 0 — Entender antes de escrever

Leia o arquivo de rotas, o controller, a factory e o port do módulo, e defina:

- **Quem chama:** `customer`, `company` ou `delivery`. Isso define a autorização (Passo 2).
- **Método e caminho:** veja como as rotas vizinhas se organizam. Ações sobre um registro seguem o formato `POST /orders/:id/accept` ou `PATCH /orders/:id/status`.
- **Se é preciso mudar o schema Prisma:** nesse caso, trate a migration antes e confirme com o usuário se houver dados existentes ou colunas legadas envolvidas.

Se a operação já existe em outra rota ou se o papel de quem chama não estiver claro, pergunte em vez de supor.

## Nomes: siga o módulo

Use os nomes que o módulo já tem, mesmo inconsistentes (`orders-controller.ts` com `order-validator.ts`, `subscribe` com `subscription-validator.ts`). A convenção singular da `adicionar-recurso` vale só para módulos novos. Renomear aqui espalha o diff e mistura refactor com funcionalidade.

| Módulo | Use cases | Port | Controller | Validator | Factory |
|---|---|---|---|---|---|
| orders | `usecases/orders/` | `orders-repository.ts` | `orders-controller.ts` | `order-validator.ts` | `order-controller-factory.ts` |
| subscribe | `usecases/subscribe/` | `subscribe-repository.ts` | `subscribe-controller.ts` | `subscription-validator.ts` | `subscribe-controller-factory.ts` |
| item | `usecases/item/` | `item-repository.ts` | `item-controller.ts` | `item-validator.ts` | `item-controller-factory.ts` |

Para os demais, confira os arquivos existentes antes de criar qualquer um.

## Passo 1 — Use case

Crie `src/core/usecases/<módulo>/<verbo>-<nome>.ts`, com uma classe e um método `execute`. Modelos: `src/core/usecases/item/update-item.ts` e `src/core/usecases/orders/release-order.ts`.

Falhas de negócio lançam subclasses de `AppError` (`src/core/errors/`), porque o controller converte o `statusCode` delas em resposta HTTP. Qualquer outro erro vira 500.

| Erro | Status | Quando |
|---|---|---|
| `BadRequestError` | 400 | Requisição inválida que o Zod não pega |
| `ForbiddenError` | 403 | O registro existe, mas não pertence a quem chama |
| `NotFoundError` | 404 | O registro não existe |
| `ConflictError` | 409 | O estado atual impede a ação |
| `InvalidOrderStatusTransitionError` | 409 | Transição de status de pedido inválida |
| `UnprocessableEntityError` | 422 | Dados válidos no formato, mas impossíveis de processar |

Transições de status de pedido passam por `src/core/usecases/orders/order-status-transitions.ts`, em vez de `if`s novos no use case, para o ciclo de vida continuar em um só lugar.

## Passo 2 — Autorização

`authMiddleware` só valida o JWT: não há guard por papel, e `req.user.id` é o id do **Supabase**, não o `User.id` do banco. Sem uma checagem no use case, qualquer usuário logado consegue agir sobre dados de outra pessoa.

Resolva quem chama a partir do `req.user.id` e compare com o dono do registro:

- **Lojista (`company`):** use `resolveOwnerBakeryId` (`src/core/usecases/shared/resolve-owner-bakery-id.ts`) e compare com `registro.bakeryId`. Modelo: `update-item.ts`.
- **Entregador (`delivery`):** `userRepository.findBySupabaseUserId` → `deliveryUserRepository.findByUserId` e compare com `order.deliveryPersonId`. Modelo: `release-order.ts`.
- **Cliente (`customer`):** `userRepository.findBySupabaseUserId` e compare com o dono do registro.

A ordem é buscar o registro, lançar 404 se não existir e lançar 403 se for de outra pessoa. Listagens filtram por dono na própria consulta.

Só deixe uma rota sem essa checagem se ela for de fato pública para os logados e o usuário tiver pedido isso. Nesse caso, diga isso explicitamente ao terminar.

## Passo 3 — Port e repositório (se precisar de consulta nova)

Reaproveite um método existente sempre que servir. Se não servir, adicione a assinatura em `src/core/ports/` e implemente em `src/infra/repositories/prisma-*-repository.ts`. Tudo com Prisma fica no repositório, porque o core não importa nada de `infra/`.

Quando duas requisições podem disputar o mesmo registro, como dois entregadores aceitando o mesmo pedido, faça a checagem de estado dentro da própria escrita no repositório, com `updateMany` e o estado esperado no `where`. Modelo: `release` em `prisma-orders-repository.ts`, que devolve `false` quando nenhum registro é afetado, e aí `release-order.ts` lança `ConflictError`.

## Passo 4 — Validação

Adicione o schema em `src/infra/http/validators/` no arquivo do módulo.

- **Body:** use `validateSchema(schema)` na rota. Esse middleware só olha `req.body`.
- **Query string:** valide no controller com `safeParse(req.query)` e `formatBadRequest`. Modelo: `listBakeryOrders` em `orders-controller.ts`.
- **Parâmetros de rota:** converta conforme o tipo do id. `Order` usa `Number(req.params.id)` e `Item` usa `String(req.params.id)`.

## Passo 5 — Controller

Adicione um método que só extrai os dados da requisição, chama o use case e devolve a resposta. Mantenha o tratamento de erro no padrão do controller: `item-controller.ts` usa um `handleError` privado, e `orders-controller.ts` repete o bloco em cada método.

Devolva `AppError` com o `statusCode` dele e o restante como 500 com `console.error`. O `catch` genérico de `OrdersController.list`, que devolve 400 para qualquer erro, é um padrão antigo e não deve ser copiado.

Adicione o use case ao final do construtor, para bater com a chamada na factory.

## Passo 6 — Factory

Instancie o use case em `src/main/factories/<módulo>-controller-factory.ts` e passe para o controller **na mesma posição do construtor**. Os argumentos são posicionais, e dois use cases com a mesma forma trocados podem compilar sem erro.

`src/main/app.ts` e `src/infra/http/routes.ts` não mudam, porque o módulo já está registrado.

## Passo 7 — Rota e Swagger

No arquivo de rotas do módulo, use `authMiddleware`, depois `validateSchema` se houver body, e por fim o controller.

**A ordem de declaração importa**, porque o Express usa a primeira rota que casa:

- Caminhos fixos vêm antes dos dinâmicos: `/orders/bakery` antes de qualquer `/orders/:id`.
- Em `orders-routes.ts`, `PATCH /orders/:orderId/:deliveryId` casa com qualquer `PATCH /orders/<x>/<y>`. Rotas como `/orders/:id/status` precisam ficar antes dela.

Adicione o bloco `@swagger` acima da rota, com `security: - bearerAuth: []` e todos os status que o use case pode devolver. Modelo: `item-routes.ts`. Schemas reutilizáveis ficam em `src/infra/http/swagger.ts`. O caminho documentado inclui o prefixo `/api`, mas o caminho no `router` não.

## Passo 8 — SSE (se outros clientes precisam saber)

Em mudanças que outros usuários acompanham em tempo real, como status de pedido, emita o evento pelo `sseService` **no controller**, depois do use case concluir. Modelo: `releaseOrder` em `orders-controller.ts`. Reutilize `order-available` e `order-status-updated` em vez de criar variações do mesmo evento. O use case não pode chamar o `sseService`, porque o core não importa `infra/`, e `npm run check:architecture` reprova isso.

## Passo 9 — `request.http`

Adicione um exemplo perto dos outros do módulo, com o comentário `###` descrevendo a chamada e placeholders como `<token do lojista>` e `<id do item>`. Nunca coloque tokens reais.

## Antes de considerar pronto

1. Rode `npm run check:architecture` e `npm run build`. O projeto não tem testes, então isso só prova que as camadas e os tipos fecham.
2. Se houver banco disponível, suba com `npm run dev` e chame a rota com quem é dono e com quem não é, esperando sucesso e 403. Se não conseguir rodar, diga que o comportamento não foi testado.
3. Se a mudança alterar algo descrito em `docs/architecture.md`, como o ciclo de vida de `Order`, atualize o documento.

## Não fazer

- Não corrigir nomes ou padrões antigos do módulo junto com o endpoint. Se notar um problema, avise o usuário e deixe para outra mudança.
- Não colocar regra de negócio no controller nem Prisma no use case.
- Não instanciar repositórios ou use cases fora da factory.
- Não escrever nas colunas legadas `serviceDate`, `status` e `deliveryPersonId` de `Subscription`.
