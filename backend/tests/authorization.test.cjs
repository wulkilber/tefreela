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
  configuracao_financeira:[{singleton:true,percentual_taxa:5}],
  taxas_plataforma:[],
}
const registered=[]
tables.mensagens.forEach(row=>Object.assign(row,{ocultada_remetente:false,ocultada_destinatario:false}))
let failChatDelete=false
let fake, app
const objects = new Map()
let failAvatarUpload = false
let failProfileSave = false
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
      res.setHeader("X-Supabase-Api-Version","2024-01-01")
      if(url.pathname==="/auth/v1/admin/users"&&req.method==="POST"){
        let raw="";for await(const chunk of req)raw+=chunk;const input=JSON.parse(raw)
        if(registered.some(item=>item.email===input.email)){res.statusCode=422;res.end(JSON.stringify({msg:"Email exists",code:"email_exists"}));return}
        const user={id:require("node:crypto").randomUUID(),email:input.email,aud:"authenticated",role:"authenticated"}
        registered.push({...user,password:input.password});res.end(JSON.stringify(user));return
      }
      if(url.pathname==="/auth/v1/token"){
        let raw="";for await(const chunk of req)raw+=chunk;const input=JSON.parse(raw),user=registered.find(item=>item.email===input.email&&item.password===input.password)
        if(!user){res.statusCode=400;res.end(JSON.stringify({msg:"Invalid credentials",code:"invalid_credentials"}));return}
        const token="registered-"+user.id;identities[token]=user.id
        res.end(JSON.stringify({access_token:token,refresh_token:"fixture-refresh",token_type:"bearer",expires_in:3600,user:{id:user.id,email:user.email,aud:"authenticated",role:"authenticated"}}));return
      }
      if (url.pathname.startsWith("/storage/v1/object/avatars/")) {
        if (failAvatarUpload) { res.statusCode=503;res.end(JSON.stringify({message:"Storage unavailable",statusCode:"503"}));return }
        const key=url.pathname.slice("/storage/v1/object/avatars/".length), chunks=[]
        for await(const chunk of req)chunks.push(chunk)
        objects.set("avatars/"+key,Buffer.concat(chunks));res.end(JSON.stringify({Key:key}));return
      }
      if (url.pathname === "/storage/v1/object/avatars" && req.method === "DELETE") {
        let body="";for await(const chunk of req)body+=chunk
        const keys=JSON.parse(body).prefixes||[];keys.forEach(key=>objects.delete("avatars/"+key))
        res.end(JSON.stringify(keys.map(name=>({name}))));return
      }
      if (url.pathname === "/storage/v1/object/list/servicos-imagens") {
        let body = ""; for await (const chunk of req) body += chunk
        const prefix = JSON.parse(body).prefix + "/"
        res.end(JSON.stringify([...objects.keys()].filter(key => key.startsWith(prefix)).map(key => ({ id: "fixture", name: key.slice(prefix.length), updated_at: "2026-10-05T00:00:00Z" }))))
        return
      }
      if (url.pathname.startsWith("/storage/v1/object/servicos-imagens/")) {
        const key = url.pathname.slice("/storage/v1/object/servicos-imagens/".length)
        const chunks = []; for await (const chunk of req) chunks.push(chunk)
        objects.set(key, Buffer.concat(chunks))
        res.end(JSON.stringify({ Key: key })); return
      }
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
        let raw="";for await(const chunk of req)raw+=chunk;const args=JSON.parse(raw||"{}")
        if(url.pathname.endsWith("/tefreela_excluir_conversa")){
          if(failChatDelete){res.statusCode=503;res.end(JSON.stringify({code:"DBERROR"}));return}
          for(const message of tables.mensagens){
            if(message.id_remetente===args.p_usuario_id&&message.id_destinatario===args.p_contato_id)message.ocultada_remetente=true
            if(message.id_destinatario===args.p_usuario_id&&message.id_remetente===args.p_contato_id)message.ocultada_destinatario=true
          }
          res.end(JSON.stringify({mensagem:"Conversa excluída"}));return
        }
        if(url.pathname.endsWith("/tefreela_resumo_taxas")){res.end(JSON.stringify({total_concluidos:tables.taxas_plataforma.filter(f=>f.freelancer_id===args.p_freelancer_id).length,percentual_atual:5,simulado:true}));return}
        if(url.pathname.endsWith("/tefreela_simular_taxa")){
          const fee=tables.taxas_plataforma.find(f=>f.id===args.p_taxa_id&&f.freelancer_id===args.p_freelancer_id)
          if(!fee){res.statusCode=404;res.end(JSON.stringify({code:"P0002"}));return}
          if(fee.status==="cancelada"||!tables.pedidos.some(p=>p.id_pedido===fee.pedido_id&&p.status==="concluido")){res.statusCode=409;res.end(JSON.stringify({code:"P0001"}));return}
          if(fee.status!=="paga"){fee.status="paga";fee.pago_em=new Date().toISOString()}
          res.end(JSON.stringify(fee));return
        }
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
      if (name === "profiles" && req.method === "PATCH" && Object.hasOwn(values,"foto") && failProfileSave) { res.statusCode=500;res.end(JSON.stringify({code:"DBERROR"}));return }
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
          ...(name==="mensagens"?{ocultada_remetente:false,ocultada_destinatario:false}:{}),
          ...values,
          ...(primary
            ? { [primary]: Math.max(0, ...rows.map((row) => row[primary])) + 1 }
            : {}),
        }
        rows.push(row)
        selected = [row]
      }
      if (req.method === "PATCH")
        selected.forEach((row) => {Object.assign(row, values);if(name==="pedidos"&&values.status==="concluido"&&!tables.taxas_plataforma.some(f=>f.pedido_id===row.id_pedido)){tables.taxas_plataforma.push({id:tables.taxas_plataforma.length+1,pedido_id:row.id_pedido,freelancer_id:row.id_freelancer,valor_servico:row.valor,percentual_taxa:5,valor_taxa:7.5,valor_liquido:142.5,status:"pendente",concluido_em:row.data_entrega})}})
      if (req.method === "DELETE")
        tables[name] = rows.filter((row) => !selected.includes(row))
      const columns = url.searchParams.get("select")
      if(name==="taxas_plataforma")res.setHeader("Content-Range",`0-${Math.max(0,selected.length-1)}/${selected.length}`)
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
    "/taxas/minhas",
    "/taxas/resumo",
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
test("pagamento legado desativado não altera dados antigos", async () => {
  assert.equal(
    (await call("/pedidos/1/pagamento", "client", "POST", {})).status,
    410,
  )
  assert.equal(
    tables.profiles.find((row) => row.id === client).saldo_creditos,
    500,
  )
})
test("contato do chat mostra o nome sem expor telefone ou créditos", async () => {
  const result = await call(`/conversas/${freelancer}`, "client")
  assert.equal(result.status, 200)
  assert.equal(result.data.nome, "Freelancer teste")
  assert.equal(result.data.telefone, undefined)
  assert.equal(result.data.saldo_creditos, undefined)
  assert.equal((await call(`/conversas/${client}`, "client")).status, 400)
})
async function upload(token, bytes, type = "image/png", slot = 0) {
  const response = await fetch(`http://127.0.0.1:31988/api/servicos/1/imagens/${slot}`, {
    method: "PUT", headers: { "Content-Type": type, Authorization: `Bearer ${token}` }, body: bytes,
  })
  return { status: response.status, data: await response.json() }
}
test("imagens exigem dono, assinatura válida, tamanho e posição permitidos", async () => {
  const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==", "base64")
  assert.equal((await upload("stranger", png)).status, 403)
  // A client cannot upload; a different freelancer cannot edit the owner's service either.
  tables.profiles.find(row => row.id === stranger).tipo_usuario = "freelancer"
  assert.equal((await upload("stranger", png)).status, 404)
  tables.profiles.find(row => row.id === stranger).tipo_usuario = "cliente"
  assert.equal((await upload("freelancer", Buffer.from("<svg>not-an-image</svg>"))).status, 400)
  assert.equal((await upload("freelancer", png, "image/jpeg")).status, 400)
  assert.equal((await upload("freelancer", png, "image/png", 4)).status, 400)
  assert.equal((await upload("freelancer", Buffer.alloc(5 * 1024 * 1024 + 1))).status, 413)
  const result = await upload("freelancer", png)
  assert.equal(result.status, 200)
  assert.equal(result.data.imagens.length, 1)
  assert.match(result.data.imagens[0], /object\/public\/servicos-imagens/)
  assert.equal((await call("/me/servicos", "freelancer")).data.find(row => row.id_servico === 1).imagens.length, 1)
})
async function avatarRequest(token, bytes, type = "image/png", method = "PUT") {
  const response=await fetch('http://127.0.0.1:31988/api/me/avatar',{method,headers:{...(token?{Authorization:'Bearer '+token}:{}),'Content-Type':type},...(bytes?{body:bytes}:{})})
  return {status:response.status,data:await response.json()}
}
const avatarPng=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==','base64')
test('avatar exige sessão, valida conteúdo e limite de tamanho',async()=>{
 assert.equal((await avatarRequest(null,avatarPng)).status,401)
 assert.equal((await avatarRequest('client',Buffer.from('<svg>unsafe</svg>'))).status,400)
 assert.equal((await avatarRequest('client',avatarPng,'image/jpeg')).status,400)
 assert.equal((await avatarRequest('client',Buffer.alloc(5*1024*1024+1))).status,413)
})
test('avatar é salvo somente no perfil autenticado e remove apenas a imagem anterior do dono',async()=>{
 const result=await avatarRequest('client',avatarPng)
 assert.equal(result.status,200);assert.match(result.data.foto,new RegExp('/avatars/'+client+'/'))
 const previous=result.data.foto
 const other=tables.profiles.find(p=>p.id===freelancer).foto
 const second=await avatarRequest('client',avatarPng)
 assert.equal(second.status,200);assert.notEqual(second.data.foto,previous)
 assert.equal([...objects.keys()].filter(key=>key.startsWith('avatars/'+client+'/')).length,1)
 assert.equal(tables.profiles.find(p=>p.id===freelancer).foto,other)
 const removed=await avatarRequest('client',undefined,'application/json','DELETE')
 assert.equal(removed.status,200);assert.equal(removed.data.foto,null)
 assert.equal([...objects.keys()].filter(key=>key.startsWith('avatars/'+client+'/')).length,0)
})
test('falha de Storage ou banco mantém a foto anterior e não deixa novo objeto órfão',async()=>{
 const profile=tables.profiles.find(p=>p.id===client)
 profile.foto='https://example.invalid/external-avatar.png'
 failAvatarUpload=true
 assert.equal((await avatarRequest('client',avatarPng)).status,503)
 failAvatarUpload=false
 assert.equal(profile.foto,'https://example.invalid/external-avatar.png')
 failProfileSave=true
 const failed=await avatarRequest('client',avatarPng)
 failProfileSave=false
 assert.equal(failed.status,503)
 assert.equal(profile.foto,'https://example.invalid/external-avatar.png')
 assert.equal([...objects.keys()].filter(key=>key.startsWith('avatars/'+client+'/')).length,0)
})

