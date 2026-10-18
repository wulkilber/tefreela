import { Router, raw, type Request, type Response, type NextFunction } from "express"
import { attachImages, withImages, imageFolder, imageType, imageBucket, imageLimit, invalidateImages } from "../serviceImages.js"
import { z } from "zod"
import { authUnavailable, createAuthClient, supabaseAdmin as db } from "../config/supabase.js"
import { nextOrderStatus } from "../domain.js"
import { randomUUID } from "node:crypto"

const router = Router()
const id = z.coerce.number().int().positive().max(Number.MAX_SAFE_INTEGER)
const uuid = z.string().uuid()
const text = z.string().trim().min(1).max(10000)
const safeUrl = z
  .string()
  .url()
  .max(2000)
  .refine((value) => value.startsWith("https://"), "Use HTTPS")
const serviceSchema = z.object({
  titulo: text.max(150),
  descricao: text,
  id_categoria: id,
  preco: z.number().nonnegative().max(1000000),
  prazo_dias: z.number().int().min(1).max(365),
  status: z.enum(["ativo", "pausado", "inativo"]).default("ativo"),
})
const portfolioSchema = z.object({
  titulo: text.max(150),
  descricao: z.string().trim().max(10000).optional(),
  imagem: safeUrl.or(z.literal("")).optional(),
  link: safeUrl.or(z.literal("")).optional(),
})
const publicProfile = "id,nome,tipo_usuario,foto,descricao,cidade,estado"
const privateProfile = `${publicProfile},telefone,saldo_creditos`
function fail(status: number, message: string): never {
  throw Object.assign(new Error(message), { status, safe: true })
}
function checked<T>(result: {
  data: T
  error: unknown
}): T {
  if (result.error)
    fail(503, "Não foi possível acessar os dados. Tente novamente.")
  return result.data
}
function parse<T>(schema: z.ZodType<T>, value: unknown): T {
  const parsed = schema.safeParse(value)
  if (!parsed.success) fail(400, "Confira os dados informados.")
  return parsed.data
}
const handle =
  (fn: (req: Request, res: Response) => Promise<unknown>) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await fn(req, res)
    } catch (error) {
      next(error)
    }
  }
const authenticate = handle(async (req, res) => {
  const token = req.headers.authorization?.match(/^Bearer (.+)$/)?.[1]
  if (!token) fail(401, "Sessão inválida ou expirada.")
  const { data, error } = await createAuthClient().auth.getUser(token)
  if (authUnavailable(error)) fail(503, "Autenticação temporariamente indisponível. Tente novamente.");
  if (error || !data.user) fail(401, "Sessão inválida ou expirada.")
  const profile = checked(
    await db
      .from("profiles")
      .select(privateProfile)
      .eq("id", data.user.id)
      .maybeSingle(),
  )
  if (!profile) fail(403, "Perfil não encontrado.")
  res.locals.user = profile
})
// Use a separate middleware wrapper because successful authentication must continue.
router.use((req, res, next) => {
  const publicRead =
    req.method === "GET" &&
    /^\/(categorias|servicos(?:\/\d+)?|perfis\/[0-9a-f-]+)$/.test(req.path)
  if (publicRead) return next()
  void authenticate(req, res, next).then(() => {
    if (res.locals.user) next()
  })
})
const current = (res: Response) =>
  res.locals.user as {
    id: string
    tipo_usuario: string
    nome: string
    saldo_creditos: number
  }
function freelancer(res: Response) {
  if (current(res).tipo_usuario !== "freelancer")
    fail(403, "Esta ação é exclusiva de freelancers.")
}
async function notify(
  user: string,
  titulo: string,
  mensagem: string,
  tipo: string,
) {
  // Notifications are best effort and must not turn a successful write into a duplicate retry.
  const { error } = await db
    .from("notificacoes")
    .insert({ id_usuario: user, titulo, mensagem, tipo })
  if (error) console.warn("Não foi possível gerar uma notificação.")
}

