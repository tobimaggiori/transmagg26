/**
 * Nuevo recibo de cobranza JM. Server wrapper.
 */

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prismaJm } from "@/jm/prisma"
import { esRolInterno } from "@/lib/permissions"
import type { Rol } from "@/types"
import { NuevoReciboJmClient } from "./nuevo-recibo-jm-client"

export default async function NuevoReciboJmPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (!esRolInterno(session.user.rol as Rol)) redirect("/dashboard")

  const [empresas, cuentas] = await Promise.all([
    prismaJm.empresa.findMany({
      where: { activa: true },
      select: { id: true, razonSocial: true, cuit: true },
      orderBy: { razonSocial: "asc" },
    }),
    prismaJm.cuenta.findMany({
      where: { activa: true },
      select: { id: true, nombre: true, banco: { select: { id: true, nombre: true } } },
      orderBy: { nombre: "asc" },
    }),
  ])

  return <NuevoReciboJmClient empresas={empresas} cuentas={cuentas} />
}
