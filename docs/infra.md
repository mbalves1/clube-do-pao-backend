# Variáveis de ambiente obrigatórias

```
DATABASE_URL=           # Connection string PostgreSQL
SUPABASE_URL=           # URL do projeto Supabase
SUPABASE_SERVICE_ROLE_KEY= # Chave de serviço do Supabase
```

# Comandos úteis

```bash
npm run dev              # Desenvolvimento com hot reload (ts-node-dev)
npm run build            # prisma generate + compila TypeScript → dist/
npm start                # Roda o build (dist/main/server.js)
npm run prisma:generate  # Gera Prisma Client após alterar o schema
npm run prisma:format    # Formata prisma/schema.prisma
npm run prisma:deploy    # Executa migrations em produção (migrate deploy)
npm run docker:up        # Sobe PostgreSQL local via Docker
npm run docker:down      # Derruba os containers
npm run setup            # Primeira execução: docker:up + aguarda Postgres + migrate dev
```

Não há scripts de `lint` ou `test` configurados no projeto no momento — o CI (`.github/workflows/ci.yml`) só roda `prisma generate` + `npm run build`.

# Notas de deploy (Vercel)

- O entry point é `src/index.ts` (exporta o app Express)
- `src/main/server.ts` **não é usado** no Vercel — ele existe só para execução local
- SSE funciona em Vercel Fluid Compute, mas não em serverless comum (timeout)
- Após alterar variáveis de ambiente no Vercel, é necessário fazer um novo deploy
