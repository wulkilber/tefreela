# Tefreela

Protótipo acadêmico com React/Vite, API Express e Supabase/PostgreSQL. Serviços, perfis, pedidos, mensagens, notificações, avaliações e portfólio usam as tabelas existentes. Consulte [AUDITORIA.md](AUDITORIA.md) para validação, limites e pendências.

## Executar localmente

Requer Node.js compatível com Vite 8 e pnpm.

1. Na raiz, execute `pnpm install`.
2. Em `backend`, execute `pnpm install`.
3. Copie `backend/.env.example` para `backend/.env` e preencha suas credenciais localmente. Não envie .env, senhas ou chaves ao GitHub.
4. Em um terminal na pasta `backend`, execute `pnpm dev`.
5. Em outro terminal na raiz, execute `pnpm dev`.
6. Abra `http://localhost:8443`.

O frontend usa `/api`, encaminhado pelo Vite para `http://localhost:3000`. Para outra API local, use `API_PROXY_TARGET`; para outra URL pública, configure `VITE_API_URL` no .env local da raiz. Nunca coloque chaves administrativas em variáveis `VITE_*`.

## Banco e créditos

A API usa o schema fornecido para profiles, categorias, servicos, pedidos, pagamentos, movimentacoes_creditos, avaliacoes, mensagens, notificacoes e portfolio. Categorias precisam conter `id_categoria`; o frontend reconhece `nome`, `nome_categoria` ou `titulo` como rótulo.

O pagamento acadêmico só funciona após revisar e executar [backend/sql/001_creditos_e_rls.sql](backend/sql/001_creditos_e_rls.sql) no SQL Editor do Supabase. Não executado automaticamente. Esse arquivo habilita RLS sem remover políticas existentes e cria uma RPC transacional restrita ao servidor.

Créditos são fictícios, sem dinheiro real. A aplicação não oferece carregamento arbitrário de saldo pelo cliente, nem escrow. Saldos iniciais devem ser definidos pelo responsável pelo ambiente acadêmico.

## Recuperação de senha

Autorize `http://localhost:8443/recuperar-senha` em Authentication → URL Configuration → Redirect URLs do Supabase. Para outro domínio, autorize a URL correspondente e atualize `FRONTEND_URL`. Configure o envio de e-mail e teste a recuperação antes de disponibilizá-la aos usuários.

## Verificações

Na raiz:

```text
pnpm exec tsc --noEmit
pnpm build
pnpm test
```

Em backend:

```text
pnpm test
```

São 5 testes de sessão e 23 testes de backend com credenciais fictícias e serviço local simulado. Nenhum deles depende do banco real. A configuração antiga do formatador oxfmt 0.2 pode remover separadores de tipos na mesma linha; conferir TypeScript após usá-lo.

## Publicação futura

O frontend compilado precisa de fallback de SPA para `index.html`. O proxy do Vite existe somente no desenvolvimento: em produção, encaminhe `/api` para a API ou configure `VITE_API_URL` durante o build.

Configure `FRONTEND_URL` no backend com as origens permitidas, separadas por vírgula. Para servidor/container com ingresso externo, defina `HOST=0.0.0.0`; localmente o padrão é `127.0.0.1`. Mantenha todas as chaves secretas exclusivamente no servidor.

Antes de produção, concluir confirmação de e-mail, políticas RLS, SMTP/OAuth e validação dos fluxos com duas contas reais. O design e as ilustrações da página inicial foram preservados; dados de negócio fictícios foram removidos.
