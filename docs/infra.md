# Variáveis de ambiente obrigatórias

```
DATABASE_URL=           # Connection string PostgreSQL
SUPABASE_URL=           # URL do projeto Supabase
SUPABASE_SERVICE_ROLE_KEY= # Chave de serviço do Supabase
```

# Comandos úteis

```bash
npm run dev          # Desenvolvimento com hot reload
npm run build        # Compila TypeScript → dist/
npm run prisma:generate  # Gera Prisma Client após alterar o schema
npm run prisma:deploy    # Executa migrations em produção
npm run docker:up    # Sobe PostgreSQL local via Docker
```

# Notas de deploy (Vercel)

- O entry point é `src/index.ts` (exporta o app Express)
- `src/main/server.ts` **não é usado** no Vercel — ele existe só para execução local
- SSE funciona em Vercel Fluid Compute, mas não em serverless comum (timeout)
- Após alterar variáveis de ambiente no Vercel, é necessário fazer um novo deploy
