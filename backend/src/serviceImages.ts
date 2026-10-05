import { supabaseAdmin as db } from "./config/supabase.js"

export const imageBucket = "servicos-imagens"
export const imageLimit = 5 * 1024 * 1024
const cache = new Map<string, { expires: number; images: string[] }>()
export function imageType(bytes: Buffer): string | null {
  if (bytes.length < 12) return null
  if (bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) return "image/png"
  if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return "image/jpeg"
  if (bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP") return "image/webp"
  return null
}
export function imageFolder(service: { id_freelancer: string; id_servico: number }) {
  return `${service.id_freelancer}/${service.id_servico}`
}
export function invalidateImages(folder: string) { cache.delete(folder) }
export async function withImages<T extends { id_freelancer: string; id_servico: number }>(service: T) {
  const folder = imageFolder(service)
  const saved = cache.get(folder)
  if (saved && saved.expires > Date.now()) return { ...service, imagens: saved.images }
  const { data, error } = await db.storage.from(imageBucket).list(folder, { limit: 10, sortBy: { column: "name", order: "asc" } })
  // Existing catalog remains available if Storage is temporarily unavailable.
  const images = error ? [] : (data || []).filter(file => /^[0-3]$/.test(file.name) && file.id).map(file =>
    `${db.storage.from(imageBucket).getPublicUrl(`${folder}/${file.name}`).data.publicUrl}?v=${encodeURIComponent(file.updated_at || file.id || "")}`)
  if (!error) {
    if (cache.size >= 1000) cache.clear()
    cache.set(folder, { expires: Date.now() + 60000, images })
  }
  return { ...service, imagens: images }
}
export async function attachImages<T extends { id_freelancer: string; id_servico: number }>(services: T[]) {
  const result = [] as Awaited<ReturnType<typeof withImages<T>>>[]
  for (let offset = 0; offset < services.length; offset += 8) {
    result.push(...await Promise.all(services.slice(offset, offset + 8).map(withImages)))
  }
  return result
}
