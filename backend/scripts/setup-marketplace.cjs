// Run from backend/. Credentials are loaded locally and never printed.
require("dotenv").config({ quiet: true })
const { createClient } = require("@supabase/supabase-js")
const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, { auth: { persistSession: false } })
async function setup() {
  const existing = await db.from("categorias").select("*")
  if (existing.error) throw new Error("Não foi possível consultar as categorias.")
  const column = ["nome", "nome_categoria", "titulo"].find(key => existing.data?.some(row => typeof row[key] === "string"))
  if (!column) throw new Error("Coluna de nome das categorias não identificada.")
  const normalize = value => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim()
  const names = ["Design", "Programação", "Marketing", "Redação", "Tradução", "Vídeo e animação", "Fotografia", "Áudio e música", "Consultoria", "Arquitetura", "Engenharia", "Suporte administrativo", "Aulas e tutoria", "Outros"]
  const missing = names.filter(name => !existing.data.some(row => normalize(row[column]) === normalize(name)))
  if (missing.length) {
    const result = await db.from("categorias").insert(missing.map(name => ({ [column]: name })))
    if (result.error) throw new Error("Não foi possível adicionar as categorias. Confira os campos obrigatórios.")
  }
  const bucket = await db.storage.getBucket("servicos-imagens")
  if (bucket.error) {
    const result = await db.storage.createBucket("servicos-imagens", { public: true, fileSizeLimit: 5 * 1024 * 1024, allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"] })
    if (result.error) throw new Error("Não foi possível configurar o armazenamento das imagens.")
  } else if (!bucket.data.public) throw new Error("O bucket existente é privado. Nenhuma configuração foi alterada.")
  console.log(JSON.stringify({ categoriasAdicionadas: missing, armazenamento: "servicos-imagens pronto" }))
}
setup().catch(error => { console.error(error.message); process.exitCode = 1 })
