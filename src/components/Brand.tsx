import { Link } from "react-router";

export default function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" className="brand" aria-label="Tefreela, início">
      <span className="brand-symbol"><img src="/brand/tefreela-logo.jpg" alt="" width="48" height="48" /></span>
      {!compact && <span className="brand-word">tefreela<span className="brand-dot">.</span></span>}
    </Link>
  );
}
