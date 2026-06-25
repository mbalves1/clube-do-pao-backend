# Camada Main

Ponto de entrada da aplicação. É o único lugar que conhece todas as camadas e faz o wiring entre elas.

## O que fica aqui

| Arquivo/Pasta | Responsabilidade |
|---------------|-----------------|
| `app.ts` | Configura o Express, registra middlewares globais e monta as rotas via factories |
| `server.ts` | Conecta o Prisma e sobe o servidor HTTP (usado apenas localmente) |
| `factories/` | Instancia repositório → use case(s) → controller e retorna o controller pronto |

## Factories

- São funções puras que retornam um controller configurado
- Seguem o padrão `makeXxxController(): XxxController`
- Só aqui se instanciam `PrismaXxxRepository`, use cases e controllers juntos
- Não contêm lógica de negócio

```ts
export function makeXxxController() {
  const repository = new PrismaXxxRepository();
  const createUseCase = new CreateXxxUseCase(repository);
  // ... outros use cases

  return new XxxController(createUseCase, ...);
}
```

## app.ts

- Para adicionar um novo recurso: chamar a factory, passar o controller para `makeRoutes`
- `makeRoutes` recebe todos os controllers e é o único ponto de registro de rotas

## Vercel vs local

- **Vercel:** usa `src/index.ts` como entry point, que exporta o `app` do `app.ts`
- **Local:** usa `server.ts`, que conecta o Prisma antes de subir o servidor
- `server.ts` nunca é importado pelo Vercel — o Prisma conecta lazily na primeira query
