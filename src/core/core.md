# Camada Core

Contém as regras de negócio. **Não pode importar nada de `infra/` ou de frameworks externos.**

## O que fica aqui

| Pasta | Responsabilidade |
|-------|-----------------|
| `entities/` | Tipos TypeScript puros do domínio (sem métodos, sem decorators) |
| `ports/` | Interfaces de repositório — o core define o contrato, a infra implementa |
| `usecases/` | Uma pasta por recurso, um arquivo por operação (`create-user.ts`, `list-user.ts`) |
| `errors/` | Classes de erro com `statusCode` — todas estendem `AppError` |
| `mappers/` | Conversão entre entidade de domínio e estruturas externas quando necessário |

## Regras

- Entidades são `type`, não `class` — apenas dados, sem lógica acoplada
- Use cases recebem o repositório via construtor (injeção de dependência)
- Use cases lançam subclasses de `AppError` para erros de negócio — nunca `Error` genérico
- Ports usam apenas tipos definidos em `entities/` — nunca tipos do Prisma

## Erros disponíveis

```
AppError(message, statusCode)     ← base
BadRequestError(message)          ← 400
ConflictError(message)            ← 409
NotFoundError(message)            ← 404
UnprocessableEntityError(message) ← 422
```

## Estrutura de um use case

```ts
export class CreateXxxUseCase {
  constructor(private xxxRepository: XxxRepository) {}

  async execute(data: CreateXxxDTO): Promise<Xxx> {
    // validações de negócio
    // chamada ao repositório
    return result;
  }
}
```

## O que nunca deve aparecer aqui

- Imports de `@prisma/client`, `express`, `@supabase/supabase-js`
- Acesso direto a `process.env`
- Instâncias de `PrismaClient`
