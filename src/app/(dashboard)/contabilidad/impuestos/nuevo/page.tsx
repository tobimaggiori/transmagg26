import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { puedeAcceder } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"
import { NuevoPagoImpuestoClient } from "./nuevo-pago-impuesto-client"
import type { Rol } from "@/types"

export default async function NuevoPagoImpuestoPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (!puedeAcceder(session.user.rol as Rol, "cuentas")) redirect("/dashboard")

  const [cuentas, tarjetas] = await Promise.all([
    prisma.cuenta.findMany({
      where: { activa: true },
      select: { id: true, nombre: true, tipo: true },
      orderBy: { nombre: "asc" },
    }),
    prisma.tarjeta.findMany({
      where: { activa: true },
      select: { id: true, nombre: true, banco: true, ultimos4: true, tipo: true },
      orderBy: { nombre: "asc" },
    }),
  ])

  return <NuevoPagoImpuestoClient cuentas={cuentas} tarjetas={tarjetas} />
}