test("cadastro valida confirmação, requisitos e campos antes de criar usuário",async()=>{
 const base={nome:"Pessoa Teste",email:"signup@example.invalid",senha:"Senha123",confirmarSenha:"Senha123",tipo_usuario:"cliente"}
 for(const [patch,message] of [[{confirmarSenha:"Outra123"},"As senhas não coincidem."],[{senha:"Ab1",confirmarSenha:"Ab1"},"A senha deve possuir pelo menos 8 caracteres."],[{senha:"abcdefgh",confirmarSenha:"abcdefgh"},"A senha deve conter pelo menos um número."],[{senha:"12345678",confirmarSenha:"12345678"},"A senha deve conter pelo menos uma letra."],[{confirmarSenha:undefined},null],[{nome:"",email:"",senha:"",confirmarSenha:""},null]]){
  const result=await call("/auth/cadastro",undefined,"POST",{...base,...patch});assert.equal(result.status,400);if(message)assert.equal(result.data.erro,message)
 }
 assert.equal(registered.length,0)
})
test("cadastro cliente e freelancer permite login e recarga; confirmação não é armazenada",async()=>{
 for(const tipo_usuario of ["cliente","freelancer"]){
  const input={nome:"Pessoa Teste",email:`signup-${tipo_usuario}@example.invalid`,senha:"Senha123",confirmarSenha:"Senha123",tipo_usuario,telefone:"",cidade:"Manaus",estado:"AM"}
  const created=await call("/auth/cadastro",undefined,"POST",input);assert.equal(created.status,201)
  const profile=tables.profiles.find(p=>p.id===created.data.usuario.id);assert.equal(profile.senha,undefined);assert.equal(profile.confirmarSenha,undefined)
  const login=await call("/auth/login",undefined,"POST",input);assert.equal(login.status,200);assert.equal(login.data.usuario.tipo_usuario,tipo_usuario);assert.equal(login.data.usuario.saldo_creditos,undefined)
  const restored=await call("/auth/me",login.data.access_token);assert.equal(restored.status,200);assert.equal(restored.data.usuario.id,created.data.usuario.id)
 }
 const duplicate=await call("/auth/cadastro",undefined,"POST",{nome:"Pessoa",email:"signup-cliente@example.invalid",senha:"Senha123",confirmarSenha:"Senha123",tipo_usuario:"cliente"});assert.equal(duplicate.status,400);assert.equal(duplicate.data.erro,"E-mail já cadastrado.")
})
test("taxas usam a identidade do token e negam cliente e freelancer alheio",async()=>{
 for(const route of ["/taxas/minhas","/taxas/resumo"]){assert.equal((await call(route,"client")).status,403);assert.equal((await call(route,"freelancer")).status,200)}
 const list=await call(`/taxas/minhas?freelancer_id=${stranger}`,"freelancer");assert.equal(list.data.items.length,1);assert.equal(list.data.items[0].freelancer_id,freelancer)
 const fee=list.data.items[0]
 assert.equal((await call("/servicos","freelancer","POST",{titulo:"Serviço com taxa pendente",descricao:"Publicação permitida",id_categoria:1,preco:90,prazo_dias:2})).status,201)
 const otherUser=registered.find(p=>p.email==="signup-freelancer@example.invalid"),otherToken="registered-"+otherUser.id;assert.deepEqual((await call("/taxas/minhas",otherToken)).data.items,[]);assert.equal((await call(`/taxas/${fee.id}/simular-pagamento`,otherToken,"POST",{})).status,404)
 assert.equal((await call(`/taxas/${fee.id}/simular-pagamento`,"client","POST",{})).status,403)
 assert.equal((await call(`/taxas/${fee.id+999}/simular-pagamento`,"freelancer","POST",{})).status,404)
 const result=await call(`/taxas/${fee.id}/simular-pagamento`,"freelancer","POST",{valor_taxa:0,percentual_taxa:0,freelancer_id:stranger});assert.equal(result.status,200);assert.equal(result.data.taxa.status,"paga");assert.equal(result.data.taxa.valor_taxa,7.5)
 const repeated=await call(`/taxas/${fee.id}/simular-pagamento`,"freelancer","POST",{});assert.equal(repeated.data.taxa.pago_em,result.data.taxa.pago_em)
 assert.equal((await call("/pedidos/1","freelancer","PATCH",{status:"concluido"})).status,200);assert.equal(tables.taxas_plataforma.filter(f=>f.pedido_id===1).length,1)
 assert.equal((await call("/creditos","client")).status,410)
})

