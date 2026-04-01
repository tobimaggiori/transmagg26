/**
 * Propósito: Página para ingresar gastos de fleteros (ruta /fleteros/gastos/ingresar).
 * Server component: carga fleteros y proveedores activos.
 */

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { esRolInterno } from "@/lib/permissions"
import { IngresarGastoClient } from "./ingresar-gasto-client"
import type { Rol } from "@/types"

export default async function IngresarGastoPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const rol = (session.user.rol ?? "OPERADOR_EMPRESA") as Rol
  if (!esRolInterno(rol)) redirect("/dashboard")

  const [fleteros, proveedores] = await Promise.all([
    prisma.fletero.findMany({
      where: { activo: true },
      select: { id: true, razonSocial: true, cuit: true },
      orderBy: { razonSocial: "asc" },
    }),
    prisma.proveedor.findMany({
      where: { activo: true },
      select: { id: true, razonSocial: true, cuit: true },
      orderBy: { razonSocial: "asc" },
    }),
  ])

  return <IngresarGastoClient fleteros={fleteros} proveedores={proveedores} />
}
