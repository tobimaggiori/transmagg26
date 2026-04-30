/**
 * FCI JM. Listado de fondos con saldo actual.
 */

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prismaJm } from "@/jm/prisma"
import { esRolInterno } from "@/lib/permissions"
import type { Rol } from "@/types"
import { FciContabilidadJmClient } from "./fci-contabilidad-jm-client"

export default async function FciContabilidadJmPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (!esRolInterno(session.user.rol as Rol)) redirect("/dashboard")

  const fcisRaw = await prismaJm.fci.findMany({
    where: { activo: true },
    include: {
      cuenta: { select: { id: true, nombre: true } },
      saldos: { orderBy: { fechaActualizacion: "desc" }, take: 1 },
      _count: { select: { movimientos: true } },
    },
    orderBy: { nombre: "asc" },
  })

  const fcis = fcisRaw.map((f) => ({
    id: f.id,
    nombre: f.nombre,
    moneda: f.moneda,
    diasHabilesAlerta: f.diasHabilesAlerta,
    saldoActual: f.saldoActual.toString(),
    saldoActualizadoEn: f.saldoActualizadoEn?.toISOString() ?? null,
    cuenta: f.cuenta,
    ultimoSaldoInformado: f.saldos[0] ? {
      saldoInformado: f.saldos[0].saldoInformado.toString(),
      fechaActualizacion: f.saldos[0].fechaActualizacion.toISOString(),
      rendimientoPeriodo: f.saldos[0].rendimientoPeriodo.toString(),
    } : null,
    cantMovimientos: f._count.movimientos,
  }))

  return <FciContabilidadJmClient fcis={fcis} />
}
