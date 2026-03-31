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
type NavSubItemProps = { href: string; label: string }

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
export function NavSubItem({ href, label }: NavSubItemProps) {
  const pathname = usePathname()
  const isActive = pathname === href || pathname.startsWith(href + "/")
  return (
    <Link
      href={href}
      className={`block pl-10 pr-3 py-1.5 text-sm rounded-md transition-colors ${
        isActive
          ? "bg-primary/20 text-white font-medium"
          : "text-slate-300 hover:bg-white/10 hover:text-white"
      }`}
    >
      {label}
    </Link>
  )
}
