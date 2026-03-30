/**
 * Propósito: Componente de ítem de navegación para la barra lateral de Transmagg.
 * Renderiza un enlace con ícono y etiqueta, resaltando el ítem activo según la ruta actual.
 */

"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

/**
 * Props del componente NavItem.
 */
interface NavItemProps {
  /** Ruta del enlace */
  href: string
  /** Etiqueta de texto del ítem */
  label: string
  /** Componente de ícono de lucide-react */
  icon: LucideIcon
}

/**
 * NavItem: NavItemProps -> JSX.Element
 *
 * Dados href, label e icon, renderiza un enlace de navegación con ícono
 * que se resalta visualmente cuando la ruta actual coincide con href.
 * Existe para encapsular la lógica de activación del ítem activo en la
 * barra lateral, evitando duplicar usePathname en cada enlace.
 *
 * Ejemplos:
 * <NavItem href="/fleteros" label="Fleteros" icon={Truck} />
 * // => enlace con estilo activo si pathname === "/fleteros"
 * <NavItem href="/viajes" label="Viajes" icon={Route} />
 * // => enlace con estilo activo si pathname startsWith "/viajes/"
 * <NavItem href="/admin" label="Admin" icon={Settings} />
 * // => enlace con estilo inactivo si pathname !== "/admin" ni startsWith "/admin/"
 */
export function NavItem({ href, label, icon: Icon }: NavItemProps) {
  const pathname = usePathname()
  const isActive = pathname === href || pathname.startsWith(href + "/")

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        isActive
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span>{label}</span>
    </Link>
  )
}
