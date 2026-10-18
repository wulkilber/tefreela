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

São 8 testes de sessão e feedback e 25 testes de backend com credenciais fictícias e serviço local simulado. Nenhum deles depende do banco real. A configuração antiga do formatador oxfmt 0.2 pode remover separadores de tipos na mesma linha; conferir TypeScript após usá-lo.

## Publicação futura

O frontend compilado precisa de fallback de SPA para `index.html`. O proxy do Vite existe somente no desenvolvimento: em produção, encaminhe `/api` para a API ou configure `VITE_API_URL` durante o build.

Configure `FRONTEND_URL` no backend com as origens permitidas, separadas por vírgula. Para servidor/container com ingresso externo, defina `HOST=0.0.0.0`; localmente o padrão é `127.0.0.1`. Mantenha todas as chaves secretas exclusivamente no servidor.

Antes de produção, concluir confirmação de e-mail, políticas RLS, SMTP/OAuth e validação dos fluxos com duas contas reais. O design e as ilustrações da página inicial foram preservados; dados de negócio fictícios foram removidos.


## Categorias e imagens dos serviços

A tabela de categorias agora inclui Redação, Tradução, Vídeo e animação, Fotografia, Áudio e música, Consultoria, Arquitetura, Engenharia, Suporte administrativo, Aulas e tutoria e Outros, além das três categorias originais.

O formulário aceita até quatro arquivos JPG, PNG ou WebP de até 5 MB cada, com prévia, capa e galeria. Os arquivos ficam no bucket público `servicos-imagens`, em pastas por freelancer e serviço. Somente o backend usa a chave secreta e autoriza envio/remoção após verificar o dono do serviço. Não é necessário alterar a estrutura das tabelas. Ao escolher novos arquivos para editar um serviço, eles substituem as posições correspondentes da galeria; imagens restantes podem ser removidas individualmente.

Para preparar outro ambiente, execute `node scripts/setup-marketplace.cjs` dentro de `backend`, com as variáveis locais configuradas. O script adiciona somente categorias ausentes e cria o bucket se necessário. Não imprime credenciais.

O chat mostra o nome do contato antes da primeira mensagem, confirma o envio na tela, atualiza a conversa a cada dez segundos enquanto estiver visível e permite voltar à lista no celular. A listagem mostra até mil mensagens recentes para reunir as conversas, e cada conversa carrega até duzentas mensagens. Paginação de históricos maiores continua pendente.

`node tests/preview-server.cjs` abre uma prévia local em `127.0.0.1:8445` com dados fictícios, após o build, para conferir responsividade sem usar contas reais. Esse servidor é exclusivo para desenvolvimento e não participa do deploy.



## Nova identidade visual

A identidade azul e os tokens semânticos estão documentados em `DESIGN.md` e centralizados em `src/styles/redesign.css`. O logotipo fornecido pelo responsável está em `public/brand/tefreela-logo.jpg`; o componente `Brand` cuida da apresentação em fundos claros e escuros. `ui.tsx` reúne Button, Input, Select, Card, Badge, Avatar, Tabs, Skeleton, EmptyState e Modal. O feedback transitório usa `Toasts` e eventos locais; consultas e marcações automáticas de leitura não geram avisos repetitivos.

Home, busca, detalhes, perfil e área interna usam a mesma identidade. Os dashboards compartilham `Overview`, e a timeline e o resumo de pedidos ficam em `OrderCard`. Métricas, histórico e avaliações usam exclusivamente dados da API existente. O backend e seu contrato não foram alterados por esta reformulação.

Para testar visualmente sem contas reais: compile e execute `node tests/preview-server.cjs`. No ambiente local, `/__role/client` e `/__role/freelancer` selecionam a conta fictícia; `/__scenario/empty`, `/__scenario/error` e `/__scenario/normal` exercitam os estados da interface. Esses caminhos e dados só existem no servidor de prévia e não integram o deploy. As artes fictícias ficam em `tests/fixtures`.

O chat mantém mensagens e leitura e permite compartilhar links HTTPS de arquivos/referências. Upload binário de anexos, presença online e contagem de visualizações não foram adicionados à API. O tema usa tokens semânticos e respeita redução de movimento; não há alternância de dark mode nesta versão.
