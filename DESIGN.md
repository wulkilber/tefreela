# Tefreela — identidade azul

## Direção e inventário

Marketplace editorial: fundo gelo, títulos fortes, azul vivo para ações e azul marinho para branding. A Home combina busca e uma composição da experiência de projeto; a área interna prioriza leitura, navegação e acompanhamento.

Páginas analisadas: Home, explorar, serviço, perfil público, login/cadastro, recuperação, dashboards cliente/freelancer, pedidos, mensagens, gerenciamento de perfil/serviços/portfólio/notificações/créditos, ajuda e erro de rota. Reutilizar Brand, PublicHeader, AppShell, ServiceCard e a biblioteca ui. As rotas e contratos de API permanecem.

## Tokens

- Marca: #2563EB; hover #1D4ED8; institucional #1E3A8A.
- Superfície: #FFFFFF; canvas #F8FAFC; destaque #EFF6FF; borda #E2E8F0.
- Texto: #0F172A; secundário #64748B.
- Sucesso #15803D sobre #F0FDF4; aviso #92400E sobre #FFFBEB; erro #B91C1C sobre #FEF2F2.
- Inter; corpo 15–16px, rótulos 13–14px, títulos 24–64px.
- Espaçamento: 4, 8, 12, 16, 24, 32, 48, 64, 96px.
- Raios: 12, 16, 20px. Sombra sutil; foco visível azul.
- Movimento 200–300ms com suporte a prefers-reduced-motion.

## Componentes e aplicação

Tokens semânticos centralizados permitem tema alternativo futuro. Button/Input e novos Card, Badge, Avatar, Tabs, Toast, Skeleton, EmptyState e Modal compartilham os mesmos estados. Layout público e área interna recebem a mesma linguagem, com navegação móvel acessível. Pedidos recebem timeline, notificações agrupamento, catálogo chips e perfil seções profissionais.

Métricas, avaliações e gráficos devem refletir dados reais da API. Não inventar depoimentos, visualizações nem presença online. O chat permite compartilhar referências e arquivos por link HTTPS, com revisão antes de enviar. Upload binário de anexos e presença online requerem suporte adicional da API; não simular esses recursos. Não alterar regras de pagamentos/autenticação.

O logotipo enviado pelo responsável foi incorporado em public/brand/tefreela-logo.jpg sem alterar a arte original. O componente Brand recorta sua apresentação em círculo com CSS e combina o símbolo com um wordmark legível, com versões de contraste para fundos claros e escuros.

## Validação

Compilação TypeScript/Vite, testes de sessão/backend/deploy e navegação visual com fixtures locais para todas as rotas, incluindo estados vazios, erro, permissões e tamanhos desktop/tablet/celular. Nenhum teste visual deve escrever em contas reais.
