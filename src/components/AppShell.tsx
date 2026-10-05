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
import { useEffect, useState, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import Brand from "./Brand";
import { Button } from "./ui";
import { api, clearSession, getSession } from "../lib/session";
import { useData, type Notification } from "../lib/data";

const nav = [
  { label: "Visão geral", to: "/app", icon: LayoutDashboard },
  { label: "Explorar", to: "/explorar", icon: Compass },
  { label: "Pedidos", to: "/app/pedidos", icon: ClipboardList, badge: "3" },
  { label: "Mensagens", to: "/app/mensagens", icon: MessageCircle, badge: "2" },
  { label: "Créditos", to: "/app/creditos", icon: WalletCards },
];

export default function AppShell({ children, title, role = "freelancer" }: { children: ReactNode; title: string; role?: "freelancer" | "cliente" }) {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const user = getSession()?.usuario;
  const navigate = useNavigate();
  const notifications = useData<Notification[]>("/notificacoes", []);
  const unread = notifications.data.filter((item) => !item.lida).length;
  const [, setIdentityVersion] = useState(0);
  useEffect(() => {
    const update = () => notifications.reload();
    const updateIdentity = () => setIdentityVersion((value) => value + 1);
    window.addEventListener("tefreela:notifications", update);
    window.addEventListener("tefreela:account", updateIdentity);
    return () => { window.removeEventListener("tefreela:notifications", update); window.removeEventListener("tefreela:account", updateIdentity); };
  }, []);
  async function logout() {
    const request = api("/auth/logout", {});
    clearSession(); navigate("/", { replace: true });
    await request.catch(() => {});
  }
  role = user?.tipo_usuario || role;

  return (
    <div className="app-layout">
      <aside className={open ? "sidebar is-open" : "sidebar"}>
        <div className="sidebar-brand"><Brand /><Button variant="ghost" className="sidebar-close" onClick={() => setOpen(false)}><X /></Button></div>
        <Link to={role === "cliente" ? "/explorar" : "/app/servicos"} className="new-service"><Plus /> {role === "cliente" ? "Encontrar um serviço" : "Criar novo serviço"}</Link>
        <nav className="app-nav">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.to;
            return <Link key={item.label} to={item.to === "/app" && role === "cliente" ? "/app/cliente" : item.to} className={active ? "active" : ""}><Icon /><span>{item.label}</span></Link>;
          })}
        </nav>
        <div className="sidebar-bottom">
          <Link to="/app/perfil"><Settings /> Meu perfil</Link>
          {role === "freelancer" && <Link to="/app/portfolio">Meu portfólio</Link>}
          <Link to="/ajuda#ajuda"><HelpCircle /> Central de ajuda</Link>
          <button onClick={logout}><LogOut /> Sair</button>
        </div>
      </aside>
      <main className="app-main">
        <header className="app-topbar">
          <div className="topbar-title">
            <Button variant="ghost" className="app-menu" onClick={() => setOpen(true)}><Menu /></Button>
            <div><span>Olá, {user?.nome || "usuário"}</span><strong>{title}</strong></div>
          </div>
          <div className="topbar-actions">
            <Button variant="ghost" className="notification" aria-label={`Notificações: ${unread} não lidas`} onClick={() => navigate("/app/notificacoes")}><Bell />{unread > 0 && <span />}</Button>
            <button className="profile-menu" onClick={() => navigate("/app/perfil")}><img src={user?.foto || "/avatar-placeholder.svg"} alt="" /><span><strong>{user?.nome || "Minha conta"}</strong><small>{role === "cliente" ? "Cliente" : "Freelancer"}</small></span><ChevronDown /></button>
          </div>
        </header>
        <div className="app-content">{children}</div>
      </main>
    </div>
  );
}
