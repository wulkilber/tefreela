# Publicar no Render conectado ao GitHub

O frontend e o backend são servidos juntos, com HTTPS e API em /api. O computador pode ficar desligado. Não é necessário tornar o repositório público.

1. Crie uma conta em https://render.com e conecte seu GitHub.
2. No painel, selecione New → Blueprint.
3. Autorize somente o repositório wulkilber/tefreela e selecione a branch melhorias/autenticacao-auditoria.
4. O Render deve detectar render.yaml. Confira o plano Free antes de continuar.
5. Preencha SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY e SUPABASE_SECRET_KEY com os valores do backend/.env local. Faça isso apenas no painel do Render. Não envie as chaves pelo chat ou ao GitHub.
6. Aplique o Blueprint e aguarde a publicação. A URL definitiva é a exibida pelo Render; não é possível garantir antecipadamente o nome do subdomínio.
7. No Supabase, autorize a URL pública seguida de /recuperar-senha em Authentication → URL Configuration → Redirect URLs. Use a URL pública como Site URL.
8. Teste cadastro, login e os fluxos com contas de teste. A função de créditos e a revisão de RLS descritas em AUDITORIA.md ainda são necessárias.

O plano gratuito pode suspender o serviço após inatividade, deixando o primeiro acesso mais lento. Verifique os limites e preços vigentes antes de aceitar qualquer plano pago.

## Verificação após publicação

- / deve abrir a interface;
- /entrar e /app/pedidos devem funcionar também ao atualizar a página;
- /api/health deve retornar status ok;
- /api/auth/me deve rejeitar acessos sem token;
- nenhuma chave administrativa deve estar no frontend compilado.

O arquivo render.yaml contém configurações e nomes de variáveis, sem segredos. A publicação ainda depende de criar a conta e conectar o repositório; preparar esses arquivos não coloca o serviço no ar.
