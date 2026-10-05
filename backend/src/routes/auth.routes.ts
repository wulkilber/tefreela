import { Router } from "express";
import {
  supabaseAuth,
  supabaseAdmin
} from "../config/supabase.js";

const router = Router();

/**
 * POST /api/auth/cadastro
 */
router.post("/cadastro", async (req, res) => {
  try {
    console.log("BODY RECEBIDO:", req.body);

    const {
      nome,
      email,
      senha,
      telefone,
      tipo_usuario,
      cidade,
      estado
    } = req.body ?? {};

    if (!nome || !email || !senha || !tipo_usuario) {
      return res.status(400).json({
        erro: "Nome, email, senha e tipo de usuário são obrigatórios."
      });
    }

    if (!["cliente", "freelancer"].includes(tipo_usuario)) {
      return res.status(400).json({
        erro: "Tipo de usuário inválido."
      });
    }

    if (senha.length < 6) {
      return res.status(400).json({
        erro: "A senha deve possuir pelo menos 6 caracteres."
      });
    }

    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password: senha,
        email_confirm: true
      });

    if (authError) {
      return res.status(400).json({
        erro: authError.message
      });
    }

    const user = authData.user;

    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .insert({
        id: user.id,
        nome,
        telefone: telefone || null,
        tipo_usuario,
        cidade: cidade || null,
        estado: estado || null
      });

    if (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(user.id);

      return res.status(400).json({
        erro: profileError.message
      });
    }

    return res.status(201).json({
      mensagem: "Usuário cadastrado com sucesso.",
      usuario: {
        id: user.id,
        email: user.email,
        nome,
        tipo_usuario
      }
    });
  } catch (error) {
    console.error("ERRO NO CADASTRO:", error);

    return res.status(500).json({
      erro: "Erro interno do servidor."
    });
  }
});

/**
 * POST /api/auth/login
 */
router.post("/login", async (req, res) => {
  try {
    const {
      email,
      senha
    } = req.body ?? {};

    if (!email || !senha) {
      return res.status(400).json({
        erro: "Email e senha são obrigatórios."
      });
    }

    const { data, error } =
      await supabaseAuth.auth.signInWithPassword({
        email,
        password: senha
      });

    if (error || !data.user || !data.session) {
      return res.status(401).json({
        erro: "Email ou senha inválidos."
      });
    }

    const { data: profiles, error: profileError } =
      await supabaseAdmin
        .from("profiles")
        .select("*")
        .eq("id", data.user.id);

    console.log("ID AUTH:", data.user.id);
    console.log("PROFILES:", profiles);
    console.log("PROFILE ERROR:", profileError);

    if (profileError) {
      return res.status(500).json({
        erro: profileError.message
      });
    }

    const profile = profiles?.[0];

    if (!profile) {
      return res.status(404).json({
        erro: "Perfil do usuário não encontrado."
      });
    }

    return res.json({
      mensagem: "Login realizado com sucesso.",

      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,

      usuario: {
        id: data.user.id,
        email: data.user.email,
        nome: profile.nome,
        telefone: profile.telefone,
        tipo_usuario: profile.tipo_usuario,
        foto: profile.foto,
        descricao: profile.descricao,
        cidade: profile.cidade,
        estado: profile.estado,
        saldo_creditos: profile.saldo_creditos
      }
    });
  } catch (error) {
    console.error("ERRO NO LOGIN:", error);

    return res.status(500).json({
      erro: "Erro interno do servidor."
    });
  }
});

export default router;