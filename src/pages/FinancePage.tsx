import { Check, CircleHelp, FlaskConical, RefreshCw } from "lucide-react"
import { useRef, useState } from "react"
import AppShell from "../components/AppShell"
import FinancialSummary, {type FeeSummary} from "../components/FinancialSummary"
import { Badge, Button, EmptyState, Heading, Modal, Skeleton } from "../components/ui"
import { api } from "../lib/session"
import { date, money, useData } from "../lib/data"
type Fee={id:number;pedido_id:number;freelancer_id:string;valor_servico:number;percentual_taxa:number;valor_taxa:number;valor_liquido:number;status:"pendente"|"paga"|"cancelada";concluido_em:string;pago_em:string|null;pedido:{servico:{titulo:string}|null;cliente:{nome:string}|null}}
type History={items:Fee[];total:number;pagina:number;por_pagina:number;simulado:true}
const labels={pendente:"Pendente",paga:"Paga",cancelada:"Cancelada"}
export default function FinancePage(){
 const [page,setPage]=useState(1),[selected,setSelected]=useState<Fee|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState("")
 const lock=useRef(false)
 const history=useData<History|null>(`/taxas/minhas?page=${page}`,null),summary=useData<FeeSummary|null>("/taxas/resumo",null)
 const reload=()=>{history.reload();summary.reload()}
 async function confirm(){
  if(!selected||lock.current)return
  lock.current=true;setBusy(true);setError("")
  try{await api(`/taxas/${selected.id}/simular-pagamento`,{});setSelected(null);reload()}catch(caught){setError((caught as Error).message)}finally{lock.current=false;setBusy(false)}
 }
 return <AppShell title="Financeiro"><div className="page-title-row"><div><span className="eyebrow">Seu trabalho em números</span><Heading as="h1">Taxas da plataforma</Heading><p>Acompanhe as taxas dos seus serviços concluídos.</p></div><Button variant="secondary" onClick={reload} disabled={busy}><RefreshCw/>Atualizar</Button></div>
 <div className="academic-notice" role="note"><FlaskConical/><div><strong>Simulação acadêmica</strong><p>Nenhum dinheiro é movimentado. Não solicitamos cartão nem dados bancários. Taxas pendentes não bloqueiam suas atividades.</p></div></div>
 {(history.error||summary.error)&&<p role="alert">{history.error||summary.error} <Button variant="ghost" onClick={reload}>Tentar novamente</Button></p>}
 <FinancialSummary data={summary.data} loading={summary.loading&&!summary.data}/>
 {summary.data&&<p className="finance-policy"><CircleHelp aria-hidden="true"/><span>Taxa atual: <strong>{summary.data.percentual_atual}%</strong> do serviço, registrada apenas na conclusão. Cada taxa preserva o percentual aplicado na sua data.</span></p>}
 <section className="panel fee-history"><div className="panel-head"><h2>Histórico de taxas</h2><Badge tone="blue">{history.data?.total??"…"} registros</Badge></div>
 {history.loading&&<Skeleton kind="row" count={3}/>}
 {!history.loading&&!history.error&&!history.data?.items.length&&<EmptyState title="Seu histórico começa na primeira entrega." description="Ao concluir um serviço, a taxa simulada aparecerá aqui. Publicar, aceitar ou iniciar um pedido não gera taxa."/>}
 {!!history.data?.items.length&&<><div className="fee-table" role="table" aria-label="Histórico de taxas simuladas"><div className="fee-table-head" role="row">{["Serviço / Cliente","Conclusão","Valor do serviço","Taxa","Valor líquido","Status / Ação"].map(label=><span role="columnheader" key={label}>{label}</span>)}</div>{history.data.items.map(fee=><article className="fee-row" role="row" key={fee.id}><div role="cell"><small className="mobile-cell-label">Serviço / Cliente</small><strong>{fee.pedido?.servico?.titulo||`Pedido #${fee.pedido_id}`}</strong><small>{fee.pedido?.cliente?.nome||"Cliente"} · #{fee.pedido_id}</small></div><div role="cell"><small className="mobile-cell-label">Conclusão</small><span>{date(fee.concluido_em)}</span></div><div role="cell"><small className="mobile-cell-label">Valor do serviço</small><strong>{money(fee.valor_servico)}</strong></div><div role="cell"><small className="mobile-cell-label">Taxa</small><strong>{money(fee.valor_taxa)}</strong><small>{fee.percentual_taxa}% do serviço</small></div><div role="cell"><small className="mobile-cell-label">Valor líquido</small><strong>{money(fee.valor_liquido)}</strong></div><div role="cell" className="fee-actions"><Badge tone={fee.status==="paga"?"green":fee.status==="pendente"?"orange":"gray"}>{labels[fee.status]}</Badge>{fee.status==="pendente"&&<Button variant="secondary" disabled={busy} aria-label={`Simular pagamento da taxa do pedido ${fee.pedido_id}`} onClick={()=>{setSelected(fee);setError("")}}>Simular pagamento</Button>}{fee.status==="paga"&&fee.pago_em&&<small>Simulado em {date(fee.pago_em)}</small>}</div></article>)}</div><nav className="fee-pagination" aria-label="Páginas do histórico"><Button variant="secondary" disabled={page===1||history.loading} onClick={()=>setPage(value=>value-1)}>Anterior</Button><span>Página {page} de {Math.max(1,Math.ceil(history.data.total/history.data.por_pagina))}</span><Button variant="secondary" disabled={page*history.data.por_pagina>=history.data.total||history.loading} onClick={()=>setPage(value=>value+1)}>Próxima</Button></nav></>}
 </section>
 <Modal open={!!selected} title="Pagamento fictício da taxa" onClose={()=>{if(!busy)setSelected(null)}}><p className="academic-notice">Este pagamento é apenas uma simulação acadêmica e não realiza nenhuma transação financeira real.</p>{selected&&<dl className="fee-payment-summary"><div><dt>Serviço</dt><dd>{selected.pedido?.servico?.titulo||`Pedido #${selected.pedido_id}`}</dd></div><div><dt>Valor do serviço</dt><dd>{money(selected.valor_servico)}</dd></div><div><dt>Taxa da plataforma</dt><dd>{selected.percentual_taxa}%</dd></div><div><dt>Valor da taxa</dt><dd>{money(selected.valor_taxa)}</dd></div><div><dt>Valor líquido estimado</dt><dd>{money(selected.valor_liquido)}</dd></div></dl>}{error&&<p role="alert">{error}</p>}<div className="action-row"><Button variant="secondary" disabled={busy} onClick={()=>setSelected(null)}>Cancelar</Button><Button disabled={busy} onClick={()=>void confirm()}><Check/>{busy?"Confirmando...":"Confirmar pagamento fictício"}</Button></div></Modal>
 </AppShell>
}
