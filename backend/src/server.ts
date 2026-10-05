import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import { supabaseAdmin } from "./config/supabase.js";
import authRoutes from "./routes/auth.routes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
  res.json({
    status: "ok",
    mensagem: "API do Tefreela funcionando"
  });
});

app.get("/teste-supabase", async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from("categorias")
    .select("*");

  if (error) {
    return res.status(500).json({
      erro: error.message
    });
  }

  return res.json(data);
});

app.get("/teste-profile", async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("*");

  return res.json({
    data,
    error
  });
});

const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, () => {
  console.log(
    `Servidor Tefreela rodando em http://localhost:${PORT}`
  );
});