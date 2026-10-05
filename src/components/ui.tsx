import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";
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
      <input {...props} />
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
