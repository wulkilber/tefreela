import { Router } from "express";
import { supabaseAdmin } from "../config/supabase.js";
import {
  requireAuth,
  type AuthenticatedRequest
} from "../middleware/auth.js";

const router = Router();
const CANCELABLE_STATUSES = ["solicitado", "pendente"];

router.get("/meus", requireAuth, async (req: AuthenticatedRequest, res) => {
  const user = req.authUser!;

  let query = supabaseAdmin
    .from("pedidos")
    .select("*")
    .order("criado_em", { ascending: false });

  query = user.tipo_usuario === "cliente"
    ? query.eq("id_cliente", user.id)
    : query.eq("id_freelancer", user.id);

  const { data, error } = await query;

  if (error) {
    return res.status(500).json({ erro: error.message });
  }

  return res.json(data ?? []);
});

router.patch("/:id/cancelar", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.authUser!;

    if (user.tipo_usuario !== "cliente") {
      return res.status(403).json({
        erro: "Apenas o cliente pode cancelar uma solicitação."
      });
    }

    const idPedido = Number(req.params.id);

    if (!Number.isInteger(idPedido) || idPedido <= 0) {
      return res.status(400).json({ erro: "Pedido inválido." });
    }

    const motivo =
      typeof req.body?.motivo === "string" && req.body.motivo.trim()
        ? req.body.motivo.trim().slice(0, 500)
        : null;

    const { data: pedido, error: findError } = await supabaseAdmin
      .from("pedidos")
      .select("*")
      .eq("id_pedido", idPedido)
      .eq("id_cliente", user.id)
      .maybeSingle();

    if (findError) {
      return res.status(500).json({ erro: findError.message });
    }

    if (!pedido) {
      return res.status(404).json({ erro: "Solicitação não encontrada." });
    }

    if (!CANCELABLE_STATUSES.includes(String(pedido.status).toLowerCase())) {
      return res.status(409).json({
        erro: "Este pedido não pode mais ser cancelado diretamente porque já foi aceito, encerrado ou alterado."
      });
    }

    const canceladoEm = new Date().toISOString();

    const { data: atualizado, error: updateError } = await supabaseAdmin
      .from("pedidos")
      .update({
        status: "cancelado",
        cancelado_em: canceladoEm,
        cancelado_por: "cliente",
        motivo_cancelamento: motivo
      })
      .eq("id_pedido", idPedido)
      .eq("id_cliente", user.id)
      .in("status", CANCELABLE_STATUSES)
      .select("*")
      .maybeSingle();

    if (updateError) {
      return res.status(500).json({ erro: updateError.message });
    }

    if (!atualizado) {
      return res.status(409).json({
        erro: "O status da solicitação mudou antes do cancelamento. Atualize a página e tente novamente."
      });
    }

    if (pedido.id_freelancer) {
      const { error: notificationError } = await supabaseAdmin
        .from("notificacoes")
        .insert({
          id_usuario: pedido.id_freelancer,
          titulo: "Solicitação cancelada",
          mensagem: "O cliente cancelou uma solicitação de serviço.",
          tipo: "pedido_cancelado",
          lida: false
        });

      if (notificationError) {
        console.warn(
          "Falha ao criar notificação de cancelamento:",
          notificationError.message
        );
      }
    }

    return res.json({
      mensagem: "Solicitação cancelada.",
      pedido: atualizado
    });
  } catch (error) {
    console.error("ERRO AO CANCELAR SOLICITAÇÃO:", error);
    return res.status(500).json({ erro: "Erro interno do servidor." });
  }
});

export default router;
