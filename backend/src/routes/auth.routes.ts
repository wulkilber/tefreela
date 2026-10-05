import { Router } from "express";
import {
  createAuthClient,
  supabaseAdmin
} from "../config/supabase.js";
import { z } from "zod";

const router = Router();
const credentials = z.object({ email: z.string().trim().email().max(254), senha: z.string().min(1).max(256) });
const registration = credentials.extend({
  senha: z.string().min(6).max(256), nome: z.string().trim().min(2).max(120),
  tipo_usuario: z.enum(["cliente", "freelancer"]),
  telefone: z.string().trim().max(30).optional(), cidade: z.string().trim().max(120).optional(), estado: z.string().trim().max(60).optional(),
});

/**
 * POST /api/auth/cadastro
 */
router.post("/cadastro", async (req, res) => {
  try {
    const parsed = registration.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ erro: "Confira nome, e-mail, senha (mínimo de 6 caracteres) e tipo de conta." });

    const {
      nome,
      email,
      senha,
      telefone,
      tipo_usuario,
      cidade,
      estado
    } = parsed.data;

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
        erro: "Não foi possível cadastrar esta conta. Confira os dados ou tente entrar."
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
        erro: "Não foi possível criar o perfil. Tente novamente."
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
    const parsed = credentials.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ erro: "Informe um e-mail válido e sua senha." });
    const {
      email,
      senha
    } = parsed.data;

    if (!email || !senha) {
      return res.status(400).json({
        erro: "Email e senha são obrigatórios."
      });
    }

    const { data, error } =
      await createAuthClient().auth.signInWithPassword({
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


    if (profileError) {
      return res.status(500).json({
        erro: "Não foi possível carregar seu perfil."
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

    return res.status(500).json({
      erro: "Erro interno do servidor."
    });
  }
});

router.get("/me", async (req, res) => {
  const token = req.headers.authorization?.match(/^Bearer (.+)$/)?.[1];
  if (!token) return res.status(401).json({ erro: "Sessão inválida ou expirada." });
  const { data, error } = await createAuthClient().auth.getUser(token);
  if (error || !data.user) return res.status(401).json({ erro: "Sessão inválida ou expirada." });
  const { data: profile, error: profileError } = await supabaseAdmin.from("profiles").select("id,nome,tipo_usuario").eq("id", data.user.id).maybeSingle();
  if (profileError) return res.status(503).json({ erro: "Não foi possível carregar seu perfil." });
  if (!profile || !["cliente", "freelancer"].includes(profile.tipo_usuario)) return res.status(401).json({ erro: "Sessão inválida ou expirada." });
  return res.json({ usuario: { ...profile, email: data.user.email } });
});

export default router;
