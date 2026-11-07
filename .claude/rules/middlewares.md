---
paths:
  - "src/middlewares/**"
---

# Middlewares

| Arquivo | Responsabilidade |
|---------|-----------------|
| `auth.ts` | `authMiddleware`: valida o JWT do Supabase e injeta `req.user` (objeto `User` do Supabase, com `app_metadata.role`) |
| `validate-schema.ts` | `validateSchema(schema)`: valida `req.body` com Zod e substitui o body pelo resultado parseado |

## Regras

- **`authMiddleware` autentica, não autoriza.** Não adicione aqui verificação de role ou de dono do recurso. A autorização fica no use case (ver "Autorização por dono" em `core.md`)
- Middlewares não acessam o Prisma nem chamam use cases. Se precisar de dado do banco, a lógica pertence a um use case
- O formato de erro do `validateSchema` é contrato com o front e não deve mudar:
  ```json
  { "success": false, "errors": { "campo": ["mensagem"] } }
  ```
- Respostas de erro do `authMiddleware` são `401` com `{ "error": "<mensagem>" }`
- `validateSchema` valida só o `body`. Query string é validada no controller com `safeParse(req.query)` + `formatBadRequest`
- Ao estender `Express.Request` (como `req.user`), use `declare global` no próprio middleware que injeta o campo
