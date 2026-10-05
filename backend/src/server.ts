import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/auth.routes.js";

dotenv.config();

const app = express();

const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:8443").split(",").map((origin) => origin.trim());
app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: "32kb" }));

app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
  res.json({
    status: "ok",
    mensagem: "API do Tefreela funcionando"
  });
});

app.use((_req, res) => { res.status(404).json({ erro: "Rota não encontrada." }); });
app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const status = (error as { status?: number })?.status;
  res.status(status === 400 ? 400 : status === 413 ? 413 : 500).json({ erro: status === 400 ? "JSON inválido." : status === 413 ? "Solicitação muito grande." : "Erro interno do servidor." });
});

const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, () => {
  console.log(
    `Servidor Tefreela rodando em http://localhost:${PORT}`
  );
});
