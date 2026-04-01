/**
 * Propósito: Barra lateral de navegación principal de Transmagg.
 * Muestra solo las secciones a las que tiene acceso el usuario según su rol.
 * Implementa las reglas de RBAC definidas en permissions.ts con grupos colapsables.
 */

"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { NavSubItem } from "@/components/nav-sub-item"
import { puedeAcceder } from "@/lib/permissions"
import type { Rol } from "@/types"
import {
  LayoutDashboard,
  Truck,
  Package,
  Route,
  Settings2,
  Warehouse,
  Building2,
  BookOpen,
  LogOut,
  ChevronDown,
  ChevronRight,
  ShieldAlert,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

/**
 * Props del componente Sidebar.
 */
interface SidebarProps {
  /** Rol del usuario autenticado para filtrar las secciones accesibles */
  rol: Rol
  /** Nombre del usuario para mostrar en el pie del sidebar */
  nombreUsuario?: string
  /** Email del usuario autenticado */
  emailUsuario?: string
  /** Cuando es true, muestra solo "Mi Panel" (chofer empleado de Transmagg) */
  esChoferTransmagg?: boolean
  /** Cuando es false y el rol es ADMIN_TRANSMAGG, muestra alerta de config ARCA incompleta */
  arcaActiva?: boolean
}

/**
 * Definición de un sub-ítem dentro de un grupo colapsable.
 */
interface SubItem {
  href: string
  label: string
}

/**
 * Definición de un grupo colapsable de navegación.
 */
interface NavGroup {
  id: string
  label: string
  icon: LucideIcon
  /** Clave de sección usada en puedeAcceder para decidir visibilidad */
  seccion: string
  /** Prefijo de ruta para detectar si el grupo está activo */
  pathPrefix: string
  items: SubItem[]
}

/** Grupos colapsables de navegación */
const NAV_GROUPS: NavGroup[] = [
  {
    id: "empresas",
    label: "Empresas",
    icon: Building2,
    seccion: "facturas",
    pathPrefix: "/empresas",
    items: [
      { href: "/empresas/facturar", label: "Facturar" },
      { href: "/empresas/facturas", label: "Consultar Facturas" },
      { href: "/empresas/cuentas-corrientes", label: "Cuentas Corrientes" },
    ],
  },
  {
    id: "fleteros",
    label: "Fleteros",
    icon: Truck,
    seccion: "liquidaciones",
    pathPrefix: "/fleteros",
    items: [
      { href: "/fleteros/liquidos-productos", label: "Líquidos Productos" },
      { href: "/fleteros/ordenes-de-pago",    label: "Órdenes de Pago" },
      { href: "/fleteros/gastos-adelantos",   label: "Gastos y Adelantos" },
      { href: "/fleteros/cuentas-corrientes", label: "Cuentas Corrientes" },
    ],
  },
  {
    id: "proveedores",
    label: "Proveedores",
    icon: Package,
    seccion: "proveedores",
    pathPrefix: "/proveedores",
    items: [
      { href: "/proveedores/factura", label: "Ingresar Factura" },
      { href: "/proveedores/facturas", label: "Consultar Facturas" },
      { href: "/proveedores/pago", label: "Registrar Pago" },
      { href: "/proveedores/cuentas-corrientes", label: "Cuentas Corrientes" },
    ],
  },
  {
    id: "contabilidad",
    label: "Contabilidad",
    icon: BookOpen,
    seccion: "cuentas",
    pathPrefix: "/contabilidad",
    items: [
      { href: "/contabilidad/cuentas", label: "Cuentas" },
      { href: "/contabilidad/chequeras", label: "Chequeras" },
      { href: "/contabilidad/tarjetas", label: "Tarjetas" },
      { href: "/contabilidad/iva", label: "IVA" },
      { href: "/contabilidad/iibb", label: "IIBB" },
      { href: "/contabilidad/gastos", label: "Gastos" },
      { href: "/contabilidad/movimientos", label: "Movimientos" },
      { href: "/contabilidad/lp-vs-facturas", label: "LP vs Facturas" },
      { href: "/contabilidad/viajes-sin-lp", label: "Viajes sin LP" },
      { href: "/contabilidad/notas-credito-debito", label: "Notas C/D" },
    ],
  },
]

/**
 * NavSimpleItem: { href, label, icon, pathname } -> JSX.Element
 *
 * Renderiza un ítem simple de navegación adaptado al fondo oscuro del sidebar.
 */
function NavSimpleItem({
  href,
  label,
  icon: Icon,
  pathname,
}: {
  href: string
  label: string
  icon: LucideIcon
  pathname: string
}) {
  const isActive = pathname === href || pathname.startsWith(href + "/")
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
        isActive
          ? "bg-primary/20 text-white"
          : "text-slate-200 hover:bg-white/10 hover:text-white"
      }`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span>{label}</span>
    </Link>
  )
}

/**
 * Sidebar: SidebarProps -> JSX.Element
 *
 * Dado el rol del usuario, renderiza la barra lateral con navegación agrupada y
 * colapsable. Solo muestra grupos e ítems accesibles según PERMISOS_SECCION.
 * Los grupos con sub-ruta activa se expanden automáticamente al cargar la página.
 * Existe para garantizar que cada usuario vea únicamente las secciones
 * permitidas por su rol, centralizando el filtro de UI en un solo lugar.
 *
 * Ejemplos:
 * <Sidebar rol="FLETERO" nombreUsuario="Juan Pérez" emailUsuario="juan@fletero.com" />
 * // => sidebar con Dashboard, grupo Fleteros expandido, Mi Flota
 * <Sidebar rol="ADMIN_TRANSMAGG" nombreUsuario="Admin" emailUsuario="admin@transmagg.com.ar" />
 * // => sidebar con todos los grupos y ítems simples
 * <Sidebar rol="ADMIN_EMPRESA" emailUsuario="empresa@x.com" />
 * // => sidebar con Dashboard, grupo Empresas
 */
export function Sidebar({ rol, nombreUsuario, emailUsuario, esChoferTransmagg, arcaActiva = true }: SidebarProps) {
  const pathname = usePathname()

  // Determine which group (if any) is currently active based on pathname
  const grupoActivoPorRuta =
    NAV_GROUPS.find(
      (g) => pathname.startsWith(g.pathPrefix + "/") || pathname === g.pathPrefix
    )?.id ?? null

  const [expandido, setExpandido] = useState<string | null>(grupoActivoPorRuta)

  // Viajes is shown as top-level only for roles that don't have the Fleteros group
  const tieneGrupoFleteros = puedeAcceder(rol, "liquidaciones")

  return (
    <aside className="flex h-full w-64 flex-col bg-sidebar">
      {/* Logo y nombre del sistema */}
      <div className="flex h-16 items-center border-b border-white/10 px-6">
        <div className="flex items-center gap-2">
          <Truck className="h-6 w-6 text-primary-foreground" />
          <span className="text-lg font-bold text-white">Transmagg</span>
        </div>
      </div>

      {/* Navegación principal */}
      <nav className="flex-1 overflow-auto px-3 py-4">
        <div className="space-y-1">
          {/* Sidebar minimalista para chofer empleado de Transmagg */}
          {esChoferTransmagg ? (
            <NavSimpleItem
              href="/dashboard"
              label="Mi Panel"
              icon={LayoutDashboard}
              pathname={pathname}
            />
          ) : (
          <>
          {/* Dashboard — siempre visible */}
          {puedeAcceder(rol, "dashboard") && (
            <NavSimpleItem
              href="/dashboard"
              label="Dashboard"
              icon={LayoutDashboard}
              pathname={pathname}
            />
          )}

          {/* Grupos colapsables */}
          {NAV_GROUPS.map((grupo) => {
            if (!puedeAcceder(rol, grupo.seccion)) return null
            const Icon = grupo.icon
            const estaExpandido = expandido === grupo.id
            const grupoActivo =
              pathname.startsWith(grupo.pathPrefix + "/") ||
              pathname === grupo.pathPrefix ||
              // También activo si algún sub-item es la ruta actual
              grupo.items.some(
                (it) => pathname === it.href || pathname.startsWith(it.href + "/")
              )

            return (
              <div key={grupo.id}>
                {/* Cabecera del grupo */}
                <button
                  type="button"
                  onClick={() =>
                    setExpandido(estaExpandido ? null : grupo.id)
                  }
                  className={`w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    grupoActivo
                      ? "bg-primary/20 text-white"
                      : "text-slate-200 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1 text-left">{grupo.label}</span>
                  {estaExpandido ? (
                    <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                  )}
                </button>

                {/* Sub-ítems del grupo */}
                {estaExpandido && (
                  <div className="mt-0.5 space-y-0.5">
                    {grupo.items.map((item) => (
                      <NavSubItem key={item.href} href={item.href} label={item.label} />
                    ))}
                  </div>
                )}
              </div>
            )
          })}

          {/* Viajes — solo para roles sin grupo Fleteros */}
          {!tieneGrupoFleteros && puedeAcceder(rol, "viajes") && (
            <NavSimpleItem
              href="/viajes"
              label="Viajes"
              icon={Route}
              pathname={pathname}
            />
          )}

          {/* ABM */}
          {puedeAcceder(rol, "abm") && (
            <>
              <NavSimpleItem
                href="/abm"
                label="ABM"
                icon={Settings2}
                pathname={pathname}
              />
              {/* Alerta ARCA para ADMIN_TRANSMAGG cuando config está incompleta */}
              {rol === "ADMIN_TRANSMAGG" && !arcaActiva && (
                <a
                  href="/abm?tab=arca"
                  className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs text-yellow-300 bg-yellow-500/10 hover:bg-yellow-500/20 transition-colors ml-2"
                >
                  <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
                  <span>Config ARCA incompleta</span>
                </a>
              )}
            </>
          )}

          {/* Mi Flota — roles internos y FLETERO */}
          {puedeAcceder(rol, "mi_flota") && (
            <NavSimpleItem
              href="/mi-flota"
              label="Mi Flota"
              icon={Warehouse}
              pathname={pathname}
            />
          )}
          </>
          )}
        </div>
      </nav>

      {/* Footer con info del usuario */}
      <div className="border-t border-white/10 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold uppercase">
            {(nombreUsuario ?? emailUsuario ?? "U").charAt(0)}
          </div>
          <div className="flex-1 overflow-hidden">
            {nombreUsuario && (
              <p className="truncate text-sm font-medium text-white">{nombreUsuario}</p>
            )}
            <p className="truncate text-xs text-slate-400">
              {emailUsuario}
            </p>
          </div>
          <a
            href="/api/auth/signout"
            className="ml-auto text-slate-400 hover:text-white transition-colors"
            title="Cerrar sesión"
          >
            <LogOut className="h-4 w-4" />
          </a>
        </div>
      </div>
    </aside>
  )
}
