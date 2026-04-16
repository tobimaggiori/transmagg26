/**
 * Propósito: Página para ingresar adelantos a fleteros (/fleteros/adelantos/ingresar).
 * Server component: carga fleteros activos, cuentas con chequera y delega al client component.
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

  const [fleteros, chequeras] = await Promise.all([
    prisma.fletero.findMany({
      where: { activo: true },
      select: { id: true, razonSocial: true, cuit: true },
      orderBy: { razonSocial: "asc" },
    }),
    prisma.cuenta.findMany({
      where: { activa: true, tieneChequera: true },
      select: { id: true, nombre: true, bancoOEntidad: true },
      orderBy: { nombre: "asc" },
    }),
  ])

  return <IngresarAdelantoClient fleteros={fleteros} chequeras={chequeras} />
}
