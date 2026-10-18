# Validação da identidade azul — 18/10/2026

## Ambiente

Build de produção servido por tests/preview-server.cjs, restrito a 127.0.0.1, com contas fictícias e fixtures locais. Nenhuma gravação de teste em usuários reais ou Supabase. O backend de produção não foi modificado.

## Rotas e responsividade

- Desktop: Home, explorar, serviço, perfil público, login, cadastro, recuperação, ajuda, 404 e todas as sete páginas de gerenciamento/pedidos/mensagens.
- Freelancer: dashboard com pedidos, avaliações, saldo, atividade mensal e ganhos processados.
- Cliente: dashboard próprio e indicador ativo correto na sidebar.
- Celular (390px): Home, explorar, serviço, perfil, login/cadastro, dashboards, pedidos, mensagens, perfil privado, serviços, portfólio, notificações e créditos. Sem rolagem horizontal da página.
- Tablet (768px): dashboard cliente, pedidos, explorar e detalhe de serviço, sem rolagem horizontal da página.
- Menu móvel: abertura, overlay, foco inicial e fechamento por Escape.
- Chat móvel: conversa selecionada, histórico, envio de texto, feedback e revisão/envio de link HTTPS.
- Formulário de serviço: criação com título, descrição, categoria Outros, preço e prazo, confirmação e presença do novo item na lista.
- Filtros móveis: seleção de Outros, aplicação e chip ativo.
- Portfólio: abertura do modal de remoção e cancelamento por Escape, sem excluir o item.
- Estados vazios: pedidos e notificações; erro de API: mensagem legível em pedidos.

## Verificações automatizadas

- TypeScript sem emissão e build Vite.
- 8 testes de sessão/feedback.
- 25 testes de backend: autenticação, isolamento de dados, pedidos, mensagens, portfólio, upload e limites.
- 5 testes do servidor publicado, com entrada HTML preservada nas 16 rotas existentes, health check, API privada protegida e logotipo JPEG válido no deploy.

Os testes de backend/deploy passaram isoladamente. Uma execução simultânea compilando a mesma pasta excedeu o prazo de inicialização dos processos locais; a repetição sem compilação concorrente passou.

## Limites preservados

Não há dados de presença online nem visualizações de serviços na API, portanto não são apresentados como métricas. Arquivos no chat são compartilhados por link; upload binário privado requer implementação adicional. Dark mode não está ativado. Pagamentos continuam sendo créditos acadêmicos. Os testes visuais confirmam o frontend com fixtures; não substituem homologação com duas contas reais no ambiente publicado.
