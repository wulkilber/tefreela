import { ArrowDown, ArrowRight, Check, CheckCheck, CircleCheck, Compass, Layers3, MessageCircle, MousePointer2, Search, ShieldCheck, Sparkles, Star, Users } from "lucide-react"
import { Link, useNavigate } from "react-router"
import { useState } from "react"
import PublicHeader from "../components/PublicHeader"
import ServiceCard from "../components/ServiceCard"
import UserCard from "../components/UserCard"
import Brand from "../components/Brand"
import { Avatar, Badge, Button, ButtonLink, EmptyState, SectionTitle, Skeleton, TextInput } from "../components/ui"
import { categories as icons } from "../data/categories"
import { categoryName, serviceCard, useData, type Category, type ServiceRecord } from "../lib/data"
export default function HomePage() {
  const [query,setQuery] = useState("")
  const catalog = useData<ServiceRecord[]>("/servicos",[])
  const categoryData = useData<Category[]>("/categorias",[])
  const featured = useData<ServiceRecord | null>(catalog.data[0] ? `/servicos/${catalog.data[0].id_servico}` : null,null)
  const services = catalog.data.map(serviceCard)
  const people = [...new Map(services.map(service => [service.sellerId,service])).values()]
  const navigate = useNavigate()
  const first = services[0]
  return <div className="new-home">
    <PublicHeader />
    <main>
      <section className="landing-hero">
        <div className="container landing-hero-grid">
          <div className="landing-copy">
            <span className="landing-kicker"><span /> Boas ideias encontram grandes talentos</span>
            <h1>Seu próximo projeto.<br />O <em>talento certo.</em></h1>
            <p>Do primeiro “olá” à última entrega. Encontre profissionais, converse sobre sua ideia e faça acontecer em um só lugar.</p>
            <form className="landing-search" onSubmit={event => {event.preventDefault();navigate(`/explorar?q=${encodeURIComponent(query.trim())}`)}}>
              <Search /><input value={query} onChange={event => setQuery(event.target.value)} aria-label="Qual serviço você procura?" placeholder="O que você quer criar hoje?" /><Button type="submit" aria-label="Buscar serviços"><ArrowRight /></Button>
            </form>
            <div className="landing-popular"><span>Explore:</span>{["Design","Programação","Marketing"].map(name=><Link key={name} to={`/explorar?categoria=${encodeURIComponent(name)}`}>{name}<ArrowRight /></Link>)}</div>
            <div className="landing-actions"><ButtonLink to="/explorar">Explorar serviços<ArrowRight /></ButtonLink><ButtonLink variant="ghost" to="/cadastro?tipo=freelancer">Sou freelancer</ButtonLink></div>
            <div className="landing-assurances"><span><ShieldCheck />Perfis e portfólios</span><span><MessageCircle />Contato direto</span><span><CircleCheck />Projetos organizados</span></div>
          </div>
          <div className="landing-composition" aria-label="Ilustração da experiência Tefreela">
            <div className="composition-orbit orbit-one" /><div className="composition-orbit orbit-two" />
            <div className="composition-label"><Sparkles /> Da sua ideia ao próximo nível</div>
            <div className="preview-project">
              <div className="preview-top"><span className="preview-dots"><i /><i /><i /></span><span>SEU PRÓXIMO PROJETO</span><Layers3 /></div>
              <div className="preview-art"><span>IDEIAS<br /><em>EM MOVIMENTO.</em></span><div className="art-loop" /><MousePointer2 className="art-cursor" /><span className="art-tag">vamos criar juntos ↗</span></div>
              <div className="preview-project-info"><div><Badge tone="blue">{first?.category || "Design & criatividade"}</Badge><h3>{first?.title || "Uma nova identidade para sua ideia"}</h3></div><ArrowRight /></div>
              <div className="preview-person"><Avatar src={first?.avatar} name="" size={34}/><div><strong>{first?.seller || "Seu próximo parceiro criativo"}</strong><span>{first ? "Conheça este profissional no catálogo" : "Composição ilustrativa da plataforma"}</span></div><span className="preview-check"><Check /></span></div>
            </div>
            <div className="preview-message"><span className="preview-message-icon"><MessageCircle /></span><div><strong>Tudo começa com uma conversa.</strong><span>Alinhe as ideias. Combine os detalhes.</span></div><CheckCheck /></div>
            <div className="preview-delivery"><span><CircleCheck /></span><div><strong>Menos distância.</strong><small>Mais possibilidades.</small></div></div>
            <div className="preview-caption">Uma prévia do que podemos construir juntos.</div>
          </div>
        </div>
        <div className="container landing-bottom"><span>CRIATIVIDADE. TECNOLOGIA. POSSIBILIDADES.</span><a href="#categorias">Encontre sua próxima parceria <ArrowDown /></a></div>
      </section>
      <section className="landing-proof"><div className="container landing-proof-grid">{[{icon:Compass,title:"Encontre seu especialista",text:"Explore serviços por categoria."},{icon:MessageCircle,title:"Converse sem complicação",text:"Combine escopo, prazo e expectativas."},{icon:Layers3,title:"Acompanhe cada etapa",text:"Pedidos, mensagens e entregas juntos."}].map(({icon:Icon,title,text})=><div key={title}><Icon /><div><strong>{title}</strong><span>{text}</span></div></div>)}</div></section>
      <section className="section" id="categorias"><div className="container">
        <SectionTitle eyebrow="Um mundo de possibilidades" title="O que sua ideia precisa?" description="Encontre o talento certo, seja qual for o próximo passo." action={<ButtonLink to="/explorar" variant="ghost">Todas as categorias<ArrowRight /></ButtonLink>}/>
        <div className="landing-categories">{categoryData.loading ? <Skeleton kind="row" count={4}/> : categoryData.data.map((category,index)=>{const Icon=icons[index%icons.length].icon; const name=categoryName(category);return <Link to={`/explorar?categoria=${encodeURIComponent(name)}`} className="landing-category" key={category.id_categoria}><span><Icon /></span><strong>{name}</strong><small>{services.filter(service=>service.category===name).length} serviços</small><ArrowRight /></Link>})}</div>
        {categoryData.error && <p role="alert">{categoryData.error}<Button variant="ghost" onClick={categoryData.reload}>Tentar novamente</Button></p>}
      </div></section>
      <section className="section landing-featured"><div className="container">
        <SectionTitle eyebrow="Seu próximo grande encontro" title="Talento em cada detalhe." description="Conheça os serviços publicados pela comunidade Tefreela." action={<ButtonLink to="/explorar" variant="secondary">Explorar marketplace<ArrowRight /></ButtonLink>}/>
        <div className="services-grid">{catalog.loading ? <Skeleton count={3}/> : services.slice(0,6).map(service=><ServiceCard key={service.id} service={service}/>)}</div>
        {catalog.error && <p role="alert">{catalog.error}<Button variant="ghost" onClick={catalog.reload}>Tentar novamente</Button></p>}
        {!catalog.loading && !catalog.error && !services.length && <EmptyState title="O próximo talento pode ser você." description="A comunidade está começando. Publique seu primeiro serviço e mostre o que você faz." to="/cadastro?tipo=freelancer" action="Quero oferecer um serviço"/>}
      </div></section>
      <section className="section"><div className="container">
        <SectionTitle eyebrow="Gente que faz acontecer" title="Conheça quem cria." description="Por trás de cada entrega, uma pessoa pronta para somar."/>
        <div className="landing-people">{people.slice(0,4).map(person=><UserCard person={person} key={person.sellerId}/>)}</div>
        {!catalog.loading && !people.length && <EmptyState title="Espaço para novos talentos." description="Os perfis dos profissionais com serviços publicados aparecerão aqui." to="/cadastro?tipo=freelancer" action="Fazer parte"/>}
      </div></section>
      <section className="section landing-how" id="como-funciona"><div className="container landing-how-grid"><div><span className="eyebrow">Simples. Do início ao fim.</span><h2>Grandes projetos<br />começam com<br /><em>uma boa conexão.</em></h2><p>Você cuida da ideia. O Tefreela ajuda a encontrar quem vai realizá-la com você.</p><ButtonLink to="/cadastro" variant="secondary">Começar meu projeto<ArrowRight /></ButtonLink></div><div className="landing-steps">{[{title:"Encontre seu profissional",text:"Explore categorias, veja trabalhos e escolha o serviço que combina com a sua ideia."},{title:"Converse e combine",text:"Alinhe o que precisa, tire dúvidas e envie sua solicitação ao freelancer."},{title:"Acompanhe e avalie",text:"Siga o andamento, receba sua entrega e compartilhe como foi a experiência."}].map((step,index)=><article key={step.title}><span>0{index+1}</span><div><h3>{step.title}</h3><p>{step.text}</p></div></article>)}</div></div></section>
      <section className="section"><div className="container landing-community"><div><span className="eyebrow">Uma comunidade em construção</span><h2>Mais conexões.<br />Mais possibilidades.</h2><p>Descubra os talentos e serviços disponíveis no catálogo. Cada nova parceria faz essa comunidade crescer.</p></div><div className="community-metrics"><div><strong>{catalog.loading ? "—" : services.length}</strong><span>serviços disponíveis</span></div><div><strong>{catalog.loading ? "—" : people.length}</strong><span>profissionais no catálogo</span></div><div><strong>{categoryData.loading ? "—" : categoryData.data.length}</strong><span>categorias para explorar</span></div></div></div></section>
      {!!featured.data?.avaliacoes?.length && <section className="section landing-featured"><div className="container"><SectionTitle eyebrow="Experiências compartilhadas" title="A palavra de quem já contratou."/><div className="landing-people">{featured.data.avaliacoes.slice(0,3).map(review=><article className="review-card" key={review.id_avaliacao}><div className="review-stars">{Array.from({length:5},(_,i)=><Star key={i} fill={i<review.nota?"currentColor":"none"}/>)}</div><p>“{review.comentario || "Avaliação enviada pela comunidade."}”</p><small>Avaliação de um pedido concluído</small></article>)}</div></div></section>}
      <section className="section"><div className="container landing-cta"><div><span>SEU TALENTO ENCONTRA SEU LUGAR.</span><h2>Vamos fazer<br />algo incrível?</h2><p>Uma boa ideia merece uma boa parceria.</p></div><div><ButtonLink to="/cadastro">Começar agora<ArrowRight /></ButtonLink><ButtonLink to="/cadastro?tipo=freelancer" variant="ghost">Quero oferecer meus serviços</ButtonLink></div><div className="cta-orbit"/></div></section>
    </main>
    <footer className="footer"><div className="container footer-grid"><div className="footer-brand"><Brand/><p>Talentos locais. Grandes ideias.<br/>Conexões que fazem acontecer.</p><span>Brasil · Português</span></div><div><strong>Explore</strong><Link to="/explorar">Encontrar serviços</Link><Link to="/#categorias">Categorias</Link><Link to="/cadastro?tipo=freelancer">Seja freelancer</Link></div><div><strong>Tefreela</strong><Link to="/ajuda#sobre">Sobre a comunidade</Link><Link to="/#como-funciona">Como funciona</Link><Link to="/ajuda#dados">Sobre esta versão</Link></div><div><strong>Podemos ajudar?</strong><Link to="/ajuda">Central de ajuda</Link><Link to="/ajuda#seguranca">Confiança e segurança</Link><Link to="/ajuda#contato">Suporte do projeto</Link></div></div><div className="container footer-bottom"><span>© {new Date().getFullYear()} Tefreela. Feito para quem faz acontecer.</span><span>Versão acadêmica · Sem transações em dinheiro real</span></div></footer>
  </div>
}
