import { Clock3, Heart, Star } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import type { Service } from "../lib/data";
import { Button } from "./ui";

export default function ServiceCard({ service }: { service: Service }) {
  const [favorite, setFavorite] = useState(() => { try { return JSON.parse(localStorage.getItem("tefreela.favorites") || "[]").includes(service.id); } catch { return false; } });
  const toggle = () => { try { const saved: string[] = JSON.parse(localStorage.getItem("tefreela.favorites") || "[]"); localStorage.setItem("tefreela.favorites", JSON.stringify(favorite ? saved.filter((id) => id !== service.id) : [...new Set([...saved, service.id])])); setFavorite(!favorite); } catch { /* Browser storage can be unavailable. */ } };
  return (
    <article className="service-card">
      <div className="service-image">
        <Link to={`/servico/${service.id}`}>
          <img src={service.image} alt="" />
        </Link>
        <span className="service-badge">{service.badge}</span>
        <Button
          variant="ghost"
          className={favorite ? "favorite is-active" : "favorite"}
          onClick={toggle}
          aria-label="Favoritar serviço"
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
        <div className="rating"><Star fill="currentColor" /> <strong>{service.rating}</strong> <span>({service.reviews})</span></div>
        <div className="service-footer">
          <span className="delivery"><Clock3 /> {service.delivery}</span>
          <div><span>A partir de</span><strong>R$ {service.price}</strong></div>
        </div>
      </div>
    </article>
  );
}
