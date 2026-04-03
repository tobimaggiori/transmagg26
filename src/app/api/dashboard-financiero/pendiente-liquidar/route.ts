/**
 * API Route: GET /api/dashboard-financiero/pendiente-liquidar
 * Devuelve los viajes sin liquidación emitida, agrupados por fletero.
 * Cada viaje incluye subtotal, iva y total precalculados.
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireFinancialAccess, serverErrorResponse } from "@/lib/financial-api"
import { calcularTotalViaje } from "@/lib/viajes"

export async function GET() {
  const access = await requireFinancialAccess()
  if (!access.ok) return access.response

  try {
    const viajes = await prisma.viaje.findMany({
      where: {
        fleteroId: { not: null },
        estadoLiquidacion: "PENDIENTE_LIQUIDAR",
      },
      include: {
        fletero: { select: { id: true, razonSocial: true, comisionDefault: true } },
      },
      orderBy: { fechaViaje: "desc" },
    })

    type ViajeEntry = {
      id: string
      fechaViaje: string
      nroCartaPorte: string | null
      cartaPorteS3Key: string | null
      tieneCpe: boolean
      remito: string | null
      cupo: string | null
      tieneCupo: boolean
      mercaderia: string | null
      procedencia: string | null
      destino: string | null
      kilos: number | null
      tarifa: number
      subtotal: number
      comisionPct: number
      comisionMonto: number
      neto: number
      iva: number
      total: number
    }

    type FleteroEntry = {
      fleteroId: string
      razonSocial: string
      comisionPct: number
      totalGeneral: number
      cantidadViajes: number
      viajes: ViajeEntry[]
    }

    const porFletero = new Map<string, FleteroEntry>()

    for (const v of viajes) {
      if (!v.fletero || !v.fleteroId) continue
      const key = v.fleteroId
      const comisionPct = v.fletero.comisionDefault
      if (!porFletero.has(key)) {
        porFletero.set(key, {
          fleteroId: v.fleteroId,
          razonSocial: v.fletero.razonSocial,
          comisionPct,
          totalGeneral: 0,
          cantidadViajes: 0,
          viajes: [],
        })
      }
      const entry = porFletero.get(key)!

      const subtotal = v.kilos != null ? calcularTotalViaje(v.kilos, v.tarifa) : 0
      const comisionMonto = Math.round(subtotal * (comisionPct / 100) * 100) / 100
      const neto = Math.round((subtotal - comisionMonto) * 100) / 100
      const iva = Math.round(neto * 0.21 * 100) / 100
      const total = Math.round((neto + iva) * 100) / 100

      entry.totalGeneral += total
      entry.cantidadViajes += 1
      entry.viajes.push({
        id: v.id,
        fechaViaje: v.fechaViaje.toISOString(),
        nroCartaPorte: v.nroCartaPorte,
        cartaPorteS3Key: v.cartaPorteS3Key,
        tieneCpe: v.tieneCpe,
        remito: v.remito,
        cupo: v.cupo,
        tieneCupo: v.tieneCupo,
        mercaderia: v.mercaderia,
        procedencia: v.procedencia,
        destino: v.destino,
        kilos: v.kilos,
        tarifa: v.tarifa,
        subtotal,
        comisionPct,
        comisionMonto,
        neto,
        iva,
        total,
      })
    }

    const resultado = Array.from(porFletero.values())
      .sort((a, b) => b.totalGeneral - a.totalGeneral)

    return NextResponse.json(resultado)
  } catch (error) {
    return serverErrorResponse("GET /api/dashboard-financiero/pendiente-liquidar", error)
  }
}
