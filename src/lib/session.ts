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
export class ApiError extends Error {
  constructor(message: string, public status: number) { super(message); }
}
export function getSession(): Session | null {
  try {
    const value = JSON.parse(sessionStorage.getItem(key) || "null")
    return value?.access_token && value?.usuario?.id ? value : null
  } catch {
    return null
  }
}
export function saveSession(session: Session) {
  sessionStorage.setItem(key, JSON.stringify(session))
}
export function clearSession() {
  sessionStorage.removeItem(key)
}
let refreshing: Promise<boolean> | null = null
export async function api<T>(
  path: string,
  body?: unknown,
  method?: string,
  retry = true,
): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${import.meta.env.VITE_API_URL || "/api"}${path}`, {
      method: method || (body === undefined ? "GET" : "POST"),
      headers: {
        "Content-Type": body instanceof Blob ? (body.type || "application/octet-stream") : "application/json",
        ...(getSession()
          ? { Authorization: `Bearer ${getSession()!.access_token}` }
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
  if (
    response.status === 401 &&
    retry &&
    !["/auth/refresh", "/auth/login", "/auth/logout"].includes(path) &&
    getSession()?.refresh_token
  ) {
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
          if (getSession()?.access_token !== session.access_token) return false
          saveSession({ ...session, ...tokens })
          return true
        } catch (error) {
          if (error instanceof ApiError && error.status === 401) { clearSession(); return false; }
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
    const message = path === "/auth/login" ? "Tudo certo. Boas-vindas ao Tefreela!" : path === "/mensagens" ? "Mensagem enviada." : path.includes("/imagens/") ? "Imagem atualizada." : path === "/pedidos" ? "Solicitação enviada ao profissional." : path === "/avaliacoes" ? "Obrigado! Sua avaliação foi enviada." : path.includes("/perfil") ? "Perfil atualizado." : "Alteração salva com sucesso."
    notify(message)
  }
  return data as T
}
