const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
function sessionModule(fetch) {
  const storage = new Map();
  const source = fs.readFileSync("src/lib/session.ts", "utf8").replaceAll("import.meta.env", "({})");
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const context = { exports: {}, fetch, Response, Blob, AbortSignal, Error, sessionStorage: { getItem: (key) => storage.get(key) || null, setItem: (key, value) => storage.set(key, value), removeItem: (key) => storage.delete(key) } };
  vm.runInNewContext(code, context);
  context.exports.saveSession({ access_token: "expired", refresh_token: "refresh", usuario: { id: "user", nome: "Teste", tipo_usuario: "cliente" } });
  return context.exports;
}
const response = (status, data) => new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
test("renovação troca os tokens e repete a operação com o token novo", async () => {
  let renewals = 0;
  const mod = sessionModule(async (url, options) => {
    if (url.endsWith("/auth/refresh")) { renewals++; return response(200, { access_token: "fresh", refresh_token: "fresh-refresh" }); }
    return options.headers.Authorization === "Bearer fresh" ? response(200, { ok: true }) : response(401, { erro: "Sessão inválida ou expirada." });
  });
  assert.equal((await mod.api("/auth/me")).ok, true);
  assert.equal(mod.getSession().access_token, "fresh"); assert.equal(renewals, 1);
});
test("operações concorrentes compartilham uma única renovação", async () => {
  let renewals = 0;
  const mod = sessionModule(async (url, options) => {
    if (url.endsWith("/auth/refresh")) { renewals++; await new Promise((resolve) => setImmediate(resolve)); return response(200, { access_token: "fresh", refresh_token: "new" }); }
    return response(options.headers.Authorization === "Bearer fresh" ? 200 : 401, {});
  });
  await Promise.all([mod.api("/pedidos"), mod.api("/notificacoes")]); assert.equal(renewals, 1);
});
test("indisponibilidade não apaga a sessão", async () => {
  const mod = sessionModule(async (url) => response(url.endsWith("/auth/refresh") ? 503 : 401, { erro: "Indisponível" }));
  await assert.rejects(mod.api("/pedidos"), (error) => error.status === 503);
  assert.equal(mod.getSession().access_token, "expired");
});
test("refresh inválido remove a sessão", async () => {
  const mod = sessionModule(async () => response(401, { erro: "Sessão inválida ou expirada." }));
  await assert.rejects(mod.api("/pedidos")); assert.equal(mod.getSession(), null);
});
test("renovação em andamento não restaura sessão após logout", async () => {
  let finish, reached;
  const refreshStarted = new Promise((resolve) => { reached = resolve; });
  const mod = sessionModule(async (url) => {
    if (url.endsWith("/auth/refresh")) { reached(); return new Promise((resolve) => { finish = resolve; }); }
    return response(401, { erro: "Sessão inválida ou expirada." });
  });
  const request = mod.api("/pedidos"); const rejected = assert.rejects(request);
  await refreshStarted; mod.clearSession(); finish(response(200, { access_token: "fresh", refresh_token: "new" }));
  await rejected; assert.equal(mod.getSession(), null);
});

test("upload binário preserva a imagem e repete o envio após renovar a sessão", async () => {
  const blob = new Blob(["image-bytes"], { type: "image/png" })
  let uploads = 0
  const mod = sessionModule(async (url, options) => {
    if (url.endsWith("/auth/refresh")) return response(200, { access_token: "fresh", refresh_token: "new" })
    uploads++
    assert.equal(options.body, blob)
    assert.equal(options.headers["Content-Type"], "image/png")
    return response(options.headers.Authorization === "Bearer fresh" ? 200 : 401, {})
  })
  await mod.api("/servicos/1/imagens/0", blob, "PUT")
  assert.equal(uploads, 2)
})
test("login preserva o contato do chat e rejeita destinos externos", () => {
  const source = fs.readFileSync("src/lib/redirect.ts", "utf8")
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText
  const context = { exports: {} }; vm.runInNewContext(code, context)
  const redirect = context.exports.afterLogin
  assert.equal(redirect("/app/mensagens?usuario=contato&servico=1", "cliente"), "/app/mensagens?usuario=contato&servico=1")
  for (const unsafe of ["https://example.invalid", "//example.invalid", "/app\\evil", "/application", null]) assert.equal(redirect(unsafe, "cliente"), "/app/cliente")
  assert.equal(redirect(null, "freelancer"), "/app")
})
