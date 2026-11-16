import type { NextFunction, Request, Response } from "express";
import { supabaseAdmin } from "../config/supabase.js";

export type AuthenticatedRequest = Request & {
  authUser?: {
    id: string;
    email: string | null;
    tipo_usuario: "cliente" | "freelancer" | "admin";
  };
};

export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const authorization = req.headers.authorization;

    if (!authorization?.startsWith("Bearer ")) {
      return res.status(401).json({ erro: "Não autenticado." });
    }

    const token = authorization.slice("Bearer ".length).trim();
    const { data, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !data.user) {
      return res.status(401).json({ erro: "Sessão inválida ou expirada." });
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", data.user.id)
      .maybeSingle();

    if (profileError) {
      return res.status(500).json({ erro: profileError.message });
    }

    if (!profile || profile.ativo === false || profile.deletado_em) {
      return res.status(401).json({ erro: "Conta indisponível." });
    }

    req.authUser = {
      id: data.user.id,
      email: data.user.email ?? null,
      tipo_usuario: profile.tipo_usuario
    };

    return next();
  } catch (error) {
    console.error("ERRO NA AUTENTICAÇÃO:", error);
    return res.status(500).json({ erro: "Erro interno do servidor." });
  }
}
