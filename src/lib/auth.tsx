import { createContext, useCallback, useContext, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react"
import { api, ApiError, clearSession, getSession, saveSession, sessionRevision, subscribeSession, type Session, type User } from "./session"
import { notify } from "./feedback"
type Status = "loading" | "ready" | "guest" | "error"
type Auth = { session:Session|null; user:User|null; status:Status; retry:()=>void; login:(email:string,senha:string)=>Promise<Session>; logout:()=>Promise<void>; updateUser:(values:Partial<User>)=>void }
const Context=createContext<Auth|null>(null)
export function AuthProvider({children}:{children:ReactNode}){
 const revision=useSyncExternalStore(subscribeSession,sessionRevision,()=>0)
 const session=getSession(),id=session?.usuario.id
 const [status,setStatus]=useState<Status>(session?"loading":"guest")
 const [attempt,setAttempt]=useState(0)
 const validated=useRef<string|null>(null)
 const loginAttempt=useRef(0)
 useEffect(()=>{
  if(!id){validated.current=null;setStatus("guest");return}
  if(validated.current===id){setStatus("ready");return}
  let active=true
  setStatus("loading")
  api<{usuario:User}>("/auth/me").then(({usuario})=>{
   const current=getSession()
   if(!active||!current||current.usuario.id!==id)return
   validated.current=id;saveSession({...current,usuario});setStatus("ready")
  }).catch(error=>{if(!active)return;if(error instanceof ApiError&&error.status===401){clearSession();setStatus("guest")}else setStatus("error")})
  return()=>{active=false}
 },[id,attempt])
 const retry=useCallback(()=>{validated.current=null;setAttempt(value=>value+1)},[])
 const login=useCallback(async(email:string,senha:string)=>{
  const currentAttempt=++loginAttempt.current
  const next=await api<Session>("/auth/login",{email,senha})
  if(currentAttempt!==loginAttempt.current)throw new Error("Entrada cancelada. Entre novamente para continuar.")
  validated.current=next.usuario.id;saveSession(next);setStatus("ready");return next
 },[])
 const logout=useCallback(async()=>{
  loginAttempt.current++
  const request=api("/auth/logout",{})
  validated.current=null;clearSession();setStatus("guest");notify("Você saiu da sua conta.","info")
  await request.catch(()=>{})
 },[])
 const updateUser=useCallback((values:Partial<User>)=>{const current=getSession();if(current)saveSession({...current,usuario:{...current.usuario,...values}})},[])
 // The revision subscribes every consumer to same-tab and cross-tab identity updates.
 void revision
 return <Context.Provider value={{session,user:session?.usuario||null,status:!session?"guest":validated.current===id?"ready":status==="error"?"error":"loading",retry,login,logout,updateUser}}>{children}</Context.Provider>
}
export function useAuth(){const context=useContext(Context);if(!context)throw new Error("AuthProvider ausente");return context}
