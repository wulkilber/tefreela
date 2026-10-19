import { ArrowLeft, BriefcaseBusiness, Check, Eye, EyeOff, LockKeyhole, Mail, UserRound, X } from "lucide-react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router";
import { afterLogin } from "../lib/redirect";
import { useRef, useState } from "react";
import { api } from "../lib/session";
import { useAuth } from "../lib/auth";
import Brand from "../components/Brand";
import { Button, Heading, TextInput } from "../components/ui";
import ThemeToggle from "../components/ThemeToggle";

export default function AuthPage({ mode }: { mode: "login" | "register" }) {
  const register = mode === "register";
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuth();
  const [accountType, setAccountType] = useState<"cliente" | "freelancer">(params.get("tipo") === "freelancer" ? "freelancer" : "cliente");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation,setShowConfirmation]=useState(false);
  const [password,setPassword]=useState("");
  const [confirmation,setConfirmation]=useState("");
  const [created,setCreated]=useState(false);
  const submitting=useRef(false);
  const rules=[{label:"Pelo menos 8 caracteres",valid:password.length>=8},{label:"Uma letra",valid:/[A-Za-zÀ-ÖØ-öø-ÿ]/.test(password)},{label:"Um número",valid:/[0-9]/.test(password)}];
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    const values = new FormData(event.currentTarget);
    const email = String(values.get("email") || "").trim();
    const senha = String(values.get("senha") || "");
    const confirmarSenha=String(values.get("confirmarSenha")||"");
    if(register&&!created){
      if(!rules.every(rule=>rule.valid)){setError("A senha deve possuir pelo menos 8 caracteres, uma letra e um número.");return}
      if(senha!==confirmarSenha){setError("As senhas não coincidem.");return}
    }
    submitting.current=true;
    setBusy(true); setError("");
    try {
      if (register&&!created) {await api("/auth/cadastro", { nome: String(values.get("nome") || "").trim(), email, senha, confirmarSenha, tipo_usuario: accountType,telefone:String(values.get("telefone")||"").trim(),cidade:String(values.get("cidade")||"").trim(),estado:String(values.get("estado")||"").trim().toUpperCase() });setCreated(true)}
      const session = await auth.login(email, senha);
      navigate(afterLogin(location.state?.from, session.usuario.tipo_usuario), { replace: true });
    } catch (error) { setError(error instanceof Error ? error.message : "Não foi possível entrar."); }
    finally { submitting.current=false;setBusy(false); }
  }
  return (
    <main className="auth-page">
      <div className="auth-theme-control"><ThemeToggle /></div>
      <section className="auth-showcase">
        <Link className="auth-back" to="/"><ArrowLeft /> Voltar para o início</Link>
        <div className="auth-brand"><Brand /></div>
        <div className="auth-quote">
          <span className="hero-kicker">Onde ideias encontram talento</span>
          <Heading as="h1">{register ? "O próximo capítulo começa com você." : "Boas ideias merecem boas conexões."}</Heading>
          <p>{register ? "Crie sua conta e faça parte de uma comunidade que transforma projetos em realidade." : "Seus projetos, conversas e oportunidades estão esperando por você."}</p>
          <div className="auth-benefits">
            <span><Check /> Contratação sem taxa para o cliente</span><span><Check /> Perfis e portfólios de profissionais</span><span><Check /> Pedidos e conversas em um só lugar</span>
          </div>
        </div>
        <div className="auth-testimonial"><p>Encontre profissionais, converse sobre seu projeto e acompanhe cada etapa.</p><div><img src="/avatar-placeholder.svg" alt="" /><span><strong>Sua próxima parceria começa aqui</strong><small>Comunidade Tefreela</small></span></div></div>
      </section>
      <section className="auth-form-side">
        <div className="auth-form">
          <span className="auth-mobile-brand"><Brand /></span>
          <Heading as="h2">{register ? "Crie sua conta" : "Entre na sua conta"}</Heading>
          <p>{register ? "Leva menos de dois minutos." : "Acesse sua conta para continuar."}</p>
          {register && <div className="account-types"><button type="button" disabled={busy||created} aria-pressed={accountType==="cliente"} className={accountType === "cliente" ? "selected" : ""} onClick={() => setAccountType("cliente")}><UserRound /><span><strong>Quero contratar</strong><small>Encontre profissionais</small></span></button><button type="button" disabled={busy||created} aria-pressed={accountType==="freelancer"} className={accountType === "freelancer" ? "selected" : ""} onClick={() => setAccountType("freelancer")}><BriefcaseBusiness /><span><strong>Quero trabalhar</strong><small>Ofereça serviços</small></span></button></div>}
          <form onSubmit={submit}>
            <fieldset disabled={busy} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
            {register && <label>Nome completo<TextInput name="nome" required maxLength={120} autoComplete="name" icon={<UserRound />} placeholder="Como podemos chamar você?" /></label>}
            <label>E-mail<TextInput name="email" required autoComplete="email" icon={<Mail />} type="email" placeholder="seu@email.com" /></label>
            <label>Senha<div className="password-field"><TextInput name="senha" required maxLength={256} minLength={register ? 8 : undefined} value={password} onChange={event=>{setPassword(event.target.value);setError("")}} aria-describedby={register?"password-requirements":undefined} autoComplete={register ? "new-password" : "current-password"} icon={<LockKeyhole />} type={showPassword ? "text" : "password"} placeholder="Sua senha" /><button type="button" aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"} aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)}>{showPassword?<EyeOff/>:<Eye />}</button></div></label>
            {register&&<><ul id="password-requirements" className="password-requirements" aria-label="Requisitos da senha">{rules.map(rule=><li key={rule.label} className={rule.valid?"is-valid":""}>{rule.valid?<Check aria-label="Atendido"/>:<span className="requirement-dot" aria-label="Pendente"/>}{rule.label}</li>)}</ul><label>Confirmar senha<div className="password-field"><TextInput name="confirmarSenha" required maxLength={256} autoComplete="new-password" icon={<LockKeyhole/>} type={showConfirmation?"text":"password"} value={confirmation} onChange={event=>{setConfirmation(event.target.value);setError("")}} aria-invalid={confirmation?confirmation!==password:undefined} aria-describedby={confirmation?"password-match":undefined} placeholder="Digite a senha novamente"/><button type="button" aria-label={showConfirmation?"Ocultar confirmação de senha":"Mostrar confirmação de senha"} aria-pressed={showConfirmation} onClick={()=>setShowConfirmation(value=>!value)}>{showConfirmation?<EyeOff/>:<Eye/>}</button></div></label>{confirmation&&<p id="password-match" className={`password-match ${confirmation===password?"is-valid":"is-invalid"}`} role="status">{confirmation===password?<Check/>:<X/>}{confirmation===password?"As senhas coincidem":"As senhas não coincidem."}</p>}<div className="registration-details"><label>Telefone (opcional)<TextInput name="telefone" type="tel" maxLength={20} autoComplete="tel"/></label><label>Cidade (opcional)<TextInput name="cidade" maxLength={100} autoComplete="address-level2"/></label><label>Estado — UF (opcional)<TextInput name="estado" minLength={2} maxLength={2} pattern="[A-Za-z]{2}" autoComplete="address-level1"/></label></div></>}
            {!register && <div className="form-options"><Link to="/recuperar-senha">Esqueci minha senha</Link></div>}
            {register && <label className="terms"><input type="checkbox" required /> Estou ciente de que esta é uma versão acadêmica, sem transações financeiras reais. <Link to="/ajuda#dados">Sobre o protótipo</Link>.</label>}
            {created&&<p className="inline-success" role="status">Conta criada com sucesso. Se a entrada automática falhar, tente entrar novamente.</p>}
            {error && <p role="alert">{error}</p>}
            <Button type="submit" className="auth-submit">{busy ? "Aguarde..." : register&&!created ? "Criar minha conta" : "Entrar"}</Button>
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
