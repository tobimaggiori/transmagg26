/**
 * Propósito: Página para consultar gastos de fleteros (ruta /fleteros/gastos).
 * Server component: carga fleteros activos para los filtros.
 */

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { esRolInterno } from "@/lib/permissions"
import { GastosClient } from "./gastos-client"
import type { Rol } from "@/types"

export default async function GastosFleteroPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const rol = (session.user.rol ?? "OPERADOR_EMPRESA") as Rol
  if (!esRolInterno(rol)) redirect("/dashboard")

  const fleteros = await prisma.fletero.findMany({
    where: { activo: true },
    select: { id: true, razonSocial: true, cuit: true },
    orderBy: { razonSocial: "asc" },
  })

  return <GastosClient fleteros={fleteros} />
}
