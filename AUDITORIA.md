# Auditoria e implementação Tefreela

> Registro histórico da primeira etapa. O sistema de créditos descrito abaixo foi aposentado em 18/10/2026. As regras vigentes e testes estão em [MODELO_TAXAS.md](MODELO_TAXAS.md); não execute a migração 001.

Base: commit `955450f`, enviado pelo usuário ao GitHub. Trabalho realizado em cópia separada, na branch `melhorias/autenticacao-auditoria`. A pasta original e os arquivos de referência do projeto ChatGPT não foram alterados.

## Achados e resultado

| Área | Problema original | Implementação |
| --- | --- | --- |
| Autenticação | Frontend apenas redirecionava; login/cadastro não chamavam a API | Formulário integrado, validação, espera, erros e seleção de cliente/freelancer |
| Senhas e privacidade | Cadastro registrava senha no console; rota pública listava todos os perfis | Logs sensíveis e rotas de diagnóstico removidos |
| Sessão | Sem verificação ou logout real; rotas privadas livres | Token verificado no servidor, renovação compartilhada entre requisições, logout com revogação de refresh token e proteção contra restauração após logout |
| Autorização | Nenhuma autorização nas funcionalidades ainda mockadas | APIs verificam usuário real, proprietário, papel e participantes; identidade e preço vêm do servidor |
| Compilação | Configuração TypeScript do backend vazia; frontend ES2020 incompatível com replaceAll | Backend NodeNext com saída dist; frontend ES2021; ambos compilam |
| Banco | Somente auth tinha integração | APIs implementadas contra as tabelas fornecidas, sem criar tabelas alternativas |
| Catálogo | Serviços fictícios e duplicados, contagem fixa, busca e filtros sem efeito | Catálogo real, busca, categoria, preço, prazo, nota, ordenação, estado vazio e serviço inexistente |
| Serviços | Botões de criação e gestão inertes | Freelancer cria, edita e pausa/inativa serviços; proprietário validado no backend |
| Perfis | Nomes falsos, configurações sem página | Dados da conta autenticada, edição de nome/descrição/local/foto, perfil público do freelancer; telefone e saldo excluídos do perfil público |
| Pedidos | Lista, valores e estados fixos; contratação não criava pedido | Cliente solicita, freelancer aceita/recusa/inicia/conclui, cliente cancela nos estados permitidos; comparação do status anterior evita atualização concorrente obsoleta |
| Relatório | Exportação não funcionava | CSV de pedidos filtrados, com neutralização de fórmulas em células de texto |
| Mensagens | Envio perdido ao recarregar; conversas fictícias | Persistência, seleção e busca de conversas, marcação de leitura e atualização a cada 15 segundos enquanto a aba está visível |
| Notificações | Ícone inerte e contagens fictícias | Lista por usuário, marcação de leitura e notificações geradas por pedidos e mensagens |
| Avaliações | Notas fictícias | Cliente avalia pedido próprio concluído; constraint existente impede duplicação; notas derivadas dos registros reais |
| Portfólio | Sem gestão | Criar, editar, remover e exibir trabalhos por URL HTTPS; autorização por proprietário |
| Dashboards | Ganhos, créditos e projetos fictícios | Dados de pedidos, perfil, saldo acadêmico, serviços e avaliações |
| Créditos | Sem processamento persistente | Extrato real e endpoint que chama RPC transacional; SQL preparado, ainda NÃO executado |
| Recuperação | Link voltava ao login | Solicitação de e-mail e nova senha implementadas; redirect precisa estar autorizado no Supabase |
| Erros | Mensagens internas do banco expostas; páginas inexistentes voltavam ao início | Erros genéricos de API, erro de rota, página 404, limite de corpo e estados de espera/erro |
| Controles e marketing | Links inexistentes e promessas de dinheiro protegido/suporte/verificação | Ajuda e informações do protótipo; créditos acadêmicos explícitos; botão Google indisponível sinalizado |
| Configuração | Chaves e URLs poderiam ser copiadas indevidamente | .env ignorado; exemplos sem credenciais; chaves administrativas somente no backend; servidor local ligado ao loopback por padrão |

