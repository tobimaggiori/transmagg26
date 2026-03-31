/**
 * Propósito: Página índice del módulo de Contabilidad (ruta /contabilidad).
 * Muestra accesos rápidos a todas las secciones del módulo.
 */

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { puedeAcceder } from "@/lib/permissions"
import Link from "next/link"
import type { Rol } from "@/types"

const SECCIONES = [
  { href: "/contabilidad/cuentas", label: "Cuentas", descripcion: "Cuentas bancarias, billeteras y brokers con saldos" },
  { href: "/contabilidad/iva", label: "IVA", descripcion: "Libro IVA Ventas y Compras con exportación PDF/Excel" },
  { href: "/contabilidad/iibb", label: "IIBB", descripcion: "Listado de viajes por provincia para IIBB" },
  { href: "/contabilidad/gastos", label: "Gastos", descripcion: "Detalle de gastos agrupados por concepto" },
  { href: "/contabilidad/lp-vs-facturas", label: "LP vs Facturas", descripcion: "Comparación de subtotales LP vs facturas emitidas por viaje" },
  { href: "/contabilidad/viajes-sin-lp", label: "Viajes sin LP", descripcion: "Viajes facturados que no tienen liquidación asociada" },
  { href: "/contabilidad/notas-credito-debito", label: "Notas C/D", descripcion: "Notas de crédito y débito emitidas y recibidas" },
]

export default async function ContabilidadPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const rol = (session.user.rol ?? "OPERADOR_EMPRESA") as Rol
  if (!puedeAcceder(rol, "cuentas")) redirect("/dashboard")

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Contabilidad</h2>
        <p className="text-muted-foreground">Módulo de reportes y gestión contable — Transmagg</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SECCIONES.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="block border rounded-lg p-5 hover:bg-accent hover:border-primary/40 transition-colors group"
          >
            <p className="font-semibold text-sm group-hover:text-primary transition-colors">{s.label}</p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{s.descripcion}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
