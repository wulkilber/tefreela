import { Check, Clock3, Search, XCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import AppShell from "../components/AppShell";
import ConfirmDialog from "../components/ConfirmDialog";
import { Button, Heading, TextInput } from "../components/ui";
import { api } from "../lib/api";
import { getSessionUser } from "../lib/session";

type Order = {
  id: string;
  status: string;
  valor?: number | string | null;
  valor_total?: number | string | null;
  titulo?: string | null;
  descricao?: string | null;
  criado_em?: string | null;
};

const cancelable = new Set(["solicitado", "pendente"]);

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    solicitado: "Solicitado",
    pendente: "Pendente",
    aceito: "Aceito",
    em_andamento: "Em andamento",
    concluido: "Concluído",
    "concluído": "Concluído",
    recusado: "Recusado",
    cancelado: "Cancelado",
  };
  return labels[status] || status;
}

export default function OrdersPage() {
  const user = getSessionUser();
  const role = user?.tipo_usuario === "cliente" ? "cliente" : "freelancer";
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Order | null>(null);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState("");

  async function loadOrders() {
    setLoading(true);
    setFeedback("");
    try {
      const data = await api<Order[]>("/api/pedidos/meus");
      setOrders(data);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Não foi possível carregar os pedidos.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadOrders(); }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return orders;
    return orders.filter((order) =>
      [order.titulo, order.descricao, order.id, order.status]
        .some((value) => String(value || "").toLowerCase().includes(term))
    );
  }, [orders, search]);

  async function cancelOrder() {
    if (!selected) return;
    setBusy(true);
    try {
      const result = await api<{ mensagem: string; pedido: Order }>(`/api/pedidos/${selected.id}/cancelar`, {
        method: "PATCH",
        body: JSON.stringify({}),
      });
      setOrders((current) => current.map((order) => order.id === selected.id ? result.pedido : order));
      setFeedback(result.mensagem);
      setSelected(null);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Não foi possível cancelar a solicitação.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell title="Pedidos" role={role}>
      <div className="page-title-row">
        <div><Heading as="h2">Seus pedidos</Heading><p>Gerencie solicitações, prazos e entregas.</p></div>
      </div>

      {feedback && <div className="inline-feedback">{feedback}</div>}

      <section className="panel orders-page-panel">
        <div className="orders-filter">
          <TextInput icon={<Search />} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar pedido" />
        </div>

        <div className="orders-table-head">
          <span>Pedido</span><span>Status</span><span>Data</span><span>Valor</span><span />
        </div>

        {loading && <p>Carregando pedidos...</p>}
        {!loading && filtered.length === 0 && <p>Nenhum pedido encontrado.</p>}

        {filtered.map((order) => {
          const status = statusLabel(order.status);
          const amount = Number(order.valor_total ?? order.valor ?? 0);
          return (
            <article className="full-order" key={order.id}>
              <div className="full-order-main">
                <div className="order-placeholder">{(order.titulo || "P").slice(0, 1)}</div>
                <div><strong>{order.titulo || "Solicitação de serviço"}</strong><span>Pedido #{order.id.slice(0, 8)}</span></div>
              </div>
              <span className={`order-status status-${status.replaceAll(" ", "-").toLowerCase()}`}>
                {status === "Concluído" && <Check />}{status}
              </span>
              <span><Clock3 /> {order.criado_em ? new Date(order.criado_em).toLocaleDateString("pt-BR") : "—"}</span>
              <strong>{amount ? amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "—"}</strong>
              {role === "cliente" && cancelable.has(order.status) ? (
                <Button variant="ghost" aria-label="Cancelar solicitação" onClick={() => setSelected(order)}><XCircle /></Button>
              ) : <span />}
            </article>
          );
        })}
      </section>

      <ConfirmDialog
        open={Boolean(selected)}
        title="Cancelar solicitação?"
        description="O freelancer não poderá mais aceitar esta solicitação. Esta ação só é permitida enquanto o pedido ainda está pendente."
        confirmLabel="Cancelar solicitação"
        busyLabel="Cancelando..."
        busy={busy}
        onCancel={() => !busy && setSelected(null)}
        onConfirm={cancelOrder}
      />
    </AppShell>
  );
}
