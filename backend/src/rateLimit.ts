import type { RequestHandler } from "express"
export default function rateLimit(
  limit: number,
  windowMs: number,
): RequestHandler {
  const hits = new Map<string, {
    count: number
    end: number
  }>()
  return (req, res, next) => {
    const now = Date.now()
    for (const [key, value] of hits) if (value.end <= now) hits.delete(key)
    const key = req.ip || "unknown"
    const value = hits.get(key) || { count: 0, end: now + windowMs }
    if (hits.size >= 10000 && !hits.has(key)) {
      res
        .status(429)
        .json({ erro: "Muitas solicitações. Tente novamente mais tarde." })
      return
    }
    value.count++
    hits.set(key, value)
    if (value.count > limit) {
      res.setHeader("Retry-After", String(Math.ceil((value.end - now) / 1000)))
      res
        .status(429)
        .json({ erro: "Muitas solicitações. Tente novamente mais tarde." })
      return
    }
    next()
  }
}
