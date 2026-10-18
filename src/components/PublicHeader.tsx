import { Menu, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router";
import Brand from "./Brand";
import { Button, ButtonLink } from "./ui";
import { useAuth } from "../lib/auth";
import ThemeToggle from "./ThemeToggle";
import { useDrawer } from "../lib/useDrawer";

export default function PublicHeader() {
  const [open, setOpen] = useState(false);
  const { session } = useAuth();
  const panel=useRef<HTMLElement>(null);
  const close=useCallback(()=>setOpen(false),[]);
  useDrawer(open,close,panel);
  const location = useLocation();
  useEffect(() => setOpen(false), [location.pathname, location.hash]);

  return (
    <header className="public-header">
      <div className="container header-inner">
        <Brand />
        {open && <button className="public-menu-backdrop" aria-label="Fechar navegação" tabIndex={-1} onClick={close}/>}
        <nav ref={panel} id="public-navigation" className={open ? "public-nav is-open" : "public-nav"} aria-label="Navegação principal">
          <Link to="/explorar">Explorar serviços</Link>
          <Link to="/#categorias">Categorias</Link>
          <Link to="/#como-funciona">Como funciona</Link>
          <div className="mobile-actions">
            {session ? <ButtonLink to="/app">Minha conta</ButtonLink> : <><ButtonLink to="/entrar" variant="ghost">Entrar</ButtonLink><ButtonLink to="/cadastro">Criar conta</ButtonLink></>}
          </div>
        </nav>
        <div className="header-actions">
          {session ? <ButtonLink to="/app">Minha conta</ButtonLink> : <><ButtonLink to="/entrar" variant="ghost">Entrar</ButtonLink><ButtonLink to="/cadastro">Criar conta</ButtonLink></>}
        </div>
        <div className="public-mobile-controls"><ThemeToggle /><Button
          variant="ghost"
          className="menu-button"
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          aria-expanded={open}
          aria-controls="public-navigation"
          onClick={() => setOpen(!open)}
        >
          {open ? <X /> : <Menu />}
        </Button></div>
      </div>
    </header>
  );
}
