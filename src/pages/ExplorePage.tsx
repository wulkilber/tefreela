import { ChevronDown, Filter, Search, SlidersHorizontal, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import PublicHeader from "../components/PublicHeader";
import ServiceCard from "../components/ServiceCard";
import { Button, EmptyState, Heading, Skeleton, TextInput } from "../components/ui";
import { categoryName, serviceCard, useData, type Category, type ServiceRecord } from "../lib/data";

import { useDrawer } from "../lib/useDrawer";
export default function ExplorePage() {
  const [params, setParams] = useSearchParams();
  const [filters, setFilters] = useState(false);
  const panel=useRef<HTMLElement>(null);
  const close=useCallback(()=>setFilters(false),[]);
  useDrawer(filters,close,panel);
  const catalog = useData<ServiceRecord[]>("/servicos", []);
  const categoryData = useData<Category[]>("/categorias", []);
  const services = catalog.data.map(serviceCard);
  const categories = categoryData.data.map((category) => ({ name: categoryName(category) }));
  const initial = params.get("q") || "";
  const [query, setQuery] = useState(initial);
  const [selected, setSelected] = useState<string[]>(params.get("categoria") ? [params.get("categoria")!] : []);
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");
  const [days, setDays] = useState(0);
  const [rating, setRating] = useState(0);
  const [sort, setSort] = useState("relevance");
  useEffect(() => { setQuery(params.get("q") || ""); setSelected(params.get("categoria") ? [params.get("categoria")!] : []); }, [params]);
  const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const results = services.filter((service) =>
    normalize(`${service.title} ${service.category} ${service.seller} ${service.role}`).includes(normalize(initial)) &&
    (!selected.length || selected.includes(service.category)) &&
    (!min || service.price >= Number(min)) && (!max || service.price <= Number(max)) &&
    (!days || parseInt(service.delivery) <= days) && service.rating >= rating
  ).sort((a, b) => sort === "price" ? a.price - b.price : sort === "rating" ? b.rating - a.rating : 0);
  const search = () => { const next = new URLSearchParams(params); if (query.trim()) next.set("q", query.trim()); else next.delete("q"); setParams(next); };
  const clear = () => { setSelected([]); setMin(""); setMax(""); setDays(0); setRating(0); setQuery(""); setSort("relevance"); setParams({}); };


  return (
    <div className="page-bg">
      <PublicHeader />
      <main className="container explore-page">
        {filters && <button className="filters-backdrop" aria-label="Fechar filtros" tabIndex={-1} onClick={() => setFilters(false)} />}
        <div className="explore-head">
          <div><span className="eyebrow">Marketplace Tefreela</span><Heading as="h1">Encontre o serviço ideal</Heading><p>Profissionais prontos para tirar seu projeto do papel.</p></div>
          <form className="explore-search" onSubmit={(event) => { event.preventDefault(); search(); }}><TextInput icon={<Search />} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Busque por serviço ou habilidade" /><Button type="submit">Buscar</Button></form>
        </div>
        <div className="explore-toolbar">
          <span><strong>{results.length}</strong> serviços encontrados</span>
          <div><Button variant="secondary" className="filter-toggle" onClick={() => setFilters(!filters)}><Filter /> Filtros</Button><select aria-label="Ordenar serviços" className="sort-button" value={sort} onChange={(event) => setSort(event.target.value)}><option value="relevance">Mais relevantes</option><option value="price">Menor preço</option><option value="rating">Melhor avaliação</option></select></div>
        </div>
        <div className="active-filters" aria-label="Filtros ativos">
          {initial && <button className="filter-chip" onClick={() => { const next = new URLSearchParams(params); next.delete("q"); setParams(next) }}>Busca: {initial}<X /></button>}
          {selected.map(name => <button className="filter-chip" key={name} onClick={() => { setSelected(values => values.filter(value => value !== name)); if(params.get("categoria")===name){const next=new URLSearchParams(params);next.delete("categoria");setParams(next)} }}>{name}<X /></button>)}
          {(min || max) && <button className="filter-chip" onClick={()=>{setMin("");setMax("")}}>Preço: {min || "0"} – {max || "sem limite"}<X /></button>}
          {!!days && <button className="filter-chip" onClick={()=>setDays(0)}>Até {days} dias<X /></button>}
          {!!rating && <button className="filter-chip" onClick={()=>setRating(0)}>Nota {rating}+<X /></button>}
          {(selected.length>0 || min || max || days || rating || initial) && <Button variant="ghost" onClick={clear}>Limpar tudo</Button>}
        </div>
        <div className="explore-layout">
          <aside ref={panel} aria-label="Filtros de serviços" className={filters ? "filters is-open" : "filters"}>
            <div className="filter-mobile-head"><strong>Filtros</strong><Button variant="ghost" aria-label="Fechar filtros" onClick={() => setFilters(false)}><X /></Button></div>
            <div className="filter-title"><strong>Filtros</strong><button onClick={clear}>Limpar</button></div>
            <div className="filter-group"><strong>Categoria</strong>{categories.map((item) => <label key={item.name}><input type="checkbox" checked={selected.includes(item.name)} onChange={(event) => setSelected(event.target.checked ? [...selected, item.name] : selected.filter((name) => name !== item.name))} /><span>{item.name}</span><small>{services.filter((service) => service.category === item.name).length}</small></label>)}</div>
            <div className="filter-group"><strong>Faixa de preço</strong><div className="price-inputs"><input type="number" min="0" aria-label="Preço mínimo" value={min} onChange={(event) => setMin(event.target.value)} placeholder="R$ mín." /><span>—</span><input type="number" min="0" aria-label="Preço máximo" value={max} onChange={(event) => setMax(event.target.value)} placeholder="R$ máx." /></div></div>
            <div className="filter-group"><strong>Prazo de entrega</strong>{[3, 7, 14].map((item) => <label key={item}><input name="prazo" type="radio" checked={days === item} onChange={() => setDays(item)} /><span>Até {item} dias</span></label>)}</div>
            <div className="filter-group"><strong>Avaliação</strong>{[4.5, 4].map((item) => <label key={item}><input name="avaliacao" type="radio" checked={rating === item} onChange={() => setRating(item)} /><span>{item.toFixed(1)} ou mais</span></label>)}</div>
            <Button className="apply-filter" onClick={() => setFilters(false)}>Aplicar filtros</Button>
          </aside>
          <div className="results-grid">
            {catalog.loading && <Skeleton count={3} />}
            {catalog.error && <p role="alert">{catalog.error} <button onClick={catalog.reload}>Tentar novamente</button></p>}
            {categoryData.error && <p role="alert">Não foi possível carregar as categorias.</p>}
            {results.map((service) => <ServiceCard key={service.id} service={service} />)}
            {!catalog.loading && !catalog.error && !results.length && <EmptyState title="Ainda não encontramos essa combinação." description="Experimente outra palavra ou remova alguns filtros para descobrir novos talentos." onAction={clear} action="Ver todos os serviços" />}
          </div>
        </div>
      </main>
    </div>
  );
}
