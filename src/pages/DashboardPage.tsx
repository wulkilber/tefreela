import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BriefcaseBusiness,
  CircleDollarSign,
  Clock3,
  Eye,
  MessageCircle,
  MoreHorizontal,
  Plus,
  Star,
  Trash2,
  TrendingUp,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import AppShell from "../components/AppShell";
import ConfirmDialog from "../components/ConfirmDialog";
import { Button, ButtonLink, Heading } from "../components/ui";
import { api } from "../lib/api";

const stats = [
  { label: "Ganhos no mês", value: "R$ 4.280", change: "+12,5%", icon: CircleDollarSign, tone: "purple", up: true },
  { label: "Pedidos ativos", value: "6", change: "+2 esta semana", icon: BriefcaseBusiness, tone: "blue", up: true },
  { label: "Visualizações", value: "1.248", change: "+8,2%", icon: Eye, tone: "orange", up: true },
  { label: "Taxa de conversão", value: "18,4%", change: "-1,2%", icon: TrendingUp, tone: "green", up: false },
];

type Service = {
  id_servico: number;
  titulo?: string | null;
  title?: string | null;
  preco?: number | string | null;
  price?: number | string | null;
  imagem?: string | null;
  image?: string | null;
  ativo?: boolean | null;
};

export default function DashboardPage() {
  const [myServices, setMyServices] = useState<Service[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [serviceError, setServiceError] = useState("");
  const [menuOpen, setMenuOpen] = useState<number | null>(null);
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function loadServices() {
    setServicesLoading(true);
    setServiceError("");
    try {
      const data = await api<Service[]>("/api/servicos/meus");
      setMyServices(data);
    } catch (error) {
      setServiceError(error instanceof Error ? error.message : "Não foi possível carregar seus serviços.");
    } finally {
      setServicesLoading(false);
    }
  }

  useEffect(() => { void loadServices(); }, []);

  async function deleteService() {
    if (!serviceToDelete) return;
    setDeleting(true);
    try {
      await api(`/api/servicos/${serviceToDelete.id}`, { method: "DELETE" });
      setMyServices((current) => current.filter((service) => service.id_servico !== serviceToDelete.id));
      setServiceToDelete(null);
      setMenuOpen(null);
    } catch (error) {
      setServiceError(error instanceof Error ? error.message : "Não foi possível excluir este serviço.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AppShell title="Visão geral">
      <section className="welcome-card">
        <div><span>Seu perfil está em destaque</span><Heading as="h2">Transforme visitas em novos projetos.</Heading><p>Mantenha seus serviços atualizados para aumentar suas chances de contratação.</p><Button>Otimizar meu perfil <ArrowRight /></Button></div>
        <div className="welcome-art"><div><span>Nota do perfil</span><strong>4.9</strong><small><Star fill="currentColor" /> Excelente</small></div></div>
      </section>

      <section className="dashboard-stats">
        {stats.map(({ label, value, change, icon: Icon, tone, up }) => (
          <article className="stat-card" key={label}><div><span>{label}</span><strong>{value}</strong><small className={up ? "positive" : "negative"}>{up ? <ArrowUpRight /> : <ArrowDownRight />}{change}</small></div><span className={`stat-icon tone-${tone}`}><Icon /></span></article>
        ))}
      </section>

      <section className="dashboard-grid">
        <div className="panel orders-panel">
          <div className="panel-head"><div><Heading as="h3">Pedidos recentes</Heading><p>Acompanhe seus projetos mais recentes.</p></div><ButtonLink to="/app/pedidos" variant="ghost">Ver todos <ArrowRight /></ButtonLink></div>
          <div className="order-list">
            {[
              { name: "Identidade visual — Lume", client: "Fernando Alves", price: "R$ 1.280", status: "Em andamento", due: "Entrega em 3 dias", avatar: 14 },
              { name: "Redesign de landing page", client: "Julia Moreira", price: "R$ 950", status: "Aguardando aprovação", due: "Enviado hoje", avatar: 25 },
              { name: "Social media — Junho", client: "Eduardo Nunes", price: "R$ 720", status: "Novo pedido", due: "Recebido há 2h", avatar: 8 },
            ].map((order) => <div className="order-row" key={order.name}><img src={`https://i.pravatar.cc/90?img=${order.avatar}`} alt="" /><div className="order-name"><strong>{order.name}</strong><span>{order.client}</span></div><span className={`order-status status-${order.status.replaceAll(" ", "-").toLowerCase()}`}>{order.status}</span><div className="order-value"><strong>{order.price}</strong><span>{order.due}</span></div><Button variant="ghost"><MoreHorizontal /></Button></div>)}
          </div>
        </div>

        <div className="panel activity-panel">
          <div className="panel-head"><div><Heading as="h3">Atividade</Heading><p>Últimos 7 dias</p></div><button className="sort-button">Esta semana</button></div>
          <div className="chart">
            {[42, 64, 50, 78, 66, 92, 75].map((value, index) => <div key={index}><span style={{ height: `${value}%` }} /><small>{["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"][index]}</small></div>)}
          </div>
          <div className="chart-summary"><span><i className="purple-dot" /> 1.248 visualizações</span><strong>+8,2%</strong></div>
        </div>
      </section>

      <section className="dashboard-grid lower-grid">
        <div className="panel services-panel">
          <div className="panel-head">
            <div><Heading as="h3">Meus serviços</Heading><p>Gerencie suas ofertas publicadas.</p></div>
            <Button><Plus /> Novo serviço</Button>
          </div>

          {serviceError && <div className="inline-feedback error">{serviceError}</div>}
          {servicesLoading && <p>Carregando serviços...</p>}
          {!servicesLoading && myServices.length === 0 && <p>Você ainda não possui serviços publicados.</p>}

          {myServices.map((service) => {
            const title = service.titulo || service.title || "Serviço";
            const image = service.imagem || service.image;
            const price = Number(service.preco ?? service.price ?? 0);
            return (
              <div className="my-service" key={service.id_servico}>
                {image ? <img src={image} alt="" /> : <div className="service-thumb-placeholder">{title.slice(0, 1)}</div>}
                <div><strong>{title}</strong><span>Publicado no Tefreela</span></div>
                <span className="active-service">Ativo</span>
                <div><strong>{price ? price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "—"}</strong><small>preço inicial</small></div>
                <div className="action-menu-wrap">
                  <Button variant="ghost" aria-label="Opções do serviço" onClick={() => setMenuOpen(menuOpen === service.id_servico ? null : service.id_servico)}>
                    <MoreHorizontal />
                  </Button>
                  {menuOpen === service.id_servico && (
                    <div className="action-menu">
                      <button type="button" className="danger-menu-item" onClick={() => setServiceToDelete(service)}>
                        <Trash2 /> Excluir serviço
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="panel quick-panel">
          <div className="panel-head"><div><Heading as="h3">Ações rápidas</Heading><p>Atalhos para seu dia.</p></div></div>
          <ButtonLink to="/app/mensagens" variant="secondary"><MessageCircle /> Responder mensagens</ButtonLink>
          <ButtonLink to="/app/pedidos" variant="secondary"><Clock3 /> Ver prazos próximos</ButtonLink>
          <ButtonLink to="/explorar" variant="secondary"><Users /> Explorar oportunidades</ButtonLink>
        </div>
      </section>

      <ConfirmDialog
        open={Boolean(serviceToDelete)}
        title="Excluir este serviço?"
        description="O serviço deixará de aparecer no marketplace. Se houver pedido em andamento, a exclusão será bloqueada para proteger o histórico."
        confirmLabel="Excluir serviço"
        busyLabel="Excluindo..."
        busy={deleting}
        onCancel={() => !deleting && setServiceToDelete(null)}
        onConfirm={deleteService}
      />
    </AppShell>
  );
}
