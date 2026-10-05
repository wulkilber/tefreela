import { Clock3, Heart, Star } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import type { services } from "../data/mock";
import { Button } from "./ui";

type Service = (typeof services)[number];

export default function ServiceCard({ service }: { service: Service }) {
  const [favorite, setFavorite] = useState(false);
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
          onClick={() => setFavorite(!favorite)}
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
