import { ChevronDown, Filter, Search, SlidersHorizontal, X } from "lucide-react";
import { useState } from "react";
import { useSearchParams } from "react-router";
import PublicHeader from "../components/PublicHeader";
import ServiceCard from "../components/ServiceCard";
import { Button, Heading, TextInput } from "../components/ui";
import { categories, services } from "../data/mock";

export default function ExplorePage() {
  const [params] = useSearchParams();
  const [filters, setFilters] = useState(false);
  const initial = params.get("q") || "";

  return (
    <div className="page-bg">
      <PublicHeader />
      <main className="container explore-page">
        <div className="explore-head">
          <div><span className="eyebrow">Marketplace Tefreela</span><Heading as="h1">Encontre o serviço ideal</Heading><p>Profissionais prontos para tirar seu projeto do papel.</p></div>
          <div className="explore-search"><TextInput icon={<Search />} defaultValue={initial} placeholder="Busque por serviço ou habilidade" /><Button>Buscar</Button></div>
        </div>
        <div className="explore-toolbar">
          <span><strong>436</strong> serviços encontrados</span>
          <div><Button variant="secondary" className="filter-toggle" onClick={() => setFilters(!filters)}><Filter /> Filtros</Button><button className="sort-button">Mais relevantes <ChevronDown /></button></div>
        </div>
        <div className="explore-layout">
          <aside className={filters ? "filters is-open" : "filters"}>
            <div className="filter-mobile-head"><strong>Filtros</strong><Button variant="ghost" onClick={() => setFilters(false)}><X /></Button></div>
            <div className="filter-title"><strong>Filtros</strong><button>Limpar</button></div>
            <div className="filter-group"><strong>Categoria</strong>{categories.slice(0, 7).map((item, i) => <label key={item.name}><input type="checkbox" defaultChecked={i === 0 && params.has("categoria")} /><span>{item.name}</span><small>{item.count}</small></label>)}</div>
            <div className="filter-group"><strong>Faixa de preço</strong><div className="price-inputs"><input placeholder="R$ mín." /><span>—</span><input placeholder="R$ máx." /></div></div>
            <div className="filter-group"><strong>Prazo de entrega</strong>{["Até 3 dias", "Até 7 dias", "Até 14 dias"].map((item) => <label key={item}><input name="prazo" type="radio" /><span>{item}</span></label>)}</div>
            <div className="filter-group"><strong>Avaliação</strong>{["4.5 ou mais", "4.0 ou mais"].map((item) => <label key={item}><input name="avaliacao" type="radio" /><span>{item}</span></label>)}</div>
            <Button className="apply-filter" onClick={() => setFilters(false)}>Aplicar filtros</Button>
          </aside>
          <div className="results-grid">
            {[...services, ...services].map((service, index) => <ServiceCard key={`${service.id}-${index}`} service={service} />)}
          </div>
        </div>
      </main>
    </div>
  );
}
