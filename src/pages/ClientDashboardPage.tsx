import { useState } from "react"
import { useNavigate } from "react-router"
import { BriefcaseBusiness, Clock3, Search, WalletCards } from "lucide-react"
import AppShell from "../components/AppShell"
import ServiceCard from "../components/ServiceCard"
import { Button, ButtonLink, Heading, TextInput } from "../components/ui"
import {
  money,
  serviceCard,
  useData,
  type Order,
  type Profile,
  type ServiceRecord,
} from "../lib/data"
export default function ClientDashboardPage() {
  const orders = useData<Order[]>("/pedidos", [])
  const profile = useData<Profile | null>("/me/perfil", null)
  const catalog = useData<ServiceRecord[]>("/servicos", [])
  const [query, setQuery] = useState("")
  const navigate = useNavigate()
  return (
    <AppShell title="Início" role="cliente">
      <section className="client-hero">
        <div>
          <span>Boas-vindas à Tefreela</span>
          <Heading as="h2">Qual ideia vamos tirar do papel hoje?</Heading>
          <p>Encontre profissionais e acompanhe seus projetos.</p>
          <form
            className="action-row"
            onSubmit={(event) => {
              event.preventDefault()
              navigate(`/explorar?q=${encodeURIComponent(query)}`)
            }}
          >
            <TextInput
              icon={<Search />}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Busque por um serviço..."
            />
            <Button>Buscar talentos</Button>
          </form>
        </div>
      </section>
      {(orders.error || profile.error || catalog.error) && (
        <p role="alert">{orders.error || profile.error || catalog.error}</p>
      )}
      <section className="client-stats">
        <article>
          <span>
            <BriefcaseBusiness />
          </span>
          <div>
            <strong>
              {orders.loading
                ? "..."
                : orders.data.filter((order) =>
                    ["solicitado", "aceito", "em_andamento"].includes(
                      order.status,
                    ),
                  ).length}
            </strong>
            <small>Projetos ativos</small>
          </div>
        </article>
        <article>
          <span>
            <Clock3 />
          </span>
          <div>
            <strong>
              {orders.loading
                ? "..."
                : orders.data.filter((order) => order.status === "concluido")
                    .length}
            </strong>
            <small>Projetos concluídos</small>
          </div>
        </article>
        <article>
          <span>
            <WalletCards />
          </span>
          <div>
            <strong>
              {profile.loading
                ? "..."
                : money(profile.data?.saldo_creditos || 0)}
            </strong>
            <small>Créditos acadêmicos</small>
          </div>
        </article>
      </section>
      <section className="panel">
        <Heading as="h3">Seus projetos</Heading>
        {orders.data.slice(0, 5).map((order) => (
          <article className="order-row" key={order.id_pedido}>
            <strong>{order.servico?.titulo}</strong>
            <span>{order.freelancer?.nome}</span>
            <span>{order.status}</span>
          </article>
        ))}
        {!orders.loading && !orders.data.length && (
          <p>Encontre um serviço para iniciar seu primeiro projeto.</p>
        )}
        <ButtonLink to="/app/pedidos" variant="ghost">
          Ver todos os pedidos
        </ButtonLink>
      </section>
      <section className="client-recommendations">
        <div className="panel-head">
          <Heading as="h3">Explore serviços</Heading>
          <ButtonLink to="/explorar" variant="ghost">
            Ver todos
          </ButtonLink>
        </div>
        <div className="services-grid">
          {catalog.data.slice(0, 3).map((record) => (
            <ServiceCard
              key={record.id_servico}
              service={serviceCard(record)}
            />
          ))}
        </div>
      </section>
    </AppShell>
  )
}
