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
  X,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import Brand from "./Brand";
import { Button } from "./ui";
import { clearSession, getSessionUser } from "../lib/session";

const nav = [
  { label: "Visão geral", freelancerTo: "/app", clienteTo: "/app/cliente", icon: LayoutDashboard },
  { label: "Explorar", freelancerTo: "/explorar", clienteTo: "/explorar", icon: Compass },
  { label: "Pedidos", freelancerTo: "/app/pedidos", clienteTo: "/app/pedidos", icon: ClipboardList },
  { label: "Mensagens", freelancerTo: "/app/mensagens", clienteTo: "/app/mensagens", icon: MessageCircle },
];

export default function AppShell({
  children,
  title,
  role,
}: {
  children: ReactNode;
  title: string;
  role?: "freelancer" | "cliente";
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const user = getSessionUser();
  const resolvedRole =
    role || (user?.tipo_usuario === "cliente" ? "cliente" : "freelancer");
  const [open, setOpen] = useState(false);

  function logout() {
    clearSession();
    navigate("/", { replace: true });
  }

  return (
    <div className="app-layout">
      <aside className={open ? "sidebar is-open" : "sidebar"}>
        <div className="sidebar-brand">
          <Brand />
          <Button variant="ghost" className="sidebar-close" onClick={() => setOpen(false)}>
            <X />
          </Button>
        </div>

        <Link
          to={resolvedRole === "cliente" ? "/explorar" : "/app#novo"}
          className="new-service"
          onClick={() => setOpen(false)}
        >
          <Plus /> {resolvedRole === "cliente" ? "Encontrar um serviço" : "Criar novo serviço"}
        </Link>

        <nav className="app-nav">
          {nav.map((item) => {
            const Icon = item.icon;
            const to = resolvedRole === "cliente" ? item.clienteTo : item.freelancerTo;
            const active = location.pathname === to;
            return (
              <Link key={item.label} to={to} className={active ? "active" : ""} onClick={() => setOpen(false)}>
                <Icon />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-bottom">
          <Link to="/app/configuracoes" onClick={() => setOpen(false)}>
            <Settings /> Configurações
          </Link>
          <Link to="/#ajuda"><HelpCircle /> Central de ajuda</Link>
          <button type="button" className="sidebar-logout" onClick={logout}>
            <LogOut /> Sair
          </button>
        </div>
      </aside>

      <main className="app-main">
        <header className="app-topbar">
          <div className="topbar-title">
            <Button variant="ghost" className="app-menu" onClick={() => setOpen(true)}>
              <Menu />
            </Button>
            <div>
              <span>Olá, {user?.nome || (resolvedRole === "cliente" ? "Cliente" : "Freelancer")}</span>
              <strong>{title}</strong>
            </div>
          </div>

          <div className="topbar-actions">
            <Button variant="ghost" className="notification"><Bell /><span /></Button>
            <button className="profile-menu" onClick={() => navigate("/app/configuracoes")}>
              <span className="profile-avatar-fallback">
                {(user?.nome || "T").slice(0, 1).toUpperCase()}
              </span>
              <span>
                <strong>{user?.nome || "Usuário Tefreela"}</strong>
                <small>{resolvedRole === "cliente" ? "Cliente" : "Freelancer"}</small>
              </span>
              <ChevronDown />
            </button>
          </div>
        </header>

        <div className="app-content">{children}</div>
      </main>
    </div>
  );
}
