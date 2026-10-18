import { Check, Circle } from "lucide-react"
import { Link } from "react-router"
import { date, money, type Order } from "../lib/data"
export const orderLabels:Record<string,string>={solicitado:"Solicitado",aceito:"Aceito",em_andamento:"Em andamento",concluido:"Concluído",recusado:"Recusado",cancelado:"Cancelado"}
export function OrderTimeline({status}:{status:string}){
 if(["recusado","cancelado"].includes(status))return <p className="timeline-stopped">{status==="recusado"?"Este pedido foi recusado pelo profissional.":"Este pedido foi cancelado."}</p>
 const steps=["solicitado","aceito","em_andamento","concluido"]
 const current=steps.indexOf(status)
 return <ol className="order-timeline" aria-label="Etapas do pedido">{steps.map((step,index)=><li key={step} className={index<=current?"done":""} aria-current={index===current?"step":undefined}><span>{index<=current?<Check/>:<Circle/>}</span>{orderLabels[step]}</li>)}</ol>
}
export function OrderPreview({order,client}:{order:Order;client:boolean}){return <Link to="/app/pedidos" className="order-row"><div><strong>{order.servico?.titulo || `Pedido #${order.id_pedido}`}</strong><small>{client?order.freelancer?.nome:order.cliente?.nome} · {date(order.criado_em)}</small></div><div><span className="order-status" data-status={order.status}>{orderLabels[order.status]||order.status}</span><small>{money(order.valor)}</small></div></Link>}
