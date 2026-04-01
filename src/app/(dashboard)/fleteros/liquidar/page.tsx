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

/**
 * FleterosLiquidarPage: () -> Promise<JSX.Element>
 *
 * Verifica autenticación y permisos, carga fleteros/camiones/choferes,
 * y renderiza LiquidarClient (solo creación de LP).
 *
 * Ejemplos:
 * // Sesión ADMIN_TRANSMAGG → LiquidarClient con selector de fletero
 * <FleterosLiquidarPage />
 * // Sin sesión → redirect /login
 * <FleterosLiquidarPage />
 */
export default async function FleterosLiquidarPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const rol = (session.user.rol ?? "OPERADOR_EMPRESA") as Rol
  if (!puedeAcceder(rol, "liquidaciones")) redirect("/dashboard")

  const esInterno = esRolInterno(rol)

  const [fleteros, camiones, choferes] = esInterno
    ? await Promise.all([
        prisma.fletero.findMany({
          where: { activo: true },
          select: { id: true, razonSocial: true, comisionDefault: true },
          orderBy: { razonSocial: "asc" },
        }),
        prisma.camion.findMany({
          where: { activo: true, esPropio: false },
          select: { id: true, patenteChasis: true, fleteroId: true },
          orderBy: { patenteChasis: "asc" },
        }),
        prisma.usuario.findMany({
          where: { rol: "CHOFER", activo: true },
          select: { id: true, nombre: true, apellido: true },
          orderBy: { apellido: "asc" },
        }),
      ])
    : [[], [], []]

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
      camiones={camiones.filter((c) => c.fleteroId !== null) as { id: string; patenteChasis: string; fleteroId: string }[]}
      choferes={choferes}
      fleteroIdPropio={fleteroIdPropio}
    />
  )
}
