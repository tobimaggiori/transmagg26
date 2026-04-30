/**
 * Propósito: Página de resumen mensual de tarjetas de seguros (/aseguradoras/resumen-tarjetas).
 * Server component: carga tarjetas CREDITO y cuentas para el modal de pago.
 */

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { tienePermiso } from "@/lib/permissions"
import { ResumenTarjetasClient } from "./resumen-tarjetas-client"
import type { Rol } from "@/types"

export default async function ResumenTarjetasPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const rol = (session.user.rol ?? "OPERADOR_TRANSMAGG") as Rol
  if (!(await tienePermiso(session.user.id, rol, "aseguradoras"))) redirect("/dashboard")

  const [tarjetas, cuentas] = await Promise.all([
    prisma.tarjeta.findMany({
      where: { activa: true, tipo: "CREDITO" },
      select: { id: true, nombre: true, banco: true, ultimos4: true },
      orderBy: { nombre: "asc" },
    }),
    prisma.cuenta.findMany({
      where: { activa: true },
      select: { id: true, nombre: true, tipo: true },
      orderBy: { nombre: "asc" },
    }),
  ])

  return <ResumenTarjetasClient tarjetas={tarjetas} cuentas={cuentas} />
}
