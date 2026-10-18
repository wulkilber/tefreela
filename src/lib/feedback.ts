export type ToastTone = "success" | "error" | "warning" | "info"
export function notify(message: string, tone: ToastTone = "success") {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("tefreela:toast", { detail: { message, tone } }))
}
