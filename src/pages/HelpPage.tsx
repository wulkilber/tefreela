import PublicHeader from "../components/PublicHeader"
import { ButtonLink, Heading } from "../components/ui"
export default function HelpPage() {
  return (
    <div className="page-bg">
      <PublicHeader />
      <main className="container service-page help-content">
        <Heading as="h1">Sobre o projeto e ajuda</Heading>
        <section className="panel" id="sobre">
          <Heading as="h2">Tefreela</Heading>
          <p>
            Protótipo acadêmico para conectar clientes e freelancers. Os
            pagamentos utilizam créditos fictícios e não movimentam dinheiro
            real.
          </p>
        </section>
        <section className="panel" id="ajuda">
          <Heading as="h2">Como usar</Heading>
          <p>
            Crie uma conta como cliente para solicitar serviços. Como
            freelancer, complete seu perfil, publique serviços e adicione
            trabalhos ao portfólio. Acompanhe os pedidos e converse pela área de
            mensagens.
          </p>
          <p>
            O freelancer aceita o pedido, inicia o trabalho e marca a entrega
            como concluída. O cliente pode avaliar a entrega e pagar com
            créditos acadêmicos disponíveis.
          </p>
          <ButtonLink to="/explorar">Explorar serviços</ButtonLink>
        </section>
        <section className="panel" id="seguranca">
          <Heading as="h2">Segurança e dados</Heading>
          <p>
            As contas são autenticadas pelo Supabase. Perfis de freelancers e
            portfólios são públicos. Pedidos, mensagens, notificações e saldos
            são acessíveis pela API conforme o usuário participante.
          </p>
          <p>
            A sessão é mantida neste navegador e compartilhada entre abas. Use Sair ao terminar, especialmente em dispositivos compartilhados. Links
            e imagens de portfólio podem levar a sites externos.
          </p>
          <p>
            Esta versão ainda precisa de revisão das políticas do banco e
            confirmação de e-mail antes de uso em produção. Evite inserir
            documentos, dados bancários ou informações sensíveis.
          </p>
        </section>
        <section className="panel" id="contato">
          <Heading as="h2">Suporte</Heading>
          <p>
            O canal oficial de suporte ainda não foi configurado. Para problemas
            nesta versão acadêmica, fale com o responsável pelo projeto. Não há
            equipe de atendimento disponível pela aplicação.
          </p>
        </section>
        <section className="panel" id="dados">
          <Heading as="h2">Uso do protótipo</Heading>
          <p>
            Esta página explica o funcionamento da versão acadêmica. Os termos
            de uso e a política de privacidade para uma versão pública precisam
            ser definidos pelo responsável pelo projeto antes do lançamento.
          </p>
        </section>
      </main>
    </div>
  )
}
