import { useEffect, useState } from "react"
import { api } from "./session"
export type Profile = {
  id: string
  nome: string
  tipo_usuario: string
  foto?: string
  descricao?: string
  telefone?: string
  cidade?: string
  estado?: string
  saldo_creditos?: number
  portfolio?: Portfolio[]
}
export type Category = {
  id_categoria: number
  nome?: string
  nome_categoria?: string
  titulo?: string
  descricao?: string
}
export type Portfolio = {
  id_portfolio: number
  titulo: string
  descricao?: string
  imagem?: string
  link?: string
}
export type Review = {
  id_avaliacao: number
  nota: number
  comentario: string
  criado_em: string
}
export type ServiceRecord = {
  id_servico: number
  id_freelancer: string
  id_categoria: number
  titulo: string
  descricao: string
  preco: number
  prazo_dias: number
  status: string
  freelancer: Profile
  categoria: Category
  nota?: number
  total_avaliacoes?: number
  avaliacoes?: Review[]
}
export type Order = {
  id_pedido: number
  id_cliente: string
  id_freelancer: string
  id_servico: number
  valor: number
  status: string
  descricao_solicitacao: string
  criado_em: string
  servico: { titulo: string }
  cliente: Profile
  freelancer: Profile
  avaliacao: Review[]
}
export type Notification = {
  id_notificacao: number
  titulo: string
  mensagem: string
  lida: boolean
  criado_em: string
  tipo: string
}
export type Message = {
  id_mensagem: number
  id_remetente: string
  id_destinatario: string
  mensagem: string
  lida: boolean
  data_envio: string
}
export type Conversation = Profile & {
  ultima: Message
  nao_lidas: number
}
export const categoryName = (category?: Category) =>
  category?.nome ||
  category?.nome_categoria ||
  category?.titulo ||
  (category ? `Categoria ${category.id_categoria}` : "Serviço")
export const money = (value: number) =>
  Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  })
export const date = (value: string) => new Date(value).toLocaleString("pt-BR")
export function serviceCard(service: ServiceRecord) {
  const reviews = service.avaliacoes || []
  return {
    id: String(service.id_servico),
    title: service.titulo,
    category: categoryName(service.categoria),
    seller: service.freelancer?.nome || "Freelancer",
    role: "Freelancer",
    sellerId: service.id_freelancer,
    rating: Number(
      (
        service.nota ??
        (reviews.length
          ? reviews.reduce((sum, review) => sum + review.nota, 0) /
            reviews.length
          : 0)
      ).toFixed(1),
    ),
    reviews: service.total_avaliacoes ?? reviews.length,
    price: Number(service.preco),
    delivery: `${service.prazo_dias} dias`,
    image: "/service-placeholder.svg",
    avatar: service.freelancer?.foto || "/avatar-placeholder.svg",
    badge: "Disponível",
  }
}
export type Service = ReturnType<typeof serviceCard>
export function useData<T>(path: string | null, initial: T) {
  const [data, setData] = useState<T>(initial)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [version, setVersion] = useState(0)
  useEffect(() => {
    let active = true
    if (!path) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError("")
    api<T>(path)
      .then((values) => {
        if (active) setData(values)
      })
      .catch((error) => {
        if (active) setError(error.message)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [path, version])
  return {
    data,
    setData,
    loading,
    error,
    reload: () => setVersion((value) => value + 1),
  }
}
