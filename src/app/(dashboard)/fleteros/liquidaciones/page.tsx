/**
 * Propósito: Página de liquidaciones (ruta /fleteros/liquidaciones).
 * Reutiliza LiquidacionesClient — misma lógica que /liquidaciones.
 */

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { puedeAcceder, esRolInterno } from "@/lib/permissions"
import type { Rol } from "@/types"
import { LiquidacionesClient } from "../../liquidaciones/liquidaciones-client"

/**
 * FleterosLiquidacionesPage: () -> Promise<JSX.Element>
 *
 * Verifica autenticación y permisos, carga lista de fleteros, y renderiza LiquidacionesClient.
 * Existe como alias de /liquidaciones bajo la ruta /fleteros/liquidaciones.
 *
 * Ejemplos:
 * // Sesión ADMIN_TRANSMAGG → LiquidacionesClient con selector de fletero completo
 * <FleterosLiquidacionesPage />
 * // Sin sesión → redirect /login
 * <FleterosLiquidacionesPage />
 */
export default async function FleterosLiquidacionesPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const rol = (session.user.rol ?? "OPERADOR_EMPRESA") as Rol
  if (!puedeAcceder(rol, "liquidaciones")) redirect("/dashboard")

  const esInterno = esRolInterno(rol)

  const [fleteros, camiones, choferes, cuentasBancarias] = esInterno
    ? await Promise.all([
        prisma.fletero.findMany({
          where: { activo: true },
          select: { id: true, razonSocial: true, comisionDefault: true },
          orderBy: { razonSocial: "asc" },
        }),
        prisma.camion.findMany({
          where: { activo: true },
          select: { id: true, patenteChasis: true, fleteroId: true },
          orderBy: { patenteChasis: "asc" },
        }),
        prisma.usuario.findMany({
          where: { rol: "CHOFER", activo: true },
          select: { id: true, nombre: true, apellido: true },
          orderBy: { apellido: "asc" },
        }),
        prisma.cuenta.findMany({
          where: { activa: true },
          select: { id: true, nombre: true, bancoOEntidad: true },
          orderBy: { nombre: "asc" },
        }),
      ])
    : [[], [], [], []]

  let fleteroIdPropio: string | null = null
  if (rol === "FLETERO") {
    const fletero = await prisma.fletero.findFirst({
      where: { usuario: { email: session.user.email ?? "" } },
      select: { id: true },
    })
    fleteroIdPropio = fletero?.id ?? null
  }

  return (
    <LiquidacionesClient
      rol={rol}
      fleteros={fleteros}
      camiones={camiones}
      choferes={choferes}
      fleteroIdPropio={fleteroIdPropio}
      cuentasBancarias={cuentasBancarias}
      titulo="Consultar Liq. Prod."
    />
  )
}
