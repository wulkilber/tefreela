import { Link } from "react-router";

export default function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" className="brand" aria-label="Tefreela, início">
      <span className="brand-mark"><span /></span>
      {!compact && <span>Tef<span>reela</span></span>}
    </Link>
  );
}
