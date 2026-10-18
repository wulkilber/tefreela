import { MapPin, MessageCircle, Pencil, Star } from "lucide-react"
import { useParams } from "react-router"
import PublicHeader from "../components/PublicHeader"
import ServiceCard from "../components/ServiceCard"
import { Avatar, Badge, ButtonLink, EmptyState, Skeleton } from "../components/ui"
import { categoryName, serviceCard, useData, type Profile, type ServiceRecord } from "../lib/data"
import { getSession } from "../lib/session"
export default function ProfilePage(){
 const {id}=useParams()
 const request=useData<Profile|null>(`/perfis/${id}`,null)
 const catalog=useData<ServiceRecord[]>("/servicos",[])
 const services=catalog.data.filter(service=>service.id_freelancer===id)
 const details=useData<ServiceRecord|null>(services[0]?`/servicos/${services[0].id_servico}`:null,null)
 const profile=request.data
 const own=getSession()?.usuario.id===id
 const specialties=[...new Set(services.map(service=>categoryName(service.categoria)))]
 const reviews=details.data?.avaliacoes || []
 return <div className="page-bg"><PublicHeader/><main className="container service-page">
  {request.loading && <Skeleton kind="profile"/>}
  {request.error && <p role="alert">{request.error}</p>}
  {profile && <><section className="professional-profile"><div className="profile-banner"/><div className="profile-intro"><Avatar src={profile.foto} name={profile.nome} size={100}/><div className="profile-title-row"><div><h1>{profile.nome}</h1><span className="profile-location"><MapPin/>{[profile.cidade,profile.estado].filter(Boolean).join(", ")||"Profissional da comunidade Tefreela"}</span></div><ButtonLink to={own?"/app/perfil":`/app/mensagens?usuario=${profile.id}`}>{own?<Pencil/>:<MessageCircle/>}{own?"Editar meu perfil":"Vamos conversar"}</ButtonLink></div><p className="profile-description">{profile.descricao || "Conheça os serviços e trabalhos deste profissional abaixo."}</p><div className="profile-specialties"><Badge>Freelancer</Badge>{specialties.map(name=><Badge tone="gray" key={name}>{name}</Badge>)}{!!reviews.length&&<Badge tone="amber"><Star/>{(reviews.reduce((sum,item)=>sum+item.nota,0)/reviews.length).toFixed(1)} · {reviews.length} avaliações</Badge>}</div></div></section>
  <section className="profile-section"><h2>Como posso ajudar</h2>{catalog.error&&<p role="alert">{catalog.error}</p>}<div className="services-grid">{catalog.loading?<Skeleton count={3}/>:services.map(service=><ServiceCard key={service.id_servico} service={serviceCard(service)}/>)}</div>{!catalog.loading&&!services.length&&<EmptyState title="Novos serviços estão a caminho." description="Este profissional ainda não tem serviços ativos no catálogo." to={own?"/app/servicos":undefined} action="Publicar serviço"/>}</section>
  <section className="profile-section"><h2>Trabalhos que contam histórias</h2><div className="services-grid">{profile.portfolio?.map(item=><article className="ui-card portfolio-item" key={item.id_portfolio}>{item.imagem&&<img className="portfolio-image" src={item.imagem} alt={item.titulo}/>}<h3>{item.titulo}</h3><p>{item.descricao}</p>{item.link&&<a className="text-link" href={item.link} target="_blank" rel="noreferrer">Conhecer projeto ↗</a>}</article>)}</div>{!profile.portfolio?.length&&<EmptyState title="Um portfólio em construção." description="Os próximos trabalhos deste profissional aparecerão aqui." to={own?"/app/portfolio":undefined} action="Adicionar trabalho"/>}</section>
  <section className="profile-section"><h2>Experiências de quem já contratou</h2>{details.loading&&<Skeleton kind="row"/>}{details.error&&<p role="alert">{details.error}</p>}{reviews.map(review=><article className="review-card" key={review.id_avaliacao}><div className="review-stars" aria-label={`${review.nota} de 5 estrelas`}>{Array.from({length:5},(_,index)=><Star key={index} fill={index<review.nota?"currentColor":"none"}/>)}</div><p>{review.comentario||"Avaliação sem comentário."}</p><small>{new Date(review.criado_em).toLocaleDateString("pt-BR")}</small></article>)}{!details.loading&&!reviews.length&&<EmptyState title="Cada parceria conta uma história." description="As avaliações de pedidos concluídos aparecerão aqui."/>}</section>
  </>}
 </main></div>
}
