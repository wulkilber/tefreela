import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router";
import { api, clearSession, getSession, saveSession, type User } from "../lib/session";

export default function ProtectedRoute() {
  const location = useLocation();
  const [state, setState] = useState<"loading" | "ready" | "invalid" | "error">("loading");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setState("loading");
    const session = getSession();
    if (!session) { setState("invalid"); return; }
    api<{ usuario: User }>("/auth/me").then(({ usuario }) => {
      if (active) { saveSession({ ...session, usuario }); setState("ready"); }
    }).catch((error) => {
      if (!active) return;
      if (error.message === "Sessão inválida ou expirada.") { clearSession(); setState("invalid"); }
      else setState("error");
    });
    return () => { active = false; };
  }, [attempt]);
  if (state === "loading") return <p role="status">Validando sua sessão...</p>;
  if (state === "error") return <div role="alert">Não foi possível validar sua sessão. <button onClick={() => setAttempt(attempt + 1)}>Tentar novamente</button></div>;
  if (state === "invalid") return <Navigate to="/entrar" replace state={{ from: location.pathname }} />;
  const role = getSession()?.usuario.tipo_usuario;
  if (location.pathname === "/app" && role === "cliente") return <Navigate to="/app/cliente" replace />;
  if (location.pathname === "/app/cliente" && role === "freelancer") return <Navigate to="/app" replace />;
  return <Outlet />;
}
