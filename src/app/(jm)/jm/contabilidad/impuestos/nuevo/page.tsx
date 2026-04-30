/**
 * Nuevo pago de impuesto JM.
 */

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prismaJm } from "@/jm/prisma"
import { esRolInterno } from "@/lib/permissions"
import type { Rol } from "@/types"
import { NuevoPagoImpuestoJmClient } from "./nuevo-pago-impuesto-jm-client"

export default async function NuevoPagoImpuestoJmPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (!esRolInterno(session.user.rol as Rol)) redirect("/dashboard")

  const [cuentas, tarjetas] = await Promise.all([
    prismaJm.cuenta.findMany({ where: { activa: true }, select: { id: true, nombre: true }, orderBy: { nombre: "asc" } }),
    prismaJm.tarjeta.findMany({ where: { activa: true }, select: { id: true, nombre: true }, orderBy: { nombre: "asc" } }),
  ])

  return <NuevoPagoImpuestoJmClient cuentas={cuentas} tarjetas={tarjetas} />
}
