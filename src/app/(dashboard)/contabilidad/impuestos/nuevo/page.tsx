import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { tienePermiso } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"
import { NuevoPagoImpuestoClient } from "./nuevo-pago-impuesto-client"
import type { Rol } from "@/types"

export default async function NuevoPagoImpuestoPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (!(await tienePermiso(session.user.id, session.user.rol as Rol, "cuentas"))) redirect("/dashboard")

  const cuentas = await prisma.cuenta.findMany({
    where: { activa: true },
    select: { id: true, nombre: true, tipo: true },
    orderBy: { nombre: "asc" },
  })

  return <NuevoPagoImpuestoClient cuentas={cuentas} />
}
