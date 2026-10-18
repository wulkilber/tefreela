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
  Images,
  Layers3,
} from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
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
  const [mobile, setMobile] = useState(() => window.matchMedia("(max-width: 767px)").matches);
  const sidebar = useRef<HTMLElement>(null);
  useEffect(() => { const media = window.matchMedia("(max-width: 767px)"); const update = () => setMobile(media.matches); media.addEventListener("change", update); return () => media.removeEventListener("change", update) }, []);
  useEffect(() => { setOpen(false) }, [location.pathname]);
  useEffect(() => {
    if (!open || !mobile) return;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    sidebar.current?.querySelector<HTMLElement>("button")?.focus();
    const keyboard = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
      if (event.key === "Tab") {
        const elements = Array.from(sidebar.current?.querySelectorAll<HTMLElement>("a,button") || []);
        const first = elements[0], last = elements.at(-1);
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
      }
    };
    document.addEventListener("keydown", keyboard);
    return () => { document.body.style.overflow = overflow; document.removeEventListener("keydown", keyboard); previous?.focus() };
  }, [open, mobile]);
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
      {open && mobile && <button className="sidebar-backdrop" aria-label="Fechar navegação" onClick={() => setOpen(false)} tabIndex={-1} />}
      <aside ref={sidebar} id="workspace-navigation" inert={mobile && !open} className={open ? "sidebar is-open" : "sidebar"} aria-label="Navegação da conta">
        <div className="sidebar-brand"><Brand /><Button variant="ghost" className="sidebar-close" aria-label="Fechar menu" onClick={() => setOpen(false)}><X /></Button></div>
        <Link to={role === "cliente" ? "/explorar" : "/app/servicos"} className="new-service"><Plus /> {role === "cliente" ? "Encontrar um serviço" : "Criar novo serviço"}</Link>
        <p className="workspace-label">Seu espaço</p>
        <nav className="app-nav" aria-label="Menu principal da conta">
          {[...nav, ...(role === "freelancer" ? [{label:"Meus serviços",to:"/app/servicos",icon:Layers3},{label:"Portfólio",to:"/app/portfolio",icon:Images}] : [])].map((item) => {
            const Icon = item.icon;
            const to = item.to === "/app" && role === "cliente" ? "/app/cliente" : item.to;
            const active = location.pathname === to;
            return <Link key={item.label} to={to} aria-current={active ? "page" : undefined} className={active ? "active" : ""}><Icon /><span>{item.label}</span></Link>;
          })}
        </nav>
        <div className="sidebar-bottom">
          <Link to="/app/perfil"><Settings /> Meu perfil</Link>
          <Link to="/app/notificacoes"><Bell /> Notificações</Link>
          <Link to="/ajuda#ajuda"><HelpCircle /> Central de ajuda</Link>
          <button onClick={logout}><LogOut /> Sair</button>
          <span className="sidebar-footnote">Talentos conectados. Ideias em movimento.</span>
        </div>
      </aside>
      <main className="app-main" inert={mobile && open}>
        <header className="app-topbar">
          <div className="topbar-title">
            <Button variant="ghost" className="app-menu" aria-label="Abrir menu" aria-expanded={open} aria-controls="workspace-navigation" onClick={() => setOpen(true)}><Menu /></Button>
            <div><span>Olá, {user?.nome || "usuário"}</span><strong>{title}</strong></div>
          </div>
          <div className="topbar-actions">
            <Button variant="ghost" className="notification" aria-label={`Notificações: ${unread} não lidas`} onClick={() => navigate("/app/notificacoes")}><Bell />{unread > 0 && <span />}</Button>
            <button className="profile-menu" onClick={() => navigate("/app/perfil")}><img src={user?.foto || "/avatar-placeholder.svg"} alt="" /><span><strong>{user?.nome || "Minha conta"}</strong><small>{role === "cliente" ? "Cliente" : "Freelancer"}</small></span><ChevronDown /></button>
          </div>
        </header>
        <div className="app-content" key={location.pathname}>{children}</div>
      </main>
    </div>
  );
}
