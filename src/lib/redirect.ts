export function afterLogin(from: unknown, role: string) {
  // Only internal protected routes are accepted; never navigate to an external URL.
  if (typeof from === "string" && /^\/app(?:\/|\?|$)/.test(from) && !/[\\\r\n]/.test(from)) return from
  return role === "cliente" ? "/app/cliente" : "/app"
}
