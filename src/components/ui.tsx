import { useEffect, useRef, useState, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from "react";
import { ArrowRight, Inbox, X } from "lucide-react";
import { Link } from "react-router";

export function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "dark";
}) {
  return (
    <button className={`btn btn-${variant} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function ButtonLink({
  children,
  to,
  variant = "primary",
  className = "",
}: {
  children: ReactNode;
  to: string;
  variant?: "primary" | "secondary" | "ghost" | "dark";
  className?: string;
}) {
  return (
    <Link className={`btn btn-${variant} ${className}`} to={to}>
      {children}
    </Link>
  );
}

export function Heading({
  children,
  as = "h2",
  className = "",
}: {
  children: ReactNode;
  as?: "h1" | "h2" | "h3" | "h4";
  className?: string;
}) {
  const Tag = as;
  return <Tag className={className}>{children}</Tag>;
}

export function TextInput({
  icon,
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { icon?: ReactNode }) {
  return (
    <div className={`input-wrap ${className}`}>
      {icon}
      <input aria-label={props["aria-label"] || (!props.name ? props.placeholder : undefined)} {...props} />
    </div>
  );
}

export function SectionTitle({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="section-heading">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <Heading as="h2">{title}</Heading>
        {description && <p>{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`ui-card ${className}`}>{children}</section>
}
export function Badge({ children, tone = "blue" }: { children: ReactNode; tone?: string }) {
  return <span className={`ui-badge badge-${tone}`}>{children}</span>
}
export function Avatar({ src, name, size = 40, status }: { src?: string | null; name: string; size?: number | "small" | "medium" | "large" | "extra-large"; status?: "online" | "offline" }) {
  const [failed, setFailed] = useState(false)
  useEffect(() => setFailed(false), [src])
  const pixels = typeof size === "number" ? size : {small:28,medium:40,large:64,"extra-large":112}[size]
  const initials = name.trim().split(/\s+/).filter(Boolean).slice(0,2).map(part=>part[0]).join("").toUpperCase() || "TF"
  return <span className={`ui-avatar ${status ? `avatar-${status}` : ""}`} style={{width:pixels,height:pixels,fontSize:Math.max(10,pixels*.32)}} role={!src||failed?"img":undefined} aria-label={!src||failed?name||"Avatar":undefined}>{src&&!failed?<img src={src} alt={name} width={pixels} height={pixels} onError={()=>setFailed(true)}/>:initials}{status&&<i className="avatar-presence" title={status==="online"?"Online":"Offline"}/>}</span>
}
export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) { return <select {...props} className={`ui-select ${props.className || ""}`} /> }
export function Skeleton({ kind = "card", count = 1 }: { kind?: "card" | "row" | "profile" | "stat"; count?: number }) {
  return <>{Array.from({length:count}, (_,index) => <div className={`skeleton skeleton-${kind}`} key={index} role="status" aria-label="Carregando"><div className="skeleton-media" /><div className="skeleton-line" /><div className="skeleton-line short" /><span className="sr-only">Carregando conteúdo...</span></div>)}</>
}
export function EmptyState({ title, description, to, action, icon, onAction }: {title:string; description:string; to?:string; action?:string; icon?:ReactNode; onAction?:()=>void}) {
  return <div className="ui-empty"><span className="empty-icon">{icon || <Inbox />}</span><h3>{title}</h3><p>{description}</p>{onAction ? <Button variant="secondary" onClick={onAction}>{action || "Tentar novamente"}<ArrowRight /></Button> : to && <ButtonLink to={to} variant="secondary">{action || "Explorar serviços"}<ArrowRight /></ButtonLink>}</div>
}
export function Tabs({ items, value, onChange }: { items:{value:string;label:string;count?:number}[];value:string;onChange:(value:string)=>void }) {
  return <div className="ui-tabs" role="group" aria-label="Filtrar conteúdo">{items.map(item => <button key={item.value} aria-pressed={value === item.value} className={value === item.value ? "active" : ""} onClick={() => onChange(item.value)}>{item.label}{item.count !== undefined && <span>{item.count}</span>}</button>)}</div>
}
export function Modal({ open, onClose, title, children }: {open:boolean;onClose:()=>void;title:string;children:ReactNode}) {
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => { const element = dialog.current; if (!element) return; if (open && !element.open) element.showModal(); else if (!open && element.open) element.close(); return () => { if (element.open) element.close() } }, [open])
  return <dialog ref={dialog} className="ui-modal" aria-label={title} onCancel={event => { event.preventDefault(); onClose() }} onClick={event => { if (event.target === event.currentTarget) { const rect = event.currentTarget.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) onClose() } }}><header><h2>{title}</h2><Button variant="ghost" aria-label="Fechar janela" onClick={onClose}><X /></Button></header>{children}</dialog>
}
