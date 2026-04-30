/**
 * Propósito: Página de creación de Líquido Producto (ruta /fleteros/liquidar).
 * Usa LiquidarClient — solo el flujo de creación.
 */

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { tienePermiso, esRolInterno } from "@/lib/permissions"
import { resolverFleteroIdPorEmail } from "@/lib/session-utils"
import type { Rol } from "@/types"
import { LiquidarClient } from "./liquidar-client"

export default async function FleterosLiquidarPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const rol = (session.user.rol ?? "OPERADOR_EMPRESA") as Rol
  if (!(await tienePermiso(session.user.id, rol, "liquidaciones"))) redirect("/dashboard")

  const esInterno = esRolInterno(rol)

  const [fleteros, empresas, camiones, choferes] = await Promise.all([
    prisma.fletero.findMany({
      where: { activo: true },
      select: { id: true, razonSocial: true, cuit: true, comisionDefault: true },
      orderBy: { razonSocial: "asc" },
    }),
    prisma.empresa.findMany({
      where: { activa: true },
      select: { id: true, razonSocial: true, cuit: true },
      orderBy: { razonSocial: "asc" },
    }),
    prisma.camion.findMany({
      where: { activo: true },
      select: { id: true, patenteChasis: true, fleteroId: true, esPropio: true },
      orderBy: { patenteChasis: "asc" },
    }),
    prisma.empleado.findMany({
      where: { cargo: "CHOFER", activo: true },
      select: { id: true, nombre: true, apellido: true, fleteroId: true },
      orderBy: { apellido: "asc" },
    }),
  ])

  let fleteroIdPropio: string | null = null
  if (rol === "FLETERO") {
    fleteroIdPropio = await resolverFleteroIdPorEmail(session.user.email ?? "")
  }

  return (
    <LiquidarClient
      rol={rol}
      fleteros={esInterno ? fleteros : []}
      empresas={empresas}
      camiones={camiones}
      choferes={choferes}
      fleteroIdPropio={fleteroIdPropio}
    />
  )
}
