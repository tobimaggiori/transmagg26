/**
 * Chequeras JM. Listado de cheques recibidos y emitidos.
 */

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prismaJm } from "@/jm/prisma"
import { esRolInterno } from "@/lib/permissions"
import type { Rol } from "@/types"
import { ChequerasJmClient } from "./chequeras-jm-client"

export default async function ChequerasJmPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (!esRolInterno(session.user.rol as Rol)) redirect("/dashboard")

  const [recibidosRaw, emitidosRaw] = await Promise.all([
    prismaJm.chequeRecibido.findMany({
      include: {
        empresa: { select: { id: true, razonSocial: true } },
        proveedorOrigen: { select: { id: true, razonSocial: true } },
        cuentaDeposito: { select: { id: true, nombre: true } },
      },
      orderBy: { fechaCobro: "asc" },
      take: 200,
    }),
    prismaJm.chequeEmitido.findMany({
      include: {
        proveedor: { select: { id: true, razonSocial: true } },
        cuenta: { select: { id: true, nombre: true } },
      },
      orderBy: { fechaPago: "asc" },
      take: 200,
    }),
  ])

  // Serializar Decimal/Date para pasar al client
  const recibidos = recibidosRaw.map((c) => ({
    ...c,
    monto: c.monto.toString(),
    fechaEmision: c.fechaEmision.toISOString(),
    fechaCobro: c.fechaCobro.toISOString(),
    fechaAcreditacion: c.fechaAcreditacion?.toISOString() ?? null,
    fechaDepositoBroker: c.fechaDepositoBroker?.toISOString() ?? null,
    creadoEn: c.creadoEn.toISOString(),
    tasaDescuento: c.tasaDescuento ?? null,
  }))
  const emitidos = emitidosRaw.map((c) => ({
    ...c,
    monto: c.monto.toString(),
    fechaEmision: c.fechaEmision.toISOString(),
    fechaPago: c.fechaPago.toISOString(),
    fechaDeposito: c.fechaDeposito?.toISOString() ?? null,
    creadoEn: c.creadoEn.toISOString(),
  }))

  return <ChequerasJmClient recibidos={recibidos} emitidos={emitidos} />
}
