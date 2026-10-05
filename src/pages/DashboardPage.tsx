import {
  BriefcaseBusiness,
  CircleDollarSign,
  MessageCircle,
  Star,
} from "lucide-react"
import AppShell from "../components/AppShell"
import { ButtonLink, Heading } from "../components/ui"
import { getSession } from "../lib/session"
import {
  money,
  useData,
  type Order,
  type Profile,
  type ServiceRecord,
} from "../lib/data"
export default function DashboardPage() {
  const orders = useData<Order[]>("/pedidos", [])
  const profile = useData<Profile | null>("/me/perfil", null)
  const services = useData<ServiceRecord[]>("/me/servicos", [])
  const reviews = orders.data.flatMap((order) => order.avaliacao || [])
  const stats = [
    {
      label: "Créditos acadêmicos",
      value: money(profile.data?.saldo_creditos || 0),
      icon: CircleDollarSign,
    },
    {
      label: "Pedidos ativos",
      value: orders.data.filter((order) =>
        ["solicitado", "aceito", "em_andamento"].includes(order.status),
      ).length,
      icon: BriefcaseBusiness,
    },
    {
      label: "Serviços publicados",
      value: services.data.filter((service) => service.status === "ativo")
        .length,
      icon: BriefcaseBusiness,
    },
    {
      label: "Avaliações",
      value: reviews.length
        ? (
            reviews.reduce((sum, review) => sum + review.nota, 0) /
            reviews.length
          ).toFixed(1)
        : "Sem avaliações",
      icon: Star,
    },
  ]
  return (
    <AppShell title="Visão geral">
      <section className="welcome-card">
        <div>
          <span>Boas-vindas, {getSession()?.usuario.nome}</span>
          <Heading as="h2">Transforme talento em novos projetos.</Heading>
          <p>Atualize seu perfil e publique serviços para receber pedidos.</p>
          <ButtonLink to="/app/perfil">Editar meu perfil</ButtonLink>
        </div>
      </section>
      {(orders.error || profile.error || services.error) && (
        <p role="alert">{orders.error || profile.error || services.error}</p>
      )}
      <section className="dashboard-stats">
        {stats.map(({ label, value, icon: Icon }) => (
          <article className="stat-card" key={label}>
            <div>
              <span>{label}</span>
              <strong>
                {orders.loading || profile.loading || services.loading
                  ? "..."
                  : value}
              </strong>
            </div>
            <span className="stat-icon tone-purple">
              <Icon />
            </span>
          </article>
        ))}
      </section>
      <section className="dashboard-grid">
        <div className="panel">
          <Heading as="h3">Pedidos recentes</Heading>
          {orders.data.slice(0, 5).map((order) => (
            <div className="order-row" key={order.id_pedido}>
              <strong>{order.servico?.titulo}</strong>
              <span>{order.cliente?.nome}</span>
              <span>{order.status}</span>
              <strong>{money(order.valor)}</strong>
            </div>
          ))}
          {!orders.loading && !orders.data.length && (
            <p>Você ainda não recebeu pedidos.</p>
          )}
          <ButtonLink to="/app/pedidos" variant="ghost">
            Ver pedidos
          </ButtonLink>
        </div>
        <div className="panel quick-panel">
          <Heading as="h3">Ações rápidas</Heading>
          <ButtonLink to="/app/servicos">Gerenciar serviços</ButtonLink>
          <ButtonLink to="/app/portfolio" variant="secondary">
            Editar portfólio
          </ButtonLink>
          <ButtonLink to="/app/mensagens" variant="secondary">
            <MessageCircle /> Ver mensagens
          </ButtonLink>
          <ButtonLink to="/app/creditos" variant="secondary">
            Extrato de créditos
          </ButtonLink>
        </div>
      </section>
    </AppShell>
  )
}
