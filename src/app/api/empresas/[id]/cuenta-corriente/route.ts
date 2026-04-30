/**
 * API Route: GET /api/empresas/[id]/cuenta-corriente?desde=YYYY-MM-DD&hasta=YYYY-MM-DD
 * Devuelve movimientos cronológicos de la CC de una empresa.
 * Solo accesible para ADMIN_TRANSMAGG y OPERADOR_TRANSMAGG.
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { esRolInterno } from "@/lib/permissions"
import { sumarImportes, restarImportes } from "@/lib/money"
import type { Rol } from "@/types"

interface Movimiento {
  fecha: string
  concepto: string
  comprobante: string
  debe: number
  haber: number
  saldo: number
  pdfEndpoint: string | null
}

/**
 * capitalize: string -> string
 *
 * Dado un string, devuelve el mismo con la primera letra en mayúscula.
 * Existe para formatear los valores de tipoPago provenientes del enum.
 *
 * Ejemplos:
 * capitalize("transferencia bancaria") === "Transferencia bancaria"
 * capitalize("") === ""
 */
function capitalize(s: string): string {
  if (!s) return s
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/**
 * conceptoFactura: number -> string
 *
 * Dado el código ARCA de tipo de comprobante, devuelve la etiqueta de concepto
 * corta y legible que se muestra en la CC ("Factura A", "Factura B",
 * "Factura MiPyme").
 *
 * Ejemplos:
 * conceptoFactura(1)   === "Factura A"
 * conceptoFactura(6)   === "Factura B"
 * conceptoFactura(201) === "Factura MiPyme"
 * conceptoFactura(999) === "Factura"
 */
function conceptoFactura(tipoCbte: number): string {
  if (tipoCbte === 1) return "Factura A"
  if (tipoCbte === 6) return "Factura B"
  if (tipoCbte === 201) return "Factura MiPyme"
  return "Factura"
}

/**
 * GET: NextRequest { params: { id } } -> Promise<NextResponse>
 *
 * Dado el id de una empresa y los query params desde/hasta,
 * devuelve los movimientos cronológicos de su cuenta corriente:
 * facturas emitidas, pagos recibidos y notas de crédito/débito.
 * Calcula el saldo acumulado por movimiento.
 * Solo accesible para roles internos (ADMIN_TRANSMAGG, OPERADOR_TRANSMAGG).
 *
 * Ejemplos:
 * GET /api/empresas/e1/cuenta-corriente
 * // => { empresa, movimientos: [...], totalDebe, totalHaber, saldoFinal }
 * GET /api/empresas/noexiste/cuenta-corriente
 * // => 404 { error: "Empresa no encontrada" }
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const rol = session.user.rol as Rol
  if (!esRolInterno(rol)) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  try {
    const empresa = await prisma.empresa.findUnique({
      where: { id: params.id },
      select: { id: true, razonSocial: true, cuit: true },
    })
    if (!empresa) return NextResponse.json({ error: "Empresa no encontrada" }, { status: 404 })

    const { searchParams } = new URL(request.url)
    const hoy = new Date()

    const desdeParam = searchParams.get("desde")
    const hastaParam = searchParams.get("hasta")

    const desdeDate = desdeParam ? new Date(desdeParam) : null
    const hastaDate = hastaParam ? new Date(hastaParam + "T23:59:59") : hoy

    const rangoFecha = { ...(desdeDate ? { gte: desdeDate } : {}), lte: hastaDate }

    const [facturas, pagos, notasCreditoDebito, recibos] = await Promise.all([
      prisma.facturaEmitida.findMany({
        where: {
          empresaId: params.id,
          emitidaEn: rangoFecha,
        },
        select: {
          id: true,
          emitidaEn: true,
          total: true,
          nroComprobante: true,
          tipoCbte: true,
        },
      }),
      prisma.pagoDeEmpresa.findMany({
        where: {
          empresaId: params.id,
          fechaPago: rangoFecha,
        },
        select: {
          id: true,
          fechaPago: true,
          monto: true,
          tipoPago: true,
          referencia: true,
          comprobanteS3Key: true,
        },
      }),
      prisma.notaCreditoDebito.findMany({
        where: {
          factura: { empresaId: params.id },
          creadoEn: rangoFecha,
        },
        select: {
          id: true,
          creadoEn: true,
          tipo: true,
          montoTotal: true,
          nroComprobante: true,
          ptoVenta: true,
          nroComprobanteExterno: true,
        },
      }),
      prisma.reciboCobranza.findMany({
        where: { empresaId: params.id },
        select: { id: true, nro: true, ptoVenta: true },
      }),
    ])

    // Mapa para resolver reciboId a partir de la referencia del pago
    // (formato: "Recibo NNNN-NNNNNNNN" o "Saldo a cuenta — Recibo NNNN-NNNNNNNN").
    const reciboPorNro = new Map<string, string>()
    for (const r of recibos) {
      reciboPorNro.set(`${r.ptoVenta}-${r.nro}`, r.id)
    }
    const resolverReciboId = (referencia: string | null): string | null => {
      if (!referencia) return null
      const m = referencia.match(/Recibo (\d+)-(\d+)/)
      if (!m) return null
      return reciboPorNro.get(`${parseInt(m[1])}-${parseInt(m[2])}`) ?? null
    }

    const movimientos: (Omit<Movimiento, "saldo"> & { fechaRaw: Date })[] = []

    for (const f of facturas) {
      movimientos.push({
        fechaRaw: f.emitidaEn,
        fecha: f.emitidaEn.toISOString(),
        concepto: conceptoFactura(f.tipoCbte),
        comprobante: `${f.tipoCbte} ${f.nroComprobante ?? "s/n"}`,
        debe: f.total,
        haber: 0,
        pdfEndpoint: `/api/facturas/${f.id}/pdf`,
      })
    }

    for (const p of pagos) {
      const reciboId = resolverReciboId(p.referencia)
      const pdfEndpoint = reciboId
        ? `/api/recibos-cobranza/${reciboId}/pdf`
        : p.comprobanteS3Key
          ? `/api/storage/signed-url?key=${encodeURIComponent(p.comprobanteS3Key)}`
          : null
      movimientos.push({
        fechaRaw: p.fechaPago,
        fecha: p.fechaPago.toISOString(),
        concepto: `Pago — ${capitalize(p.tipoPago.toLowerCase().replace(/_/g, " "))}`,
        comprobante: p.referencia ?? "",
        debe: 0,
        haber: p.monto,
        pdfEndpoint,
      })
    }

    for (const nc of notasCreditoDebito) {
      // Formatear nro comprobante: preferir nro interno, fallback a externo
      const cbteNro = nc.nroComprobante && nc.ptoVenta
        ? `${String(nc.ptoVenta).padStart(4, "0")}-${String(nc.nroComprobante).padStart(8, "0")}`
        : nc.nroComprobanteExterno ?? ""

      if (nc.tipo === "NC_EMITIDA") {
        movimientos.push({
          fechaRaw: nc.creadoEn,
          fecha: nc.creadoEn.toISOString(),
          concepto: "Nota de Crédito",
          comprobante: cbteNro,
          debe: 0,
          haber: nc.montoTotal,
          pdfEndpoint: `/api/notas-credito-debito/${nc.id}/pdf`,
        })
      } else if (nc.tipo === "ND_EMITIDA") {
        movimientos.push({
          fechaRaw: nc.creadoEn,
          fecha: nc.creadoEn.toISOString(),
          concepto: "Nota de Débito",
          comprobante: cbteNro,
          debe: nc.montoTotal,
          haber: 0,
          pdfEndpoint: `/api/notas-credito-debito/${nc.id}/pdf`,
        })
      }
      // NC_RECIBIDA / ND_RECIBIDA linked to empresa facturas: skip
    }

    // Sort by fecha ascending
    movimientos.sort((a, b) => a.fechaRaw.getTime() - b.fechaRaw.getTime())

    // Calculate running saldo
    let saldo = 0
    const movimientosConSaldo: Movimiento[] = movimientos.map((m) => {
      saldo += m.debe - m.haber
      return {
        fecha: m.fecha,
        concepto: m.concepto,
        comprobante: m.comprobante,
        debe: m.debe,
        haber: m.haber,
        saldo,
        pdfEndpoint: m.pdfEndpoint,
      }
    })

    const totalDebe = sumarImportes(movimientos.map(m => m.debe))
    const totalHaber = sumarImportes(movimientos.map(m => m.haber))
    const saldoFinal = restarImportes(totalDebe, totalHaber)

    return NextResponse.json({
      empresa,
      movimientos: movimientosConSaldo,
      totalDebe,
      totalHaber,
      saldoFinal,
      desde: desdeDate ? desdeDate.toISOString() : null,
      hasta: hastaDate.toISOString(),
    })
  } catch (error) {
    console.error("[GET /api/empresas/[id]/cuenta-corriente]", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    )
  }
}
