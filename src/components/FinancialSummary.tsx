import { Banknote, ChartNoAxesCombined, Clock3, Percent } from "lucide-react"
import { money } from "../lib/data"
import { Skeleton } from "./ui"
export type FeeSummary={total_concluidos:number;valor_bruto:number;total_taxas:number;valor_liquido:number;taxas_pendentes:number;valor_pendente:number;percentual_atual:number;simulado:true}
export default function FinancialSummary({data,loading=false}:{data:FeeSummary|null;loading?:boolean}){
 if(loading)return <section className="dashboard-stats"><Skeleton kind="stat" count={4}/></section>
 if(!data)return null
 const cards=[{label:"Valor bruto",value:money(data.valor_bruto),note:`${data.total_concluidos} serviços concluídos`,icon:Banknote},{label:"Taxas da plataforma",value:money(data.total_taxas),note:"Calculadas somente na conclusão",icon:Percent},{label:"Valor líquido estimado",value:money(data.valor_liquido),note:"Bruto menos taxas; valores simulados",icon:ChartNoAxesCombined},{label:"Taxas pendentes",value:data.taxas_pendentes,note:`${money(data.valor_pendente)} em simulação`,icon:Clock3}]
 return <section className="dashboard-stats financial-summary" aria-label="Resumo financeiro simulado">{cards.map(({label,value,note,icon:Icon})=><article className="stat-card" key={label}><div><span>{label}</span><strong>{value}</strong><small>{note}</small></div><span className="stat-icon"><Icon/></span></article>)}</section>
}
