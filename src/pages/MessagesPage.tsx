import { Search, Send } from "lucide-react"
import { useEffect, useState } from "react"
import { useSearchParams } from "react-router"
import AppShell from "../components/AppShell"
import { Button, Heading, TextInput } from "../components/ui"
import { api, getSession } from "../lib/session"
import { date, useData, type Conversation, type Message } from "../lib/data"
export default function MessagesPage() {
  const [params, setParams] = useSearchParams()
  const peer = params.get("usuario")
  const conversations = useData<Conversation[]>("/conversas", [])
  const messages = useData<Message[]>(peer ? `/mensagens/${peer}` : null, [])
  const [message, setMessage] = useState("")
  const [query, setQuery] = useState("")
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  const selected = conversations.data.find((person) => person.id === peer)
  useEffect(() => {
    if (!peer) return
    const update = () => {
      if (document.visibilityState === "visible") {
        messages.reload()
        conversations.reload()
        void api(`/mensagens/${peer}/lidas`, {}, "PATCH").catch(() => {})
      }
    }
    update()
    const timer = setInterval(update, 15000)
    return () => clearInterval(timer)
  }, [peer])
  async function send(event: React.FormEvent) {
    event.preventDefault()
    if (!message.trim() || !peer || busy) return
    setBusy(true)
    setError("")
    try {
      await api("/mensagens", {
        id_destinatario: peer,
        mensagem: message.trim(),
        ...(params.get("pedido")
          ? { id_pedido: Number(params.get("pedido")) }
          : {}),
        ...(params.get("servico")
          ? { id_servico: Number(params.get("servico")) }
          : {}),
      })
      setMessage("")
      messages.reload()
      conversations.reload()
    } catch (error) {
      setError((error as Error).message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <AppShell title="Mensagens">
      <section className="messages-shell">
        <aside className="conversation-list">
          <div className="message-title">
            <Heading as="h2">Mensagens</Heading>
          </div>
          <TextInput
            icon={<Search />}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar conversa"
          />
          {conversations.error && <p role="alert">{conversations.error}</p>}
          {conversations.loading && <p>Carregando...</p>}
          {conversations.data
            .filter((person) =>
              person.nome?.toLowerCase().includes(query.toLowerCase()),
            )
            .map((person) => (
              <button
                className={`conversation ${peer === person.id ? "active" : ""}`}
                onClick={() => setParams({ usuario: person.id })}
                key={person.id}
              >
                <img
                  width="38"
                  height="38"
                  src={person.foto || "/avatar-placeholder.svg"}
                  alt=""
                />
                <span>
                  <strong>{person.nome}</strong>
                  <small>{person.ultima.mensagem}</small>
                </span>
                <span>{person.nao_lidas > 0 && <b>{person.nao_lidas}</b>}</span>
              </button>
            ))}
          {!conversations.loading && !conversations.data.length && (
            <p className="empty-state">
              Inicie uma conversa pela página de um serviço ou pedido.
            </p>
          )}
        </aside>
        <div className="chat">
          <header className="chat-head">
            <strong>
              {selected?.nome ||
                (peer ? "Nova conversa" : "Selecione uma conversa")}
            </strong>
            <Button
              variant="ghost"
              onClick={() => {
                messages.reload()
                conversations.reload()
              }}
            >
              Atualizar
            </Button>
          </header>
          <div className="project-context">
            {params.get("pedido")
              ? `Pedido #${params.get("pedido")}`
              : params.get("servico")
                ? `Serviço #${params.get("servico")}`
                : "Conversa"}
          </div>
          <div className="chat-body">
            {messages.error && <p role="alert">{messages.error}</p>}
            {peer &&
              messages.data
                .filter(
                  (item) =>
                    item.id_remetente === peer || item.id_destinatario === peer,
                )
                .map((item) => (
                  <div
                    className={`bubble ${
                      item.id_remetente === getSession()?.usuario.id
                        ? "outgoing"
                        : "incoming"
                    }`}
                    key={item.id_mensagem}
                  >
                    <p>{item.mensagem}</p>
                    <small>
                      {date(item.data_envio)}
                      {item.lida ? " · Lida" : ""}
                    </small>
                  </div>
                ))}
            {error && <p role="alert">{error}</p>}
          </div>
          <form className="chat-input" onSubmit={send}>
            <input
              aria-label="Mensagem"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              required
              maxLength={10000}
              disabled={!peer || busy}
              placeholder="Escreva uma mensagem..."
            />
            <Button
              disabled={!peer || busy || !message.trim()}
              aria-label="Enviar mensagem"
            >
              <Send />
            </Button>
          </form>
        </div>
      </section>
    </AppShell>
  )
}
