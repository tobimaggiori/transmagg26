/**
 * API Route: GET /api/dashboard-financiero/pendiente-facturar
 * Devuelve los viajes sin factura emitida, agrupados por empresa.
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireFinancialAccess, serverErrorResponse } from "@/lib/financial-api"
import { calcularTotalViaje } from "@/lib/viajes"
import { viajeEsFacturable } from "@/lib/facturacion"

export async function GET() {
  const access = await requireFinancialAccess()
  if (!access.ok) return access.response

  try {
    const viajes = await prisma.viaje.findMany({
      where: {
        estadoFactura: "PENDIENTE_FACTURAR",
      },
      include: {
        empresa: { select: { id: true, razonSocial: true } },
        enLiquidaciones: {
          include: {
            liquidacion: { select: { id: true, estado: true, cae: true, arcaEstado: true, nroComprobante: true, ptoVenta: true, pdfS3Key: true } },
          },
        },
      },
      orderBy: { fechaViaje: "desc" },
    })

    type ViajeEntry = {
      id: string
      fechaViaje: string
      procedencia: string | null
      destino: string | null
      nroCartaPorte: string | null
      cartaPorteS3Key: string | null
      empresaRazonSocial: string
      totalEmpresa: number | null
      liquidacion: {
        id: string
        nroComprobante: number | null
        ptoVenta: number | null
        pdfS3Key: string | null
      } | null
    }
    type EmpresaEntry = {
      empresaId: string
      razonSocial: string
      total: number
      cantidadViajes: number
      viajes: ViajeEntry[]
    }

    const porEmpresa = new Map<string, EmpresaEntry>()

    // Solo mostrar viajes facturables (con LP emitida + CAE aceptado por ARCA)
    const viajesFacturables = viajes.filter((v) => viajeEsFacturable({
      estadoFactura: "PENDIENTE_FACTURAR",
      enLiquidaciones: v.enLiquidaciones.map((el) => ({
        liquidacion: { estado: el.liquidacion.estado, cae: el.liquidacion.cae, arcaEstado: el.liquidacion.arcaEstado },
      })),
    }))

    for (const v of viajesFacturables) {
      const key = v.empresaId
      if (!porEmpresa.has(key)) {
        porEmpresa.set(key, {
          empresaId: v.empresaId,
          razonSocial: v.empresa.razonSocial,
          total: 0,
          cantidadViajes: 0,
          viajes: [],
        })
      }
      const entry = porEmpresa.get(key)!
      const totalEmpresa = v.kilos != null ? calcularTotalViaje(v.kilos, v.tarifaEmpresa) : null
      entry.total += totalEmpresa ?? 0
      entry.cantidadViajes += 1

      // Find the active (non-ANULADA) liquidación if any
      const liqActiva = v.enLiquidaciones.find((el) => el.liquidacion.estado !== "ANULADA")

      entry.viajes.push({
        id: v.id,
        fechaViaje: v.fechaViaje.toISOString(),
        procedencia: v.procedencia,
        destino: v.destino,
        nroCartaPorte: v.nroCartaPorte,
        cartaPorteS3Key: v.cartaPorteS3Key,
        empresaRazonSocial: v.empresa.razonSocial,
        totalEmpresa,
        liquidacion: liqActiva ? {
          id: liqActiva.liquidacion.id,
          nroComprobante: liqActiva.liquidacion.nroComprobante,
          ptoVenta: liqActiva.liquidacion.ptoVenta,
          pdfS3Key: liqActiva.liquidacion.pdfS3Key,
        } : null,
      })
    }

    const resultado = Array.from(porEmpresa.values())
      .sort((a, b) => b.total - a.total)

    return NextResponse.json(resultado)
  } catch (error) {
    return serverErrorResponse("GET /api/dashboard-financiero/pendiente-facturar", error)
  }
}
