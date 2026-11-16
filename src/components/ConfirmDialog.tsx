import type { ReactNode } from "react";
import { AlertTriangle, X } from "lucide-react";
import { Button } from "./ui";

export default function ConfirmDialog({
  open,
  title,
  description,
  children,
  confirmLabel,
  busyLabel,
  busy = false,
  disabled = false,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  description: string;
  children?: ReactNode;
  confirmLabel: string;
  busyLabel?: string;
  busy?: boolean;
  disabled?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;

  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={onCancel}>
      <section
        className="confirm-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="confirm-dialog-head">
          <span className="danger-icon"><AlertTriangle /></span>
          <Button variant="ghost" aria-label="Fechar" onClick={onCancel}><X /></Button>
        </div>
        <h3 id="confirm-title">{title}</h3>
        <p>{description}</p>
        {children}
        <div className="confirm-dialog-actions">
          <Button variant="secondary" onClick={onCancel} disabled={busy}>Cancelar</Button>
          <button className="btn danger-button" onClick={onConfirm} disabled={disabled || busy}>
            {busy ? busyLabel || "Processando..." : confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}
