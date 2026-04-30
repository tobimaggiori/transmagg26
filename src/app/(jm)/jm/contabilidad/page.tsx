/**
 * Página índice del módulo Contabilidad JM. Muestra accesos rápidos a las
 * subsecciones disponibles. Excluye LP/fletero (lp-vs-facturas, viajes-sin-lp).
 */

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { esRolInterno } from "@/lib/permissions"
import Link from "next/link"
import type { Rol } from "@/types"

const SECCIONES = [
  { href: "/jm/contabilidad/cuentas", label: "Cuentas", descripcion: "Cuentas bancarias, billeteras y brokers con saldos" },
  { href: "/jm/contabilidad/iva", label: "IVA", descripcion: "Libro IVA Ventas y Compras con exportación PDF/Excel" },
  { href: "/jm/contabilidad/iibb", label: "IIBB", descripcion: "Listado de viajes por provincia para IIBB" },
  { href: "/jm/contabilidad/gastos", label: "Gastos", descripcion: "Detalle de gastos agrupados por concepto" },
  { href: "/jm/contabilidad/notas-credito-debito", label: "Notas C/D", descripcion: "Notas de crédito y débito emitidas y recibidas" },
  { href: "/jm/contabilidad/chequeras", label: "Chequeras", descripcion: "Cheques propios y cheques recibidos" },
  { href: "/jm/contabilidad/fci", label: "FCI", descripcion: "Fondos Comunes de Inversión" },
  { href: "/jm/contabilidad/impuestos", label: "Impuestos", descripcion: "Pago de impuestos y consulta de pagos" },
  { href: "/jm/contabilidad/percepciones", label: "Percepciones", descripcion: "Generación y consulta de percepciones" },
  { href: "/jm/contabilidad/comprobantes", label: "Comprobantes", descripcion: "Visor de comprobantes" },
  { href: "/jm/contabilidad/reportes", label: "Reportes", descripcion: "Reportes financieros" },
]

export default async function ContabilidadJmPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (!esRolInterno(session.user.rol as Rol)) redirect("/dashboard")

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Contabilidad</h2>
        <p className="text-muted-foreground">Módulo de reportes y gestión contable — Javier Maggiori</p>
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
