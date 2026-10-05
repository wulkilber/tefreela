import { ArrowLeft, BadgeCheck, Check, Clock3, Heart, MessageCircle, RefreshCw, ShieldCheck, Star } from "lucide-react";
import { useParams, Link } from "react-router";
import PublicHeader from "../components/PublicHeader";
import { Button, ButtonLink, Heading } from "../components/ui";
import { services } from "../data/mock";

export default function ServicePage() {
  const { id } = useParams();
  const service = services.find((item) => item.id === id);
  if (!service) return <div className="page-bg"><PublicHeader /><main className="container service-page"><Heading as="h1">Serviço não encontrado</Heading><ButtonLink to="/explorar">Voltar para serviços</ButtonLink></main></div>;
  return (
    <div className="page-bg">
      <PublicHeader />
      <main className="container service-page">
        <Link className="back-link" to="/explorar"><ArrowLeft /> Voltar para serviços</Link>
        <div className="service-detail-grid">
          <div className="service-detail-main">
            <span className="service-category">{service.category}</span>
            <Heading as="h1">{service.title}</Heading>
            <div className="detail-seller"><img src={service.avatar} alt="" /><div><strong>{service.seller} <BadgeCheck /></strong><span>{service.role}</span></div><span className="rating"><Star fill="currentColor" /> <strong>{service.rating}</strong> ({service.reviews} avaliações)</span></div>
            <img className="detail-cover" src={service.image} alt="Exemplo visual do serviço" />
            <section className="detail-section"><Heading as="h2">Sobre este serviço</Heading><p>Vou transformar a essência da sua marca em uma identidade visual estratégica, original e pronta para se destacar. O processo é colaborativo e pensado para criar um resultado que faça sentido para seu público e para o futuro do seu negócio.</p><p>Você receberá arquivos organizados, orientações de uso e todo o suporte necessário durante o projeto.</p></section>
            <section className="detail-section"><Heading as="h2">O que está incluído</Heading><div className="included-grid">{["Briefing estratégico", "2 propostas de conceito", "Paleta de cores e tipografia", "Aplicações da marca", "Arquivos editáveis", "Manual de identidade"].map((item) => <span key={item}><Check /> {item}</span>)}</div></section>
            <section className="detail-section seller-profile"><img src={service.avatar} alt="" /><div><Heading as="h3">{service.seller}</Heading><p>{service.role} · São Paulo, Brasil</p><div><span><Star fill="currentColor" /> {service.rating} avaliação</span><span>184 projetos concluídos</span><span>Responde em até 1h</span></div><Button variant="secondary"><MessageCircle /> Falar com freelancer</Button></div></section>
          </div>
          <aside className="purchase-card">
            <div className="purchase-top"><span>Pacote completo</span><Button variant="ghost"><Heart /></Button></div>
            <div className="purchase-price"><span>A partir de</span><strong>R$ {service.price}</strong><small>ou 3x sem juros</small></div>
            <p>Identidade visual profissional com tudo que sua marca precisa para começar.</p>
            <div className="purchase-meta"><span><Clock3 /> Entrega em {service.delivery}</span><span><RefreshCw /> 2 revisões incluídas</span></div>
            <ButtonLink to="/cadastro" className="purchase-button">Continuar contratação</ButtonLink>
            <Button variant="secondary" className="purchase-button"><MessageCircle /> Conversar antes</Button>
            <div className="safe-purchase"><ShieldCheck /><div><strong>Compra 100% protegida</strong><span>Pagamento liberado só após sua aprovação.</span></div></div>
          </aside>
        </div>
      </main>
    </div>
  );
}
