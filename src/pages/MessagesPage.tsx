import { ArrowLeft, Ellipsis, Link2, MessageCircle, Search, Send, Trash2 } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { useSearchParams } from "react-router"
import AppShell from "../components/AppShell"
import ActionMenu from "../components/ActionMenu"
import { Avatar, Button, Heading, Modal, Skeleton, TextInput } from "../components/ui"
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
  const [sharing, setSharing] = useState(false)
  const [sharedUrl, setSharedUrl] = useState("")
  const [removing,setRemoving]=useState<{id:string;nome:string}|null>(null)
  const [deleting,setDeleting]=useState(false),[deleteError,setDeleteError]=useState("")
  const deleteLock=useRef(false),mounted=useRef(true)
  const conversationEpoch=useRef(0)
  useEffect(()=>{mounted.current=true;return()=>{mounted.current=false}},[])
  const bottom = useRef<HTMLDivElement>(null)
  const visibleMessageIds=useRef(new Set<number>())
  visibleMessageIds.current=new Set(messages.map(item=>item.id_mensagem))
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
      const knownIds=visibleMessageIds.current
      const requestEpoch=conversationEpoch.current
      try {
        const values = await api<Message[]>(`/mensagens/${peer}`)
        if (!active||activePeer.current!==peer||deleteLock.current||requestEpoch!==conversationEpoch.current) return
        setMessages(current => {
          const ids = new Set(values.map(item => item.id_mensagem))
          return [...values, ...current.filter(item => !ids.has(item.id_mensagem) && !knownIds.has(item.id_mensagem) && item.id_remetente === getSession()?.usuario.id)]
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
    if (!message.trim() || !peer || busy || deleteLock.current) return
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
  function askRemoval(id:string,nome:string){if(busy||deleteLock.current)return;setDeleteError("");setRemoving({id,nome})}
  async function removeConversation(){
    if(!removing||busy||deleteLock.current)return
    const target=removing.id
    deleteLock.current=true;conversationEpoch.current++;setDeleting(true);setDeleteError("")
    try{
      await api(`/conversas/${target}`,undefined,"DELETE")
      if(!mounted.current)return
      conversations.setData(values=>values.filter(person=>person.id!==target))
      if(activePeer.current===target){activePeer.current=null;setMessages([]);setMessage("");setParams({})}
      setRemoving(null);conversations.reload()
    }catch(caught){if(mounted.current)setDeleteError((caught as Error).message)}
    finally{deleteLock.current=false;if(mounted.current)setDeleting(false)}
  }
  return <AppShell title="Mensagens">
    <section className={`messages-shell ${peer ? "has-conversation" : ""}`}>
      <aside className="conversation-list">
        <div className="message-title"><Heading as="h2">Conversas</Heading></div>
        <TextInput icon={<Search />} value={query} onChange={event => setQuery(event.target.value)} placeholder="Buscar conversa" />
        {conversations.error && <p role="alert">{conversations.error} <Button onClick={conversations.reload}>Tentar novamente</Button></p>}
        {conversations.loading && !conversations.data.length && <Skeleton kind="row" count={3} />}
        {conversations.data.filter(person => person.nome?.toLowerCase().includes(query.toLowerCase())).map(person =>
          <div className="conversation-row" key={person.id}><button disabled={deleting} className={`conversation ${peer === person.id ? "active" : ""}`} onClick={() => setParams({ usuario: person.id })}>
            <img width="38" height="38" src={person.foto || "/avatar-placeholder.svg"} alt="" />
            <span><strong>{person.nome || "Usuário"}</strong><small>{person.ultima.mensagem}</small></span>
            <span>{person.nao_lidas > 0 && <b>{person.nao_lidas}</b>}</span>
          </button><ActionMenu label={`Opções da conversa com ${person.nome||"Usuário"}`} trigger={<Ellipsis/>} items={[{label:"Excluir conversa",icon:<Trash2/>,danger:true,disabled:busy||deleting,onSelect:()=>askRemoval(person.id,person.nome||"Usuário")}]} /></div>)}
        {!conversations.loading && !conversations.data.length && <div className="empty-state"><MessageCircle /><p>Suas conversas aparecerão aqui. Para começar, toque em “Conversar” na página de um serviço ou pedido.</p></div>}
        {query && conversations.data.length > 0 && !conversations.data.some(person => person.nome?.toLowerCase().includes(query.toLowerCase())) && <p className="empty-state">Nenhuma conversa encontrada.</p>}
      </aside>
      <div className="chat">
        <header className="chat-head">
          <div><Button type="button" className="chat-back" variant="ghost" aria-label="Voltar às conversas" onClick={() => setParams({})}><ArrowLeft /></Button>
            {peer && <Avatar src={selected?.foto || (recipient.data?.id === peer ? recipient.data.foto : undefined)} name="" size={38} />}<div><strong>{selected?.nome || (recipient.data?.id === peer ? recipient.data.nome : peer ? "Carregando contato..." : "Suas mensagens")}</strong>{peer && <small>Combine os detalhes por aqui</small>}</div></div>
          {peer && <ActionMenu label="Opções da conversa" trigger={<Ellipsis/>} items={[{label:"Atualizar conversa",disabled:deleting,onSelect:()=>{setVersion(value=>value+1);recipient.reload();conversations.reload()}},{label:"Excluir conversa",icon:<Trash2/>,danger:true,disabled:busy||deleting,onSelect:()=>askRemoval(peer,selected?.nome||(recipient.data?.id===peer?recipient.data.nome:"este contato"))}]} />}
        </header>
        <div className="project-context">{params.get("pedido") ? `Pedido #${params.get("pedido")}` : params.get("servico") ? `Serviço #${params.get("servico")}` : "Converse sobre o projeto e combine os detalhes"}</div>
        <div className="chat-body" aria-live="polite">
          {!peer && <div className="chat-empty"><MessageCircle /><h3>Vamos conversar?</h3><p>Selecione um contato ao lado para continuar seu projeto.</p></div>}
          {loading && <Skeleton kind="row" count={2} />}
          {peer && !loading && !messages.length && !error && <div className="chat-empty"><MessageCircle /><p>Envie a primeira mensagem para combinar os detalhes do serviço.</p></div>}
          {messages.map(item => <div className={`bubble ${item.id_remetente === getSession()?.usuario.id ? "outgoing" : "incoming"}`} key={item.id_mensagem}>
            <p>{item.mensagem.split(/(https:\/\/[^\s]+)/g).map((part,index)=>part.startsWith("https://")?<a key={index} href={part} target="_blank" rel="noreferrer noopener">{part}</a>:part)}</p><small>{date(item.data_envio)}{item.id_remetente === getSession()?.usuario.id && item.lida ? " · Lida" : ""}</small>
          </div>)}
          {(error || recipient.error) && <p role="alert">{error || recipient.error}</p>}
          <div ref={bottom} />
        </div>
        <form className="chat-input" onSubmit={send}>
          <Button variant="ghost" type="button" disabled={!peer || busy || deleting} aria-label="Compartilhar link" title="Compartilhar um arquivo ou referência por link" onClick={()=>setSharing(true)}><Link2 /></Button>
          <input aria-label="Mensagem" value={message} onChange={event => setMessage(event.target.value)} required maxLength={10000} disabled={!peer || busy || deleting || !!recipient.error || recipient.loading} placeholder="Escreva uma mensagem..." />
          <Button disabled={!peer || busy || deleting || !message.trim() || !!recipient.error || recipient.loading} aria-label="Enviar mensagem"><Send /></Button>
        </form>
      </div>
    </section>
    <Modal className="chat-delete-modal" open={!!removing} title="Excluir conversa?" onClose={()=>{if(!deleting)setRemoving(null)}}><p>A conversa com <strong>{removing?.nome}</strong> será removida somente do seu histórico. A outra pessoa continuará com a cópia dela.</p><p>Uma nova mensagem fará a conversa reaparecer, sem restaurar para você as mensagens que excluiu.</p>{deleteError&&<p role="alert">{deleteError}</p>}<div className="action-row"><Button variant="secondary" disabled={deleting} onClick={()=>setRemoving(null)}>Manter conversa</Button><Button disabled={deleting} className="delete-conversation-button" onClick={()=>void removeConversation()}><Trash2/>{deleting?"Excluindo...":"Excluir do meu histórico"}</Button></div></Modal>
    <Modal open={sharing} title="Compartilhar um link" onClose={()=>setSharing(false)}><p>Cole o link de um arquivo ou referência. Você poderá revisar a mensagem antes de enviar.</p><form className="data-form" onSubmit={event=>{event.preventDefault();if(!sharedUrl.startsWith("https://"))return;setMessage(current=>(current.trim()?current.trim()+"\n":"")+sharedUrl.trim());setSharedUrl("");setSharing(false)}}><label>Link HTTPS<TextInput name="shared_url" type="url" required pattern="https://.*" maxLength={2000} value={sharedUrl} onChange={event=>setSharedUrl(event.target.value)} placeholder="https://..."/></label><Button disabled={message.length+sharedUrl.length+1>10000}>Adicionar à mensagem</Button></form></Modal>
  </AppShell>
}
