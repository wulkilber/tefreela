import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "node:path";
import { existsSync } from "node:fs";

import authRoutes from "./routes/auth.routes.js";
import marketplaceRoutes from "./routes/marketplace.routes.js";
import rateLimit from "./rateLimit.js";

dotenv.config();

const app = express();

const allowedOrigins = (process.env.FRONTEND_URL || process.env.RENDER_EXTERNAL_URL || "http://localhost:8443").split(",").map((origin) => origin.trim());
app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: "32kb" }));

app.disable("x-powered-by");
app.get("/api/health", (_req, res) => { res.json({ status: "ok" }); });
app.use("/api", rateLimit(240, 60000));
app.use("/api/auth/login", rateLimit(20, 15 * 60000));
app.use("/api/auth/cadastro", rateLimit(10, 60 * 60000));
app.use("/api/auth/recuperar", rateLimit(5, 15 * 60000));
app.use("/api/auth/senha", rateLimit(10, 15 * 60000));
app.use("/api/auth", authRoutes);
app.use("/api", marketplaceRoutes);

if (process.env.SERVE_FRONTEND !== "true") app.get("/", (req, res) => {
  res.json({
    status: "ok",
    mensagem: "API do Tefreela funcionando"
  });
});

if (process.env.SERVE_FRONTEND === "true") {
  const directory = path.resolve(__dirname, "../../dist");
  const index = path.join(directory, "index.html");
  if (!existsSync(index)) throw new Error("Frontend não compilado. Execute pnpm build na raiz.");
  app.use(express.static(directory));
  // Direct navigation to React routes needs the same HTML entrypoint.
  app.get(/^(?!\/api(?:\/|$)).*/, (_req, res) => { res.sendFile("index.html", { root: directory }); });
}

app.use((_req, res) => { res.status(404).json({ erro: "Rota não encontrada." }); });
app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const status = (error as { status?: number })?.status;
  if ((error as { safe?: boolean })?.safe && status) { res.status(status).json({ erro: (error as Error).message }); return; }
  res.status(status === 400 ? 400 : status === 413 ? 413 : 500).json({ erro: status === 400 ? "JSON inválido." : status === 413 ? "Solicitação muito grande." : "Erro interno do servidor." });
});

const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, process.env.HOST || "127.0.0.1", () => {
  console.log(
    `Servidor Tefreela rodando em http://localhost:${PORT}`
  );
});
