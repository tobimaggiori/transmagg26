/**
 * API Route: GET /api/empresas/[id]/cuenta-corriente/pdf?desde=YYYY-MM-DD&hasta=YYYY-MM-DD
 * Devuelve el PDF (A4) de la cuenta corriente de una empresa para el período dado.
 * Solo accesible para ADMIN_TRANSMAGG y OPERADOR_TRANSMAGG.
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { esRolInterno } from "@/lib/permissions"
import { sumarImportes, restarImportes } from "@/lib/money"
import { generarPDFCCEmpresa, type MovimientoCCEmpresaPDF } from "@/lib/pdf-cc-empresa"
import { obtenerDatosEmisor } from "@/lib/pdf-common"
import type { Rol } from "@/types"

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

    const rangoFechaObj = { ...(desdeDate ? { gte: desdeDate } : {}), lte: hastaDate }

    const [facturas, pagos, notasCreditoDebito] = await Promise.all([
      prisma.facturaEmitida.findMany({
        where: { empresaId: params.id, emitidaEn: rangoFechaObj },
        select: { id: true, emitidaEn: true, total: true, nroComprobante: true, tipoCbte: true },
      }),
      prisma.pagoDeEmpresa.findMany({
        where: { empresaId: params.id, fechaPago: rangoFechaObj },
        select: { id: true, fechaPago: true, monto: true, tipoPago: true, referencia: true },
      }),
      prisma.notaCreditoDebito.findMany({
        where: { factura: { empresaId: params.id }, creadoEn: rangoFechaObj },
        select: { id: true, creadoEn: true, tipo: true, montoTotal: true, nroComprobante: true, ptoVenta: true, nroComprobanteExterno: true },
      }),
    ])

    type MovRaw = Omit<MovimientoCCEmpresaPDF, "saldo"> & { fechaRaw: Date }
    const movimientos: MovRaw[] = []

    for (const f of facturas) {
      movimientos.push({
        fechaRaw: f.emitidaEn,
        fecha: f.emitidaEn.toISOString(),
        concepto: conceptoFactura(f.tipoCbte),
        comprobante: `${f.tipoCbte} ${f.nroComprobante ?? "s/n"}`,
        debe: f.total,
        haber: 0,
      })
    }
    for (const p of pagos) {
      movimientos.push({
        fechaRaw: p.fechaPago,
        fecha: p.fechaPago.toISOString(),
        concepto: `Pago — ${capitalize(p.tipoPago.toLowerCase().replace(/_/g, " "))}`,
        comprobante: p.referencia ?? "",
        debe: 0,
        haber: p.monto,
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
          haber: nc.montoTotal,
        })
      } else if (nc.tipo === "ND_EMITIDA") {
        movimientos.push({
          fechaRaw: nc.creadoEn,
          fecha: nc.creadoEn.toISOString(),
          concepto: "Nota de Débito",
          comprobante: cbteNro,
          debe: nc.montoTotal,
          haber: 0,
        })
      }
    }

    movimientos.sort((a, b) => a.fechaRaw.getTime() - b.fechaRaw.getTime())

    let saldo = 0
    const movimientosConSaldo: MovimientoCCEmpresaPDF[] = movimientos.map((m) => {
      saldo += m.debe - m.haber
      return { fecha: m.fecha, concepto: m.concepto, comprobante: m.comprobante, debe: m.debe, haber: m.haber, saldo }
    })

    const totalDebe = sumarImportes(movimientos.map(m => m.debe))
    const totalHaber = sumarImportes(movimientos.map(m => m.haber))
    const saldoFinal = restarImportes(totalDebe, totalHaber)

    const emisor = await obtenerDatosEmisor()

    const pdf = await generarPDFCCEmpresa({
      empresa,
      movimientos: movimientosConSaldo,
      totalDebe,
      totalHaber,
      saldoFinal,
      desde: desdeDate,
      hasta: hastaDate,
      logo: emisor.logoComprobante,
    })

    const nombreArchivo = `cc-${empresa.razonSocial.replace(/[^a-zA-Z0-9]+/g, "-").toLowerCase()}.pdf`

    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${nombreArchivo}"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    console.error("[GET /api/empresas/[id]/cuenta-corriente/pdf]", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    )
  }
}
