/**
 * Propósito: Página para ingresar adelantos a fleteros (/fleteros/adelantos/ingresar).
 * Server component: carga la lista de fleteros activos y delega al client component.
 */

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { esRolInterno } from "@/lib/permissions"
import { IngresarAdelantoClient } from "./ingresar-adelanto-client"
import type { Rol } from "@/types"

export default async function IngresarAdelantoPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const rol = (session.user.rol ?? "OPERADOR_EMPRESA") as Rol
  if (!esRolInterno(rol)) redirect("/dashboard")

  const fleteros = await prisma.fletero.findMany({
    where: { activo: true },
    select: { id: true, razonSocial: true },
    orderBy: { razonSocial: "asc" },
  })

  return <IngresarAdelantoClient fleteros={fleteros} />
}