test("excluir chat exige sessão, ignora identidade enviada e preserva o histórico alheio",async()=>{
 assert.equal((await call(`/conversas/${freelancer}`,undefined,"DELETE")).status,401)
 assert.equal((await call(`/conversas/${client}`,"client","DELETE")).status,400)
 const before=(await call(`/mensagens/${freelancer}`,"client")).data
 assert.ok(before.length>0)
 assert.equal((await call(`/conversas/${freelancer}`,"stranger","DELETE",{p_usuario_id:client})).status,200)
 assert.equal((await call(`/mensagens/${freelancer}`,"client")).data.length,before.length)
 failChatDelete=true
 assert.equal((await call(`/conversas/${freelancer}`,"client","DELETE")).status,503)
 failChatDelete=false
 assert.equal((await call(`/mensagens/${freelancer}`,"client")).data.length,before.length)
 for(let i=0;i<2;i++)assert.equal((await call(`/conversas/${freelancer}`,"client","DELETE")).status,200)
 assert.deepEqual((await call(`/mensagens/${freelancer}`,"client")).data,[])
 assert.ok(!(await call("/conversas","client")).data.some(p=>p.id===freelancer))
 const others=(await call(`/mensagens/${client}`,"freelancer")).data
 assert.equal(others.length,before.length)
 assert.equal(others[0].ocultada_remetente,undefined);assert.equal(others[0].ocultada_destinatario,undefined)
 const sent=await call("/mensagens","freelancer","POST",{id_destinatario:client,mensagem:"Nova mensagem depois da exclusão"});assert.equal(sent.status,201)
 assert.equal(sent.data.ocultada_remetente,undefined)
 const restored=(await call(`/mensagens/${freelancer}`,"client")).data
 assert.equal(restored.length,1);assert.equal(restored[0].mensagem,"Nova mensagem depois da exclusão")
 assert.equal((await call("/conversas","client")).data.some(p=>p.id===freelancer),true)
})
