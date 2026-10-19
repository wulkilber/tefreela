# Cadastro e taxas simuladas — 18/10/2026

## Modelo vigente

O cliente procura, solicita e acompanha serviços sem taxa interna, carteira ou saldo. O freelancer publica e executa serviços normalmente, mesmo com taxas pendentes. Ao concluir cada pedido, surge uma única taxa simulada. Nenhum dinheiro, cartão, conta bancária ou gateway é utilizado.

A configuração central fica em `configuracao_financeira.percentual_taxa` (registro singleton). A migração define o percentual inicial; a API e a interface leem o banco, sem constantes duplicadas. Cada taxa guarda valor, percentual, líquido e data de conclusão daquela operação. Alterar a configuração afeta somente novas taxas.

O cálculo ocorre no servidor PostgreSQL com NUMERIC e arredondamento decimal para centavos. Não há cálculo financeiro confiado ao navegador. A trigger é executada na mesma transação da conclusão: uma falha desfaz ambas as alterações. A constraint UNIQUE em pedido_id e ON CONFLICT DO NOTHING impedem duplicações, inclusive em repetição/concorrência. A API trata repetir a conclusão do próprio pedido como operação idempotente. A [documentação do PostgreSQL](https://www.postgresql.org/docs/current/trigger-definition.html) descreve a atomicidade das triggers.

O pagamento fictício bloqueia a linha da taxa, valida dono/papel/pedido concluído e registra status paga e pago_em. Repetir a ação retorna o mesmo registro sem trocar a data. Taxas canceladas não podem ser simuladas. A aplicação não implementa bloqueio por dívida, cobrança automática ou prazos.

## Cadastro

- Confirmação obrigatória no formulário e no servidor.
- Oito caracteres, uma letra e um número; requisitos e coincidência visíveis durante a digitação.
- Mostrar/ocultar independente para os dois campos; erro não aparece antes de preencher a confirmação.
- Senha e confirmação nunca são gravadas em profiles. A senha é enviada exclusivamente ao Supabase Auth; confirmação é descartada após validar.
- Nome, e-mail, tipo, telefone, cidade e estado são validados. O backend comunica e-mail duplicado por código do Supabase.
- Bloqueio de envio duplicado e preservação do estado de conta criada se a entrada automática falhar, evitando cadastrar novamente.
- A nova regra se aplica ao cadastro; contas antigas continuam podendo entrar com suas senhas atuais.

## Migrações e arquivos antigos

1. `backend/sql/002_taxas_plataforma.sql`: não destrutiva e repetível. Cria configuração, taxas, RLS, índices, trigger, RPCs e registros dos pedidos já concluídos. O responsável executou e confirmou sucesso; leitura do Supabase encontrou configuração em 5%, três taxas existentes e RPC de resumo disponível.
2. `backend/sql/001_creditos_e_rls.sql`: aposentada e bloqueada para não reativar o modelo antigo. Versão anterior disponível no histórico Git.
3. `backend/sql/003_arquivar_creditos_MANUAL.sql`: limpeza futura comentada. Só após backup/exportação, revisão de dependências e homologação. NÃO executada.

Nenhuma coluna ou tabela antiga foi apagada e nenhum saldo legado foi movimentado. A aplicação deixou de ler essas estruturas. Endpoints antigos de créditos/pagamento devolvem 410 depois de autenticar, sem chamar a RPC antiga. A URL antiga da interface redireciona para Financeiro; clientes são redirecionados ao painel do cliente.

## API e segurança

- GET `/api/taxas/minhas?page=1`: apenas do freelancer autenticado; 20 registros por página, contagem total e vínculos com serviço/cliente.
- GET `/api/taxas/resumo`: agrega todo o histórico no servidor, sem limitar os totais à página carregada.
- POST `/api/taxas/:id/simular-pagamento`: ignora identidades, valores e percentuais enviados pelo navegador; usa a sessão verificada.
- Cliente recebe 403 nas rotas financeiras. Outro freelancer não lê nem altera a taxa alheia.
- Banco: leitura própria protegida por RLS; escrita e RPCs restritas a service_role. Nenhuma chave administrativa no frontend ou Git.

## Interface

Financeiro e resumo do dashboard mostram bruto, taxas, líquido estimado, pendências, datas e status. Histórico paginado vira cards em telas menores. Modal com resumo e aviso de simulação, estados de espera, vazio e erro, confirmação por toast. Os temas atuais e a identidade azul foram preservados.

O painel do cliente usa pedidos ativos/concluídos, mensagens não lidas e favoritos locais. Os detalhes internos de taxa não aparecem no fluxo do cliente. Catálogo, serviços, ajuda, menus, formulários e pedidos deixaram de anunciar valores em créditos.

## Testes

- 18 testes frontend de sessão, concorrência, renovação, tema, menus e feedback.
- 37 testes backend: 31 de HTTP/domínio e 6 executando a migração em PostgreSQL local isolado (PGlite).
- 5 testes de publicação, incluindo recarga da rota Financeiro e API protegida.
- TypeScript e builds frontend/backend aprovados.
- Cadastro: válido de cliente e freelancer, confirmação divergente/ausente, senha curta/sem letra/sem número, campos vazios, e-mail duplicado, login e restauração após recarga. Confirmação e senha ausentes do perfil armazenado.
- Taxas: demais estados sem taxa; conclusão e repetição com taxa única; arredondamento de meio centavo; snapshot preservado ao alterar percentual; rollback de conclusão; simulação idempotente; identidade e percentual não controlados pelo navegador; cliente e outro freelancer bloqueados; RLS e permissões testadas. Publicação de serviço não bloqueada por taxa pendente.
- Navegador local: cadastro e login de ambos os papéis, confirmação dinâmica e olhos; favorito atualiza métrica; cliente solicita sem carteira; freelancer aceita/inicia/conclui; taxa surge e pagamento fictício muda para paga; modal em 320 px; estados vazio e erro.
- Revisão inicial: 216 verificações responsivas nas telas afetadas. Evidência final salva em `tests/fees-responsive-audit.json`: 180 verificações em nove larguras nos dois temas para cliente/freelancer, sem overflow nem erro de renderização. Larguras reais: 320, 375, 390, 430, 768, 1024, 1280, 1440 e 1920. Cliente não acessou Financeiro nem pelo link antigo.
- Console da conferência final sem erros. As falhas de API exercitadas intencionalmente no cenário de indisponibilidade foram tratadas na interface.

## Limites de homologação

As operações de cadastro, contratação, conclusão e pagamento fictício dos testes usaram contas e banco locais isolados. No ambiente real foi conferida por leitura a migração executada pelo usuário. Não foram criadas contas reais nem alterados pedidos ou taxas reais durante os testes.

Navegador redimensionado não substitui aparelhos físicos: falta homologar Safari/iOS, Chrome/Android e teclado virtual real. SMTP/recuperação, OAuth e confirmação de e-mail para lançamento público permanecem com as limitações já documentadas. Dados do modelo antigo devem continuar arquivados até a revisão de remoção.
