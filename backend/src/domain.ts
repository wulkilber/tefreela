export function nextOrderStatus(
  role: string,
  current: string,
  next: string,
): boolean {
  const rules: Record<string, Record<string, string[]>> = {
    freelancer: {
      solicitado: ["aceito", "recusado"],
      aceito: ["em_andamento"],
      em_andamento: ["concluido"],
    },
    cliente: { solicitado: ["cancelado"], aceito: ["cancelado"] },
  }
  return !!rules[role]?.[current]?.includes(next)
}
