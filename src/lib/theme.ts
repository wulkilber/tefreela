import { useSyncExternalStore } from "react"
export type Theme = "light" | "dark"
const key="tefreela.theme"
const listeners=new Set<()=>void>()
let choice:Theme|null=null
try{const saved=localStorage.getItem(key);if(saved==="light"||saved==="dark")choice=saved}catch{}
const media=window.matchMedia("(prefers-color-scheme: dark)")
function current():Theme{return choice||(media.matches?"dark":"light")}
function apply(){const value=current();document.documentElement.dataset.theme=value;document.documentElement.style.colorScheme=value;document.querySelector('meta[name="theme-color"]')?.setAttribute("content",value==="dark"?"#0f172a":"#2563eb");listeners.forEach(listener=>listener())}
media.addEventListener("change",()=>{if(!choice)apply()})
window.addEventListener("storage",event=>{if(event.key===key||event.key===null){choice=event.newValue==="light"||event.newValue==="dark"?event.newValue:null;apply()}})
apply()
export function setTheme(value:Theme){choice=value;try{localStorage.setItem(key,value)}catch{}apply()}
export function useTheme(){const theme=useSyncExternalStore(listener=>{listeners.add(listener);return()=>{listeners.delete(listener)}},current,()=>"light" as Theme);return {theme,toggleTheme:()=>setTheme(theme==="dark"?"light":"dark")}}
