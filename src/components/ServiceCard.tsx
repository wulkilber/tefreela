import { ArrowUpRight, Clock3, Heart, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { money, type Service } from "../lib/data";
import { notify } from "../lib/feedback";
import { useAuth } from "../lib/auth";
import { Button } from "./ui";

export default function ServiceCard({ service }: { service: Service }) {
  const {user}=useAuth();
  const favoriteKey=`tefreela.favorites.${user?.id || "guest"}`;
  const [favorite, setFavorite] = useState(() => { try { return JSON.parse(localStorage.getItem(favoriteKey) || "[]").includes(service.id); } catch { return false; } });
  useEffect(()=>{try{setFavorite(JSON.parse(localStorage.getItem(favoriteKey)||"[]").includes(service.id))}catch{setFavorite(false)}},[favoriteKey,service.id]);
  const toggle = () => { try { const saved: string[] = JSON.parse(localStorage.getItem(favoriteKey) || "[]"); localStorage.setItem(favoriteKey, JSON.stringify(favorite ? saved.filter((id) => id !== service.id) : [...new Set([...saved, service.id])])); setFavorite(!favorite); notify(favorite ? "Serviço removido dos favoritos." : "Serviço salvo nos favoritos.", "info"); } catch { /* Browser storage can be unavailable. */ } };
  return (
    <article className="service-card">
      <div className="service-image">
        <Link to={`/servico/${service.id}`} aria-label={`Ver serviço: ${service.title}`}>
          <img src={service.image} alt="" loading="lazy" />
        </Link>
        <span className="service-badge">{service.badge}</span>
        <Button
          variant="ghost"
          className={favorite ? "favorite is-active" : "favorite"}
          onClick={toggle}
          aria-label={favorite ? "Remover dos favoritos" : "Favoritar serviço"}
          aria-pressed={favorite}
        >
          <Heart fill={favorite ? "currentColor" : "none"} />
        </Button>
      </div>
      <div className="service-content">
        <div className="seller">
          <img src={service.avatar} alt={`Foto de ${service.seller}`} />
          <div><strong>{service.seller}</strong><span>{service.category}</span></div>
        </div>
        <Link className="service-title" to={`/servico/${service.id}`}>{service.title}</Link>
        <div className="rating"><Star fill={service.reviews ? "currentColor" : "none"} /> <strong>{service.reviews ? service.rating : "Novo"}</strong> <span>{service.reviews ? `(${service.reviews} avaliações)` : "Sem avaliações ainda"}</span></div>
        <div className="service-footer">
          <span className="delivery"><Clock3 /> {service.delivery}</span>
          <div><span>A partir de</span><strong>{money(service.price)}</strong><small>em créditos</small></div>
        </div>
        <Link className="card-quick-action" to={`/servico/${service.id}`}>Conhecer serviço<ArrowUpRight /></Link>
      </div>
    </article>
  );
}
