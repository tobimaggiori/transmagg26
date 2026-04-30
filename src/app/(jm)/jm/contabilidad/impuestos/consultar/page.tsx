/**
 * Consultar pagos de impuestos JM.
 */

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prismaJm } from "@/jm/prisma"
import { esRolInterno } from "@/lib/permissions"
import type { Rol } from "@/types"
import { ConsultarPagosImpuestoJmClient } from "./consultar-pagos-impuesto-jm-client"

export default async function ConsultarPagosImpuestoJmPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (!esRolInterno(session.user.rol as Rol)) redirect("/dashboard")

  const pagos = await prismaJm.pagoImpuesto.findMany({
    include: { cuenta: { select: { id: true, nombre: true } }, tarjeta: { select: { id: true, nombre: true } } },
    orderBy: { fechaPago: "desc" },
    take: 200,
  })

  const serial = pagos.map((p) => ({
    id: p.id,
    tipoImpuesto: p.tipoImpuesto,
    descripcion: p.descripcion,
    periodo: p.periodo,
    monto: p.monto.toString(),
    fechaPago: p.fechaPago.toISOString(),
    medioPago: p.medioPago,
    observaciones: p.observaciones,
    cuenta: p.cuenta,
    tarjeta: p.tarjeta,
  }))

  return <ConsultarPagosImpuestoJmClient pagosIniciales={serial} />
}
