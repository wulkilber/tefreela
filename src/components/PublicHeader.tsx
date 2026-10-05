import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import Brand from "./Brand";
import { Button, ButtonLink } from "./ui";
import { getSession } from "../lib/session";

export default function PublicHeader() {
  const [open, setOpen] = useState(false);
  const session = getSession();

  return (
    <header className="public-header">
      <div className="container header-inner">
        <Brand />
        <nav className={open ? "public-nav is-open" : "public-nav"} aria-label="Navegação principal">
          <Link to="/explorar">Explorar serviços</Link>
          <Link to="/explorar#categorias">Categorias</Link>
          <Link to="/#como-funciona">Como funciona</Link>
          <div className="mobile-actions">
            <ButtonLink to="/entrar" variant="ghost">Entrar</ButtonLink>
            <ButtonLink to="/cadastro">Criar conta</ButtonLink>
          </div>
        </nav>
        <div className="header-actions">
          {session ? <ButtonLink to="/app">Minha conta</ButtonLink> : <><ButtonLink to="/entrar" variant="ghost">Entrar</ButtonLink><ButtonLink to="/cadastro">Criar conta</ButtonLink></>}
        </div>
        <Button
          variant="ghost"
          className="menu-button"
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          onClick={() => setOpen(!open)}
        >
          {open ? <X /> : <Menu />}
        </Button>
      </div>
    </header>
  );
}
