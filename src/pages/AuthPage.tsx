import { ArrowLeft, BriefcaseBusiness, Check, Eye, LockKeyhole, Mail, UserRound } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { useState } from "react";
import { api, saveSession, type Session } from "../lib/session";
import Brand from "../components/Brand";
import { Button, Heading, TextInput } from "../components/ui";

export default function AuthPage({ mode }: { mode: "login" | "register" }) {
  const register = mode === "register";
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [accountType, setAccountType] = useState<"cliente" | "freelancer">(params.get("tipo") === "freelancer" ? "freelancer" : "cliente");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const values = new FormData(event.currentTarget);
    const email = String(values.get("email") || "").trim();
    const senha = String(values.get("senha") || "");
    setBusy(true); setError("");
    try {
      if (register) await api("/auth/cadastro", { nome: String(values.get("nome") || "").trim(), email, senha, tipo_usuario: accountType });
      const session = await api<Session>("/auth/login", { email, senha });
      saveSession(session);
      navigate(session.usuario.tipo_usuario === "cliente" ? "/app/cliente" : "/app", { replace: true });
    } catch (error) { setError(error instanceof Error ? error.message : "Não foi possível entrar."); }
    finally { setBusy(false); }
  }
  return (
    <main className="auth-page">
      <section className="auth-showcase">
        <Link className="auth-back" to="/"><ArrowLeft /> Voltar para o início</Link>
        <div className="auth-brand"><Brand /></div>
        <div className="auth-quote">
          <span className="hero-kicker">Onde ideias encontram talento</span>
          <Heading as="h1">{register ? "Comece algo incrível hoje." : "Que bom ter você de volta."}</Heading>
          <p>{register ? "Crie sua conta e faça parte de uma comunidade que transforma projetos em realidade." : "Seus projetos, conversas e oportunidades estão esperando por você."}</p>
          <div className="auth-benefits">
            <span><Check /> Créditos acadêmicos de demonstração</span><span><Check /> Perfis e portfólios de profissionais</span><span><Check /> Pedidos e conversas em um só lugar</span>
          </div>
        </div>
        <div className="auth-testimonial"><p>Encontre profissionais, converse sobre seu projeto e acompanhe cada etapa.</p><div><img src="/avatar-placeholder.svg" alt="" /><span><strong>Sua próxima parceria começa aqui</strong><small>Comunidade Tefreela</small></span></div></div>
      </section>
      <section className="auth-form-side">
        <div className="auth-form">
          <span className="auth-mobile-brand"><Brand /></span>
          <Heading as="h2">{register ? "Crie sua conta" : "Entre na sua conta"}</Heading>
          <p>{register ? "Leva menos de dois minutos." : "Acesse sua conta para continuar."}</p>
          {register && <div className="account-types"><button type="button" className={accountType === "cliente" ? "selected" : ""} onClick={() => setAccountType("cliente")}><UserRound /><span><strong>Quero contratar</strong><small>Encontre profissionais</small></span></button><button type="button" className={accountType === "freelancer" ? "selected" : ""} onClick={() => setAccountType("freelancer")}><BriefcaseBusiness /><span><strong>Quero trabalhar</strong><small>Ofereça serviços</small></span></button></div>}
          <form onSubmit={submit}>
            <fieldset disabled={busy} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
            {register && <label>Nome completo<TextInput name="nome" required maxLength={120} autoComplete="name" icon={<UserRound />} placeholder="Como podemos chamar você?" /></label>}
            <label>E-mail<TextInput name="email" required autoComplete="email" icon={<Mail />} type="email" placeholder="seu@email.com" /></label>
            <label>Senha<div className="password-field"><TextInput name="senha" required minLength={register ? 6 : undefined} autoComplete={register ? "new-password" : "current-password"} icon={<LockKeyhole />} type={showPassword ? "text" : "password"} placeholder="Sua senha" /><button type="button" aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"} onClick={() => setShowPassword(!showPassword)}><Eye /></button></div></label>
            {!register && <div className="form-options"><Link to="/recuperar-senha">Esqueci minha senha</Link></div>}
            {register && <label className="terms"><input type="checkbox" required /> Estou ciente de que esta é uma versão acadêmica com créditos fictícios. <Link to="/ajuda#dados">Sobre o protótipo</Link>.</label>}
            {error && <p role="alert">{error}</p>}
            <Button type="submit" className="auth-submit">{busy ? "Aguarde..." : register ? "Criar minha conta" : "Entrar"}</Button>
            </fieldset>
          </form>
          <div className="divider"><span>ou continue com</span></div>
          <button className="google-button" disabled title="Integração com Google ainda não configurada"><b>G</b> Google (em breve)</button>
          <p className="auth-switch">{register ? "Já tem uma conta?" : "Ainda não tem uma conta?"} <Link to={register ? "/entrar" : "/cadastro"}>{register ? "Entrar" : "Criar conta grátis"}</Link></p>
        </div>
      </section>
    </main>
  );
}
