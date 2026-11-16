import { Router } from "express";
import { supabaseAdmin, supabaseAuth } from "../config/supabase.js";
import {
  requireAuth,
  type AuthenticatedRequest
} from "../middleware/auth.js";

const router = Router();
const ACTIVE_ORDER_STATUSES = ["solicitado", "pendente", "aceito", "em_andamento"];

router.delete("/", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.authUser!;
    const senha = typeof req.body?.senha === "string" ? req.body.senha : "";
    const confirmacao =
      typeof req.body?.confirmacao === "string"
        ? req.body.confirmacao.trim().toUpperCase()
        : "";

    if (confirmacao !== "EXCLUIR") {
      return res.status(400).json({ erro: "Digite EXCLUIR para confirmar." });
    }

    if (!senha || !user.email) {
      return res.status(400).json({ erro: "Informe sua senha atual." });
    }

    const { error: passwordError } = await supabaseAuth.auth.signInWithPassword({
      email: user.email,
      password: senha
    });

    if (passwordError) {
      return res.status(401).json({ erro: "Senha atual incorreta." });
    }

    let activeOrdersQuery = supabaseAdmin
      .from("pedidos")
      .select("id,status")
      .in("status", ACTIVE_ORDER_STATUSES);

    activeOrdersQuery = user.tipo_usuario === "cliente"
      ? activeOrdersQuery.eq("cliente_id", user.id)
      : activeOrdersQuery.eq("freelancer_id", user.id);

    const { data: activeOrders, error: activeOrdersError } = await activeOrdersQuery;

    if (activeOrdersError) {
      return res.status(500).json({ erro: activeOrdersError.message });
    }

    if ((activeOrders ?? []).length > 0) {
      return res.status(409).json({
        erro:
          user.tipo_usuario === "cliente"
            ? "Você possui solicitações ou serviços em andamento. Cancele ou finalize esses pedidos antes de excluir sua conta."
            : "Você possui pedidos em andamento. Conclua ou encerre esses pedidos antes de excluir sua conta."
      });
    }

    const deletedAt = new Date().toISOString();

    if (user.tipo_usuario === "freelancer") {
      const { error: servicesError } = await supabaseAdmin
        .from("servicos")
        .update({ ativo: false, deletado_em: deletedAt })
        .eq("freelancer_id", user.id)
        .is("deletado_em", null);

      if (servicesError) {
        return res.status(500).json({ erro: servicesError.message });
      }
    }

    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({
        ativo: false,
        deletado_em: deletedAt,
        nome: "Usuário removido",
        telefone: null,
        foto: null,
        descricao: null,
        cidade: null,
        estado: null
      })
      .eq("id", user.id);

    if (profileError) {
      return res.status(500).json({ erro: profileError.message });
    }

    const anonymizedEmail = `deleted-${user.id}@tefreela.invalid`;

    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      {
        email: anonymizedEmail,
        ban_duration: "876000h",
        user_metadata: {}
      }
    );

    if (authError) {
      console.error("Falha ao desativar usuário no Auth:", authError.message);
      return res.status(500).json({
        erro: "O perfil foi desativado, mas houve uma falha ao encerrar o acesso. Contate o suporte."
      });
    }

    return res.json({ mensagem: "Sua conta foi excluída." });
  } catch (error) {
    console.error("ERRO AO EXCLUIR CONTA:", error);
    return res.status(500).json({ erro: "Erro interno do servidor." });
  }
});

export default router;
