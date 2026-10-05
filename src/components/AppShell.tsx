import {
  Bell,
  ChevronDown,
  ClipboardList,
  Compass,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  Menu,
  Plus,
  Settings,
  WalletCards,
  X,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { Link, useLocation } from "react-router";
import Brand from "./Brand";
import { Button } from "./ui";

const nav = [
  { label: "Visão geral", to: "/app", icon: LayoutDashboard },
  { label: "Explorar", to: "/explorar", icon: Compass },
  { label: "Pedidos", to: "/app/pedidos", icon: ClipboardList, badge: "3" },
  { label: "Mensagens", to: "/app/mensagens", icon: MessageCircle, badge: "2" },
  { label: "Créditos", to: "/app#creditos", icon: WalletCards },
];

export default function AppShell({ children, title, role = "freelancer" }: { children: ReactNode; title: string; role?: "freelancer" | "cliente" }) {
  const location = useLocation();
  const [open, setOpen] = useState(false);

  return (
    <div className="app-layout">
      <aside className={open ? "sidebar is-open" : "sidebar"}>
        <div className="sidebar-brand"><Brand /><Button variant="ghost" className="sidebar-close" onClick={() => setOpen(false)}><X /></Button></div>
        <Link to={role === "cliente" ? "/explorar" : "/app#novo"} className="new-service"><Plus /> {role === "cliente" ? "Encontrar um serviço" : "Criar novo serviço"}</Link>
        <nav className="app-nav">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.to;
            return <Link key={item.label} to={item.to} className={active ? "active" : ""}><Icon /><span>{item.label}</span>{item.badge && <b>{item.badge}</b>}</Link>;
          })}
        </nav>
        <div className="sidebar-bottom">
          <Link to="/app#configuracoes"><Settings /> Configurações</Link>
          <Link to="/#ajuda"><HelpCircle /> Central de ajuda</Link>
          <Link to="/"><LogOut /> Sair</Link>
        </div>
      </aside>
      <main className="app-main">
        <header className="app-topbar">
          <div className="topbar-title">
            <Button variant="ghost" className="app-menu" onClick={() => setOpen(true)}><Menu /></Button>
            <div><span>Olá, {role === "cliente" ? "Rafael" : "Marina"}</span><strong>{title}</strong></div>
          </div>
          <div className="topbar-actions">
            <Button variant="ghost" className="notification"><Bell /><span /></Button>
            <button className="profile-menu"><img src={role === "cliente" ? "https://i.pravatar.cc/100?img=13" : "https://i.pravatar.cc/100?img=47"} alt="" /><span><strong>{role === "cliente" ? "Rafael Melo" : "Marina Costa"}</strong><small>{role === "cliente" ? "Cliente" : "Freelancer"}</small></span><ChevronDown /></button>
          </div>
        </header>
        <div className="app-content">{children}</div>
      </main>
    </div>
  );
}
