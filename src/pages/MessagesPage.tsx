import { CheckCheck, MoreHorizontal, Paperclip, Phone, Search, Send, Smile, Video } from "lucide-react";
import { useState } from "react";
import AppShell from "../components/AppShell";
import { Button, Heading, TextInput } from "../components/ui";

const conversations = [
  { name: "Fernando Alves", text: "Perfeito, pode seguir com essa opção!", time: "10:42", avatar: 14, unread: 2, online: true },
  { name: "Julia Moreira", text: "Enviei as referências no projeto.", time: "09:18", avatar: 25, unread: 0, online: true },
  { name: "Eduardo Nunes", text: "Qual o melhor prazo para você?", time: "Ontem", avatar: 8, unread: 0, online: false },
  { name: "Camila Rocha", text: "Obrigada pelo excelente trabalho.", time: "Ter", avatar: 44, unread: 0, online: false },
];

export default function MessagesPage() {
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState<string[]>([]);
  const send = () => { if (message.trim()) { setSent([...sent, message]); setMessage(""); } };
  return (
    <AppShell title="Mensagens">
      <section className="messages-shell">
        <aside className="conversation-list">
          <div className="message-title"><Heading as="h2">Mensagens</Heading><span>2 novas</span></div>
          <TextInput icon={<Search />} placeholder="Buscar conversa" />
          <div className="conversation-tabs"><button className="active">Todas</button><button>Não lidas</button></div>
          {conversations.map((person, index) => <button className={index === 0 ? "conversation active" : "conversation"} key={person.name}><span className="avatar-online"><img src={`https://i.pravatar.cc/100?img=${person.avatar}`} alt="" />{person.online && <i />}</span><span><strong>{person.name}</strong><small>{person.text}</small></span><span><small>{person.time}</small>{person.unread > 0 && <b>{person.unread}</b>}</span></button>)}
        </aside>
        <div className="chat">
          <header className="chat-head"><div><span className="avatar-online"><img src="https://i.pravatar.cc/100?img=14" alt="" /><i /></span><span><strong>Fernando Alves</strong><small>Online agora</small></span></div><div><Button variant="ghost"><Phone /></Button><Button variant="ghost"><Video /></Button><Button variant="ghost"><MoreHorizontal /></Button></div></header>
          <div className="project-context"><span>Projeto:</span><strong>Identidade visual — Lume Café</strong><button>Ver pedido</button></div>
          <div className="chat-body">
            <span className="chat-date">Hoje</span>
            <div className="bubble incoming"><p>Oi, Marina! Gostei bastante das duas propostas. A primeira combina muito com o que imaginávamos.</p><small>10:28</small></div>
            <div className="bubble outgoing"><p>Que bom que gostou, Fernando! Posso refinar a primeira opção com a paleta mais quente que conversamos.</p><small>10:34 <CheckCheck /></small></div>
            <div className="bubble incoming"><p>Perfeito, pode seguir com essa opção!</p><small>10:42</small></div>
            {sent.map((text, index) => <div className="bubble outgoing" key={index}><p>{text}</p><small>agora <CheckCheck /></small></div>)}
          </div>
          <div className="chat-input"><Button variant="ghost"><Paperclip /></Button><input value={message} onChange={(e) => setMessage(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Escreva uma mensagem..." /><Button variant="ghost"><Smile /></Button><Button onClick={send}><Send /></Button></div>
        </div>
      </section>
    </AppShell>
  );
}
