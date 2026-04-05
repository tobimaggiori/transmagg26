/**
 * Propósito: Barra lateral de navegación principal de Transmagg.
 * Muestra solo las secciones a las que tiene acceso el usuario según su rol.
 * Soporta modo colapsado (solo íconos) en desktop.
 */

"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { NavSubItem } from "@/components/nav-sub-item"
import { puedeAcceder } from "@/lib/permissions"
import type { Rol } from "@/types"
import {
  LayoutDashboard,
  Truck,
  Package,
  Route,
  Settings2,
  Building2,
  BookOpen,
  LogOut,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  ShieldAlert,
  Shield,
  Cog,
  PanelLeftOpen,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

interface SidebarProps {
  rol: Rol
  nombreUsuario?: string
  emailUsuario?: string
  esChoferTransmagg?: boolean
  arcaActiva?: boolean
  permisos?: string[]
  onClose?: () => void
  collapsed?: boolean
  onToggleCollapse?: () => void
}

interface SubItem {
  href: string
  label: string
  seccion?: string
}

interface NavGroup {
  id: string
  label: string
  icon: LucideIcon
  seccion: string
  pathPrefix: string
  items: SubItem[]
}

const NAV_GROUPS: NavGroup[] = [
  {
    id: "empresas",
    label: "Empresas",
    icon: Building2,
    seccion: "facturas",
    pathPrefix: "/empresas",
    items: [
      { href: "/empresas/facturas",           label: "Facturas",             seccion: "empresas.facturas" },
      { href: "/empresas/recibos",            label: "Recibos por Cobranza", seccion: "empresas.recibos" },
      { href: "/empresas/cuentas-corrientes", label: "Cuentas Corrientes",   seccion: "empresas.cuentas_corrientes" },
    ],
  },
  {
    id: "fleteros",
    label: "Fleteros",
    icon: Truck,
    seccion: "liquidaciones",
    pathPrefix: "/fleteros",
    items: [
      { href: "/fleteros/liquidos-productos", label: "Líquidos Productos",   seccion: "fleteros.liquidos_productos" },
      { href: "/fleteros/ordenes-de-pago",    label: "Órdenes de Pago",      seccion: "fleteros.ordenes_pago" },
      { href: "/fleteros/gastos-adelantos",   label: "Gastos y Adelantos",   seccion: "fleteros.gastos_adelantos" },
      { href: "/fleteros/cuentas-corrientes", label: "Cuentas Corrientes",   seccion: "fleteros.cuentas_corrientes" },
    ],
  },
  {
    id: "proveedores",
    label: "Proveedores",
    icon: Package,
    seccion: "proveedores",
    pathPrefix: "/proveedores",
    items: [
      { href: "/proveedores/facturas",           label: "Facturas",           seccion: "proveedores.facturas" },
      { href: "/proveedores/pago",               label: "Registrar Pago",     seccion: "proveedores.pagos" },
      { href: "/proveedores/cuentas-corrientes", label: "Cuentas Corrientes", seccion: "proveedores.cuentas_corrientes" },
    ],
  },
  {
    id: "aseguradoras",
    label: "Aseguradoras",
    icon: Shield,
    seccion: "aseguradoras",
    pathPrefix: "/aseguradoras",
    items: [
      { href: "/aseguradoras/facturas", label: "Facturas y Pólizas", seccion: "aseguradoras" },
    ],
  },
  {
    id: "contabilidad",
    label: "Contabilidad",
    icon: BookOpen,
    seccion: "cuentas",
    pathPrefix: "/contabilidad",
    items: [
      { href: "/contabilidad/reportes",  label: "Reportes",   seccion: "contabilidad.reportes" },
      { href: "/contabilidad/chequeras", label: "Chequeras",  seccion: "contabilidad.reportes" },
      { href: "/contabilidad/tarjetas",  label: "Tarjetas",   seccion: "contabilidad.reportes" },
      { href: "/contabilidad/cuentas",   label: "Cuentas",    seccion: "contabilidad.reportes" },
      { href: "/contabilidad/notas-credito-debito", label: "Notas C/D", seccion: "contabilidad.reportes" },
      { href: "/contabilidad/impuestos",     label: "Impuestos",     seccion: "contabilidad.impuestos" },
      { href: "/contabilidad/percepciones", label: "Percepciones", seccion: "contabilidad.reportes" },
    ],
  },
  {
    id: "abm",
    label: "ABM",
    icon: Settings2,
    seccion: "abm",
    pathPrefix: "/abm/base-de-datos",
    items: [
      { href: "/abm/base-de-datos", label: "Base de datos", seccion: "" },
      { href: "/abm/contabilidad",  label: "Contabilidad",  seccion: "" },
      { href: "/mi-flota",          label: "Mi Flota",      seccion: "" },
    ],
  },
  {
    id: "configuracion",
    label: "Configuración",
    icon: Cog,
    seccion: "abm",
    pathPrefix: "/abm/arca",
    items: [
      { href: "/abm/arca", label: "ARCA", seccion: "" },
      { href: "/abm/otp",  label: "OTP",  seccion: "" },
    ],
  },
]

function NavSimpleItem({
  href,
  label,
  icon: Icon,
  pathname,
  onClose,
  collapsed,
}: {
  href: string
  label: string
  icon: LucideIcon
  pathname: string
  onClose?: () => void
  collapsed?: boolean
}) {
  const isActive = pathname === href || pathname.startsWith(href + "/")
  return (
    <Link
      href={href}
      onClick={onClose}
      title={collapsed ? label : undefined}
      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
        collapsed ? "justify-center" : ""
      } ${
        isActive
          ? "bg-primary/20 text-white"
          : "text-slate-200 hover:bg-white/10 hover:text-white"
      }`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {!collapsed && <span>{label}</span>}
    </Link>
  )
}

export function Sidebar({ rol, nombreUsuario, emailUsuario, esChoferTransmagg, arcaActiva = true, permisos, onClose, collapsed = false, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname()

  const grupoActivoPorRuta =
    NAV_GROUPS.find(
      (g) =>
        pathname.startsWith(g.pathPrefix + "/") ||
        pathname === g.pathPrefix ||
        g.items.some((it) => pathname === it.href || pathname.startsWith(it.href + "/"))
    )?.id ?? null

  const [expandido, setExpandido] = useState<string | null>(grupoActivoPorRuta)

  function filtrarItems(items: SubItem[]): SubItem[] {
    if (rol !== "OPERADOR_TRANSMAGG" || !permisos) return items
    return items.filter(item => !item.seccion || item.seccion === "" || permisos.includes(item.seccion))
  }

  function renderGrupo(grupo: NavGroup) {
    if (!puedeAcceder(rol, grupo.seccion)) return null

    const itemsVisibles = filtrarItems(grupo.items)
    if (rol === "OPERADOR_TRANSMAGG" && permisos && itemsVisibles.length === 0) return null

    const Icon = grupo.icon
    const estaExpandido = expandido === grupo.id && !collapsed
    const grupoActivo =
      pathname.startsWith(grupo.pathPrefix + "/") ||
      pathname === grupo.pathPrefix ||
      itemsVisibles.some(
        (it) => pathname === it.href || pathname.startsWith(it.href + "/")
      )

    if (collapsed) {
      // In collapsed mode, render the group icon as a link to the first sub-item
      const firstHref = itemsVisibles[0]?.href ?? grupo.pathPrefix
      return (
        <Link
          key={grupo.id}
          href={firstHref}
          onClick={onClose}
          title={grupo.label}
          className={`flex items-center justify-center rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            grupoActivo
              ? "bg-primary/20 text-white"
              : "text-slate-200 hover:bg-white/10 hover:text-white"
          }`}
        >
          <Icon className="h-4 w-4 shrink-0" />
        </Link>
      )
    }

    return (
      <div key={grupo.id}>
        <button
          type="button"
          onClick={() => setExpandido(estaExpandido ? null : grupo.id)}
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
        {estaExpandido && (
          <div className="mt-0.5 space-y-0.5">
            {itemsVisibles.map((item) => (
              <NavSubItem key={item.href} href={item.href} label={item.label} onClose={onClose} />
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <aside className={`flex h-full flex-col bg-sidebar transition-all duration-200 ${collapsed ? "w-16" : "w-64"}`}>
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-white/10 px-4">
        <div className={`flex items-center gap-2 ${collapsed ? "justify-center w-full" : ""}`}>
          <Truck className="h-6 w-6 text-primary-foreground shrink-0" />
          {!collapsed && <span className="text-lg font-bold text-white">Transmagg</span>}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-auto px-2 py-4">
        <div className="space-y-1">
          {esChoferTransmagg ? (
            <NavSimpleItem href="/dashboard" label="Mi Panel" icon={LayoutDashboard} pathname={pathname} onClose={onClose} collapsed={collapsed} />
          ) : (
          <>
          {puedeAcceder(rol, "dashboard") && (
            <NavSimpleItem href="/dashboard" label="Dashboard" icon={LayoutDashboard} pathname={pathname} onClose={onClose} collapsed={collapsed} />
          )}

          {puedeAcceder(rol, "viajes") && (
            <NavSimpleItem href="/fleteros/viajes" label="Viajes" icon={Route} pathname={pathname} onClose={onClose} collapsed={collapsed} />
          )}

          {NAV_GROUPS.map((grupo) => renderGrupo(grupo))}

          {!collapsed && rol === "ADMIN_TRANSMAGG" && !arcaActiva && (
            <a
              href="/abm/arca"
              className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs text-yellow-300 bg-yellow-500/10 hover:bg-yellow-500/20 transition-colors ml-2"
            >
              <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
              <span>Config ARCA incompleta</span>
            </a>
          )}
          </>
          )}
        </div>
      </nav>

      {/* Footer */}
      <div className="border-t border-white/10 p-3 space-y-2">
        {/* Collapse toggle — only visible on desktop */}
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="hidden md:flex w-full items-center justify-center gap-2 rounded-lg px-2 py-1.5 text-xs text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
            title={collapsed ? "Expandir menú" : "Colapsar menú"}
          >
            {collapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4" />
                <span>Colapsar</span>
              </>
            )}
          </button>
        )}

        {/* User info */}
        <div className={`flex items-center ${collapsed ? "justify-center" : "gap-3"}`}>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold uppercase shrink-0">
            {(nombreUsuario ?? emailUsuario ?? "U").charAt(0)}
          </div>
          {!collapsed && (
            <div className="flex-1 overflow-hidden">
              {nombreUsuario && (
                <p className="truncate text-sm font-medium text-white">{nombreUsuario}</p>
              )}
              <p className="truncate text-xs text-slate-400">{emailUsuario}</p>
            </div>
          )}
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className={`text-slate-400 hover:text-white transition-colors ${collapsed ? "mt-2" : "ml-auto"}`}
            title="Cerrar sesión"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
