# Tefreela

Frontend React/Vite e API Express/Supabase. O catálogo, os dashboards, pedidos e mensagens ainda contêm demonstrações; consulte [AUDITORIA.md](AUDITORIA.md).

## Configuração local

Requer Node.js compatível com Vite 8 e pnpm.

1. Execute `pnpm install` na raiz e em `backend`.
2. Copie `backend/.env.example` para `backend/.env` e preencha localmente. Nunca envie esse arquivo ou credenciais ao GitHub.
3. O frontend usa `/api`, encaminhado pelo Vite para `http://localhost:3000`. Para outro servidor, configure `VITE_API_URL` no `.env` local da raiz. Nunca coloque chaves administrativas em variáveis `VITE_*`.
4. Execute `pnpm dev` em `backend` e, em outro terminal, na raiz.
5. Abra `http://localhost:8443`.

A API depende da tabela `profiles` existente e dos campos usados em `backend/src/routes/auth.routes.ts`. Não foi criado schema novo nem alterado o banco nesta etapa.

## Verificações

Na raiz: `pnpm build` e `pnpm exec tsc --noEmit`.

Em `backend`: `pnpm test` compila e executa verificações HTTP locais com configurações fictícias. Não testa autenticação real no Supabase.

## Publicação futura

O frontend compilado precisa de fallback de SPA para `index.html`. O proxy do Vite só existe durante desenvolvimento; em produção, encaminhe `/api` à API ou configure `VITE_API_URL` durante o build. Configure `FRONTEND_URL` no backend com as origens autorizadas, separadas por vírgula. Mantenha todas as chaves secretas exclusivamente no ambiente do servidor.
