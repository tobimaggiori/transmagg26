/**
 * Propósito: Página de Mi Flota — bifurca por rol.
 * FLETERO → MiFlotaClient (su propia flota).
 * Roles internos → FlotaPropiaClient (camiones propios de Transmagg).
 */

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { esRolInterno, tienePermiso } from "@/lib/permissions"
import { resolverFleteroIdPorEmail } from "@/lib/session-utils"
import type { Rol } from "@/types"
import { sumarImportes } from "@/lib/money"
import { MiFlotaClient } from "./mi-flota-client"
import { FlotaPropiaClient } from "./flota-propia-client"

export default async function MiFlotaPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const rol = (session.user.rol ?? "OPERADOR_EMPRESA") as Rol
  if (!(await tienePermiso(session.user.id, rol, "mi_flota"))) redirect("/dashboard")

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
                usuario: { select: { email: true } },
              },
            },
          },
          take: 1,
        },
        polizas: { orderBy: { vigenciaHasta: "desc" } },
        infracciones: {
          orderBy: { fecha: "desc" },
          take: 20,
          select: {
            id: true,
            fecha: true,
            organismo: true,
            descripcion: true,
            monto: true,
            estado: true,
            comprobantePdfS3Key: true,
          },
        },
      },
      orderBy: { patenteChasis: "asc" },
    })

    const cuentas = await prisma.cuenta.findMany({
      where: { activa: true },
      select: { id: true, nombre: true },
      orderBy: { nombre: "asc" },
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
      const infraccionesMapeadas = c.infracciones.map((inf) => ({
        id: inf.id,
        fecha: inf.fecha.toISOString(),
        organismo: inf.organismo,
        descripcion: inf.descripcion,
        monto: inf.monto,
        estado: inf.estado,
        comprobantePdfS3Key: inf.comprobantePdfS3Key,
      }))
      const infrasPendientes = infraccionesMapeadas.filter((i) => i.estado === "PENDIENTE")
      return {
        id: c.id,
        patenteChasis: c.patenteChasis,
        patenteAcoplado: c.patenteAcoplado,
        activo: c.activo,
        esPropio: c.esPropio,
        choferActual: c.choferHistorial[0]?.chofer ?? null,
        polizas: polizasConEstado,
        alertaPoliza: (!polizaVigente
          ? "SIN_COBERTURA"
          : polizaVigente.estadoPoliza === "POR_VENCER"
          ? "POR_VENCER"
          : null) as "SIN_COBERTURA" | "POR_VENCER" | null,
        infracciones: infraccionesMapeadas,
        infrasPendientes: infrasPendientes.length,
        montoInfrasPendientes: sumarImportes(infrasPendientes.map(i => i.monto)),
      }
    })

    // Choferes empleados de Transmagg (Empleado con cargo CHOFER y sin fleteroId)
    const choferes = await prisma.empleado.findMany({
      where: { cargo: "CHOFER", activo: true, fleteroId: null },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        usuario: { select: { email: true } },
      },
      orderBy: [{ apellido: "asc" }, { nombre: "asc" }],
    })

    return <FlotaPropiaClient camiones={camionesEnriquecidos} choferes={choferes} cuentas={cuentas} />
  }

  // ── FLETERO: su propia flota ───────────────────────────────────────────────
  const fleteroId = await resolverFleteroIdPorEmail(session.user.email ?? "")
  if (!fleteroId) redirect("/dashboard")

  const fletero = await prisma.fletero.findUnique({
    where: { id: fleteroId },
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
          choferHistorial: {
            where: { hasta: null },
            select: {
              chofer: {
                select: {
                  id: true, nombre: true, apellido: true,
                  usuario: { select: { email: true } },
                },
              },
            },
            take: 1,
          },
        },
      },
      empleados: {
        where: { cargo: "CHOFER", activo: true },
        select: {
          id: true, nombre: true, apellido: true,
          usuario: { select: { email: true } },
        },
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
        choferActual: c.choferHistorial[0]?.chofer
          ? {
              id: c.choferHistorial[0].chofer.id,
              nombre: c.choferHistorial[0].chofer.nombre,
              apellido: c.choferHistorial[0].chofer.apellido,
              email: c.choferHistorial[0].chofer.usuario?.email ?? null,
            }
          : null,
      }))}
      choferesSinCamion={fletero.empleados
        .filter((e) => !choferesConCamion.has(e.id))
        .map((e) => ({ id: e.id, nombre: e.nombre, apellido: e.apellido, email: e.usuario?.email ?? null }))}
    />
  )
}
