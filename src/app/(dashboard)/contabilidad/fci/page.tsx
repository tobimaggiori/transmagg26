/**
 * Listado de FCIs con saldo actual, última conciliación y alerta de días
 * hábiles sin conciliar.
 */

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { tienePermiso } from "@/lib/permissions"
import type { Rol } from "@/types"
import { contarDiasHabilesEntre } from "@/lib/feriados"
import { FciListadoClient, type FciListado } from "./fci-listado-client"

export default async function FciIndexPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  const rol = session.user.rol as Rol
  if (!(await tienePermiso(session.user.id, rol, "contabilidad.fci"))) redirect("/dashboard")

  const fcis = await prisma.fci.findMany({
    where: { activo: true },
    include: {
      cuenta: { select: { id: true, nombre: true, tipo: true, moneda: true } },
      saldos: { orderBy: { fechaActualizacion: "desc" }, take: 1 },
    },
    orderBy: { nombre: "asc" },
  })

  const hoy = new Date()

  const items: FciListado[] = await Promise.all(
    fcis.map(async (f) => {
      const ultimo = f.saldos[0] ?? null
      const diasSinConciliar = ultimo
        ? Math.max(0, (await contarDiasHabilesEntre(ultimo.fechaActualizacion, hoy)) - 1)
        : null
      return {
        id: f.id,
        nombre: f.nombre,
        moneda: f.moneda,
        cuenta: f.cuenta,
        saldoActual: Number(f.saldoActual),
        saldoInformado: ultimo ? Number(ultimo.saldoInformado) : null,
        fechaUltimaConciliacion: ultimo?.fechaActualizacion.toISOString() ?? null,
        diasSinConciliar,
        diasHabilesAlerta: f.diasHabilesAlerta,
      }
    })
  )

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">FCI</h2>
        <p className="text-sm text-muted-foreground">
          Seleccioná un fondo para conciliar el saldo o registrar suscripciones y rescates.
        </p>
      </div>
      <FciListadoClient items={items} />
    </div>
  )
}
