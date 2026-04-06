/**
 * Propósito: Página de gestión de liquidaciones de Transmagg.
 * Server component que verifica auth y renderiza el cliente interactivo.
 */

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { puedeAcceder, esRolInterno } from "@/lib/permissions"
import { resolverFleteroIdPorEmail } from "@/lib/session-utils"
import { leerComprobantesHabilitados } from "@/lib/arca/leer-config-habilitados"
import type { Rol } from "@/types"
import { LiquidacionesClient } from "./liquidaciones-client"

/**
 * LiquidacionesPage: () -> Promise<JSX.Element>
 *
 * Verifica autenticación y permisos, carga lista de fleteros, y renderiza LiquidacionesClient.
 * Existe como server component para separar autenticación del cliente interactivo.
 *
 * Ejemplos:
 * // Sesión ADMIN_TRANSMAGG → LiquidacionesClient con selector de fletero completo
 * <LiquidacionesPage />
 * // Sesión FLETERO → LiquidacionesClient con su propio fleteroId automático
 * <LiquidacionesPage />
 * // Sesión ADMIN_EMPRESA → redirect /dashboard
 * <LiquidacionesPage />
 */
export default async function LiquidacionesPage() {
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
          where: { activo: true, esPropio: false },
          select: { id: true, patenteChasis: true, fleteroId: true },
          orderBy: { patenteChasis: "asc" },
        }),
        prisma.usuario.findMany({
          where: { rol: "CHOFER", activo: true },
          select: { id: true, nombre: true, apellido: true },
          orderBy: { apellido: "asc" },
        }),
        prisma.cuenta.findMany({
          where: {
            activa: true,
            OR: [
              { cuentaPadreId: { not: null } },
              { tipo: { not: "BANCO" } },
            ],
          },
          select: { id: true, nombre: true, bancoOEntidad: true },
          orderBy: { nombre: "asc" },
        }),
      ])
    : [[], [], [], []]

  // Para FLETERO: obtener su propio fleteroId
  const [fleteroIdPropio, comprobantesHabilitados] = await Promise.all([
    rol === "FLETERO" ? resolverFleteroIdPorEmail(session.user.email ?? "") : null,
    leerComprobantesHabilitados(),
  ])

  return (
    <LiquidacionesClient
      rol={rol}
      fleteros={fleteros}
      camiones={camiones.filter((c) => c.fleteroId !== null) as { id: string; patenteChasis: string; fleteroId: string }[]}
      choferes={choferes}
      fleteroIdPropio={fleteroIdPropio}
      cuentasBancarias={cuentasBancarias}
      comprobantesHabilitados={comprobantesHabilitados}
    />
  )
}
