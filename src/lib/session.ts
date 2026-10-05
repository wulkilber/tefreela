export type User = { id: string; email: string; nome: string; tipo_usuario: "cliente" | "freelancer" };
export type Session = { access_token: string; refresh_token: string; usuario: User };
const key = "tefreela.session";
export function getSession(): Session | null {
  try {
    const value = JSON.parse(sessionStorage.getItem(key) || "null");
    return value?.access_token && value?.usuario?.id ? value : null;
  } catch { return null; }
}
export function saveSession(session: Session) { sessionStorage.setItem(key, JSON.stringify(session)); }
export function clearSession() { sessionStorage.removeItem(key); }
export async function api<T>(path: string, body?: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${import.meta.env.VITE_API_URL || "/api"}${path}`, {
      method: body === undefined ? "GET" : "POST",
      headers: { "Content-Type": "application/json", ...(getSession() ? { Authorization: `Bearer ${getSession()!.access_token}` } : {}) },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      signal: AbortSignal.timeout(15000),
    });
  } catch { throw new Error("Não foi possível conectar ao servidor. Tente novamente."); }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.erro || "Não foi possível concluir a solicitação.");
  return data as T;
}
