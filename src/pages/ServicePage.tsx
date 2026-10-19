import { ArrowLeft, Clock3, MessageCircle, Star } from "lucide-react"
import { useParams, Link, useNavigate } from "react-router"
import { useState } from "react"
import PublicHeader from "../components/PublicHeader"
import { Button, ButtonLink, EmptyState, Heading, Skeleton } from "../components/ui"
import { money, serviceCard, useData, type ServiceRecord } from "../lib/data"
import { api, getSession } from "../lib/session"

export default function ServicePage() {
  const { id } = useParams()
  const request = useData<ServiceRecord | null>(`/servicos/${id}`, null)
  const [description, setDescription] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [activeImage, setActiveImage] = useState(0)
  const navigate = useNavigate()
  const record = request.data
  const service = record ? serviceCard(record) : null
  async function purchase(event: React.FormEvent) {
    event.preventDefault()
    if (!getSession()) {
      navigate("/entrar")
      return
    }
    setBusy(true)
    setError("")
    try {
      await api("/pedidos", {
        id_servico: Number(id),
        descricao_solicitacao: description,
      })
      navigate("/app/pedidos")
    } catch (error) {
      setError((error as Error).message)
    } finally {
      setBusy(false)
    }
  }
  function converse() {
    if (getSession()?.usuario.id === record?.id_freelancer) { navigate("/app/servicos"); return }
    navigate(
      getSession()
        ? `/app/mensagens?usuario=${record?.id_freelancer}&servico=${id}`
        : "/entrar",
      getSession() ? undefined : { state: { from: `/app/mensagens?usuario=${record?.id_freelancer}&servico=${id}` } },
    )
  }
  return (
    <div className="page-bg">
      <PublicHeader />
      <main className="container service-page">
        <Link className="back-link" to="/explorar">
          <ArrowLeft /> Voltar para serviços
        </Link>
        {request.loading && <Skeleton kind="profile" />}
        {request.error && (
          <p role="alert">
            {request.error}{" "}
            <Button onClick={request.reload}>Tentar novamente</Button>
          </p>
        )}
        {service && record && (
          <div className="service-detail-grid">
            <div className="service-detail-main">
              <span className="service-category">{service.category}</span>
              <Heading as="h1">{service.title}</Heading>
              <div className="detail-seller">
                <img src={service.avatar} alt="" />
                <Link to={`/perfil/${record.id_freelancer}`}>
                  {service.seller}
                </Link>
                <span className="rating">
                  <Star />{" "}
                  {service.reviews
                    ? `${service.rating} (${service.reviews} avaliações)`
                    : "Sem avaliações"}
                </span>
              </div>
              <img className="detail-cover" src={record.imagens?.[activeImage] || service.image} alt={service.title} />
              {(record.imagens?.length || 0) > 1 && <div className="service-thumbnails">{record.imagens!.map((url, index) => <button key={url} className={activeImage === index ? "active" : ""} onClick={() => setActiveImage(index)} aria-label={`Ver imagem ${index + 1}`} aria-pressed={activeImage === index}><img src={url} alt="" /></button>)}</div>}
              <section className="detail-section">
                <Heading as="h2">Sobre este serviço</Heading>
                <p style={{ whiteSpace: "pre-wrap" }}>{record.descricao}</p>
              </section>
              <section className="detail-section seller-profile">
                <img src={service.avatar} alt="" />
                <div>
                  <Heading as="h3">{service.seller}</Heading>
                  <p>{record.freelancer?.descricao}</p>
                  <ButtonLink
                    to={`/perfil/${record.id_freelancer}`}
                    variant="secondary"
                  >
                    Ver perfil e portfólio
                  </ButtonLink>
                </div>
              </section>
              <section className="detail-section">
                <Heading as="h2">Avaliações do freelancer</Heading>
                {record.avaliacoes?.map((review) => (
                  <article className="review-card" key={review.id_avaliacao}>
                    <div className="review-stars" aria-label={`${review.nota} de 5 estrelas`}>{Array.from({length:5},(_,index)=><Star key={index} fill={index<review.nota?"currentColor":"none"} />)}<span>{new Date(review.criado_em).toLocaleDateString("pt-BR")}</span></div>
                    <p>{review.comentario}</p>
                  </article>
                ))}
                {!record.avaliacoes?.length && <EmptyState title="A primeira experiência pode ser a sua." description="As avaliações de pedidos concluídos aparecerão aqui." />}
              </section>
            </div>
            <aside className="purchase-card">
              <div className="purchase-top">
                <span>Solicitar serviço</span>
              </div>
              <div className="purchase-price">
                <span>Valor do serviço</span>
                <strong>{money(service.price)}</strong>
                <small>Valor do serviço · sem cobrança na plataforma</small>
              </div>
              <div className="purchase-meta">
                <span>
                  <Clock3 /> Prazo combinado: {service.delivery}
                </span>
              </div>
              <form onSubmit={purchase}>
                <label>
                  Conte ao freelancer o que você precisa
                  <textarea
                    required
                    maxLength={10000}
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                  />
                </label>
                {error && <p role="alert">{error}</p>}
                <Button
                  type="submit"
                  disabled={
                    busy || getSession()?.usuario.tipo_usuario === "freelancer"
                  }
                  className="purchase-button"
                >
                  {busy ? "Enviando..." : "Solicitar contratação"}
                </Button>
              </form>
              <Button
                variant="secondary"
                className="purchase-button"
                onClick={converse}
              >
                <MessageCircle /> {getSession()?.usuario.id === record.id_freelancer ? "Gerenciar meu serviço" : "Conversar antes"}
              </Button>
              <p>
                O pedido será enviado ao freelancer para aceite. Este projeto
                não processa dinheiro real.
              </p>
            </aside>
          </div>
        )}
      </main>
    </div>
  )
}
