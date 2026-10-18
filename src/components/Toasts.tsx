import { CheckCircle2, Info, TriangleAlert, X, CircleAlert } from "lucide-react"
import { useEffect, useState } from "react"
import type { ToastTone } from "../lib/feedback"
type ToastItem = { id: number; message: string; tone: ToastTone; leaving?: boolean }
export default function Toasts() {
  const [items, setItems] = useState<ToastItem[]>([])
  useEffect(() => {
    const timers = new Set<ReturnType<typeof setTimeout>>()
    let nextId = 0
    const receive = (event: Event) => {
      const { message, tone } = (event as CustomEvent).detail
      const id = ++nextId
      setItems(current => [...current.filter(item => item.message !== message), {id, message, tone}].slice(-3))
      const timer = setTimeout(() => {
        setItems(current => current.map(item => item.id === id ? {...item, leaving:true} : item))
        const exit = setTimeout(() => { setItems(current => current.filter(item => item.id !== id)); timers.delete(exit) }, 220)
        timers.add(exit); timers.delete(timer)
      }, tone === "error" ? 7000 : 4500)
      timers.add(timer)
    }
    window.addEventListener("tefreela:toast", receive)
    return () => { window.removeEventListener("tefreela:toast", receive); timers.forEach(clearTimeout) }
  }, [])
  return <div className="toast-stack" aria-label="Avisos da aplicação">{items.map(item => {
    const Icon = item.tone === "success" ? CheckCircle2 : item.tone === "error" ? CircleAlert : item.tone === "warning" ? TriangleAlert : Info
    return <div className={`toast toast-${item.tone} ${item.leaving ? "is-leaving" : ""}`} role={item.tone === "error" ? "alert" : "status"} key={item.id}><Icon /><span>{item.message}</span><button aria-label="Fechar aviso" onClick={() => setItems(current => current.filter(toast => toast.id !== item.id))}><X /></button></div>
  })}</div>
}
