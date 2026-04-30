/**
 * GET /api/jm/empresas/[id]/cuenta-corriente?desde=YYYY-MM-DD&hasta=YYYY-MM-DD
 * Movimientos cronológicos de la CC de una empresa JM.
 * Adaptado del de Transmagg (sin LP, solo facturas + pagos + NC/ND).
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prismaJm } from "@/jm/prisma"
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

function capitalize(s: string): string {
  if (!s) return s
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function conceptoFactura(tipoCbte: number): string {
  if (tipoCbte === 1) return "Factura A"
  if (tipoCbte === 6) return "Factura B"
  if (tipoCbte === 201) return "Factura MiPyme"
  return "Factura"
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (!esRolInterno(session.user.rol as Rol)) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  try {
    const empresa = await prismaJm.empresa.findUnique({
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
      prismaJm.facturaEmitida.findMany({
        where: { empresaId: params.id, emitidaEn: rangoFecha },
        select: { id: true, emitidaEn: true, total: true, nroComprobante: true, tipoCbte: true },
      }),
      prismaJm.pagoDeEmpresa.findMany({
        where: { empresaId: params.id, fechaPago: rangoFecha },
        select: { id: true, fechaPago: true, monto: true, tipoPago: true, referencia: true, comprobanteS3Key: true },
      }),
      prismaJm.notaCreditoDebito.findMany({
        where: { factura: { empresaId: params.id }, creadoEn: rangoFecha },
        select: { id: true, creadoEn: true, tipo: true, montoTotal: true, nroComprobante: true, ptoVenta: true, nroComprobanteExterno: true },
      }),
      prismaJm.reciboCobranza.findMany({
        where: { empresaId: params.id },
        select: { id: true, nro: true, ptoVenta: true },
      }),
    ])

    const reciboPorNro = new Map<string, string>()
    for (const r of recibos) reciboPorNro.set(`${r.ptoVenta}-${r.nro}`, r.id)
    const resolverReciboId = (referencia: string | null): string | null => {
      if (!referencia) return null
      const mm = referencia.match(/Recibo (\d+)-(\d+)/)
      if (!mm) return null
      return reciboPorNro.get(`${parseInt(mm[1])}-${parseInt(mm[2])}`) ?? null
    }

    const movimientos: (Omit<Movimiento, "saldo"> & { fechaRaw: Date })[] = []

    for (const f of facturas) {
      movimientos.push({
        fechaRaw: f.emitidaEn,
        fecha: f.emitidaEn.toISOString(),
        concepto: conceptoFactura(f.tipoCbte),
        comprobante: `${f.tipoCbte} ${f.nroComprobante ?? "s/n"}`,
        debe: Number(f.total),
        haber: 0,
        pdfEndpoint: `/api/jm/facturas/${f.id}/pdf`,
      })
    }

    for (const p of pagos) {
      const reciboId = resolverReciboId(p.referencia)
      const pdfEndpoint = reciboId ? `/api/jm/recibos-cobranza/${reciboId}/pdf` : null
      movimientos.push({
        fechaRaw: p.fechaPago,
        fecha: p.fechaPago.toISOString(),
        concepto: `Pago — ${capitalize(p.tipoPago.toLowerCase().replace(/_/g, " "))}`,
        comprobante: p.referencia ?? "",
        debe: 0,
        haber: Number(p.monto),
        pdfEndpoint,
      })
    }

    for (const nc of notasCreditoDebito) {
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
          haber: Number(nc.montoTotal),
          pdfEndpoint: `/api/jm/notas-credito-debito/${nc.id}/pdf`,
        })
      } else if (nc.tipo === "ND_EMITIDA") {
        movimientos.push({
          fechaRaw: nc.creadoEn,
          fecha: nc.creadoEn.toISOString(),
          concepto: "Nota de Débito",
          comprobante: cbteNro,
          debe: Number(nc.montoTotal),
          haber: 0,
          pdfEndpoint: `/api/jm/notas-credito-debito/${nc.id}/pdf`,
        })
      }
    }

    movimientos.sort((a, b) => a.fechaRaw.getTime() - b.fechaRaw.getTime())

    let saldo = 0
    const movimientosConSaldo: Movimiento[] = movimientos.map((m) => {
      saldo += m.debe - m.haber
      return { fecha: m.fecha, concepto: m.concepto, comprobante: m.comprobante, debe: m.debe, haber: m.haber, saldo, pdfEndpoint: m.pdfEndpoint }
    })

    const totalDebe = sumarImportes(movimientos.map(m => m.debe))
    const totalHaber = sumarImportes(movimientos.map(m => m.haber))
    const saldoFinal = restarImportes(totalDebe, totalHaber)

    return NextResponse.json({
      empresa,
      movimientos: movimientosConSaldo,
      totalDebe, totalHaber, saldoFinal,
      desde: desdeDate ? desdeDate.toISOString() : null,
      hasta: hastaDate.toISOString(),
    })
  } catch (error) {
    console.error("[GET /api/jm/empresas/[id]/cuenta-corriente]", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Error" }, { status: 500 })
  }
}
