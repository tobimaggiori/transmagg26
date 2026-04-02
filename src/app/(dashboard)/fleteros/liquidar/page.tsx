/**
 * Propósito: Página de creación de Líquido Producto (ruta /fleteros/liquidar).
 * Usa LiquidarClient — solo el flujo de creación.
 */

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { puedeAcceder, esRolInterno } from "@/lib/permissions"
import type { Rol } from "@/types"
import { LiquidarClient } from "./liquidar-client"

export default async function FleterosLiquidarPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const rol = (session.user.rol ?? "OPERADOR_EMPRESA") as Rol
  if (!puedeAcceder(rol, "liquidaciones")) redirect("/dashboard")

  const esInterno = esRolInterno(rol)

  const fleteros = esInterno
    ? await prisma.fletero.findMany({
        where: { activo: true },
        select: { id: true, razonSocial: true, comisionDefault: true },
        orderBy: { razonSocial: "asc" },
      })
    : []

  let fleteroIdPropio: string | null = null
  if (rol === "FLETERO") {
    const fletero = await prisma.fletero.findFirst({
      where: { usuario: { email: session.user.email ?? "" } },
      select: { id: true },
    })
    fleteroIdPropio = fletero?.id ?? null
  }

  return (
    <LiquidarClient
      rol={rol}
      fleteros={fleteros}
      fleteroIdPropio={fleteroIdPropio}
    />
  )
}
