import { Moon, Sun } from "lucide-react"
import { useTheme } from "../lib/theme"
import { Button } from "./ui"
export default function ThemeToggle(){const {theme,toggleTheme}=useTheme();const label=theme==="dark"?"Ativar modo claro":"Ativar modo escuro";return <Button variant="ghost" type="button" className="theme-toggle" aria-label={label} title={label} onClick={toggleTheme}>{theme==="dark"?<Sun/>:<Moon/>}</Button>}
