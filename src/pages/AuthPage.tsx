import {
  ArrowLeft,
  BriefcaseBusiness,
  Check,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  UserRound,
} from "lucide-react";
import { Link, useNavigate } from "react-router";
import { FormEvent, useState } from "react";
import Brand from "../components/Brand";
import { Button, Heading, TextInput } from "../components/ui";
import { api } from "../lib/api";
import { saveSession } from "../lib/session";

export default function AuthPage({ mode }: { mode: "login" | "register" }) {
  const register = mode === "register";
  const navigate = useNavigate();
  const [accountType, setAccountType] = useState<"cliente" | "freelancer">("cliente");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [terms, setTerms] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");

    if (register && senha !== confirmarSenha) {
      setError("As senhas não coincidem.");
      return;
    }
    if (register && !terms) {
      setError("Você precisa aceitar os Termos de uso e a Política de privacidade.");
      return;
    }

    setBusy(true);
    try {
      if (register) {
        await api("/api/auth/cadastro", {
          method: "POST",
          body: JSON.stringify({
            nome,
            email,
            senha,
            confirmarSenha,
            tipo_usuario: accountType,
          }),
        }, false);
      }

      const login = await api<{
        access_token: string;
        refresh_token: string;
        usuario: {
          id: string;
          email?: string | null;
          nome?: string | null;
          tipo_usuario: "cliente" | "freelancer" | "admin";
        };
      }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, senha }),
      }, false);

      saveSession(login.access_token, login.refresh_token, login.usuario, remember);
      navigate(login.usuario.tipo_usuario === "cliente" ? "/app/cliente" : "/app", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível continuar.");
    } finally {
      setBusy(false);
    }
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
            <span><Check /> Contratações organizadas</span>
            <span><Check /> Perfis para clientes e freelancers</span>
            <span><Check /> Suporte em todas as etapas</span>
          </div>
        </div>
      </section>

      <section className="auth-form-side">
        <div className="auth-form">
          <span className="auth-mobile-brand"><Brand /></span>
          <Heading as="h2">{register ? "Crie sua conta" : "Entre na sua conta"}</Heading>
          <p>{register ? "Leva menos de dois minutos." : "Acesse sua conta para continuar."}</p>

          {register && (
            <div className="account-types">
              <button type="button" className={accountType === "cliente" ? "selected" : ""} onClick={() => setAccountType("cliente")}>
                <UserRound /><span><strong>Quero contratar</strong><small>Encontre profissionais</small></span>
              </button>
              <button type="button" className={accountType === "freelancer" ? "selected" : ""} onClick={() => setAccountType("freelancer")}>
                <BriefcaseBusiness /><span><strong>Quero trabalhar</strong><small>Ofereça serviços</small></span>
              </button>
            </div>
          )}

          <form onSubmit={submit}>
            {register && (
              <label>Nome completo
                <TextInput value={nome} onChange={(e) => setNome(e.target.value)} icon={<UserRound />} placeholder="Como podemos chamar você?" required />
              </label>
            )}
            <label>E-mail
              <TextInput value={email} onChange={(e) => setEmail(e.target.value)} icon={<Mail />} type="email" placeholder="seu@email.com" required />
            </label>
            <label>Senha
              <div className="password-field">
                <TextInput value={senha} onChange={(e) => setSenha(e.target.value)} icon={<LockKeyhole />} type={showPassword ? "text" : "password"} placeholder="Sua senha" required />
                <button type="button" aria-label="Mostrar ou ocultar senha" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>
            </label>
            {register && (
              <label>Confirmar senha
                <TextInput value={confirmarSenha} onChange={(e) => setConfirmarSenha(e.target.value)} icon={<LockKeyhole />} type={showPassword ? "text" : "password"} placeholder="Repita sua senha" required />
              </label>
            )}
            {!register && (
              <div className="form-options">
                <label><input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} /> Lembrar de mim</label>
                <Link to="/entrar">Esqueci minha senha</Link>
              </div>
            )}
            {register && (
              <label className="terms">
                <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} />
                Li e concordo com os <a href="#termos">Termos de uso</a> e a <a href="#privacidade">Política de privacidade</a>.
              </label>
            )}
            {error && <p className="form-error">{error}</p>}
            <Button type="submit" className="auth-submit" disabled={busy}>
              {busy ? "Processando..." : register ? "Criar minha conta" : "Entrar"}
            </Button>
          </form>

          <p className="auth-switch">
            {register ? "Já tem uma conta?" : "Ainda não tem uma conta?"}{" "}
            <Link to={register ? "/entrar" : "/cadastro"}>{register ? "Entrar" : "Criar conta grátis"}</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