router.get(
  "/categorias",
  handle(async (_req, res) => {
    res.json(
      checked(await db.from("categorias").select("*").order("id_categoria")),
    )
  }),
)
router.get(
  "/servicos",
  handle(async (_req, res) => {
    const services =
      checked(
        await db
          .from("servicos")
          .select(
            `*,freelancer:profiles!id_freelancer(${publicProfile}),categoria:categorias(*)`,
          )
          .eq("status", "ativo")
          .order("criado_em", { ascending: false })
          .limit(200),
      ) || []
    const reviews = services.length
      ? checked(
          await db
            .from("avaliacoes")
            .select("id_freelancer,nota")
            .in("id_freelancer", [
              ...new Set(services.map((s) => s.id_freelancer)),
            ])
            .limit(10000),
        ) || []
      : []
    res.json(
      await attachImages(services.map((service) => {
        const values = reviews.filter(
          (review) => review.id_freelancer === service.id_freelancer,
        )
        return {
          ...service,
          nota: values.length
            ? values.reduce((sum, value) => sum + value.nota, 0) / values.length
            : 0,
          total_avaliacoes: values.length,
        }
      })),
    )
  }),
)
router.get(
  "/servicos/:id",
  handle(async (req, res) => {
    const service = checked(
      await db
        .from("servicos")
        .select(
          `*,freelancer:profiles!id_freelancer(${publicProfile}),categoria:categorias(*)`,
        )
        .eq("id_servico", parse(id, req.params.id))
        .eq("status", "ativo")
        .maybeSingle(),
    )
    if (!service) fail(404, "Serviço não encontrado.")
    const reviews = checked(
      await db
        .from("avaliacoes")
        .select("id_avaliacao,nota,comentario,criado_em")
        .eq("id_freelancer", service.id_freelancer)
        .order("criado_em", { ascending: false })
        .limit(100),
    )
    res.json({ ...await withImages(service), avaliacoes: reviews })
  }),
)
router.get(
  "/me/servicos",
  handle(async (_req, res) => {
    res.json(
      await attachImages(checked(
        await db
          .from("servicos")
          .select("*,categoria:categorias(*)")
          .eq("id_freelancer", current(res).id)
          .order("criado_em", { ascending: false })
          .limit(200),
      ) || []),
    )
  }),
)
router.post(
  "/servicos",
  handle(async (req, res) => {
    freelancer(res)
    const values = parse(serviceSchema, req.body)
    const category = checked(
      await db
        .from("categorias")
        .select("id_categoria")
        .eq("id_categoria", values.id_categoria)
        .maybeSingle(),
    )
    if (!category) fail(400, "Categoria inválida.")
    res.status(201).json(
      checked(
        await db
          .from("servicos")
          .insert({ ...values, id_freelancer: current(res).id })
          .select()
          .single(),
      ),
    )
  }),
)
router.patch(
  "/servicos/:id",
  handle(async (req, res) => {
    freelancer(res)
    const values = parse(serviceSchema, req.body)
    const service = checked(
      await db
        .from("servicos")
        .update(values)
        .eq("id_servico", parse(id, req.params.id))
        .eq("id_freelancer", current(res).id)
        .select()
        .maybeSingle(),
    )
    if (!service) fail(404, "Serviço não encontrado.")
    res.json(service)
  }),
)
router.put("/servicos/:id/imagens/:slot", raw({ type: ["image/jpeg", "image/png", "image/webp"], limit: imageLimit }), handle(async (req, res) => {
  freelancer(res)
  const serviceId = parse(id, req.params.id)
  const slot = parse(z.coerce.number().int().min(0).max(3), req.params.slot)
  const service = checked(await db.from("servicos").select("id_servico,id_freelancer").eq("id_servico", serviceId).eq("id_freelancer", current(res).id).maybeSingle())
  if (!service) fail(404, "Serviço não encontrado.")
  const bytes = req.body
  const contentType = Buffer.isBuffer(bytes) ? imageType(bytes) : null
  if (!contentType || contentType !== req.headers["content-type"]?.split(";")[0]) fail(400, "Envie uma imagem JPG, PNG ou WebP válida, de até 5 MB.")
  const folder = imageFolder(service)
  const { error } = await db.storage.from(imageBucket).upload(`${folder}/${slot}`, bytes, { contentType, upsert: true, cacheControl: "60" })
  if (error) fail(503, "Não foi possível salvar a imagem. Tente novamente.")
  invalidateImages(folder)
  res.json(await withImages(service))
}))
router.delete("/servicos/:id/imagens/:slot", handle(async (req, res) => {
  freelancer(res)
  const service = checked(await db.from("servicos").select("id_servico,id_freelancer").eq("id_servico", parse(id, req.params.id)).eq("id_freelancer", current(res).id).maybeSingle())
  if (!service) fail(404, "Serviço não encontrado.")
  const slot = parse(z.coerce.number().int().min(0).max(3), req.params.slot)
  const folder = imageFolder(service)
  const { error } = await db.storage.from(imageBucket).remove([`${folder}/${slot}`])
  if (error) fail(503, "Não foi possível remover a imagem.")
  invalidateImages(folder)
  res.json({ mensagem: "Imagem removida." })
}))
function ownedAvatarPath(url: string | null | undefined, userId: string) {
  if (!url) return null
  const base = db.storage.from("avatars").getPublicUrl("").data.publicUrl
  if (!url.startsWith(base)) return null
  const path = url.slice(base.length).split("?")[0].replace(/^\//, "")
  return path.startsWith(`${userId}/`) && !path.includes("..") ? path : null
}
async function cleanAvatar(path: string | null) {
  if (path) { const { error } = await db.storage.from("avatars").remove([path]); if (error) console.warn("Limpeza de avatar anterior pendente.") }
}
router.put("/me/avatar", raw({ type: ["image/jpeg", "image/png", "image/webp"], limit: imageLimit }), handle(async (req, res) => {
  const user = current(res)
  const bytes = req.body
  const contentType = Buffer.isBuffer(bytes) ? imageType(bytes) : null
  if (!contentType || contentType !== req.headers["content-type"]?.split(";")[0]) fail(400, "Escolha uma imagem JPG, PNG ou WebP válida de até 5 MB.")
  const previous = checked(await db.from("profiles").select("foto").eq("id", user.id).single())
  const path = `${user.id}/${randomUUID()}`
  const result = await db.storage.from("avatars").upload(path, bytes, { contentType, cacheControl: "3600", upsert: false })
  if (result.error) fail(503, "Não foi possível enviar a foto. Tente novamente.")
  const foto = db.storage.from("avatars").getPublicUrl(path).data.publicUrl
  const saved = await db.from("profiles").update({ foto }).eq("id", user.id).select(privateProfile).single()
  if (saved.error) { await cleanAvatar(path); fail(503, "A foto não pôde ser salva no perfil. Tente novamente.") }
  await cleanAvatar(ownedAvatarPath(previous?.foto, user.id))
  res.json(saved.data)
}))
router.delete("/me/avatar", handle(async (_req, res) => {
  const user = current(res)
  const previous = checked(await db.from("profiles").select("foto").eq("id", user.id).single())
  const saved = checked(await db.from("profiles").update({foto:null}).eq("id", user.id).select(privateProfile).single())
  await cleanAvatar(ownedAvatarPath(previous?.foto, user.id))
  res.json(saved)
}))
router.get(
  "/me/perfil",
  handle(async (_req, res) => {
    res.json(current(res))
  }),
)
router.patch(
  "/me/perfil",
  handle(async (req, res) => {
    const values = parse(
      z.object({
        nome: text.max(150),
        telefone: z.string().trim().max(20).nullable().optional(),
        descricao: z.string().trim().max(10000).nullable().optional(),
        cidade: z.string().trim().max(100).nullable().optional(),
        estado: z
          .string()
          .trim()
          .length(2)
          .or(z.literal(""))
          .nullable()
          .optional(),
        foto: safeUrl.or(z.literal("")).nullable().optional(),
      }),
      req.body,
    )
    res.json(
      checked(
        await db
          .from("profiles")
          .update(values)
          .eq("id", current(res).id)
          .select(privateProfile)
          .single(),
      ),
    )
  }),
)
router.get(
  "/perfis/:id",
  handle(async (req, res) => {
    const userId = parse(uuid, req.params.id)
    const profile = checked(
      await db
        .from("profiles")
        .select(publicProfile)
        .eq("id", userId)
        .eq("tipo_usuario", "freelancer")
        .maybeSingle(),
    )
    if (!profile) fail(404, "Perfil não encontrado.")
    const portfolio = checked(
      await db
        .from("portfolio")
        .select("*")
        .eq("id_freelancer", userId)
        .order("criado_em", { ascending: false })
        .limit(100),
    )
    res.json({ ...profile, portfolio })
  }),
)
router.get(
  "/me/portfolio",
  handle(async (_req, res) => {
    res.json(
      checked(
        await db
          .from("portfolio")
          .select("*")
          .eq("id_freelancer", current(res).id)
          .order("criado_em", { ascending: false })
          .limit(100),
      ),
    )
  }),
)
router.post(
  "/portfolio",
  handle(async (req, res) => {
    freelancer(res)
    res.status(201).json(
      checked(
        await db
          .from("portfolio")
          .insert({
            ...parse(portfolioSchema, req.body),
            id_freelancer: current(res).id,
          })
          .select()
          .single(),
      ),
    )
  }),
)
router.patch(
  "/portfolio/:id",
  handle(async (req, res) => {
    freelancer(res)
    const item = checked(
      await db
        .from("portfolio")
        .update(parse(portfolioSchema, req.body))
        .eq("id_portfolio", parse(id, req.params.id))
        .eq("id_freelancer", current(res).id)
        .select()
        .maybeSingle(),
    )
    if (!item) fail(404, "Item não encontrado.")
    res.json(item)
  }),
)
router.delete(
  "/portfolio/:id",
  handle(async (req, res) => {
    const item = checked(
      await db
        .from("portfolio")
        .delete()
        .eq("id_portfolio", parse(id, req.params.id))
        .eq("id_freelancer", current(res).id)
        .select("id_portfolio")
        .maybeSingle(),
    )
    if (!item) fail(404, "Item não encontrado.")
    res.json({ mensagem: "Item removido." })
  }),
)

const orderColumns =
  "*,servico:servicos(titulo),cliente:profiles!id_cliente(id,nome,foto),freelancer:profiles!id_freelancer(id,nome,foto),avaliacao:avaliacoes(id_avaliacao,nota,comentario)"
router.get(
  "/pedidos",
  handle(async (_req, res) => {
    const userId = current(res).id
    const orders =
      checked(
        await db
          .from("pedidos")
          .select(orderColumns)
          .or(`id_cliente.eq.${userId},id_freelancer.eq.${userId}`)
          .order("criado_em", { ascending: false })
          .limit(200),
      ) || []
    res.json(
      orders.map((order) => ({
        ...order,
        avaliacao: Array.isArray(order.avaliacao)
          ? order.avaliacao
          : order.avaliacao
            ? [order.avaliacao]
            : [],
      })),
    )
  }),
)
router.post(
  "/pedidos",
  handle(async (req, res) => {
    if (current(res).tipo_usuario !== "cliente")
      fail(403, "Somente clientes podem contratar.")
    const values = parse(
      z.object({ id_servico: id, descricao_solicitacao: text }),
      req.body,
    )
    const service = checked(
      await db
        .from("servicos")
        .select("id_servico,id_freelancer,preco,status,titulo")
        .eq("id_servico", values.id_servico)
        .eq("status", "ativo")
        .maybeSingle(),
    )
    if (!service || service.id_freelancer === current(res).id)
      fail(400, "Serviço indisponível para contratação.")
    const order = checked(
      await db
        .from("pedidos")
        .insert({
          ...values,
          id_cliente: current(res).id,
          id_freelancer: service.id_freelancer,
          valor: service.preco,
          status: "solicitado",
        })
        .select()
        .single(),
    )
    await notify(
      service.id_freelancer,
      "Novo pedido",
      `Você recebeu uma solicitação: ${service.titulo}`,
      "pedido",
    )
    res.status(201).json(order)
  }),
)
router.patch(
  "/pedidos/:id",
  handle(async (req, res) => {
    const orderId = parse(id, req.params.id)
    const next = parse(
      z.object({
        status: z.enum([
          "aceito",
          "recusado",
          "em_andamento",
          "concluido",
          "cancelado",
        ]),
      }),
      req.body,
    ).status
    const userId = current(res).id
    const order = checked(
      await db
        .from("pedidos")
        .select("*")
        .eq("id_pedido", orderId)
        .or(`id_cliente.eq.${userId},id_freelancer.eq.${userId}`)
        .maybeSingle(),
    )
    if (!order) fail(404, "Pedido não encontrado.")
    const role = order.id_cliente === userId ? "cliente" : "freelancer"
    if (!nextOrderStatus(role, order.status, next))
      fail(409, "Esta mudança de status não é permitida.")
    const update = {
      status: next,
      ...(next === "aceito" ? { data_aceite: new Date().toISOString() } : {}),
      ...(next === "concluido"
        ? { data_entrega: new Date().toISOString() }
        : {}),
    }
    const changed = checked(
      await db
        .from("pedidos")
        .update(update)
        .eq("id_pedido", orderId)
        .eq("status", order.status)
        .select()
        .maybeSingle(),
    )
    if (!changed) fail(409, "O pedido mudou. Atualize a página.")
    await notify(
      role === "cliente" ? order.id_freelancer : order.id_cliente,
      "Pedido atualizado",
      `Pedido #${orderId}: ${next}`,
      "pedido",
    )
    res.json(changed)
  }),
)
router.post(
  "/pedidos/:id/pagamento",
  handle(async (req, res) => {
    const orderId = parse(id, req.params.id)
    const result = await db.rpc("tefreela_pagar_pedido", {
      p_id_pedido: orderId,
      p_id_cliente: current(res).id,
    })
    if (result.error)
      fail(
        result.error.code === "P0001" ? 409 : 503,
        result.error.code === "P0001"
          ? "Pedido não pode ser pago: confira status e saldo."
          : "Pagamento indisponível. A operação de créditos precisa estar configurada no banco.",
      )
    res.json({
      mensagem: "Pagamento acadêmico processado.",
      pagamento: result.data,
    })
  }),
)
router.post(
  "/avaliacoes",
  handle(async (req, res) => {
    const values = parse(
      z.object({
        id_pedido: id,
        nota: z.number().int().min(1).max(5),
        comentario: z.string().trim().max(2000).default(""),
      }),
      req.body,
    )
    const order = checked(
      await db
        .from("pedidos")
        .select("id_cliente,id_freelancer,status")
        .eq("id_pedido", values.id_pedido)
        .eq("id_cliente", current(res).id)
        .maybeSingle(),
    )
    if (!order || order.status !== "concluido")
      fail(403, "Só é possível avaliar um pedido seu que foi concluído.")
    const result = await db
      .from("avaliacoes")
      .insert({
        ...values,
        id_cliente: current(res).id,
        id_freelancer: order.id_freelancer,
      })
      .select()
      .single()
    if (result.error?.code === "23505")
      fail(409, "Este pedido já foi avaliado.")
    res.status(201).json(checked(result))
  }),
)

router.get(
  "/conversas",
  handle(async (_req, res) => {
    const userId = current(res).id
    const messages =
      checked(
        await db
          .from("mensagens")
          .select("*")
          .or(`id_remetente.eq.${userId},id_destinatario.eq.${userId}`)
          .order("data_envio", { ascending: false })
          .limit(1000),
      ) || []
    const peers = [
      ...new Set(
        messages.map((message) =>
          message.id_remetente === userId
            ? message.id_destinatario
            : message.id_remetente,
        ),
      ),
    ]
    const profiles = peers.length
      ? checked(
          await db.from("profiles").select("id,nome,foto").in("id", peers),
        ) || []
      : []
    res.json(
      peers.map((peer) => {
        const history = messages.filter(
          (m) => m.id_remetente === peer || m.id_destinatario === peer,
        )
        return {
          ...profiles.find((p) => p.id === peer),
          id: peer,
          ultima: history[0],
          nao_lidas: history.filter(
            (m) => m.id_destinatario === userId && !m.lida,
          ).length,
        }
      }),
    )
  }),
)
router.get("/conversas/:peer", handle(async (req, res) => {
  const peer = parse(uuid, req.params.peer)
  if (peer === current(res).id) fail(400, "Escolha outra pessoa para conversar.")
  const profile = checked(await db.from("profiles").select("id,nome,foto,tipo_usuario").eq("id", peer).maybeSingle())
  if (!profile || profile.tipo_usuario === "admin") fail(404, "Destinatário não encontrado.")
  res.json(profile)
}))
router.get(
  "/mensagens/:peer",
  handle(async (req, res) => {
    const peer = parse(uuid, req.params.peer)
    const userId = current(res).id
    const messages =
      checked(
        await db
          .from("mensagens")
          .select("*")
          .or(
            `and(id_remetente.eq.${userId},id_destinatario.eq.${peer}),and(id_remetente.eq.${peer},id_destinatario.eq.${userId})`,
          )
          .order("data_envio", { ascending: false })
          .limit(200),
      ) || []
    res.json(messages.reverse())
  }),
)
router.post(
  "/mensagens",
  handle(async (req, res) => {
    const values = parse(
      z.object({
        id_destinatario: uuid,
        mensagem: text,
        id_pedido: id.optional(),
        id_servico: id.optional(),
      }),
      req.body,
    )
    const userId = current(res).id
    if (values.id_destinatario === userId)
      fail(400, "Escolha outra pessoa para conversar.")
    const recipient = checked(
      await db
        .from("profiles")
        .select("id")
        .eq("id", values.id_destinatario)
        .maybeSingle(),
    )
    if (!recipient) fail(404, "Destinatário não encontrado.")
    if (values.id_pedido) {
      const order = checked(
        await db
          .from("pedidos")
          .select("id_cliente,id_freelancer")
          .eq("id_pedido", values.id_pedido)
          .maybeSingle(),
      )
      if (
        !order ||
        ![order.id_cliente, order.id_freelancer].includes(userId) ||
        ![order.id_cliente, order.id_freelancer].includes(
          values.id_destinatario,
        )
      )
        fail(403, "Conversa não pertence a este pedido.")
    }
    if (values.id_servico) {
      const service = checked(
        await db
          .from("servicos")
          .select("id_freelancer,status")
          .eq("id_servico", values.id_servico)
          .maybeSingle(),
      )
      if (
        !service ||
        service.status !== "ativo" ||
        ![userId, values.id_destinatario].includes(service.id_freelancer)
      )
        fail(403, "Serviço indisponível para esta conversa.")
    }
    const message = checked(
      await db
        .from("mensagens")
        .insert({ ...values, id_remetente: userId })
        .select()
        .single(),
    )
    await notify(
      values.id_destinatario,
      "Nova mensagem",
      `${current(res).nome} enviou uma mensagem.`,
      "mensagem",
    )
    res.status(201).json(message)
  }),
)
router.patch(
  "/mensagens/:peer/lidas",
  handle(async (req, res) => {
    checked(
      await db
        .from("mensagens")
        .update({ lida: true })
        .eq("id_destinatario", current(res).id)
        .eq("id_remetente", parse(uuid, req.params.peer)),
    )
    res.json({ mensagem: "Mensagens marcadas como lidas." })
  }),
)
router.get(
  "/notificacoes",
  handle(async (_req, res) => {
    res.json(
      checked(
        await db
          .from("notificacoes")
          .select("*")
          .eq("id_usuario", current(res).id)
          .order("criado_em", { ascending: false })
          .limit(100),
      ),
    )
  }),
)
router.patch(
  "/notificacoes/:id",
  handle(async (req, res) => {
    const notification = checked(
      await db
        .from("notificacoes")
        .update({ lida: true })
        .eq("id_usuario", current(res).id)
        .eq("id_notificacao", parse(id, req.params.id))
        .select()
        .maybeSingle(),
    )
    if (!notification) fail(404, "Notificação não encontrada.")
    res.json(notification)
  }),
)
router.get(
  "/creditos",
  handle(async (_req, res) => {
    const movements = checked(
      await db
        .from("movimentacoes_creditos")
        .select("*")
        .eq("id_usuario", current(res).id)
        .order("criado_em", { ascending: false })
        .limit(200),
    )
    const payments = checked(
      await db
        .from("pagamentos")
        .select("*,pedido:pedidos!inner(id_cliente,id_freelancer)")
        .or(
          `id_cliente.eq.${current(res).id},id_freelancer.eq.${current(res).id}`,
          { referencedTable: "pedido" },
        )
        .order("criado_em", { ascending: false })
        .limit(200),
    )
    res.json({
      saldo: current(res).saldo_creditos,
      movimentacoes: movements,
      pagamentos: payments,
    })
  }),
)
export default router
