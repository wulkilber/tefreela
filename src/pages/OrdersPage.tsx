import { Download, MessageCircle, Search } from "lucide-react"
import { useState } from "react"
import AppShell from "../components/AppShell"
import { Button, ButtonLink, Heading, TextInput } from "../components/ui"
import { api, getSession } from "../lib/session"
import { date, money, useData, type Order } from "../lib/data"
const labels: Record<string, string> = {
  solicitado: "Solicitado",
  aceito: "Aceito",
  recusado: "Recusado",
  em_andamento: "Em andamento",
  concluido: "Concluído",
  cancelado: "Cancelado",
}
export default function OrdersPage() {
  const request = useData<Order[]>("/pedidos", [])
  const [query, setQuery] = useState("")
  const [tab, setTab] = useState("")
  const [busy, setBusy] = useState<number | null>(null)
  const [error, setError] = useState("")
  const [selected, setSelected] = useState<number | null>(null)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState("")
  const user = getSession()!.usuario
  const orders = request.data.filter(
    (order) =>
      (!tab || order.status === tab) &&
      `${order.servico?.titulo} ${order.cliente?.nome} ${order.freelancer?.nome} ${order.id_pedido}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  )
  async function action(order: Order, status: string) {
    setBusy(order.id_pedido)
    setError("")
    try {
      await api(
        `/pedidos/${order.id_pedido}${status === "pagar" ? "/pagamento" : ""}`,
        status === "pagar" ? {} : { status },
        status === "pagar" ? "POST" : "PATCH",
      )
      request.reload()
    } catch (error) {
      setError((error as Error).message)
    } finally {
      setBusy(null)
    }
  }
  async function review(event: React.FormEvent) {
    event.preventDefault()
    setBusy(selected)
    setError("")
    try {
      await api("/avaliacoes", {
        id_pedido: selected,
        nota: rating,
        comentario: comment,
      })
      setSelected(null)
      setComment("")
      request.reload()
    } catch (error) {
      setError((error as Error).message)
    } finally {
      setBusy(null)
    }
  }
  function exportOrders() {
    // Quote every cell and neutralize spreadsheet formulas from user supplied fields.
    const cell = (value: unknown) =>
      `"${String(value ?? "")
        .replace(/^[=+@-]/, "'$&")
        .replaceAll('"', '""')}"`
    const lines = [
      ["Pedido", "Serviço", "Status", "Valor", "Data"],
      ...orders.map((order) => [
        order.id_pedido,
        order.servico?.titulo,
        labels[order.status],
        order.valor,
        order.criado_em,
      ]),
    ]
    const url = URL.createObjectURL(
      new Blob(
        ["\ufeff" + lines.map((row) => row.map(cell).join(";")).join("\r\n")],
        { type: "text/csv;charset=utf-8" },
      ),
    )
    const link = document.createElement("a")
    link.href = url
    link.download = "pedidos-tefreela.csv"
    link.click()
    URL.revokeObjectURL(url)
  }
  return (
    <AppShell title="Pedidos">
      <div className="page-title-row">
        <div>
          <Heading as="h2">Seus pedidos</Heading>
          <p>Gerencie solicitações, prazos e entregas.</p>
        </div>
        <Button onClick={exportOrders}>
          <Download /> Exportar relatório
        </Button>
      </div>
      <div className="order-tabs">
        {[
          "",
          "solicitado",
          "aceito",
          "em_andamento",
          "concluido",
          "cancelado",
          "recusado",
        ].map((value) => (
          <button
            className={tab === value ? "active" : ""}
            onClick={() => setTab(value)}
            key={value}
          >
            {value ? labels[value] : "Todos"}{" "}
            <b>
              {
                request.data.filter((order) => !value || order.status === value)
                  .length
              }
            </b>
          </button>
        ))}
      </div>
      <section className="panel orders-page-panel">
        <div className="orders-filter">
          <TextInput
            icon={<Search />}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar pedido ou pessoa"
          />
          <Button variant="ghost" onClick={request.reload}>
            Atualizar
          </Button>
        </div>
        {request.loading && <p role="status">Carregando pedidos...</p>}
        {(request.error || error) && (
          <p role="alert">{request.error || error}</p>
        )}
        {!request.loading && !request.error && !orders.length && (
          <p>Nenhum pedido encontrado.</p>
        )}
        {orders.map((order) => {
          const client = order.id_cliente === user.id
          const peer = client ? order.freelancer : order.cliente
          const actions = client
            ? order.status === "solicitado" || order.status === "aceito"
              ? ["cancelado"]
              : order.status === "concluido"
                ? ["pagar"]
                : []
            : order.status === "solicitado"
              ? ["aceito", "recusado"]
              : order.status === "aceito"
                ? ["em_andamento"]
                : order.status === "em_andamento"
                  ? ["concluido"]
                  : []
          return (
            <article className="panel order-detail" key={order.id_pedido}>
              <div className="page-title-row">
                <div>
                  <Heading as="h3">
                    #{order.id_pedido} · {order.servico?.titulo}
                  </Heading>
                  <p>
                    Com {peer?.nome} · {date(order.criado_em)}
                  </p>
                </div>
                <span className="order-status">
                  {labels[order.status]} · {money(order.valor)}
                </span>
              </div>
              <p style={{ whiteSpace: "pre-wrap" }}>
                {order.descricao_solicitacao}
              </p>
              <div className="action-row">
                {actions.map((status) => (
                  <Button
                    key={status}
                    disabled={busy === order.id_pedido}
                    onClick={() => action(order, status)}
                  >
                    {status === "pagar"
                      ? "Pagar com créditos acadêmicos"
                      : status === "aceito"
                        ? "Aceitar"
                        : status === "recusado"
                          ? "Recusar"
                          : status === "em_andamento"
                            ? "Iniciar trabalho"
                            : status === "concluido"
                              ? "Concluir entrega"
                              : "Cancelar"}
                  </Button>
                ))}
                <ButtonLink
                  variant="secondary"
                  to={`/app/mensagens?usuario=${peer?.id}&pedido=${order.id_pedido}`}
                >
                  <MessageCircle /> Conversar
                </ButtonLink>
                {client &&
                  order.status === "concluido" &&
                  !order.avaliacao?.length && (
                    <Button
                      variant="secondary"
                      onClick={() => setSelected(order.id_pedido)}
                    >
                      Avaliar
                    </Button>
                  )}
              </div>
              {order.avaliacao?.length > 0 && (
                <p>
                  Avaliação: {order.avaliacao[0].nota}/5 —{" "}
                  {order.avaliacao[0].comentario}
                </p>
              )}
              {selected === order.id_pedido && (
                <form className="data-form" onSubmit={review}>
                  <label>
                    Nota
                    <select
                      value={rating}
                      onChange={(event) =>
                        setRating(Number(event.target.value))
                      }
                    >
                      {[1, 2, 3, 4, 5].map((value) => (
                        <option key={value}>{value}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Comentário
                    <textarea
                      maxLength={2000}
                      value={comment}
                      onChange={(event) => setComment(event.target.value)}
                    />
                  </label>
                  <Button disabled={busy !== null}>Enviar avaliação</Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setSelected(null)}
                  >
                    Fechar
                  </Button>
                </form>
              )}
            </article>
          )
        })}
      </section>
    </AppShell>
  )
}
