# Auditoria Tefreela

Base: commit 955450f enviado ao GitHub. Alterações realizadas em cópia separada; a pasta original não foi modificada.

## Prioridades e achados

| Prioridade | Área | Estado encontrado | Correção / pendência |
| --- | --- | --- | --- |
| Crítica | Privacidade | `/teste-profile` listava todos os perfis com cliente administrativo, sem autenticação | Rota removida; teste verifica resposta 404 |
| Crítica | Credenciais | Cadastro registrava corpo completo, incluindo senha, no console | Log removido, assim como logs de dados pessoais do login |
| Alta | Login e cadastro | Formulário do frontend apenas redirecionava, sem chamar backend | Formulário conectado; validação, bloqueio de envio repetido e mensagens de erro |
| Alta | Rotas privadas | Qualquer visitante acessava `/app` | Validação do token no backend em `/api/auth/me`; redirecionamento por papel |
| Alta | Isolamento de autenticação | Cliente Supabase Auth compartilhado por requisições | Cliente independente por operação; cliente administrativo permanece somente no backend |
| Alta | Backend | `tsconfig.json` vazio | Configuração de compilação NodeNext com saída em `dist` |
| Alta | Cadastro seguro | Conta criada com `email_confirm: true` | Ainda precisa configurar confirmação de e-mail e proteção contra abuso; não considerar produção pronta |
| Alta | Sessão | Não havia sessão real ou logout | Sessão por aba e logout local; renovação automática e revogação remota ainda pendentes |
| Alta | Serviços | Catálogo e perfis importados de `src/data/mock.ts`; sem API de serviços | Busca, filtros e ordenação locais corrigidos; persistência depende da estrutura existente |
| Alta | Contratação | Botão levava ao cadastro sem criar pedido | Falta criação transacional, preço calculado no servidor e autorização por participante |
| Alta | Pedidos | Lista, contagens, valores e andamento fixos | Faltam endpoints, controle de estados, entrega e aprovação; exportação e abas não funcionam |
| Alta | Mensagens | Conversas fixas; envio apenas em estado React, perdido ao recarregar | Faltam persistência, autorização de participantes, leitura e atualização entre usuários |
| Alta | Banco e RLS | Repositório não contém schema SQL, migrações nem políticas | Usuário confirmou tabelas existentes; estrutura, relações e RLS ainda precisam ser fornecidas |
| Média | Perfis | Nomes e avatares falsos na navegação; configuração e edição sem fluxo | Navegação usa identidade autenticada; edição e página pública pendentes |
| Média | Notificações | Ícone e contagens fixos; sem ação | Faltam notificações persistentes e marcação de leitura |
| Média | Avaliações | Notas e contagens fictícias | Falta vínculo com pedido concluído e proteção contra avaliações duplicadas |
| Média | Portfólio | Imagens e descrição de serviço fixas; sem upload ou gestão | Faltam armazenamento, políticas de acesso e vínculo ao proprietário |
| Média | Dashboard | Ganhos, visitas, créditos, conversão e projetos fictícios | Substituir por agregações reais; não apresentar esses números como saldo efetivo |
| Média | Marketplace | Resultados duplicados, contagem 436 fixa, filtros sem efeito, ID inválido mostrava primeiro serviço | Removida duplicação; contagem real do catálogo de demonstração, filtros e estado vazio; ID inválido exibe erro |
| Média | OAuth / recuperação | Botão Google inerte e recuperação apontava ao próprio login | Google sinalizado indisponível e controle de recuperação inoperante removido; implementar fluxos reais |
| Média | Termos e links | Termos, privacidade, ajuda, configurações e novo serviço apontam a âncoras inexistentes | Conteúdo e rotas ainda pendentes; aceite visual não substitui publicação dos documentos |
| Média | Créditos / pagamentos | Interface afirma proteção de pagamento sem integração correspondente | Integração e conciliação pendentes; não processar cobranças antes de concluir |
| Média | Erros e API | Erros internos do banco enviados ao cliente; CORS irrestrito | Mensagens genéricas, CORS por origem, limite de corpo e erros JSON padronizados |

## Verificação realizada

- Build do frontend passou.
- Verificação TypeScript do frontend passou após ajuste ES2021 para `replaceAll`.
- Build do backend passou.
- Sete testes locais do backend passaram: health check, remoção de diagnósticos, exigência de token, validação de entrada, JSON inválido, limite de corpo e CORS.
- Testes usam URL e chaves fictícias; não acessam o Supabase real.
- Cadastro/login com usuários reais, expiração de token, persistência e permissões RLS ainda não foram testados.
- Não foi feita verificação visual em navegador nesta etapa.

## Próxima etapa

Obter somente a estrutura SQL, relações, constraints, triggers, policies e configuração de confirmação de e-mail existentes. Não enviar dados de usuários ou credenciais. Com essa referência, implementar serviços, pedidos e mensagens respeitando o schema atual, seguido de notificações, avaliações e portfólio.

Antes de produção: confirmação de e-mail, recuperação de senha, limitação de tentativas, renovação/revogação de sessão, políticas de acesso e testes de isolamento entre contas.
