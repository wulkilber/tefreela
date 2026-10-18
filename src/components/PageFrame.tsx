import { useEffect } from "react"
import { Outlet, useLocation } from "react-router"

export default function PageFrame() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      if (hash) {
        let id = hash.slice(1)
        try { id = decodeURIComponent(id) } catch { /* Keep malformed fragments harmless. */ }
        document.getElementById(id)?.scrollIntoView({ behavior: "instant", block: "start" })
      } else window.scrollTo({ top: 0, behavior: "instant" })
    })
    return () => cancelAnimationFrame(frame)
  }, [pathname, hash])
  return <Outlet />
}
