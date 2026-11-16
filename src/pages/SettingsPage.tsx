import { useState } from "react";
import { ShieldAlert, Trash2 } from "lucide-react";
import { useNavigate } from "react-router";
import AppShell from "../components/AppShell";
import ConfirmDialog from "../components/ConfirmDialog";
import { Button, Heading, TextInput } from "../components/ui";
import { api } from "../lib/api";
import { clearSession, getSessionUser } from "../lib/session";

export default function SettingsPage() {
  const navigate = useNavigate();
  const user = getSessionUser();
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function deleteAccount() {
    setBusy(true);
    setMessage("");
    try {
      const result = await api<{ mensagem: string }>("/api/conta", {
        method: "DELETE",
        body: JSON.stringify({ confirmacao: confirmation, senha: password }),
      });
      clearSession();
      navigate("/", { replace: true });
      window.setTimeout(() => window.alert(result.mensagem), 50);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível excluir sua conta.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell title="Configurações" role={user?.tipo_usuario === "cliente" ? "cliente" : "freelancer"}>
      <div className="settings-page">
        <div>
          <Heading as="h2">Configurações da conta</Heading>
          <p>Gerencie preferências e ações relacionadas à sua conta.</p>
        </div>

        <section className="panel danger-zone">
          <div className="danger-zone-icon"><ShieldAlert /></div>
          <div>
            <Heading as="h3">Zona de perigo</Heading>
            <p>Excluir sua conta encerra seu acesso ao Tefreela. Pedidos em andamento impedem a exclusão até serem concluídos ou cancelados.</p>
          </div>
          <Button className="danger-outline" variant="secondary" onClick={() => setOpen(true)}>
            <Trash2 /> Excluir minha conta
          </Button>
        </section>
      </div>

      <ConfirmDialog
        open={open}
        title="Excluir sua conta?"
        description="Esta ação desativa permanentemente seu acesso e remove seus dados pessoais visíveis, preservando apenas o histórico necessário."
        confirmLabel="Excluir conta permanentemente"
        busyLabel="Excluindo..."
        busy={busy}
        disabled={confirmation.trim().toUpperCase() !== "EXCLUIR" || !password}
        onCancel={() => !busy && setOpen(false)}
        onConfirm={deleteAccount}
      >
        <div className="danger-form">
          <label>
            Digite <strong>EXCLUIR</strong> para confirmar
            <TextInput value={confirmation} onChange={(e) => setConfirmation(e.target.value)} placeholder="EXCLUIR" autoComplete="off" />
          </label>
          <label>
            Confirme sua senha atual
            <TextInput type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Sua senha" autoComplete="current-password" />
          </label>
          {message && <p className="form-error">{message}</p>}
        </div>
      </ConfirmDialog>
    </AppShell>
  );
}
