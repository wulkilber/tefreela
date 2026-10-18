import { ArrowUpRight, Star } from "lucide-react"
import { Link } from "react-router"
import type { Service } from "../lib/data"
import { Avatar, Badge } from "./ui"
export default function UserCard({person}:{person:Service}){
 return <article className="user-card"><div className="user-card-top"><Avatar src={person.avatar} name={person.seller} size={52}/><div><h3>{person.seller}</h3><p>Freelancer · {person.category}</p></div></div><p>Conheça seus serviços e portfólio para encontrar a parceria ideal.</p><Badge>{person.category}</Badge><div className="user-card-footer"><span className="rating"><Star fill="currentColor"/>{person.reviews?`${person.rating} (${person.reviews})`:"Novo na comunidade"}</span><Link to={`/perfil/${person.sellerId}`}>Ver perfil <ArrowUpRight size={12}/></Link></div></article>
}
