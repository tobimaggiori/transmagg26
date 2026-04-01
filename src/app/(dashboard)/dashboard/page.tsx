/**
 * Propósito: Página principal del dashboard de Transmagg.
 * - Roles internos → dashboard financiero
 * - CHOFER empleado de Transmagg → panel personal del chofer (solo lectura)
 * - Otros roles → redirect /viajes
 */

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { esRolInterno } from "@/lib/permissions"
import { FinancialDashboardClient } from "./financial-dashboard-client"
import { DashboardChoferTransmagg } from "./dashboard-chofer-transmagg"
import type { Rol } from "@/types"

/**
 * DashboardPage: () -> Promise<JSX.Element>
 *
 * Verifica la sesión del usuario y su rol antes de renderizar el dashboard.
 * - Roles internos → FinancialDashboardClient
 * - CHOFER empleado de Transmagg → DashboardChoferTransmagg con datos personales
 * - Otros roles → redirect /viajes
 * Existe como punto de entrada al dashboard, separando la autenticación de la UI.
 *
 * Ejemplos:
 * // Sesión ADMIN_TRANSMAGG → renderiza FinancialDashboardClient
 * <DashboardPage />
 * // Sesión CHOFER empleado de Transmagg → renderiza DashboardChoferTransmagg
 * <DashboardPage />
 * // Sesión FLETERO → redirect /viajes
 * <DashboardPage />
 * // Sin sesión → redirect /login
 * <DashboardPage />
 */
export default async function DashboardPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  const rol = (session.user.rol ?? "OPERADOR_EMPRESA") as Rol

  if (esRolInterno(rol)) {
    return <FinancialDashboardClient />
  }

  // Panel personal para CHOFER empleado de Transmagg
  if (rol === "CHOFER") {
    const usuario = await prisma.usuario.findFirst({
      where: { email: session.user.email ?? "" },
      include: { empleado: true },
    })

    // Chofer de fletero → redirigir a viajes como antes
    if (!usuario?.empleado || usuario.fleteroId) {
      redirect("/viajes")
    }

    const empleado = usuario.empleado
    const usuarioId = usuario.id
    const now = new Date()

    // Camión actualmente asignado al chofer (propio de Transmagg)
    const camionRaw = await prisma.camion.findFirst({
      where: {
        esPropio: true,
        choferHistorial: { some: { choferId: usuarioId, hasta: null } },
      },
      include: {
        polizas: { orderBy: { vigenciaHasta: "desc" }, take: 1 },
      },
    })

    // Tarjeta asignada al chofer
    const tarjetaRaw = await prisma.tarjeta.findFirst({
      where: { choferId: usuarioId, activa: true },
      include: {
        gastos: { orderBy: { fecha: "desc" }, take: 20 },
      },
    })

    // Últimos 20 viajes como chofer — sin tarifas
    const viajesRaw = await prisma.viaje.findMany({
      where: { choferId: usuarioId },
      orderBy: { fechaViaje: "desc" },
      take: 20,
      select: {
        id: true,
        fechaViaje: true,
        mercaderia: true,
        provinciaOrigen: true,
        provinciaDestino: true,
        procedencia: true,
        destino: true,
        estadoFactura: true,
        empresa: { select: { razonSocial: true } },
      },
    })

    // Serializar camion (fechas → strings)
    const camion = camionRaw
      ? {
          id: camionRaw.id,
          patenteChasis: camionRaw.patenteChasis,
          patenteAcoplado: camionRaw.patenteAcoplado,
          tipoCamion: camionRaw.tipoCamion,
          polizaActual: (() => {
            const p = camionRaw.polizas[0] ?? null
            if (!p) return null
            const diasParaVencer = Math.ceil(
              (p.vigenciaHasta.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
            )
            return {
              id: p.id,
              aseguradora: p.aseguradora,
              nroPoliza: p.nroPoliza,
              cobertura: p.cobertura,
              vigenciaDesde: p.vigenciaDesde.toISOString(),
              vigenciaHasta: p.vigenciaHasta.toISOString(),
              estadoPoliza: (
                p.vigenciaHasta < now
                  ? "VENCIDA"
                  : p.vigenciaHasta <= new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
                  ? "POR_VENCER"
                  : "VIGENTE"
              ) as "VIGENTE" | "POR_VENCER" | "VENCIDA",
              diasParaVencer,
            }
          })(),
        }
      : null

    const tarjeta = tarjetaRaw
      ? {
          id: tarjetaRaw.id,
          nombre: tarjetaRaw.nombre,
          tipo: tarjetaRaw.tipo,
          banco: tarjetaRaw.banco,
          ultimos4: tarjetaRaw.ultimos4,
          gastos: tarjetaRaw.gastos.map((g) => ({
            id: g.id,
            tipoGasto: g.tipoGasto,
            monto: g.monto,
            fecha: g.fecha.toISOString(),
            descripcion: g.descripcion,
          })),
        }
      : null

    const viajes = viajesRaw.map((v) => ({
      id: v.id,
      fechaViaje: v.fechaViaje.toISOString(),
      mercaderia: v.mercaderia,
      provinciaOrigen: v.provinciaOrigen,
      provinciaDestino: v.provinciaDestino,
      procedencia: v.procedencia,
      destino: v.destino,
      estadoFactura: v.estadoFactura,
      empresa: v.empresa,
    }))

    return (
      <DashboardChoferTransmagg
        usuario={{ nombre: usuario.nombre, apellido: usuario.apellido, email: usuario.email }}
        empleado={{
          id: empleado.id,
          nombre: empleado.nombre,
          apellido: empleado.apellido,
          cuit: empleado.cuit,
          cargo: empleado.cargo,
          fechaIngreso: empleado.fechaIngreso.toISOString(),
        }}
        camion={camion}
        tarjeta={tarjeta}
        viajes={viajes}
      />
    )
  }

  redirect("/viajes")
}
