import { notify } from "./feedback"
export type User = {
  id: string
  email: string
  nome: string
  foto?: string
  tipo_usuario: "cliente" | "freelancer"
}
export type Session = {
  access_token: string
  refresh_token: string
  usuario: User
}
const key = "tefreela.session"
let memory: Session | null = null
let volatile = false
let revision = 0
const listeners = new Set<() => void>()
function changed() { revision++; listeners.forEach(listener => listener()) }
export function subscribeSession(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener) } }
export function sessionRevision() { return revision }
if (typeof window !== "undefined") window.addEventListener("storage", event => { if (event.key === key || event.key === null) { memory = null; volatile = false; changed() } })
export class ApiError extends Error {
  constructor(message: string, public status: number) { super(message); }
}
export function getSession(): Session | null {
  if (volatile) return memory
  try {
    const saved = localStorage.getItem(key)
    const legacy = saved ? null : sessionStorage.getItem(key)
    const value = JSON.parse(saved || legacy || "null")
    const valid = value?.access_token && value?.refresh_token && value?.usuario?.id && ["cliente", "freelancer"].includes(value?.usuario?.tipo_usuario)
    if (valid && legacy) { localStorage.setItem(key, legacy); sessionStorage.removeItem(key) }
    memory = valid ? value : null
    return memory
  } catch {
    return memory
  }
}
export function saveSession(session: Session) {
  memory = session
  try { localStorage.setItem(key, JSON.stringify(session)); sessionStorage.removeItem(key); volatile = false } catch { volatile = true }
  changed()
}
export function clearSession() {
  const owner = getSession()?.usuario.id
  memory = null
  volatile = true
  try { localStorage.removeItem(key); sessionStorage.removeItem(key); localStorage.removeItem("tefreela.favorites"); if (owner) localStorage.removeItem(`tefreela.favorites.${owner}`); volatile = false } catch { /* In-memory logout must still work. */ }
  changed()
}
let refreshing: Promise<boolean> | null = null
export async function api<T>(
  path: string,
  body?: unknown,
  method?: string,
  retry = true,
): Promise<T> {
  const started = getSession()
  let response: Response
  try {
    response = await fetch(`${import.meta.env.VITE_API_URL || "/api"}${path}`, {
      method: method || (body === undefined ? "GET" : "POST"),
      headers: {
        "Content-Type": body instanceof Blob ? (body.type || "application/octet-stream") : "application/json",
        ...(started
          ? { Authorization: `Bearer ${started.access_token}` }
          : {}),
      },
      ...(body === undefined ? {} : { body: body instanceof Blob ? body : JSON.stringify(body) }),
      signal: AbortSignal.timeout(body instanceof Blob ? 60000 : 15000),
    })
  } catch {
    if ((method || (body === undefined ? "GET" : "POST")) !== "GET" && !["/auth/refresh", "/auth/logout"].includes(path) && !path.endsWith("/lidas")) notify("Não foi possível conectar ao servidor. Tente novamente.", "error")
    throw new ApiError("Não foi possível conectar ao servidor. Tente novamente.", 0)
  }
  const data = await response.json().catch(() => ({}))
  // A response from the previous account must never populate the next account's UI.
  if (started && getSession()?.usuario.id !== started.usuario.id) throw new ApiError("Sua sessão foi encerrada.", 401)
  if (
    response.status === 401 &&
    retry &&
    !["/auth/refresh", "/auth/login", "/auth/logout"].includes(path) &&
    getSession()?.refresh_token
  ) {
    const latest = getSession()
    if (latest && latest.access_token !== started?.access_token) return api<T>(path, body, method, false)
    if (!refreshing)
      refreshing = (async () => {
        const session = getSession()!
        try {
          const tokens = await api<{
            access_token: string
            refresh_token: string
          }>(
            "/auth/refresh",
            { refresh_token: session.refresh_token },
            "POST",
            false,
          )
          // Do not resurrect a session after the user signed out.
          const current = getSession()
          if (!current || current.usuario.id !== session.usuario.id) return false
          if (current.access_token !== session.access_token) return true
          saveSession({ ...current, ...tokens })
          return true
        } catch (error) {
          if (error instanceof ApiError && error.status === 401) {
            if (getSession()?.access_token !== session.access_token) return !!getSession()
            clearSession(); notify("Sessão expirada. Entre novamente.", "warning"); return false;
          }
          throw error
        }
      })().finally(() => {
        refreshing = null
      })
    if (await refreshing) return api<T>(path, body, method, false)
  }
  const writes = (method || (body === undefined ? "GET" : "POST")) !== "GET"
  const feedback = writes && !path.endsWith("/lidas") && !["/auth/refresh", "/auth/logout"].includes(path)
  if (!response.ok) {
    if (feedback) notify(data.erro || "Não foi possível concluir a ação.", "error")
    throw new ApiError(data.erro || "Não foi possível concluir a solicitação.", response.status)
  }
  if (feedback) {
    const message = path.startsWith("/conversas/") && method === "DELETE" ? "Conversa excluída do seu histórico." : path.includes("/simular-pagamento") ? "Pagamento fictício confirmado. Nenhum dinheiro foi movimentado." : path === "/auth/cadastro" ? "Conta criada com sucesso." : path === "/me/avatar" ? method === "DELETE" ? "Foto removida." : "Foto de perfil atualizada." : path === "/auth/login" ? "Tudo certo. Boas-vindas ao Tefreela!" : path === "/mensagens" ? "Mensagem enviada." : path.includes("/imagens/") ? "Imagem atualizada." : path === "/pedidos" ? "Solicitação enviada ao profissional." : path === "/avaliacoes" ? "Obrigado! Sua avaliação foi enviada." : path.includes("/perfil") ? "Perfil atualizado." : "Alteração salva com sucesso."
    notify(message)
  }
  return data as T
}
