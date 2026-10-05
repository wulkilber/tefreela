import { ArrowLeft, MessageCircle, Search, Send } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { useSearchParams } from "react-router"
import AppShell from "../components/AppShell"
import { Button, Heading, TextInput } from "../components/ui"
import { api, getSession } from "../lib/session"
import { date, useData, type Conversation, type Message, type Profile } from "../lib/data"
export default function MessagesPage() {
  const [params, setParams] = useSearchParams()
  const peer = params.get("usuario")
  const conversations = useData<Conversation[]>("/conversas", [])
  const recipient = useData<Profile | null>(peer ? `/conversas/${peer}` : null, null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [query, setQuery] = useState("")
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  const [version, setVersion] = useState(0)
  const bottom = useRef<HTMLDivElement>(null)
  const activePeer = useRef(peer)
  activePeer.current = peer
  const selected = conversations.data.find(person => person.id === peer)
  useEffect(() => {
    let active = true, fetching = false
    setMessages([]); setMessage(""); setError("")
    if (!peer) { setLoading(false); return }
    setLoading(true)
    async function update() {
      if (fetching || document.visibilityState !== "visible") return
      fetching = true
      try {
        const values = await api<Message[]>(`/mensagens/${peer}`)
        if (!active) return
        setMessages(current => {
          const ids = new Set(values.map(item => item.id_mensagem))
          return [...values, ...current.filter(item => !ids.has(item.id_mensagem) && item.id_remetente === getSession()?.usuario.id)]
            .sort((a, b) => a.id_mensagem - b.id_mensagem)
        }); setError("")
        if (values.some(item => item.id_destinatario === getSession()?.usuario.id && !item.lida)) {
          await api(`/mensagens/${peer}/lidas`, {}, "PATCH")
          if (active) conversations.reload()
        }
      } catch (caught) { if (active) setError((caught as Error).message) }
      finally { fetching = false; if (active) setLoading(false) }
    }
    void update()
    const timer = setInterval(() => void update(), 10000)
    document.addEventListener("visibilitychange", update)
    return () => { active = false; clearInterval(timer); document.removeEventListener("visibilitychange", update) }
  }, [peer, version])
  useEffect(() => { bottom.current?.scrollIntoView({ block: "nearest", behavior: "smooth" }) }, [messages.at(-1)?.id_mensagem, peer])
  useEffect(() => {
    const timer = setInterval(() => { if (document.visibilityState === "visible") conversations.reload() }, 20000)
    return () => clearInterval(timer)
  }, [])
  async function send(event: React.FormEvent) {
    event.preventDefault()
    if (!message.trim() || !peer || busy) return
    const target = peer
    setBusy(true); setError("")
    try {
      const sent = await api<Message>("/mensagens", {
        id_destinatario: target, mensagem: message.trim(),
        ...(params.get("pedido") ? { id_pedido: Number(params.get("pedido")) } : {}),
        ...(params.get("servico") ? { id_servico: Number(params.get("servico")) } : {}),
      })
      if (activePeer.current === target) {
        setMessage("")
        setMessages(current => current.some(item => item.id_mensagem === sent.id_mensagem) ? current : [...current, sent])
      }
      conversations.reload()
    } catch (caught) { if (activePeer.current === target) setError((caught as Error).message) }
    finally { setBusy(false) }
  }
  return <AppShell title="Mensagens">
    <section className={`messages-shell ${peer ? "has-conversation" : ""}`}>
      <aside className="conversation-list">
        <div className="message-title"><Heading as="h2">Conversas</Heading></div>
        <TextInput icon={<Search />} value={query} onChange={event => setQuery(event.target.value)} placeholder="Buscar conversa" />
        {conversations.error && <p role="alert">{conversations.error} <Button onClick={conversations.reload}>Tentar novamente</Button></p>}
        {conversations.loading && !conversations.data.length && <p role="status">Carregando conversas...</p>}
        {conversations.data.filter(person => person.nome?.toLowerCase().includes(query.toLowerCase())).map(person =>
          <button className={`conversation ${peer === person.id ? "active" : ""}`} onClick={() => setParams({ usuario: person.id })} key={person.id}>
            <img width="38" height="38" src={person.foto || "/avatar-placeholder.svg"} alt="" />
            <span><strong>{person.nome || "Usuário"}</strong><small>{person.ultima.mensagem}</small></span>
            <span>{person.nao_lidas > 0 && <b>{person.nao_lidas}</b>}</span>
          </button>)}
        {!conversations.loading && !conversations.data.length && <div className="empty-state"><MessageCircle /><p>Suas conversas aparecerão aqui. Para começar, toque em “Conversar” na página de um serviço ou pedido.</p></div>}
        {query && conversations.data.length > 0 && !conversations.data.some(person => person.nome?.toLowerCase().includes(query.toLowerCase())) && <p className="empty-state">Nenhuma conversa encontrada.</p>}
      </aside>
      <div className="chat">
        <header className="chat-head">
          <div><Button type="button" className="chat-back" variant="ghost" aria-label="Voltar às conversas" onClick={() => setParams({})}><ArrowLeft /></Button>
            <strong>{selected?.nome || (recipient.data?.id === peer ? recipient.data.nome : peer ? "Carregando contato..." : "Suas mensagens")}</strong></div>
          {peer && <Button variant="ghost" onClick={() => { setVersion(value => value + 1); recipient.reload(); conversations.reload() }}>Atualizar</Button>}
        </header>
        <div className="project-context">{params.get("pedido") ? `Pedido #${params.get("pedido")}` : params.get("servico") ? `Serviço #${params.get("servico")}` : "Converse sobre o projeto e combine os detalhes"}</div>
        <div className="chat-body" aria-live="polite">
          {!peer && <div className="chat-empty"><MessageCircle /><h3>Vamos conversar?</h3><p>Selecione um contato ao lado para continuar seu projeto.</p></div>}
          {loading && <p role="status">Carregando mensagens...</p>}
          {peer && !loading && !messages.length && !error && <div className="chat-empty"><MessageCircle /><p>Envie a primeira mensagem para combinar os detalhes do serviço.</p></div>}
          {messages.map(item => <div className={`bubble ${item.id_remetente === getSession()?.usuario.id ? "outgoing" : "incoming"}`} key={item.id_mensagem}>
            <p>{item.mensagem}</p><small>{date(item.data_envio)}{item.id_remetente === getSession()?.usuario.id && item.lida ? " · Lida" : ""}</small>
          </div>)}
          {(error || recipient.error) && <p role="alert">{error || recipient.error}</p>}
          <div ref={bottom} />
        </div>
        <form className="chat-input" onSubmit={send}>
          <input aria-label="Mensagem" value={message} onChange={event => setMessage(event.target.value)} required maxLength={10000} disabled={!peer || busy || !!recipient.error || recipient.loading} placeholder="Escreva uma mensagem..." />
          <Button disabled={!peer || busy || !message.trim() || !!recipient.error || recipient.loading} aria-label="Enviar mensagem"><Send /></Button>
        </form>
      </div>
    </section>
  </AppShell>
}
