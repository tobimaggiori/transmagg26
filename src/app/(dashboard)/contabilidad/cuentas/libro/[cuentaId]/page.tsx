/**
 * Libro de una cuenta: movimientos en tiempo real, saldo corrido, conciliación
 * de días contra el extracto, y cierre/reapertura mensual.
 */

import { auth } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { tienePermiso } from "@/lib/permissions"
import { LibroCuentaDetalle } from "./detalle-client"
import type { Rol } from "@/types"

export default async function LibroCuentaDetallePage({
  params,
}: {
  params: Promise<{ cuentaId: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")
  const rol = (session.user.rol ?? "OPERADOR_TRANSMAGG") as Rol
  if (!(await tienePermiso(session.user.id, rol, "cuentas"))) redirect("/dashboard")

  const { cuentaId } = await params

  const cuenta = await prisma.cuenta.findUnique({
    where: { id: cuentaId },
    select: {
      id: true,
      nombre: true,
      tipo: true,
      moneda: true,
      saldoInicial: true,
      fechaSaldoInicial: true,
      tieneImpuestoDebcred: true,
      alicuotaImpuesto: true,
      tieneIibbSircrebTucuman: true,
      alicuotaIibbSircrebTucuman: true,
      banco: { select: { nombre: true } },
      billetera: { select: { nombre: true } },
      broker: { select: { nombre: true } },
    },
  })
  if (!cuenta) notFound()

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold">{cuenta.nombre}</h1>
        <p className="text-sm text-muted-foreground">
          {cuenta.banco?.nombre ?? cuenta.billetera?.nombre ?? cuenta.broker?.nombre ?? "—"} · {cuenta.moneda} · {cuenta.tipo}
        </p>
      </div>
      <LibroCuentaDetalle
        cuentaId={cuenta.id}
        saldoInicial={cuenta.saldoInicial}
        fechaSaldoInicial={cuenta.fechaSaldoInicial ? cuenta.fechaSaldoInicial.toISOString() : null}
        impuestos={{
          debcred: cuenta.tieneImpuestoDebcred
            ? { alicuota: cuenta.alicuotaImpuesto }
            : null,
          iibbSircreb: cuenta.tieneIibbSircrebTucuman
            ? { alicuota: cuenta.alicuotaIibbSircrebTucuman }
            : null,
        }}
      />
    </div>
  )
}