## Regras do pedido acadêmico

- Cliente: solicitado → cancelado; aceito → cancelado.
- Freelancer: solicitado → aceito/recusado; aceito → em_andamento; em_andamento → concluido.
- Freelancer marca a entrega concluída; cliente avalia e pode pagar com créditos acadêmicos.
- Estados concluído, cancelado e recusado não podem ser reabertos pela API.
- Não há escrow, cobrança monetária, parcelamento, pagamento antecipado ou upload de entrega nesta versão.

## Operação de créditos pendente no banco

`backend/sql/001_creditos_e_rls.sql` prepara `tefreela_pagar_pedido`, sem criar tabelas nem carregar créditos. A função:

- bloqueia pedido e saldos para evitar duplo débito e atualizações concorrentes;
- exige cliente correto e pedido concluído;
- usa valor do pedido, taxa acadêmica de 5% e saldo suficiente;
- registra débito, recebimento, pagamento e notificação na mesma transação;
- retorna o pagamento existente em reenvio, sem novo débito;
- permite execução somente ao papel service_role, usado pelo servidor.

O SQL também habilita RLS nas tabelas. Policies preexistentes não são removidas e precisam de revisão separada. Não foi aplicado SQL ao banco nem modificado saldo de usuário real. Sem a função instalada, o pagamento retorna indisponibilidade explícita.

## Verificação

- Build de produção do frontend passou.
- Verificação TypeScript do frontend e build do backend passaram.
- 23 testes HTTP/domínio do backend passaram com Supabase simulado: autorização entre contas, preço e identidades não controlados pelo cliente, transições, avaliações únicas, privacidade, mensagens, portfólio, entrada inválida e erros.
- 5 testes de sessão passaram: renovação, concorrência, indisponibilidade, refresh inválido e logout durante renovação.
- Leitura real no Supabase: categorias HTTP 200 (3 registros), serviços HTTP 200 (0 registros).
- Navegador: login, bloqueio de rota privada sem sessão, controle de visibilidade de senha, busca e filtro móvel; verificação em 1440×900 e 390×844, sem rolagem horizontal no catálogo móvel.
- Cadastro, recuperação de senha, operações de escrita e transferência de créditos NÃO foram executados contra dados reais.
- A transação PostgreSQL ainda precisa ser executada e testada no banco, inclusive reenvio, concorrência e saldo insuficiente.

## Limitações e próximos passos

1. O cadastro herdado usa criação administrativa com e-mail confirmado automaticamente. Serve ao protótipo acadêmico; substituir por fluxo de confirmação por e-mail antes de produção.
2. Autorizar `/recuperar-senha` nas Redirect URLs do Supabase e validar envio de e-mails. Google OAuth não foi configurado.
3. Aplicar e testar a RPC de créditos; revisar RLS e políticas reais antes de exposição pública.
4. Testar com contas reais de cliente e freelancer, usando registros de teste definidos pelo responsável.
5. Portfólio aceita URLs; upload de arquivo e bucket Storage não foram criados. Conversas atualizam por polling, sem WebSocket/Realtime; anexos e chamadas não existem.
6. As consultas têm limites: catálogo/pedidos/serviços 200, notificações/portfólio 100, mensagens recentes por conversa 200 e conversas derivadas das últimas 1000 mensagens. Dashboards resumem os dados carregados; implementar paginação e agregações globais se superar esses limites.
7. Favoritos são locais ao navegador e não sincronizam entre dispositivos.
8. Notificações geradas pela API são best effort: falha na notificação não repete uma gravação bem-sucedida. Adotar fila/outbox se necessário.
9. Limitação de tentativas usa memória por processo; produção com múltiplos servidores precisa de armazenamento compartilhado e configuração explícita de proxy confiável.
10. Administração, moderação, suporte externo e documentos legais de lançamento ainda não estão implementados. Contas admin não têm painel nesta versão.

Nenhuma chave foi incorporada ao código ou aos commits. O arquivo de configuração local foi utilizado apenas na cópia de trabalho ignorada pelo Git.
