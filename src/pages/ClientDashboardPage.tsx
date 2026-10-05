import { ArrowRight, BriefcaseBusiness, CheckCircle2, Clock3, Heart, MessageCircle, Search, WalletCards } from "lucide-react";
import AppShell from "../components/AppShell";
import ServiceCard from "../components/ServiceCard";
import { ButtonLink, Heading, TextInput } from "../components/ui";
import { services } from "../data/mock";

export default function ClientDashboardPage() {
  return (
    <AppShell title="Início" role="cliente">
      <section className="client-hero">
        <div>
          <span>Boas-vindas à Tefreela</span>
          <Heading as="h2">Qual ideia vamos tirar do papel hoje?</Heading>
          <p>Encontre profissionais avaliados e acompanhe tudo em um só lugar.</p>
          <div><TextInput icon={<Search />} placeholder="Busque por design, programação, marketing..." /><ButtonLink to="/explorar">Buscar talentos</ButtonLink></div>
        </div>
      </section>
      <section className="client-stats">
        <article><span><BriefcaseBusiness /></span><div><strong>3</strong><small>Projetos ativos</small></div></article>
        <article><span><Clock3 /></span><div><strong>1</strong><small>Aguardando entrega</small></div></article>
        <article><span><WalletCards /></span><div><strong>R$ 320</strong><small>Créditos disponíveis</small></div></article>
        <article><span><Heart /></span><div><strong>8</strong><small>Serviços salvos</small></div></article>
      </section>
      <section className="dashboard-grid">
        <div className="panel client-projects">
          <div className="panel-head"><div><Heading as="h3">Projetos em andamento</Heading><p>Acompanhe cada etapa das suas contratações.</p></div><ButtonLink to="/app/pedidos" variant="ghost">Ver todos <ArrowRight /></ButtonLink></div>
          {[
            { title: "Identidade visual — Lume Café", person: "Marina Costa", progress: 70, status: "Entrega em 3 dias", avatar: 47 },
            { title: "Landing page institucional", person: "Lucas Ribeiro", progress: 40, status: "Entrega em 8 dias", avatar: 12 },
          ].map((project) => <article key={project.title}><img src={`https://i.pravatar.cc/100?img=${project.avatar}`} alt="" /><div><strong>{project.title}</strong><span>com {project.person}</span><div className="client-progress"><span style={{ width: `${project.progress}%` }} /></div></div><small>{project.status}</small><ButtonLink to="/app/mensagens" variant="ghost"><MessageCircle /></ButtonLink></article>)}
        </div>
        <div className="panel client-tip">
          <CheckCircle2 />
          <Heading as="h3">Contrate com segurança</Heading>
          <p>O pagamento fica protegido até você aprovar a entrega final.</p>
          <ButtonLink to="/#como-funciona" variant="secondary">Saiba como funciona</ButtonLink>
        </div>
      </section>
      <section className="client-recommendations">
        <div className="panel-head"><div><Heading as="h3">Recomendados para você</Heading><p>Com base nos seus projetos recentes.</p></div><ButtonLink to="/explorar" variant="ghost">Explorar marketplace <ArrowRight /></ButtonLink></div>
        <div className="services-grid">{services.slice(0, 3).map((service) => <ServiceCard key={service.id} service={service} />)}</div>
      </section>
    </AppShell>
  );
}
