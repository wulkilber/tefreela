const { test, before, after } = require("node:test")
const assert = require("node:assert/strict")
const http = require("node:http")
const { spawn } = require("node:child_process")
const { nextOrderStatus } = require("../dist/domain.js")
const client = "11111111-1111-4111-8111-111111111111"
const freelancer = "22222222-2222-4222-8222-222222222222"
const stranger = "33333333-3333-4333-8333-333333333333"
const identities = { client, freelancer, stranger }
const tables = {
  profiles: [
    {
      id: client,
      nome: "Cliente teste",
      tipo_usuario: "cliente",
      saldo_creditos: 500,
      telefone: "privado",
    },
    {
      id: freelancer,
      nome: "Freelancer teste",
      tipo_usuario: "freelancer",
      saldo_creditos: 0,
      telefone: "privado",
    },
    {
      id: stranger,
      nome: "Outra conta",
      tipo_usuario: "cliente",
      saldo_creditos: 700,
      telefone: "privado",
    },
  ],
  categorias: [{ id_categoria: 1, nome: "Design" }],
  servicos: [
    {
      id_servico: 1,
      id_freelancer: freelancer,
      id_categoria: 1,
      titulo: "Serviço teste",
      descricao: "Descrição",
      preco: 150,
      prazo_dias: 3,
      status: "ativo",
    },
  ],
  pedidos: [
    {
      id_pedido: 1,
      id_cliente: client,
      id_freelancer: freelancer,
      id_servico: 1,
      valor: 150,
      status: "solicitado",
    },
  ],
  avaliacoes: [],
  mensagens: [
    {
      id_mensagem: 1,
      id_remetente: freelancer,
      id_destinatario: client,
      mensagem: "Conversa privada",
      lida: false,
      data_envio: new Date().toISOString(),
    },
  ],
  notificacoes: [
    {
      id_notificacao: 1,
      id_usuario: client,
      titulo: "Privada",
      mensagem: "Teste",
      lida: false,
    },
  ],
  portfolio: [
    { id_portfolio: 1, id_freelancer: freelancer, titulo: "Trabalho teste" },
  ],
  movimentacoes_creditos: [],
  pagamentos: [],
}
let fake, app
function splitTop(value) {
  let depth = 0,
    start = 0
  const values = []
  for (let i = 0; i < value.length; i++) {
    if (value[i] === "(") depth++
    if (value[i] === ")") depth--
    if (value[i] === "," && depth === 0) {
      values.push(value.slice(start, i))
      start = i + 1
    }
  }
  values.push(value.slice(start))
  return values
}
function expression(row, value) {
  if (value.startsWith("and("))
    return splitTop(value.slice(4, -1)).every((part) => expression(row, part))
  if (value.startsWith("or("))
    return splitTop(value.slice(3, -1)).some((part) => expression(row, part))
  const [field, operator, ...rest] = value.split(".")
  const target = rest.join(".")
  if (operator === "eq") return String(row[field]) === target
  if (operator === "in")
    return target.slice(1, -1).split(",").includes(String(row[field]))
  throw new Error(`Filtro não suportado no mock: ${value}`)
}
function matches(row, query) {
  for (const [field, value] of query) {
    if (field === "or" && !expression(row, "or" + value)) return false
    if (
      ["select", "order", "limit", "offset", "or"].includes(field) ||
      field.includes(".")
    )
      continue
    if (!expression(row, `${field}.${value}`)) return false
  }
  return true
}
before(async () => {
  fake = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, "http://localhost")
      res.setHeader("Content-Type", "application/json")
      if (url.pathname === "/auth/v1/user") {
        const token = req.headers.authorization?.replace("Bearer ", "")
        const user = identities[token]
        res.statusCode = user ? 200 : 401
        res.end(
          JSON.stringify(
            user
              ? {
                  id: user,
                  email: "test@example.invalid",
                  aud: "authenticated",
                  role: "authenticated",
                }
              : { message: "invalid", code: "bad_jwt" },
          ),
        )
        return
      }
      if (url.pathname.startsWith("/rest/v1/rpc/")) {
        res.statusCode = 404
        res.end(JSON.stringify({ code: "PGRST202" }))
        return
      }
      const name = url.pathname.replace("/rest/v1/", "")
      const rows = tables[name]
      if (!rows) {
        res.statusCode = 404
        res.end(JSON.stringify({ code: "42P01" }))
        return
      }
      let selected = rows.filter((row) => matches(row, url.searchParams))
      let body = ""
      for await (const chunk of req) body += chunk
      const values = body ? JSON.parse(body) : {}
      const primary = {
        servicos: "id_servico",
        pedidos: "id_pedido",
        avaliacoes: "id_avaliacao",
        mensagens: "id_mensagem",
        notificacoes: "id_notificacao",
        portfolio: "id_portfolio",
      }[name]
      if (req.method === "POST") {
        if (
          name === "avaliacoes" &&
          rows.some((row) => row.id_pedido === values.id_pedido)
        ) {
          res.statusCode = 409
          res.end(JSON.stringify({ code: "23505" }))
          return
        }
        const row = {
          ...values,
          ...(primary
            ? { [primary]: Math.max(0, ...rows.map((row) => row[primary])) + 1 }
            : {}),
        }
        rows.push(row)
        selected = [row]
      }
      if (req.method === "PATCH")
        selected.forEach((row) => Object.assign(row, values))
      if (req.method === "DELETE")
        tables[name] = rows.filter((row) => !selected.includes(row))
      const columns = url.searchParams.get("select")
      if (name === "pedidos" && columns?.includes("avaliacao:"))
        selected = selected.map((row) => ({
          ...row,
          avaliacao:
            tables.avaliacoes.find(
              (review) => review.id_pedido === row.id_pedido,
            ) || null,
        }))
      if (columns && !columns.includes("*") && !columns.includes("("))
        selected = selected.map((row) =>
          Object.fromEntries(
            columns.split(",").map((column) => [column, row[column]]),
          ),
        )
      res.statusCode = req.method === "POST" ? 201 : 200
      res.end(
        JSON.stringify(
          req.headers.accept?.includes("vnd.pgrst.object")
            ? selected[0] || null
            : selected,
        ),
      )
    } catch (error) {
      res.statusCode = 500
      res.end(JSON.stringify({ message: error.message }))
    }
  })
  await new Promise((resolve) => fake.listen(31989, "127.0.0.1", resolve))
  app = spawn(process.execPath, ["dist/server.js"], {
    env: {
      ...process.env,
      PORT: "31988",
      SUPABASE_URL: "http://127.0.0.1:31989",
      SUPABASE_PUBLISHABLE_KEY: "placeholder",
      SUPABASE_SECRET_KEY: "placeholder",
    },
    stdio: ["ignore", "pipe", "pipe"],
  })
  await new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error("Servidor não iniciou")),
      10000,
    )
    app.stdout.on("data", (data) => {
      if (String(data).includes("Servidor Tefreela")) {
        clearTimeout(timer)
        resolve()
      }
    })
    app.on("exit", (code) => {
      clearTimeout(timer)
      reject(new Error(`Servidor encerrou ${code}`))
    })
  })
})
after(async () => {
  app?.kill()
  await new Promise((resolve) => fake?.close(resolve))
})
async function call(path, token, method = "GET", body) {
  const response = await fetch("http://127.0.0.1:31988/api" + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: "Bearer " + token } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  })
  return { status: response.status, data: await response.json() }
}
test("regras de estado protegem papéis e estados terminais", () => {
  assert.equal(nextOrderStatus("cliente", "solicitado", "aceito"), false)
  assert.equal(nextOrderStatus("freelancer", "solicitado", "aceito"), true)
  assert.equal(nextOrderStatus("freelancer", "solicitado", "concluido"), false)
  assert.equal(nextOrderStatus("cliente", "concluido", "cancelado"), false)
})
test("todas as áreas privadas exigem sessão", async () => {
  for (const path of [
    "/pedidos",
    "/me/perfil",
    "/me/servicos",
    "/me/portfolio",
    "/conversas",
    "/notificacoes",
    "/creditos",
  ])
    assert.equal((await call(path)).status, 401, path)
})
test("perfil público não expõe telefone ou saldo", async () => {
  const result = await call(`/perfis/${freelancer}`)
  assert.equal(result.status, 200)
  assert.equal(result.data.telefone, undefined)
  assert.equal(result.data.saldo_creditos, undefined)
})
test("consulta de pedidos não mostra pedidos de outras contas", async () => {
  assert.equal((await call("/pedidos", "client")).data.length, 1)
  assert.deepEqual((await call("/pedidos", "stranger")).data, [])
})
test("cliente não altera saldo nem papel pelo perfil", async () => {
  assert.equal(
    (
      await call("/me/perfil", "client", "PATCH", {
        nome: "Nome editado",
        saldo_creditos: 99999,
        tipo_usuario: "admin",
      })
    ).status,
    200,
  )
  const profile = tables.profiles.find((row) => row.id === client)
  assert.equal(profile.saldo_creditos, 500)
  assert.equal(profile.tipo_usuario, "cliente")
})
test("cliente não publica serviço; freelancer não edita serviço alheio", async () => {
  const body = {
    titulo: "Teste",
    descricao: "Descrição",
    id_categoria: 1,
    preco: 10,
    prazo_dias: 1,
  }
  assert.equal((await call("/servicos", "client", "POST", body)).status, 403)
  assert.equal(
    (await call("/servicos/999", "freelancer", "PATCH", body)).status,
    404,
  )
})
test("pedido ignora preço e identidades enviados pelo cliente", async () => {
  const result = await call("/pedidos", "client", "POST", {
    id_servico: 1,
    descricao_solicitacao: "Solicitação",
    valor: 0,
    id_cliente: stranger,
    id_freelancer: stranger,
  })
  assert.equal(result.status, 201)
  assert.equal(result.data.valor, 150)
  assert.equal(result.data.id_cliente, client)
  assert.equal(result.data.id_freelancer, freelancer)
})
test("terceiro não atualiza pedido e cliente não aceita próprio pedido", async () => {
  assert.equal(
    (await call("/pedidos/1", "stranger", "PATCH", { status: "aceito" }))
      .status,
    404,
  )
  assert.equal(
    (await call("/pedidos/1", "client", "PATCH", { status: "aceito" })).status,
    409,
  )
})
test("freelancer aceita, inicia e conclui na ordem correta", async () => {
  assert.equal(
    (await call("/pedidos/1", "freelancer", "PATCH", { status: "concluido" }))
      .status,
    409,
  )
  for (const status of ["aceito", "em_andamento", "concluido"])
    assert.equal(
      (await call("/pedidos/1", "freelancer", "PATCH", { status })).status,
      200,
    )
})
test("avaliação exige propriedade e não permite duplicação", async () => {
  const body = { id_pedido: 1, nota: 5, comentario: "Ótimo" }
  assert.equal(
    (await call("/avaliacoes", "stranger", "POST", body)).status,
    403,
  )
  assert.equal((await call("/avaliacoes", "client", "POST", body)).status, 201)
  assert.equal((await call("/avaliacoes", "client", "POST", body)).status, 409)
  const orders = (await call("/pedidos", "client")).data
  assert.equal(
    orders.find((order) => order.id_pedido === 1).avaliacao[0].nota,
    5,
  )
})
test("terceiro não lê conversa nem marca mensagens alheias", async () => {
  assert.deepEqual(
    (await call(`/mensagens/${freelancer}`, "stranger")).data,
    [],
  )
  assert.equal(
    (await call(`/mensagens/${freelancer}/lidas`, "stranger", "PATCH", {}))
      .status,
    200,
  )
  assert.equal(tables.mensagens[0].lida, false)
})
test("remetente vem da sessão e pedido exige os participantes corretos", async () => {
  assert.equal(
    (
      await call("/mensagens", "stranger", "POST", {
        id_destinatario: freelancer,
        id_pedido: 1,
        mensagem: "Invasão",
      })
    ).status,
    403,
  )
  const result = await call("/mensagens", "client", "POST", {
    id_destinatario: freelancer,
    id_remetente: stranger,
    mensagem: "Olá",
  })
  assert.equal(result.status, 201)
  assert.equal(result.data.id_remetente, client)
})
test("notificações e portfólio respeitam proprietário", async () => {
  assert.deepEqual((await call("/notificacoes", "stranger")).data, [])
  assert.equal(
    (await call("/notificacoes/1", "stranger", "PATCH", {})).status,
    404,
  )
  assert.equal((await call("/portfolio/1", "client", "DELETE")).status, 404)
})
test("portfólio rejeita URL executável", async () => {
  assert.equal(
    (
      await call("/portfolio", "freelancer", "POST", {
        titulo: "Teste",
        link: "javascript:alert(1)",
      })
    ).status,
    400,
  )
})
test("edição do portfólio não altera itens de outra conta", async () => {
  assert.equal(
    (await call("/portfolio/1", "client", "PATCH", { titulo: "Invasão" }))
      .status,
    403,
  )
  assert.equal(
    (
      await call("/portfolio/1", "freelancer", "PATCH", {
        titulo: "Atualizado",
      })
    ).status,
    200,
  )
})
test("pagamento indisponível não altera saldo", async () => {
  assert.equal(
    (await call("/pedidos/1/pagamento", "client", "POST", {})).status,
    503,
  )
  assert.equal(
    tables.profiles.find((row) => row.id === client).saldo_creditos,
    500,
  )
})
