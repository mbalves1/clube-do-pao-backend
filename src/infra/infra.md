# Camada Infra

Implementa os contratos definidos no core usando frameworks e ferramentas externas.

## O que fica aqui

| Pasta | Responsabilidade |
|-------|-----------------|
| `controllers/` | Recebe `req`/`res`, chama use cases, retorna resposta HTTP |
| `repositories/` | Implementa os ports do core usando Prisma |
| `http/routes/` | Um arquivo por recurso — monta Router Express e aplica middlewares |
| `http/validators/` | Schemas Zod para validar body/params de entrada |
| `mappers/` | Converte resultado do Prisma → entidade de domínio quando há diferença de shape |
| `sse/` | `sseService` — singleton com lista de clientes SSE conectados |
| `database/` | `prisma` — singleton lazy, único ponto de acesso ao banco |

## Repositórios Prisma

- Implementam a interface do port correspondente em `core/ports/`
- Retornam sempre a entidade de domínio (nunca o tipo raw do Prisma)
- Usam o singleton `prisma` de `../database/prisma-client`
- Fazem a conversão campo a campo no retorno (não use `as` para forçar tipos)

## Controllers

- Não contêm lógica de negócio — apenas orquestram chamada ao use case
- Validam o body com Zod antes de chamar o use case
- Capturam `AppError` e retornam `error.statusCode` — erros desconhecidos retornam 500
- Rotas protegidas acessam `req.user` (injetado pelo `authMiddleware`)

## Rotas

- Cada arquivo exporta uma função `makeXxxRoutes(controller)` que retorna um `Router`
- Rotas que exigem autenticação usam `authMiddleware` diretamente na definição da rota
- Cada rota tem comentário JSDoc para o Swagger (`@swagger`)

## Validators Zod

```ts
export const createXxxSchema = z.object({ ... });
export type CreateXxxDTO = z.infer<typeof createXxxSchema>;
```

- Um schema por operação (create, update)
- `parse()` no controller — lança `ZodError` que é capturado pelo `formatBadRequest`

## SSE

- `sseService.addClient(id, res)` — registra a conexão
- `sseService.emit(event, data)` — envia para todos os clientes conectados
- Só funciona em ambientes que suportam conexões longas (não serverless padrão)
