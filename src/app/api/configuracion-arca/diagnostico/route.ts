/**
 * GET /api/configuracion-arca/diagnostico
 *
 * Devuelve estado de la integración ARCA para el panel de diagnóstico.
 * Incluye: ticket WSAA, config resumen, última emisión exitosa, errores recientes.
 * No expone secretos.
 */

import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { esAdmin } from "@/lib/permissions"
import type { Rol } from "@/types"
import { resolverUrls } from "@/lib/arca/config"

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  if (!esAdmin(session.user.rol as Rol)) return NextResponse.json({ error: "Sin permisos" }, { status: 403 })

  const config = await prisma.configuracionArca.findFirst()

  // Ticket WSAA
  const ticket = await prisma.ticketWsaa.findUnique({ where: { id: "wsfe" } })
  const ticketVigente = ticket ? new Date(ticket.expiresAt).getTime() > Date.now() : false

  // Puntos de venta configurados
  let puntosVentaCount = 0
  try {
    const pv = JSON.parse(config?.puntosVenta ?? "{}") as Record<string, unknown>
    puntosVentaCount = Object.keys(pv).filter((k) => pv[k]).length
  } catch { /* ignore */ }

  // Última emisión exitosa (liquidación, factura o nota con CAE)
  const [ultimaLiq, ultimaFac, ultimaNota] = await Promise.all([
    prisma.liquidacion.findFirst({
      where: { arcaEstado: "AUTORIZADA" },
      orderBy: { autorizadaEn: "desc" },
      select: { id: true, nroComprobante: true, autorizadaEn: true, cae: true },
    }),
    prisma.facturaEmitida.findFirst({
      where: { estadoArca: "AUTORIZADA" },
      orderBy: { autorizadaEn: "desc" },
      select: { id: true, nroComprobante: true, autorizadaEn: true, cae: true },
    }),
    prisma.notaCreditoDebito.findFirst({
      where: { arcaEstado: "AUTORIZADA" },
      orderBy: { autorizadaEn: "desc" },
      select: { id: true, nroComprobante: true, autorizadaEn: true, cae: true, tipo: true },
    }),
  ])

  // Determinar la más reciente
  const emisiones = [
    ultimaLiq ? { tipo: "Liquidación", nro: ultimaLiq.nroComprobante, fecha: ultimaLiq.autorizadaEn, cae: ultimaLiq.cae } : null,
    ultimaFac ? { tipo: "Factura", nro: ultimaFac.nroComprobante, fecha: ultimaFac.autorizadaEn, cae: ultimaFac.cae } : null,
    ultimaNota ? { tipo: ultimaNota.tipo, nro: ultimaNota.nroComprobante, fecha: ultimaNota.autorizadaEn, cae: ultimaNota.cae } : null,
  ].filter(Boolean) as { tipo: string; nro: number | string | null; fecha: Date | null; cae: string | null }[]

  emisiones.sort((a, b) => (b.fecha?.getTime() ?? 0) - (a.fecha?.getTime() ?? 0))

  // Últimos rechazos
  const [ultimoRechazoLiq, ultimoRechazoFac] = await Promise.all([
    prisma.liquidacion.findFirst({
      where: { arcaEstado: "RECHAZADA" },
      orderBy: { autorizadaEn: "desc" },
      select: { arcaObservaciones: true, autorizadaEn: true },
    }),
    prisma.facturaEmitida.findFirst({
      where: { estadoArca: "RECHAZADA" },
      orderBy: { autorizadaEn: "desc" },
      select: { arcaObservaciones: true, autorizadaEn: true },
    }),
  ])

  const ultimoError = [ultimoRechazoLiq, ultimoRechazoFac]
    .filter(Boolean)
    .sort((a, b) => (b!.autorizadaEn?.getTime() ?? 0) - (a!.autorizadaEn?.getTime() ?? 0))[0]

  // URLs resueltas
  let urls = { wsaaUrl: "", wsfev1Url: "" }
  if (config) {
    try {
      urls = resolverUrls({
        cuit: config.cuit,
        razonSocial: config.razonSocial,
        certificadoB64: "",
        certificadoPass: "",
        modo: config.modo === "produccion" ? "produccion" : "homologacion",
        puntosVenta: {},
        cbuMiPymes: null,
        activa: config.activa,
      })
    } catch { /* ignore */ }
  }

  return NextResponse.json({
    config: {
      activa: config?.activa ?? false,
      modo: config?.modo ?? "homologacion",
      tieneCertificado: !!config?.certificadoB64,
      cuit: config?.cuit ?? "",
      razonSocial: config?.razonSocial ?? "",
      puntosVentaCount,
      actualizadoEn: config?.actualizadoEn?.toISOString() ?? null,
      actualizadoPor: config?.actualizadoPor ?? null,
    },
    ticket: ticket ? {
      vigente: ticketVigente,
      expiresAt: ticket.expiresAt.toISOString(),
      obtainedAt: ticket.obtainedAt.toISOString(),
    } : null,
    ultimaEmision: emisiones[0] ?? null,
    ultimoError: ultimoError ? {
      observaciones: ultimoError.arcaObservaciones?.slice(0, 200) ?? null,
      fecha: ultimoError.autorizadaEn?.toISOString() ?? null,
    } : null,
    urls,
    emisionesRecientes: emisiones.slice(0, 5),
  })
}
