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

## Banco e financeiro simulado

Clientes não possuem carteira ou saldo interno e não pagam taxa à plataforma. A taxa do freelancer nasce apenas quando o pedido é concluído. Não há gateway, cartão, Pix ou movimentação de dinheiro real.

Antes de publicar a API, execute [backend/sql/002_taxas_plataforma.sql](backend/sql/002_taxas_plataforma.sql) no SQL Editor. Ela cria configuração central, taxas, trigger transacional, RLS e RPCs restritas ao servidor. O percentual inicial está definido somente na configuração do banco; futuras alterações preservam os valores históricos. O resumo agrega todo o histórico com NUMERIC; a listagem possui paginação de 20 registros.

A migração inclui pedidos já concluídos, com uma taxa simulada única por pedido. O responsável informou execução bem-sucedida em 18/10/2026, e a API de dados confirmou configuração e resumo disponíveis. Não execute a migração antiga 001.

A aplicação não lê nem modifica saldo_creditos, movimentacoes_creditos ou pagamentos. Os dados antigos continuam preservados. [003_arquivar_creditos_MANUAL.sql](backend/sql/003_arquivar_creditos_MANUAL.sql) contém uma proposta comentada de remoção futura, dependente de backup e revisão; não foi executada.

A nova área `/app/financeiro` é exclusiva do freelancer. O link antigo `/app/creditos` redireciona para ela; clientes são enviados ao próprio painel. Endpoints antigos de créditos e pagamento respondem HTTP 410 após autenticação.

Cadastro exige senha de oito caracteres, uma letra e um número, além de confirmação idêntica no frontend e backend. A confirmação não é salva. Senhas continuam exclusivamente no Supabase Auth. Logins antigos continuam aceitando suas credenciais existentes.

Consulte [MODELO_TAXAS.md](MODELO_TAXAS.md) para regras, validação e operação.
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

São 18 testes de sessão, tema, menus e feedback e 37 testes de backend, incluindo PostgreSQL isolado com PGlite e serviço HTTP simulado. Nenhum deles depende do banco real. A configuração antiga do formatador oxfmt 0.2 pode remover separadores de tipos na mesma linha; conferir TypeScript após usá-lo.

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

O chat mantém mensagens e leitura e permite compartilhar links HTTPS de arquivos/referências. Upload binário de anexos, presença online e contagem de visualizações não foram adicionados à API. O tema usa tokens semânticos e respeita redução de movimento; há alternância persistida entre temas claro e escuro.

Refinamento de sessão, temas, perfil e avatares: consulte [RELATORIO_REFINAMENTO.md](RELATORIO_REFINAMENTO.md). O bucket `avatars` deve ser público, limitar arquivos a 5 MB e aceitar JPEG/PNG/WebP. O script `backend/scripts/setup-avatars.cjs` prepara o bucket usando somente as credenciais do servidor; execute apenas com autorização para exposição pública das fotos.

## Excluir conversas

Na lista de Mensagens ou dentro de uma conversa, use o menu de três pontos → Excluir conversa → Excluir do meu histórico. A confirmação permite cancelar, mostra falhas e bloqueia envio repetido durante a exclusão.

Antes de publicar em outro ambiente, execute `backend/sql/004_excluir_conversas.sql`. O responsável executou a migração e as colunas foram confirmadas por leitura em 18/10/2026. São marcadores de exclusão por participante: nenhum registro é apagado fisicamente, a outra pessoa mantém a cópia dela e mensagens novas fazem a conversa reaparecer sem restaurar o histórico oculto. As flags internas não são devolvidas pela API de mensagens. A RPC é exclusiva do servidor, que usa o usuário do token; identidades enviadas no corpo são ignoradas.

A exclusão funciona após recarga e em outros dispositivos. Requisições antigas de atualização são descartadas ao excluir; mensagens próprias antigas não são recuperadas indevidamente pelo polling. Os limites existentes permanecem: até mil mensagens recentes para reunir conversas e duzentas por conversa.

Validação desta etapa: 62 testes automatizados aprovados (18 frontend, 39 backend/SQL e 5 publicação), TypeScript/builds e 18 verificações do modal nos dois temas nas larguras 320, 375, 390, 430, 768, 1024, 1280, 1440 e 1920. Evidência em `tests/chat-delete-responsive-audit.json`. Testes interativos locais: cancelamento, erro sem perder dados, exclusão pela lista no celular, exclusão pelo cabeçalho no desktop, recarga, preservação da outra conta e retorno apenas da mensagem nova. Não foram excluídas conversas reais nos testes. Aparelhos físicos ainda precisam de homologação.
