const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
let server;
const base = "http://127.0.0.1:31990";
before(async () => {
  server = spawn(process.execPath, ["backend/dist/server.js"], { env: { ...process.env, PORT: "31990", HOST: "127.0.0.1", SERVE_FRONTEND: "true", SUPABASE_URL: "https://example.invalid", SUPABASE_PUBLISHABLE_KEY: "placeholder", SUPABASE_SECRET_KEY: "placeholder" }, stdio: ["ignore", "pipe", "pipe"] });
  await new Promise((resolve, reject) => { const timeout = setTimeout(() => reject(new Error("Servidor não iniciou")), 10000); server.stdout.on("data", (data) => { if (String(data).includes("Servidor Tefreela")) { clearTimeout(timeout); resolve(); } }); server.on("exit", (code) => { clearTimeout(timeout); reject(new Error(`Servidor encerrou ${code}`)); }); });
});
after(() => server?.kill());
test("produção serve frontend na raiz", async () => {
  const result = await fetch(base); assert.equal(result.status, 200); assert.match(result.headers.get("content-type"), /text\/html/); assert.match(await result.text(), /Tefreela/);
});
test("atualizar rota React preserva a entrada HTML", async () => {
  for (const path of ["/entrar", "/app/pedidos", "/recuperar-senha"]) { const result = await fetch(base + path); assert.equal(result.status, 200); assert.match(await result.text(), /id="root"/); }
});
test("health check funciona sem acessar o banco", async () => { const result = await fetch(base + "/api/health"); assert.equal(result.status, 200); assert.deepEqual(await result.json(), { status: "ok" }); });
test("API privada continua protegida no modo publicado", async () => { const result = await fetch(base + "/api/auth/me"); assert.equal(result.status, 401); assert.match(result.headers.get("content-type"), /application\/json/); });
