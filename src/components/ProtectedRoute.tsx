import { Navigate, Outlet, useLocation } from "react-router"
import Brand from "./Brand"
import { Button, Skeleton } from "./ui"
import { useAuth } from "../lib/auth"
export default function ProtectedRoute({role}:{role?:"cliente"|"freelancer"}){
 const location=useLocation(),auth=useAuth()
 if(auth.status==="loading")return <div className="session-loading"><Brand/><p>Preparando seu espaço...</p><Skeleton kind="row"/></div>
 if(!auth.user)return <Navigate to="/entrar" replace state={{from:location.pathname+location.search}}/>
 if(auth.status==="error")return <div className="session-loading"><Brand/><p role="alert">Não foi possível validar sua sessão. Seus dados de acesso foram preservados.</p><Button onClick={auth.retry}>Tentar novamente</Button></div>
 const home=auth.user.tipo_usuario==="cliente"?"/app/cliente":"/app"
 if(role&&auth.user.tipo_usuario!==role)return <Navigate to={home} replace/>
 if((location.pathname==="/app"&&auth.user.tipo_usuario==="cliente")||(location.pathname==="/app/cliente"&&auth.user.tipo_usuario==="freelancer"))return <Navigate to={home} replace/>
 return <Outlet key={auth.user.id}/>
}
