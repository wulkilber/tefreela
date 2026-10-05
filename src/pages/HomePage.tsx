import {
  ArrowRight,
  BadgeCheck,
  Check,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  MessageSquareText,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  Zap,
} from "lucide-react";
import { Link, useNavigate } from "react-router";
import { useState } from "react";
import PublicHeader from "../components/PublicHeader";
import ServiceCard from "../components/ServiceCard";
import Brand from "../components/Brand";
import { Button, ButtonLink, Heading, SectionTitle, TextInput } from "../components/ui";
import { categories as categoryIcons } from "../data/categories";
import { categoryName, serviceCard, useData, type Category, type ServiceRecord } from "../lib/data";

export default function HomePage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const catalog = useData<ServiceRecord[]>("/servicos", []);
  const categoryData = useData<Category[]>("/categorias", []);
  const services = catalog.data.map(serviceCard);
  const categories = categoryData.data.map((value, index) => ({ name: categoryName(value), count: services.filter((service) => service.category === categoryName(value)).length, icon: categoryIcons[index % categoryIcons.length].icon, tone: categoryIcons[index % categoryIcons.length].tone }));
  const freelancers = [...new Map(services.map((service) => [service.sellerId, { id: service.sellerId, name: service.seller, avatar: service.avatar, title: service.role, skill: service.category, rating: service.rating, jobs: service.reviews }])).values()].slice(0, 4);
  const navigate = useNavigate();
  const search = () => { const params = new URLSearchParams(); if (query.trim()) params.set("q", query.trim()); if (category) params.set("categoria", category); navigate(`/explorar?${params}`); };

  return (
    <div>
      <PublicHeader />
      <main>
        <section className="hero">
          <div className="hero-glow hero-glow-one" />
          <div className="hero-glow hero-glow-two" />
          <div className="container hero-grid">
            <div className="hero-copy">
              <span className="hero-kicker"><Sparkles /> Talentos que fazem acontecer</span>
              <Heading as="h1">Encontre talento para <em>transformar</em> suas ideias.</Heading>
              <p>Conecte-se com freelancers, encontre o serviço ideal e acompanhe todo o projeto em um só lugar.</p>
              <div className="hero-actions">
                <ButtonLink to="/explorar">Encontrar serviços <ArrowRight /></ButtonLink>
                <ButtonLink to="/cadastro?tipo=freelancer" variant="secondary">Quero ser freelancer</ButtonLink>
              </div>
              <div className="hero-trust">
                <div className="avatar-stack">
                  {[18, 32, 12, 47].map((id) => <img key={id} src={`https://i.pravatar.cc/80?img=${id}`} alt="" />)}
                </div>
                <div><div className="stars"><Star fill="currentColor" /><Star fill="currentColor" /><Star fill="currentColor" /><Star fill="currentColor" /><Star fill="currentColor" /></div><span>Conecte-se com profissionais</span></div>
              </div>
            </div>
            <div className="hero-visual">
              <div className="hero-photo"><img src="https://images.unsplash.com/photo-1758874384556-cc2b9dcbb6e0?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=85&w=1080" alt="Profissional freelancer trabalhando em um notebook" /></div>
              <div className="floating-card float-job" aria-label="Exemplo ilustrativo de projeto">
                <span className="floating-icon"><BadgeCheck /></span>
                <div><strong>Projeto concluído!</strong><span>Exemplo ilustrativo</span></div>
                <Check />
              </div>
              <div className="floating-card float-rating">
                <img src="https://i.pravatar.cc/100?img=47" alt="" />
                <div><strong>Marina Costa</strong><span><Star fill="currentColor" /> 4.9 · Top freelancer</span></div>
              </div>
              <div className="availability"><span /> Encontre seu próximo talento</div>
            </div>
          </div>
          <div className="container search-panel">
            <div className="search-title"><Search /><div><strong>Encontre o especialista ideal</strong><span>Busque entre centenas de serviços</span></div></div>
            <TextInput value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Qual serviço você procura?" onKeyDown={(e) => e.key === "Enter" && search()} />
            <select aria-label="Selecionar categoria" value={category} onChange={(event) => setCategory(event.target.value)}><option value="">Todas as categorias</option>{categories.map((item) => <option key={item.name}>{item.name}</option>)}</select>
            <Button onClick={search}>Pesquisar</Button>
            <div className="popular-searches"><span>Popular:</span>{["Design de logo", "Landing page", "Social media", "Edição de vídeo"].map((item) => <Link key={item} to={`/explorar?q=${item}`}>{item}</Link>)}</div>
          </div>
        </section>

        <section className="section categories-section" id="categorias">
          <div className="container">
            <SectionTitle eyebrow="Possibilidades para todo projeto" title="Explore por categoria" description="Encontre profissionais especializados para qualquer desafio." action={<ButtonLink to="/explorar" variant="ghost">Ver todas <ArrowRight /></ButtonLink>} />
            <div className="category-grid">
              {categories.map(({ name, count, icon: Icon, tone }) => (
                <Link to={`/explorar?categoria=${name}`} className="category-card" key={name}>
                  <span className={`category-icon tone-${tone}`}><Icon /></span>
                  <div><strong>{name}</strong><span>{count} serviços</span></div>
                  <ChevronRight />
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="section soft-section">
          <div className="container">
            <SectionTitle eyebrow="Escolhas que encantam" title="Serviços em destaque" description="Explore os serviços publicados na comunidade." action={<ButtonLink to="/explorar" variant="ghost">Explorar todos <ArrowRight /></ButtonLink>} />
            {catalog.loading && <p role="status">Carregando serviços...</p>}
            {catalog.error && <p role="alert">{catalog.error} <button onClick={catalog.reload}>Tentar novamente</button></p>}
            {!catalog.loading && !catalog.error && !services.length && <p>Os primeiros serviços estarão disponíveis aqui.</p>}
            <div className="services-grid">{services.map((service) => <ServiceCard key={service.id} service={service} />)}</div>
          </div>
        </section>

        <section className="section">
          <div className="container">
            <SectionTitle eyebrow="Gente boa no que faz" title="Freelancers em destaque" description="Conheça talentos que entregam trabalho de alta qualidade." />
            <div className="freelancer-grid">
              {freelancers.map((person) => (
                <article className="freelancer-card" key={person.name}>
                  <div className="freelancer-cover" />
                  <img src={person.avatar} alt={`Foto de ${person.name}`} />
                  <BadgeCheck className="verified" />
                  <Heading as="h3">{person.name}</Heading>
                  <p>{person.title}</p>
                  <span className="skill-pill">{person.skill}</span>
                  <div className="freelancer-stats"><span><Star fill="currentColor" /> {person.rating || "Novo"}</span><span>{person.jobs} avaliações</span></div>
                  <ButtonLink to={`/perfil/${person.id}`} variant="secondary">Ver perfil</ButtonLink>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section how-section" id="como-funciona">
          <div className="container how-grid">
            <div>
              <SectionTitle eyebrow="Simples do início ao fim" title="Seu projeto pronto em 3 passos" description="Da ideia à entrega, a Tefreela deixa tudo mais claro, seguro e organizado." />
              <div className="steps">
                {[
                  { icon: Search, title: "Encontre o talento certo", text: "Explore serviços, compare avaliações e escolha com confiança." },
                  { icon: MessageSquareText, title: "Combine todos os detalhes", text: "Converse diretamente e alinhe escopo, prazo e expectativas." },
                  { icon: Zap, title: "Acompanhe e receba", text: "Tenha visibilidade do andamento até a aprovação da entrega." },
                ].map(({ icon: Icon, title, text }, index) => (
                  <div className="step" key={title}><span><Icon /></span><div><b>0{index + 1}</b><Heading as="h3">{title}</Heading><p>{text}</p></div></div>
                ))}
              </div>
            </div>
            <div className="how-visual">
              <div className="project-widget">
                <div className="project-top"><div><span>Projeto em andamento</span><strong>Nova identidade da marca</strong></div><span className="status">No prazo</span></div>
                <div className="project-people"><img src="https://i.pravatar.cc/100?img=32" alt="" /><div><strong>Beatriz Lima</strong><span>Brand Designer</span></div><MessageSquareText /></div>
                <div className="progress-label"><span>Progresso</span><strong>75%</strong></div><div className="progress"><span /></div>
                <div className="project-milestones"><span className="done"><Check /> Briefing</span><span className="done"><Check /> Conceito</span><span><Clock3 /> Entrega final</span></div>
              </div>
              <div className="mini-payment"><CircleDollarSign /><div><span>Créditos acadêmicos</span><strong>Sem dinheiro real</strong></div><ShieldCheck /></div>
            </div>
          </div>
        </section>

        <section className="benefits">
          <div className="container benefits-grid">
            {[
              { icon: ShieldCheck, title: "Créditos acadêmicos", text: "O projeto utiliza créditos de demonstração, sem dinheiro real." },
              { icon: BadgeCheck, title: "Conheça os talentos", text: "Explore perfis, portfólios e avaliações." },
              { icon: Users, title: "Comunidade de talentos", text: "Converse diretamente com clientes e freelancers." },
              { icon: Zap, title: "Contratação simples", text: "Encontre, converse e contrate em poucos passos." },
            ].map(({ icon: Icon, title, text }) => <div className="benefit" key={title}><Icon /><div><strong>{title}</strong><p>{text}</p></div></div>)}
          </div>
        </section>

        <section className="section cta-section">
          <div className="container cta">
            <div className="cta-shape" />
            <div><span>Pronto para começar?</span><Heading as="h2">Sua próxima grande ideia merece o talento certo.</Heading><p>Junte-se a milhares de clientes e freelancers construindo projetos incríveis.</p></div>
            <div className="cta-actions"><ButtonLink to="/cadastro" variant="dark">Criar conta grátis <ArrowRight /></ButtonLink><span>Sem taxas para começar</span></div>
          </div>
        </section>
      </main>
      <footer className="footer">
        <div className="container footer-grid">
          <div className="footer-brand"><Brand /><p>Conectando boas ideias aos talentos certos para realizá-las.</p><span>Brasil · Português</span></div>
          <div><strong>Descubra</strong><Link to="/explorar">Explorar serviços</Link><Link to="/explorar#categorias">Categorias</Link><Link to="/cadastro?tipo=freelancer">Seja freelancer</Link></div>
          <div><strong>Suporte</strong><Link to="/ajuda#ajuda">Central de ajuda</Link><Link to="/ajuda#seguranca">Confiança e segurança</Link><Link to="/ajuda#contato">Suporte do projeto</Link></div>
          <div><strong>Projeto</strong><Link to="/ajuda#sobre">Sobre a Tefreela</Link><Link to="/ajuda#dados">Uso do protótipo e dados</Link></div>
        </div>
        <div className="container footer-bottom"><span>© 2025 Tefreela. Todos os direitos reservados.</span><span>Feito para quem faz acontecer.</span></div>
      </footer>
    </div>
  );
}
