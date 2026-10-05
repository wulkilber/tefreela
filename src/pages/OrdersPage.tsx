import { Check, ChevronRight, Clock3, Download, Search } from "lucide-react";
import AppShell from "../components/AppShell";
import { Button, Heading, TextInput } from "../components/ui";

const orders = [
  { title: "Identidade visual — Lume Café", client: "Fernando Alves", status: "Em andamento", date: "12 jun 2025", price: "R$ 1.280", progress: 70, avatar: 14 },
  { title: "Redesign de landing page", client: "Julia Moreira", status: "Aguardando aprovação", date: "09 jun 2025", price: "R$ 950", progress: 100, avatar: 25 },
  { title: "Kit de posts para Instagram", client: "Eduardo Nunes", status: "Novo pedido", date: "Hoje, 10:24", price: "R$ 720", progress: 10, avatar: 8 },
  { title: "Apresentação comercial", client: "Camila Rocha", status: "Concluído", date: "28 mai 2025", price: "R$ 560", progress: 100, avatar: 44 },
];

export default function OrdersPage() {
  return (
    <AppShell title="Pedidos">
      <div className="page-title-row"><div><Heading as="h2">Seus pedidos</Heading><p>Gerencie solicitações, prazos e entregas.</p></div><Button><Download /> Exportar relatório</Button></div>
      <div className="order-tabs"><button className="active">Todos <b>12</b></button><button>Novos <b>3</b></button><button>Em andamento <b>6</b></button><button>Concluídos</button></div>
      <section className="panel orders-page-panel">
        <div className="orders-filter"><TextInput icon={<Search />} placeholder="Buscar por pedido ou cliente" /><button className="sort-button">Mais recentes</button></div>
        <div className="orders-table-head"><span>Pedido</span><span>Status</span><span>Data</span><span>Valor</span><span /></div>
        {orders.map((order) => <article className="full-order" key={order.title}>
          <div className="full-order-main"><img src={`https://i.pravatar.cc/90?img=${order.avatar}`} alt="" /><div><strong>{order.title}</strong><span>{order.client}</span></div></div>
          <span className={`order-status status-${order.status.replaceAll(" ", "-").toLowerCase()}`}>{order.status === "Concluído" && <Check />}{order.status}</span>
          <span><Clock3 /> {order.date}</span><strong>{order.price}</strong><Button variant="ghost"><ChevronRight /></Button>
          <div className="mobile-progress"><div><span style={{ width: `${order.progress}%` }} /></div><small>{order.progress}% concluído</small></div>
        </article>)}
      </section>
    </AppShell>
  );
}
