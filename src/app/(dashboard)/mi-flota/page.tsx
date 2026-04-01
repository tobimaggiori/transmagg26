/**
 * Propósito: Página de Mi Flota — bifurca por rol.
 * FLETERO → MiFlotaClient (su propia flota).
 * Roles internos → FlotaPropiaClient (camiones propios de Transmagg).
 */

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { esRolInterno, puedeAcceder } from "@/lib/permissions"
import type { Rol } from "@/types"
import { MiFlotaClient } from "./mi-flota-client"
import { FlotaPropiaClient } from "./flota-propia-client"

export default async function MiFlotaPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const rol = (session.user.rol ?? "OPERADOR_EMPRESA") as Rol
  if (!puedeAcceder(rol, "mi_flota")) redirect("/dashboard")

  // ── Roles internos: gestión de flota propia de Transmagg ──────────────────
  if (esRolInterno(rol)) {
    const now = new Date()
    const camiones = await prisma.camion.findMany({
      where: { esPropio: true, activo: true },
      include: {
        choferHistorial: {
          where: { hasta: null },
          include: {
            chofer: {
              select: {
                id: true,
                nombre: true,
                apellido: true,
                email: true,
                empleado: { select: { id: true, nombre: true, apellido: true } },
              },
            },
          },
          take: 1,
        },
        polizas: { orderBy: { vigenciaHasta: "desc" } },
      },
      orderBy: { patenteChasis: "asc" },
    })

    const camionesEnriquecidos = camiones.map((c) => {
      const polizasConEstado = c.polizas.map((p) => ({
        ...p,
        estadoPoliza: (
          p.vigenciaHasta < now
            ? "VENCIDA"
            : p.vigenciaHasta <= new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
            ? "POR_VENCER"
            : "VIGENTE"
        ) as "VENCIDA" | "POR_VENCER" | "VIGENTE",
        vigenciaDesde: p.vigenciaDesde.toISOString(),
        vigenciaHasta: p.vigenciaHasta.toISOString(),
        creadoEn: p.creadoEn.toISOString(),
      }))
      const polizaVigente = polizasConEstado.find((p) => p.estadoPoliza !== "VENCIDA")
      return {
        id: c.id,
        patenteChasis: c.patenteChasis,
        patenteAcoplado: c.patenteAcoplado,
        tipoCamion: c.tipoCamion,
        activo: c.activo,
        esPropio: c.esPropio,
        choferActual: c.choferHistorial[0]?.chofer ?? null,
        polizas: polizasConEstado,
        alertaPoliza: (!polizaVigente
          ? "SIN_COBERTURA"
          : polizaVigente.estadoPoliza === "POR_VENCER"
          ? "POR_VENCER"
          : null) as "SIN_COBERTURA" | "POR_VENCER" | null,
      }
    })

    // Choferes empleados de Transmagg con rol CHOFER
    const choferes = await prisma.usuario.findMany({
      where: { rol: "CHOFER", activo: true, fleteroId: null },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        email: true,
        empleado: { select: { id: true, nombre: true, apellido: true } },
      },
      orderBy: [{ apellido: "asc" }, { nombre: "asc" }],
    })

    return <FlotaPropiaClient camiones={camionesEnriquecidos} choferes={choferes} />
  }

  // ── FLETERO: su propia flota ───────────────────────────────────────────────
  const fletero = await prisma.fletero.findFirst({
    where: { usuario: { email: session.user.email ?? "" } },
    select: {
      id: true,
      razonSocial: true,
      camiones: {
        where: { activo: true },
        orderBy: { patenteChasis: "asc" },
        select: {
          id: true,
          patenteChasis: true,
          patenteAcoplado: true,
          tipoCamion: true,
          choferHistorial: {
            where: { hasta: null },
            select: { chofer: { select: { id: true, nombre: true, apellido: true, email: true } } },
            take: 1,
          },
        },
      },
      choferes: {
        where: { rol: "CHOFER", activo: true },
        select: { id: true, nombre: true, apellido: true, email: true },
        orderBy: [{ apellido: "asc" }, { nombre: "asc" }],
      },
    },
  })

  if (!fletero) redirect("/dashboard")

  const choferesConCamion = new Set(
    fletero.camiones.flatMap((c) => c.choferHistorial.map((h) => h.chofer.id))
  )

  return (
    <MiFlotaClient
      razonSocial={fletero.razonSocial}
      camiones={fletero.camiones.map((c) => ({
        id: c.id,
        patenteChasis: c.patenteChasis,
        patenteAcoplado: c.patenteAcoplado,
        tipoCamion: c.tipoCamion,
        choferActual: c.choferHistorial[0]?.chofer ?? null,
      }))}
      choferesSinCamion={fletero.choferes.filter((c) => !choferesConCamion.has(c.id))}
    />
  )
}
