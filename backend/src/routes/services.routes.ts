import { Router } from "express";
import { supabaseAdmin } from "../config/supabase.js";
import {
  requireAuth,
  type AuthenticatedRequest
} from "../middleware/auth.js";

const router = Router();

router.get("/meus", requireAuth, async (req: AuthenticatedRequest, res) => {
  if (req.authUser?.tipo_usuario !== "freelancer") {
    return res.status(403).json({ erro: "Apenas freelancers podem acessar seus serviços." });
  }

  const { data, error } = await supabaseAdmin
    .from("servicos")
    .select("*")
    .eq("freelancer_id", req.authUser.id)
    .is("deletado_em", null)
    .order("criado_em", { ascending: false });

  if (error) {
    return res.status(500).json({ erro: error.message });
  }

  return res.json(data ?? []);
});

router.delete("/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (req.authUser?.tipo_usuario !== "freelancer") {
      return res.status(403).json({ erro: "Apenas freelancers podem excluir serviços." });
    }

    const { id } = req.params;

    const { data: servico, error: serviceError } = await supabaseAdmin
      .from("servicos")
      .select("*")
      .eq("id", id)
      .eq("freelancer_id", req.authUser.id)
      .maybeSingle();

    if (serviceError) {
      return res.status(500).json({ erro: serviceError.message });
    }

    if (!servico || servico.deletado_em) {
      return res.status(404).json({ erro: "Serviço não encontrado." });
    }

    const { data: pedidosAtivos, error: ordersError } = await supabaseAdmin
      .from("pedidos")
      .select("id,status")
      .eq("servico_id", id)
      .in("status", ["aceito", "em_andamento"]);

    if (ordersError) {
      return res.status(500).json({ erro: ordersError.message });
    }

    if ((pedidosAtivos ?? []).length > 0) {
      return res.status(409).json({
        erro: "Este serviço possui um pedido em andamento e não pode ser excluído neste momento."
      });
    }

    const { error: deleteError } = await supabaseAdmin
      .from("servicos")
      .update({
        ativo: false,
        deletado_em: new Date().toISOString()
      })
      .eq("id", id)
      .eq("freelancer_id", req.authUser.id);

    if (deleteError) {
      return res.status(500).json({ erro: deleteError.message });
    }

    return res.json({ mensagem: "Serviço excluído com sucesso." });
  } catch (error) {
    console.error("ERRO AO EXCLUIR SERVIÇO:", error);
    return res.status(500).json({ erro: "Erro interno do servidor." });
  }
});

export default router;
