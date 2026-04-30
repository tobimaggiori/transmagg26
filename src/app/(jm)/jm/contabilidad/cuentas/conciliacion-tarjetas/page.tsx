/**
 * Conciliación de tarjetas JM. Listado de resúmenes.
 */

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prismaJm } from "@/jm/prisma"
import { esRolInterno } from "@/lib/permissions"
import type { Rol } from "@/types"
import { ConciliacionTarjetasJmClient } from "./conciliacion-tarjetas-jm-client"

export default async function ConciliacionTarjetasJmPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (!esRolInterno(session.user.rol as Rol)) redirect("/dashboard")

  const resumenesRaw = await prismaJm.resumenTarjeta.findMany({
    include: { tarjeta: { select: { id: true, nombre: true, banco: true } } },
    orderBy: { fechaVtoPago: "desc" },
    take: 200,
  })

  const resumenes = resumenesRaw.map((r) => ({
    id: r.id,
    periodo: r.periodo,
    periodoDesde: r.periodoDesde?.toISOString() ?? null,
    periodoHasta: r.periodoHasta?.toISOString() ?? null,
    fechaVtoPago: r.fechaVtoPago.toISOString(),
    totalARS: r.totalARS.toString(),
    totalUSD: r.totalUSD?.toString() ?? null,
    pagado: r.pagado,
    estado: r.estado,
    tarjeta: r.tarjeta,
  }))

  return <ConciliacionTarjetasJmClient resumenes={resumenes} />
}
