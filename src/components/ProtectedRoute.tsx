import { useEffect, useState } from "react"
import { Navigate, Outlet, useLocation } from "react-router"
import Brand from "./Brand"
import { Skeleton } from "./ui"
import {
  api,
  ApiError,
  clearSession,
  getSession,
  saveSession,
  type User,
} from "../lib/session"

export default function ProtectedRoute() {
  const location = useLocation()
  const [state, setState] = useState<"loading" | "ready" | "invalid" | "error">(
    "loading",
  )
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    let active = true
    setState("loading")
    const session = getSession()
    if (!session) {
      setState("invalid")
      return
    }
    api<{ usuario: User }>("/auth/me")
      .then(({ usuario }) => {
        if (active) {
          const refreshed = getSession();
          if (!refreshed || refreshed.usuario.id !== session.usuario.id) { setState("invalid"); return; }
          saveSession({ ...refreshed, usuario })
          setState("ready")
        }
      })
      .catch((error) => {
        if (!active) return
        if (error instanceof ApiError && error.status === 401) {
          clearSession()
          setState("invalid")
        } else setState("error")
      })
    return () => {
      active = false
    }
  }, [attempt])
  if (state === "loading") return <div className="session-loading"><Brand /><p>Preparando seu espaço...</p><Skeleton kind="row" /></div>
  if (state === "error")
    return (
      <div role="alert">
        Não foi possível validar sua sessão.{" "}
        <button onClick={() => setAttempt(attempt + 1)}>
          Tentar novamente
        </button>
      </div>
    )
  if (state === "invalid")
    return <Navigate to="/entrar" replace state={{ from: location.pathname + location.search }} />
  const role = getSession()?.usuario.tipo_usuario
  if (location.pathname === "/app" && role === "cliente")
    return <Navigate to="/app/cliente" replace />
  if (location.pathname === "/app/cliente" && role === "freelancer")
    return <Navigate to="/app" replace />
  return <Outlet />
}
