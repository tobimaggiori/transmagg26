/**
 * Propósito: Barra lateral de navegación principal de Transmagg.
 * Muestra solo las secciones a las que tiene acceso el usuario según su rol.
 * Implementa las reglas de RBAC definidas en permissions.ts.
 */

"use client"

import { NavItem } from "@/components/nav-item"
import { puedeAcceder } from "@/lib/permissions"
import type { Rol } from "@/types"
import {
  LayoutDashboard,
  Truck,
  FileText,
  Receipt,
  Package,
  Calculator,
  MapPin,
  Settings,
  LogOut,
  Route,
  CreditCard,
  Building2,
  ArrowLeftRight,
  FileMinus,
  Warehouse,
} from "lucide-react"

/**
 * Definición de un ítem del menú de navegación lateral.
 */
interface NavItemDef {
  href: string
  label: string
  icon: typeof LayoutDashboard
  /** Clave usada para verificar permisos en PERMISOS_SECCION */
  seccion: string
}

/** Lista completa de ítems de navegación del sistema */
const NAV_ITEMS: NavItemDef[] = [
  {
    href: "/",
    label: "Dashboard",
    icon: LayoutDashboard,
    seccion: "dashboard",
  },
  {
    href: "/viajes",
    label: "Viajes",
    icon: Route,
    seccion: "viajes",
  },
  {
    href: "/mi-flota",
    label: "Mi Flota",
    icon: Warehouse,
    seccion: "mi_flota",
  },
  {
    href: "/liquidaciones",
    label: "Liquidaciones",
    icon: FileText,
    seccion: "liquidaciones",
  },
  {
    href: "/facturas",
    label: "Facturas",
    icon: Receipt,
    seccion: "facturas",
  },
  {
    href: "/notas-credito-debito",
    label: "NC / ND",
    icon: FileMinus,
    seccion: "notas_credito_debito",
  },
  {
    href: "/proveedores",
    label: "Proveedores",
    icon: Package,
    seccion: "proveedores",
  },
  {
    href: "/iva",
    label: "IVA",
    icon: Calculator,
    seccion: "iva",
  },
  {
    href: "/iibb",
    label: "IIBB",
    icon: MapPin,
    seccion: "iibb",
  },
  {
    href: "/cuentas-corrientes",
    label: "Cuentas Corrientes",
    icon: CreditCard,
    seccion: "cuentas_corrientes",
  },
  {
    href: "/cuentas",
    label: "Cuentas",
    icon: Building2,
    seccion: "cuentas",
  },
  {
    href: "/pagos",
    label: "Pagos",
    icon: ArrowLeftRight,
    seccion: "pagos",
  },
  {
    href: "/abm",
    label: "ABM",
    icon: Settings,
    seccion: "abm",
  },
]

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
}

/**
 * Sidebar: SidebarProps -> JSX.Element
 *
 * Dado el rol del usuario, renderiza la barra lateral con solo los ítems de
 * navegación a los que ese rol tiene acceso según PERMISOS_SECCION.
 * Existe para garantizar que cada usuario vea únicamente las secciones
 * permitidas por su rol, centralizando el filtro de UI en un solo lugar.
 *
 * Ejemplos:
 * <Sidebar rol="FLETERO" nombreUsuario="Juan Pérez" emailUsuario="juan@fletero.com" />
 * // => sidebar con Dashboard, Viajes, Liquidaciones
 * <Sidebar rol="ADMIN_TRANSMAGG" nombreUsuario="Admin" emailUsuario="admin@transmagg.com.ar" />
 * // => sidebar con todas las secciones incluyendo ABM y Cuentas Corrientes
 * <Sidebar rol="ADMIN_EMPRESA" emailUsuario="empresa@x.com" />
 * // => sidebar con Dashboard, Viajes, Facturas
 */
export function Sidebar({ rol, nombreUsuario, emailUsuario }: SidebarProps) {
  const itemsVisibles = NAV_ITEMS.filter((item) =>
    puedeAcceder(rol, item.seccion)
  )

  return (
    <aside className="flex h-full w-64 flex-col border-r bg-background">
      {/* Logo y nombre del sistema */}
      <div className="flex h-16 items-center border-b px-6">
        <div className="flex items-center gap-2">
          <Truck className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold">Transmagg</span>
        </div>
      </div>

      {/* Navegación principal */}
      <nav className="flex-1 overflow-auto px-3 py-4">
        <div className="space-y-1">
          {itemsVisibles.map((item) => (
            <NavItem
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
            />
          ))}
        </div>
      </nav>

      {/* Footer con info del usuario */}
      <div className="border-t p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold uppercase">
            {(nombreUsuario ?? emailUsuario ?? "U").charAt(0)}
          </div>
          <div className="flex-1 overflow-hidden">
            {nombreUsuario && (
              <p className="truncate text-sm font-medium">{nombreUsuario}</p>
            )}
            <p className="truncate text-xs text-muted-foreground">
              {emailUsuario}
            </p>
          </div>
          <a
            href="/api/auth/signout"
            className="ml-auto text-muted-foreground hover:text-foreground"
            title="Cerrar sesión"
          >
            <LogOut className="h-4 w-4" />
          </a>
        </div>
      </div>
    </aside>
  )
}
