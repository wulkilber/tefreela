import { ArrowLeft, BriefcaseBusiness, Check, Eye, LockKeyhole, Mail, UserRound } from "lucide-react";
import { Link } from "react-router";
import { useState } from "react";
import Brand from "../components/Brand";
import { Button, Heading, TextInput } from "../components/ui";

export default function AuthPage({ mode }: { mode: "login" | "register" }) {
  const register = mode === "register";
  const [accountType, setAccountType] = useState<"cliente" | "freelancer">("cliente");
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
            <span><Check /> Pagamentos seguros e protegidos</span><span><Check /> Profissionais e clientes verificados</span><span><Check /> Suporte em todas as etapas</span>
          </div>
        </div>
        <div className="auth-testimonial"><p>“Encontrei a profissional perfeita para minha marca e todo o processo foi muito simples.”</p><div><img src="https://i.pravatar.cc/100?img=5" alt="" /><span><strong>Ana Rodrigues</strong><small>Fundadora, Clara Studio</small></span></div></div>
      </section>
      <section className="auth-form-side">
        <div className="auth-form">
          <span className="auth-mobile-brand"><Brand /></span>
          <Heading as="h2">{register ? "Crie sua conta" : "Entre na sua conta"}</Heading>
          <p>{register ? "Leva menos de dois minutos." : "Acesse sua conta para continuar."}</p>
          {register && <div className="account-types"><button type="button" className={accountType === "cliente" ? "selected" : ""} onClick={() => setAccountType("cliente")}><UserRound /><span><strong>Quero contratar</strong><small>Encontre profissionais</small></span></button><button type="button" className={accountType === "freelancer" ? "selected" : ""} onClick={() => setAccountType("freelancer")}><BriefcaseBusiness /><span><strong>Quero trabalhar</strong><small>Ofereça serviços</small></span></button></div>}
          <form onSubmit={(e) => e.preventDefault()}>
            {register && <label>Nome completo<TextInput icon={<UserRound />} placeholder="Como podemos chamar você?" /></label>}
            <label>E-mail<TextInput icon={<Mail />} type="email" placeholder="seu@email.com" /></label>
            <label>Senha<div className="password-field"><TextInput icon={<LockKeyhole />} type="password" placeholder="Sua senha" /><Eye /></div></label>
            {!register && <div className="form-options"><label><input type="checkbox" /> Lembrar de mim</label><Link to="/entrar">Esqueci minha senha</Link></div>}
            {register && <label className="terms"><input type="checkbox" /> Li e concordo com os <a href="#termos">Termos de uso</a> e a <a href="#privacidade">Política de privacidade</a>.</label>}
            <Button className="auth-submit" onClick={() => window.location.assign(accountType === "cliente" ? "/app/cliente" : "/app")}>{register ? "Criar minha conta" : "Entrar"}</Button>
          </form>
          <div className="divider"><span>ou continue com</span></div>
          <button className="google-button"><b>G</b> Google</button>
          <p className="auth-switch">{register ? "Já tem uma conta?" : "Ainda não tem uma conta?"} <Link to={register ? "/entrar" : "/cadastro"}>{register ? "Entrar" : "Criar conta grátis"}</Link></p>
        </div>
      </section>
    </main>
  );
}
