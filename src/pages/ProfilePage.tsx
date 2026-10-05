import { useParams } from "react-router"
import PublicHeader from "../components/PublicHeader"
import { ButtonLink, Heading } from "../components/ui"
import { useData, type Profile } from "../lib/data"
import { getSession } from "../lib/session"
export default function ProfilePage() {
  const { id } = useParams()
  const request = useData<Profile | null>(`/perfis/${id}`, null)
  const profile = request.data
  return (
    <div className="page-bg">
      <PublicHeader />
      <main className="container service-page">
        {request.loading && <p>Carregando perfil...</p>}
        {request.error && <p role="alert">{request.error}</p>}
        {profile && (
          <>
            <section className="panel seller-profile">
              <img src={profile.foto || "/avatar-placeholder.svg"} alt="" />
              <div>
                <Heading as="h1">{profile.nome}</Heading>
                <p>
                  {[profile.cidade, profile.estado].filter(Boolean).join(" · ")}
                </p>
                <p>{profile.descricao}</p>
                <ButtonLink to={getSession()?.usuario.id === profile.id ? "/app/perfil" : `/app/mensagens?usuario=${profile.id}`}>
                  {getSession()?.usuario.id === profile.id ? "Editar meu perfil" : "Conversar"}
                </ButtonLink>
              </div>
            </section>
            <Heading as="h2">Portfólio</Heading>
            <div className="services-grid">
              {profile.portfolio?.map((item) => (
                <article className="panel" key={item.id_portfolio}>
                  {item.imagem && (
                    <img
                      className="portfolio-image"
                      src={item.imagem}
                      alt={item.titulo}
                    />
                  )}
                  <Heading as="h3">{item.titulo}</Heading>
                  <p>{item.descricao}</p>
                  {item.link && (
                    <a href={item.link} target="_blank" rel="noreferrer">
                      Abrir projeto
                    </a>
                  )}
                </article>
              ))}
            </div>
            {!profile.portfolio?.length && (
              <p>Ainda sem trabalhos publicados.</p>
            )}
          </>
        )}
      </main>
    </div>
  )
}
