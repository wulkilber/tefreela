const { test, before, after } = require("node:test")
const assert = require("node:assert/strict")
const { spawn } = require("node:child_process")
let server
const port = 31987
const base = `http://127.0.0.1:${port}`
before(async () => {
  server = spawn(process.execPath, ["dist/server.js"], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      PORT: String(port),
      SUPABASE_URL: "https://example.invalid",
      SUPABASE_PUBLISHABLE_KEY: "test-publishable-placeholder",
      SUPABASE_SECRET_KEY: "test-secret-placeholder",
      FRONTEND_URL: "http://localhost:8443",
    },
    stdio: ["ignore", "pipe", "pipe"],
  })
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error("Servidor não iniciou")),
      10000,
    )
    server.stdout.on("data", (data) => {
      if (String(data).includes("Servidor Tefreela")) {
        clearTimeout(timeout)
        resolve()
      }
    })
    server.on("exit", (code) => {
      clearTimeout(timeout)
      reject(new Error(`Servidor encerrou: ${code}`))
    })
  })
})
after(() => server?.kill())
test("health check funciona", async () => {
  const response = await fetch(base)
  assert.equal(response.status, 200)
  assert.equal((await response.json()).status, "ok")
})
test("rotas de diagnóstico não expõem dados", async () => {
  for (const path of ["/teste-profile", "/teste-supabase"]) {
    const response = await fetch(base + path)
    assert.equal(response.status, 404)
    assert.deepEqual(await response.json(), { erro: "Rota não encontrada." })
  }
})
test("perfil exige token", async () => {
  const response = await fetch(base + "/api/auth/me")
  assert.equal(response.status, 401)
})
test("entrada malformada não chega ao Supabase", async () => {
  for (const path of ["login", "cadastro"]) {
    const response = await fetch(base + "/api/auth/" + path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: [], senha: {} }),
    })
    assert.equal(response.status, 400)
    assert.ok((await response.json()).erro)
  }
})
test("JSON inválido retorna erro legível", async () => {
  const response = await fetch(base + "/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{",
  })
  assert.equal(response.status, 400)
  assert.deepEqual(await response.json(), { erro: "JSON inválido." })
})
test("solicitação excessiva é rejeitada", async () => {
  const response = await fetch(base + "/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "a".repeat(40000) }),
  })
  assert.equal(response.status, 413)
})
test("origem não autorizada não recebe permissão CORS", async () => {
  const response = await fetch(base, {
    headers: { Origin: "https://untrusted.invalid" },
  })
  assert.equal(response.headers.get("access-control-allow-origin"), null)
})
