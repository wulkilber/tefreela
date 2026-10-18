import { useEffect, useState } from "react"
import AppShell from "../components/AppShell"
import { Button, ButtonLink, EmptyState, Heading, Modal, Skeleton, TextInput } from "../components/ui"
import NotificationsPanel from "../components/NotificationsPanel"
import { api, getSession, saveSession } from "../lib/session"
import {
  categoryName,
  date,
  money,
  useData,
  type Category,
  type Notification,
  type Portfolio,
  type Profile,
  type ServiceRecord,
} from "../lib/data"
type Kind = "perfil" | "servicos" | "portfolio" | "notificacoes" | "creditos"
type Credits = {
  saldo: number
  movimentacoes: {
    id_movimentacao: number
    tipo: string
    valor: number
    descricao: string
    criado_em: string
  }[]
  pagamentos: {
    id_pagamento: number
    id_pedido: number
    valor_servico: number
    valor_taxa: number
    valor_freelancer: number
    status: string
  }[]
}
export default function ManagementPage({ kind }: { kind: Kind }) {
  const path =
    kind === "creditos" || kind === "notificacoes"
      ? `/${kind}`
      : `/me/${kind === "perfil" ? "perfil" : kind}`
  const request =
    useData<Profile | ServiceRecord[] | Portfolio[] | Notification[] | Credits | null>(
      path,
      null,
    )
  const categories = useData<Category[]>(
    kind === "servicos" ? "/categorias" : null,
    [],
  )
  const [editing, setEditing] = useState<ServiceRecord | null>(null)
  const [editingPortfolio, setEditingPortfolio] = useState<Portfolio | null>(
    null,
  )
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [removingPortfolio, setRemovingPortfolio] = useState<Portfolio | null>(null)
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  useEffect(() => {
    const urls = imageFiles.map(file => URL.createObjectURL(file))
    setImagePreviews(urls)
    return () => urls.forEach(url => URL.revokeObjectURL(url))
  }, [imageFiles])
  async function saveService(values: unknown) {
    setBusy(true); setError(""); setSuccess("")
    let saved: ServiceRecord | null = null
    try {
      saved = await api<ServiceRecord>(editing ? `/servicos/${editing.id_servico}` : "/servicos", values, editing ? "PATCH" : "POST")
      // Keep the saved ID if an upload fails, so retrying cannot create duplicate services.
      setEditing(saved)
      for (let slot = 0; slot < imageFiles.length; slot++) {
        await api(`/servicos/${saved.id_servico}/imagens/${slot}`, imageFiles[slot], "PUT")
      }
      setEditing(null); setImageFiles([])
      setSuccess("Serviço e imagens salvos com sucesso.")
      return true
    } catch (caught) {
      setError(`${saved ? "O serviço foi salvo, mas uma imagem não foi enviada. Clique em Salvar alterações para tentar novamente. " : ""}${(caught as Error).message}`)
      return false
    } finally { setBusy(false); request.reload() }
  }
  async function removeServiceImage(url: string) {
    if (!editing || busy) return
    const slot = new URL(url, window.location.origin).pathname.split("/").at(-1)
    if (!slot || !/^[0-3]$/.test(slot)) return
    setBusy(true); setError("")
    try {
      await api(`/servicos/${editing.id_servico}/imagens/${slot}`, undefined, "DELETE")
      setEditing({ ...editing, imagens: editing.imagens?.filter(image => image !== url) })
      request.reload(); setSuccess("Imagem removida.")
    } catch (caught) { setError((caught as Error).message) }
    finally { setBusy(false) }
  }
  async function mutate(path: string, body: unknown, method = "POST") {
    setBusy(true)
    setError("")
    setSuccess("")
    try {
      const result = await api<Profile>(path, body, method)
      if (kind === "perfil") {
        const session = getSession()
        if (session)
          saveSession({
            ...session,
            usuario: { ...session.usuario, nome: result.nome, foto: result.foto },
          })
      }
      request.reload()
      if (kind === "notificacoes") window.dispatchEvent(new Event("tefreela:notifications"));
      if (kind === "perfil") window.dispatchEvent(new Event("tefreela:account"));
      setSuccess("Alteração salva.")
      return true
    } catch (error) {
      setError((error as Error).message)
      return false
    } finally {
      setBusy(false)
    }
  }
  const title = {
    perfil: "Meu perfil",
    servicos: "Meus serviços",
    portfolio: "Meu portfólio",
    notificacoes: "Notificações",
    creditos: "Créditos acadêmicos",
  }[kind]
  const profile = kind === "perfil" ? request.data as Profile | null : null
  const credits = kind === "creditos" ? request.data as Credits | null : null
  return (
    <AppShell title={title}>
      <div className="page-title-row">
        <Heading as="h2">{title}</Heading>
        <Button variant="ghost" onClick={request.reload}>
          Atualizar
        </Button>
      </div>
      {request.loading && <Skeleton kind={kind === "perfil" ? "profile" : "row"} count={kind === "perfil" ? 1 : 2} />}
      {(request.error || error) && <p role="alert">{request.error || error}</p>}
      {success && <p role="status">{success}</p>}
      {profile && !request.loading && (
        <form
          key={JSON.stringify(profile)}
          className="panel data-form"
          onSubmit={async (event) => {
            event.preventDefault()
            const form = new FormData(event.currentTarget)
            await mutate("/me/perfil", Object.fromEntries(form), "PATCH")
          }}
        >
          <fieldset disabled={busy}>
            <label>
              Nome
              <TextInput
                name="nome"
                required
                maxLength={150}
                defaultValue={profile.nome}
              />
            </label>
            <label>
              Telefone
              <TextInput
                name="telefone"
                maxLength={20}
                defaultValue={profile.telefone || ""}
              />
            </label>
            <label>
              Descrição
              <textarea
                name="descricao"
                maxLength={10000}
                defaultValue={profile.descricao || ""}
              />
            </label>
            <label>
              Cidade
              <TextInput
                name="cidade"
                maxLength={100}
                defaultValue={profile.cidade || ""}
              />
            </label>
            <label>
              UF
              <TextInput
                name="estado"
                maxLength={2}
                minLength={2}
                defaultValue={profile.estado || ""}
              />
            </label>
            <label>
              URL da foto (HTTPS)
              <TextInput
                type="url"
                name="foto"
                defaultValue={profile.foto || ""}
              />
            </label>
            <Button>Salvar perfil</Button>
          </fieldset>
        </form>
      )}
      {kind === "servicos" && (
        <>
          <form
            key={editing?.id_servico || "novo"}
            className="panel data-form"
            onSubmit={async (event) => {
              event.preventDefault()
              const formElement = event.currentTarget
              const form = new FormData(formElement)
              const values = {
                titulo: form.get("titulo"),
                descricao: form.get("descricao"),
                id_categoria: Number(form.get("id_categoria")),
                preco: Number(form.get("preco")),
                prazo_dias: Number(form.get("prazo_dias")),
                status: form.get("status"),
              }
              if (
                await saveService(values)
              ) {
                setEditing(null)
                formElement.reset()
              }
            }}
          >
            <Heading as="h3">
              {editing ? "Editar serviço" : "Publicar serviço"}
            </Heading>
            <p className="form-intro">Mostre o que você faz, escolha a categoria e destaque seu trabalho com imagens.</p>
            <fieldset
              disabled={
                busy || getSession()?.usuario.tipo_usuario !== "freelancer"
              }
            >
              <label>
                Título
                <TextInput
                  name="titulo"
                  required
                  maxLength={150}
                  defaultValue={editing?.titulo}
                />
              </label>
              <label>
                Descrição
                <textarea
                  name="descricao"
                  required
                  maxLength={10000}
                  defaultValue={editing?.descricao}
                />
              </label>
              <label>
                Categoria
                <select
                  name="id_categoria" aria-label="Categoria"
                  required
                  defaultValue={editing?.id_categoria || ""}
                >
                  <option value="">Selecione...</option>
                  {categories.data.map((category) => (
                    <option
                      key={category.id_categoria}
                      value={category.id_categoria}
                    >
                      {categoryName(category)}
                    </option>
                  ))}
                </select>
              </label>
              {categories.error && <p role="alert">{categories.error}</p>}
              <label className="image-upload">
                Imagens do serviço
                <span>Até 4 imagens JPG, PNG ou WebP, de até 5 MB cada. A primeira será a capa. As imagens ficam visíveis no catálogo.</span>
                <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={event => {
                  const files = Array.from(event.target.files || [])
                  if (files.length > 4 || files.some(file => file.size > 5 * 1024 * 1024 || !["image/jpeg", "image/png", "image/webp"].includes(file.type))) {
                    setError("Selecione até 4 imagens JPG, PNG ou WebP de até 5 MB cada."); event.target.value = ""; return
                  }
                  setError(""); setImageFiles(files)
                }} />
              </label>
              <div className="upload-previews">
                {(imageFiles.length ? imagePreviews : editing?.imagens || []).map((url, index) => <figure key={url}><img src={url} alt={`Imagem ${index + 1} do serviço`} /><figcaption>{index === 0 ? "Capa" : `Imagem ${index + 1}`}</figcaption>{!imageFiles.length && <Button type="button" variant="ghost" onClick={() => void removeServiceImage(url)} aria-label={`Remover imagem ${index + 1}`}>Remover</Button>}</figure>)}
              </div>
              {imageFiles.length > 0 && <Button type="button" variant="ghost" onClick={() => setImageFiles([])}>Limpar seleção de imagens</Button>}
              <label>
                Preço em créditos
                <TextInput
                  type="number"
                  name="preco"
                  required
                  min="0"
                  max="1000000"
                  step="0.01"
                  defaultValue={editing?.preco}
                />
              </label>
              <label>
                Prazo em dias
                <TextInput
                  type="number"
                  name="prazo_dias"
                  required
                  min="1"
                  max="365"
                  defaultValue={editing?.prazo_dias}
                />
              </label>
              <label>
                Status
                <select name="status" defaultValue={editing?.status || "ativo"}>
                  <option value="ativo">Ativo</option>
                  <option value="pausado">Pausado</option>
                  <option value="inativo">Inativo</option>
                </select>
              </label>
              <div className="action-row">
                <Button>
                  {editing ? "Salvar alterações" : "Publicar serviço"}
                </Button>
                {editing && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => { setEditing(null); setImageFiles([]); setError("") }}
                  >
                    Cancelar edição
                  </Button>
                )}
              </div>
            </fieldset>
          </form>
          <section className="panel">
            {(request.data as ServiceRecord[] | null)?.map((service) => (
              <article className="my-service" key={service.id_servico}>
                <img src={service.imagens?.[0] || "/service-placeholder.svg"} alt="" />
                <div>
                  <strong>{service.titulo}</strong>
                  <span>
                    {service.status} · {service.prazo_dias} dias
                  </span>
                </div>
                <strong>{money(service.preco)}</strong>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setEditing(service)
                    setImageFiles([])
                    setError("")
                    window.scrollTo({ top: 0, behavior: "smooth" })
                  }}
                >
                  Editar
                </Button>
              </article>
            ))}
            {!request.loading &&
              !(request.data as ServiceRecord[] | null)?.length && (
                <EmptyState title="Seu talento merece ser visto." description="Use o formulário acima para publicar seu primeiro serviço, com descrição, categoria e imagens do seu trabalho." />
              )}
          </section>
        </>
      )}
      {kind === "portfolio" && (
        <>
          <form
            key={editingPortfolio?.id_portfolio || "novo"}
            className="panel data-form"
            onSubmit={async (event) => {
              event.preventDefault()
              const form = event.currentTarget
              if (
                await mutate(
                  editingPortfolio
                    ? `/portfolio/${editingPortfolio.id_portfolio}`
                    : "/portfolio",
                  Object.fromEntries(new FormData(form)),
                  editingPortfolio ? "PATCH" : "POST",
                )
              ) {
                setEditingPortfolio(null)
                form.reset()
              }
            }}
          >
            <Heading as="h3">
              {editingPortfolio ? "Editar trabalho" : "Adicionar trabalho"}
            </Heading>
            <fieldset
              disabled={
                busy || getSession()?.usuario.tipo_usuario !== "freelancer"
              }
            >
              <label>
                Título
                <TextInput
                  name="titulo"
                  required
                  maxLength={150}
                  defaultValue={editingPortfolio?.titulo}
                />
              </label>
              <label>
                Descrição
                <textarea
                  name="descricao"
                  maxLength={10000}
                  defaultValue={editingPortfolio?.descricao}
                />
              </label>
              <label>
                URL da imagem (HTTPS)
                <TextInput
                  type="url"
                  name="imagem"
                  defaultValue={editingPortfolio?.imagem}
                />
              </label>
              <label>
                Link do projeto (HTTPS)
                <TextInput
                  type="url"
                  name="link"
                  defaultValue={editingPortfolio?.link}
                />
              </label>
              <Button>
                {editingPortfolio
                  ? "Salvar alterações"
                  : "Adicionar ao portfólio"}
              </Button>
              {editingPortfolio && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setEditingPortfolio(null)}
                >
                  Cancelar edição
                </Button>
              )}
            </fieldset>
          </form>
          <section className="services-grid">
            {(request.data as Portfolio[] | null)?.map((item) => (
              <article className="panel portfolio-item" key={item.id_portfolio}>
                {item.imagem && (
                  <img
                    className="portfolio-image"
                    src={item.imagem}
                    alt={item.titulo}
                  />
                )}
                <Heading as="h3">{item.titulo}</Heading>
                <p>{item.descricao}</p>
                {item.link && (
                  <a href={item.link} target="_blank" rel="noreferrer">
                    Abrir projeto
                  </a>
                )}
                <Button
                  disabled={busy}
                  variant="secondary"
                  onClick={() => {
                    setEditingPortfolio(item)
                    window.scrollTo({ top: 0, behavior: "smooth" })
                  }}
                >
                  Editar
                </Button>
                <Button
                  disabled={busy}
                  variant="ghost"
                  onClick={() => setRemovingPortfolio(item)}
                >
                  Remover
                </Button>
              </article>
            ))}
          </section>
          {!request.loading &&
            !(request.data as Portfolio[] | null)?.length && (
              <EmptyState title="Todo trabalho tem uma história." description="Adicione seu primeiro projeto ao portfólio e mostre o que você pode criar para seus próximos clientes." />
            )}
        </>
      )}
      {kind === "notificacoes" && !request.loading && <NotificationsPanel items={(request.data as Notification[] | null) || []} busy={busy} onRead={id => void mutate(`/notificacoes/${id}`, {}, "PATCH")} />}
      {credits && (
        <>
          <section className="panel">
            <Heading as="h3">Saldo: {money(credits.saldo)}</Heading>
            <p>
              Créditos acadêmicos de demonstração. Não representam dinheiro
              real.
            </p>
          </section>
          <section className="panel">
            <Heading as="h3">Movimentações</Heading>
            {credits.movimentacoes.map((item) => (
              <div className="order-detail" key={item.id_movimentacao}>
                <strong>
                  {item.tipo} · {money(item.valor)}
                </strong>
                <p>{item.descricao}</p>
                <small>{date(item.criado_em)}</small>
              </div>
            ))}
            {!credits.movimentacoes.length && <p>Sem movimentações.</p>}
          </section>
          <section className="panel">
            <Heading as="h3">Pagamentos</Heading>
            {credits.pagamentos.map((item) => (
              <div className="order-detail" key={item.id_pagamento}>
                <strong>
                  Pedido #{item.id_pedido} · {item.status}
                </strong>
                <p>
                  Valor: {money(item.valor_servico)} · Taxa:{" "}
                  {money(item.valor_taxa)} · Freelancer:{" "}
                  {money(item.valor_freelancer)}
                </p>
              </div>
            ))}
            {!credits.pagamentos.length && <p>Sem pagamentos.</p>}
          </section>
        </>
      )}
      <Modal open={!!removingPortfolio} title="Remover este trabalho?" onClose={() => { if (!busy) setRemovingPortfolio(null) }}><p>O trabalho “{removingPortfolio?.titulo}” será removido do seu portfólio público.</p><div className="action-row"><Button variant="secondary" disabled={busy} onClick={() => setRemovingPortfolio(null)}>Manter trabalho</Button><Button disabled={busy} onClick={async () => { if (removingPortfolio && await mutate(`/portfolio/${removingPortfolio.id_portfolio}`, undefined, "DELETE")) setRemovingPortfolio(null) }}>{busy ? "Removendo..." : "Remover trabalho"}</Button></div></Modal>
    </AppShell>
  )
}
