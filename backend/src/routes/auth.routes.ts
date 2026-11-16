import { Router } from "express";
import {
  supabaseAuth,
  supabaseAdmin
} from "../config/supabase.js";

const router = Router();

router.post("/cadastro", async (req, res) => {
  try {
    const {
      nome,
      email,
      senha,
      confirmarSenha,
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

    if (confirmarSenha !== undefined && senha !== confirmarSenha) {
      return res.status(400).json({ erro: "As senhas não coincidem." });
    }

    if (!["cliente", "freelancer"].includes(tipo_usuario)) {
      return res.status(400).json({ erro: "Tipo de usuário inválido." });
    }

    if (senha.length < 8 || !/[A-Za-z]/.test(senha) || !/\d/.test(senha)) {
      return res.status(400).json({
        erro: "A senha deve possuir pelo menos 8 caracteres, uma letra e um número."
      });
    }

    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password: senha,
        email_confirm: true
      });

    if (authError) {
      return res.status(400).json({ erro: authError.message });
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
      return res.status(400).json({ erro: profileError.message });
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
    return res.status(500).json({ erro: "Erro interno do servidor." });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, senha } = req.body ?? {};

    if (!email || !senha) {
      return res.status(400).json({ erro: "Email e senha são obrigatórios." });
    }

    const { data, error } =
      await supabaseAuth.auth.signInWithPassword({
        email,
        password: senha
      });

    if (error || !data.user || !data.session) {
      return res.status(401).json({ erro: "Email ou senha inválidos." });
    }

    const { data: profiles, error: profileError } =
      await supabaseAdmin
        .from("profiles")
        .select("*")
        .eq("id", data.user.id);

    if (profileError) {
      return res.status(500).json({ erro: profileError.message });
    }

    const profile = profiles?.[0];

    if (!profile || profile.ativo === false || profile.deletado_em) {
      return res.status(401).json({ erro: "Esta conta não está disponível." });
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
        estado: profile.estado
      }
    });
  } catch (error) {
    console.error("ERRO NO LOGIN:", error);
    return res.status(500).json({ erro: "Erro interno do servidor." });
  }
});

export default router;
