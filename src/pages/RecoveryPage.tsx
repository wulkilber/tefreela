import { useEffect, useState } from "react"
import PublicHeader from "../components/PublicHeader"
import { Button, ButtonLink, Heading, TextInput } from "../components/ui"
import { api, clearSession } from "../lib/session"
export default function RecoveryPage() {
  const [token] = useState(() => {
    const hash = new URLSearchParams(window.location.hash.slice(1))
    return hash.get("type") === "recovery" ? hash.get("access_token") : null
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  useEffect(() => {
    if (window.location.hash)
      window.history.replaceState(null, "", window.location.pathname)
  }, [])
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const values = new FormData(event.currentTarget)
    setBusy(true)
    setError("")
    try {
      const result = await api<{ mensagem: string }>(
        token ? "/auth/senha" : "/auth/recuperar",
        token
          ? { access_token: token, senha: values.get("senha") }
          : { email: values.get("email") },
      )
      setMessage(result.mensagem)
      if (token) clearSession()
    } catch (error) {
      setError((error as Error).message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="page-bg">
      <PublicHeader />
      <main className="container service-page">
        <section className="panel data-form recovery-panel">
          <Heading as="h1">
            {token ? "Definir nova senha" : "Recuperar acesso"}
          </Heading>
          {error && <p role="alert">{error}</p>}
          {message && <p role="status">{message}</p>}
          {!message && (
            <form onSubmit={submit}>
              {token ? (
                <label>
                  Nova senha
                  <TextInput
                    type="password"
                    name="senha"
                    required
                    minLength={6}
                    maxLength={256}
                    autoComplete="new-password"
                  />
                </label>
              ) : (
                <label>
                  E-mail
                  <TextInput
                    type="email"
                    name="email"
                    required
                    autoComplete="email"
                  />
                </label>
              )}
              <Button disabled={busy}>
                {busy
                  ? "Aguarde..."
                  : token
                    ? "Salvar senha"
                    : "Enviar instruções"}
              </Button>
            </form>
          )}
          <ButtonLink to="/entrar" variant="ghost">
            Voltar para entrar
          </ButtonLink>
        </section>
      </main>
    </div>
  )
}
