/**
 * Propósito: Sub-ítem de navegación para grupos colapsables de la barra lateral.
 * Renderiza un enlace indentado que se resalta cuando la ruta actual coincide.
 */

"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

/**
 * Props del componente NavSubItem.
 */
type NavSubItemProps = { href: string; label: string; onClose?: () => void }

/**
 * NavSubItem: NavSubItemProps -> JSX.Element
 *
 * Dado href y label, renderiza un enlace de sub-navegación con indentación
 * que se resalta cuando la ruta actual coincide con href.
 * Existe para encapsular la lógica de activación de sub-ítems dentro de los
 * grupos colapsables de la barra lateral, sin duplicar usePathname.
 *
 * Ejemplos:
 * <NavSubItem href="/empresas/facturar" label="Facturar" />
 * // => enlace activo si pathname === "/empresas/facturar"
 * <NavSubItem href="/fleteros/liquidar" label="Liquidar" />
 * // => enlace inactivo si pathname !== "/fleteros/liquidar"
 */
export function NavSubItem({ href, label, onClose }: NavSubItemProps) {
  const pathname = usePathname()
  const isActive = pathname === href || pathname.startsWith(href + "/")
  return (
    <Link
      href={href}
      onClick={onClose}
      className={`block pl-10 pr-3 py-1.5 text-[13px] rounded-md transition-colors ${
        isActive
          ? "bg-sidebar-primary/25 text-white font-medium"
          : "text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      }`}
    >
      {label}
    </Link>
  )
}
