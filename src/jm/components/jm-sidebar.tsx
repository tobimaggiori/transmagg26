"use client"

/**
 * Sidebar del sistema "Javier Maggiori".
 * Replica el patrón del sidebar de Transmagg (grupos colapsables).
 * Sin sección Fleteros — JM no tiene esa identidad.
 */

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import {
  Building2, ChevronLeft, ChevronDown, ChevronRight,
  LogOut, PanelLeftOpen, Route, Package, BookOpen,
  Settings2, Cog, LayoutDashboard, Truck,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { EmpresaSelector } from "@/components/empresa-selector"

interface JmSidebarProps {
  nombreUsuario?: string
  emailUsuario?: string
  onClose?: () => void
  collapsed?: boolean
  onToggleCollapse?: () => void
}

interface SubItem {
  href: string
  label: string
}

interface NavGroup {
  id: string
  label: string
  icon: LucideIcon
  pathPrefix: string
  items: SubItem[]
}

const NAV_GROUPS: NavGroup[] = [
  {
    id: "empresas",
    label: "Empresas",
    icon: Building2,
    pathPrefix: "/jm/empresas",
    items: [
      { href: "/jm/empresas/facturas",            label: "Facturas" },
      { href: "/jm/empresas/recibos",             label: "Recibos por Cobranza" },
      { href: "/jm/empresas/cuentas-corrientes",  label: "Cuentas Corrientes" },
    ],
  },
  {
    id: "proveedores",
    label: "Proveedores",
    icon: Package,
    pathPrefix: "/jm/proveedores",
    items: [
      { href: "/jm/proveedores/facturas",            label: "Facturas" },
      { href: "/jm/aseguradoras/facturas",           label: "Aseguradoras" },
      { href: "/jm/proveedores/pago",                label: "Registrar Pago" },
      { href: "/jm/proveedores/cuentas-corrientes",  label: "Cuentas Corrientes" },
    ],
  },
  {
    id: "contabilidad",
    label: "Contabilidad",
    icon: BookOpen,
    pathPrefix: "/jm/contabilidad",
    items: [
      { href: "/jm/contabilidad/chequeras", label: "Chequeras" },
      { href: "/jm/contabilidad/cuentas",   label: "Cuentas y Tarjetas" },
      { href: "/jm/contabilidad/fci",       label: "FCI" },
      { href: "/jm/contabilidad/impuestos", label: "Pago de Impuestos" },
      { href: "/jm/contabilidad/reportes",  label: "Reportes" },
    ],
  },
  {
    id: "abm",
    label: "ABM",
    icon: Settings2,
    pathPrefix: "/jm/abm",
    items: [
      { href: "/jm/abm/base-de-datos", label: "Base de datos" },
      { href: "/jm/abm/contabilidad",  label: "Contabilidad" },
      { href: "/jm/mi-flota",          label: "Mi Flota" },
    ],
  },
  {
    id: "configuracion",
    label: "Configuración",
    icon: Cog,
    pathPrefix: "/jm/configuracion",
    items: [
      { href: "/jm/configuracion/arca",  label: "ARCA" },
      { href: "/jm/configuracion/envio", label: "Envío" },
    ],
  },
]

function NavSimpleItem({
  href, label, icon: Icon, pathname, onClose, collapsed,
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
      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors ${
        collapsed ? "justify-center" : ""
      } ${
        isActive
          ? "bg-sidebar-primary/25 text-white"
          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-white"
      }`}
    >
      <Icon className="h-[18px] w-[18px] shrink-0" />
      {!collapsed && <span>{label}</span>}
    </Link>
  )
}

function NavSubItem({ href, label, onClose }: { href: string; label: string; onClose?: () => void }) {
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

export function JmSidebar({
  nombreUsuario,
  emailUsuario,
  onClose,
  collapsed = false,
  onToggleCollapse,
}: JmSidebarProps) {
  const pathname = usePathname()

  const grupoActivoPorRuta =
    NAV_GROUPS.find(
      (g) =>
        pathname.startsWith(g.pathPrefix + "/") ||
        pathname === g.pathPrefix ||
        g.items.some((it) => pathname === it.href || pathname.startsWith(it.href + "/"))
    )?.id ?? null

  const [expandido, setExpandido] = useState<string | null>(grupoActivoPorRuta)

  function renderGrupo(grupo: NavGroup) {
    const Icon = grupo.icon
    const estaExpandido = expandido === grupo.id && !collapsed
    const grupoActivo =
      pathname.startsWith(grupo.pathPrefix + "/") ||
      pathname === grupo.pathPrefix ||
      grupo.items.some((it) => pathname === it.href || pathname.startsWith(it.href + "/"))

    if (collapsed) {
      const firstHref = grupo.items[0]?.href ?? grupo.pathPrefix
      return (
        <Link
          key={grupo.id}
          href={firstHref}
          onClick={onClose}
          title={grupo.label}
          className={`flex items-center justify-center rounded-lg px-3 py-2 text-[13px] font-medium transition-colors ${
            grupoActivo
              ? "bg-sidebar-primary/25 text-white"
              : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-white"
          }`}
        >
          <Icon className="h-[18px] w-[18px] shrink-0" />
        </Link>
      )
    }

    return (
      <div key={grupo.id}>
        <button
          type="button"
          onClick={() => setExpandido(estaExpandido ? null : grupo.id)}
          className={`w-full flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors ${
            grupoActivo
              ? "bg-sidebar-primary/25 text-white"
              : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-white"
          }`}
        >
          <Icon className="h-[18px] w-[18px] shrink-0" />
          <span className="flex-1 text-left">{grupo.label}</span>
          {estaExpandido ? (
            <ChevronDown className="h-3.5 w-3.5 text-sidebar-muted" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 text-sidebar-muted" />
          )}
        </button>
        {estaExpandido && (
          <div className="mt-0.5 space-y-0.5">
            {grupo.items.map((item) => (
              <NavSubItem key={item.href} href={item.href} label={item.label} onClose={onClose} />
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <aside className={`flex h-full flex-col bg-sidebar transition-all duration-200 ${collapsed ? "w-16" : "w-60"}`}>
      <div className="flex h-14 items-center border-b border-sidebar-border px-4">
        <div className={`flex items-center gap-2.5 ${collapsed ? "justify-center w-full" : ""}`}>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary/25 shrink-0">
            <Truck className="h-[18px] w-[18px] text-sidebar-primary" />
          </div>
          {!collapsed && <span className="text-[15px] font-bold text-white tracking-tight">Javier Maggiori</span>}
        </div>
      </div>

      <nav className="flex-1 overflow-auto px-2 py-3">
        <div className="space-y-0.5">
          <NavSimpleItem href="/jm" label="Dashboard" icon={LayoutDashboard} pathname={pathname} onClose={onClose} collapsed={collapsed} />
          <NavSimpleItem href="/jm/viajes" label="Viajes" icon={Route} pathname={pathname} onClose={onClose} collapsed={collapsed} />
          {NAV_GROUPS.map((grupo) => renderGrupo(grupo))}
        </div>
      </nav>

      <div className="border-t border-sidebar-border p-3 space-y-2">
        <EmpresaSelector collapsed={collapsed} />

        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="hidden md:flex w-full items-center justify-center gap-2 rounded-lg px-2 py-1.5 text-xs text-sidebar-muted hover:bg-sidebar-accent hover:text-white transition-colors"
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

        <div className={`flex items-center ${collapsed ? "justify-center" : "gap-3"}`}>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-primary text-sidebar-primary-foreground text-xs font-semibold uppercase shrink-0">
            {(nombreUsuario ?? emailUsuario ?? "U").charAt(0)}
          </div>
          {!collapsed && (
            <div className="flex-1 overflow-hidden">
              {nombreUsuario && <p className="truncate text-sm font-medium text-white">{nombreUsuario}</p>}
              <p className="truncate text-xs text-sidebar-muted">{emailUsuario}</p>
            </div>
          )}
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className={`text-sidebar-muted hover:text-white transition-colors ${collapsed ? "mt-2" : "ml-auto"}`}
            title="Cerrar sesión"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
