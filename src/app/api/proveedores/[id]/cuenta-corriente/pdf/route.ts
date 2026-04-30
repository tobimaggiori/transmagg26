/**
 * API Route: GET /api/proveedores/[id]/cuenta-corriente/pdf?desde=YYYY-MM-DD&hasta=YYYY-MM-DD
 * Devuelve el PDF (A4) de la cuenta corriente de un proveedor para el período dado.
 * Solo accesible para ADMIN_TRANSMAGG y OPERADOR_TRANSMAGG.
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { esRolInterno } from "@/lib/permissions"
import { sumarImportes, restarImportes } from "@/lib/money"
import { generarPDFCCProveedor, type MovimientoCCProveedorPDF } from "@/lib/pdf-cc-proveedor"
import { obtenerDatosEmisor } from "@/lib/pdf-common"
import type { Rol } from "@/types"

function capitalize(s: string): string {
  if (!s) return s
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function formatearNroExterno(ptoVenta: string | null, nro: string | null): string {
  if (!nro) return ""
  const pv = ptoVenta ? ptoVenta.padStart(4, "0") : null
  const nn = /^\d+$/.test(nro) ? nro.padStart(8, "0") : nro
  return pv ? `${pv}-${nn}` : nn
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
    const proveedor = await prisma.proveedor.findUnique({
      where: { id: params.id },
      select: { id: true, razonSocial: true, cuit: true },
    })
    if (!proveedor) return NextResponse.json({ error: "Proveedor no encontrado" }, { status: 404 })

    const { searchParams } = new URL(request.url)
    const hoy = new Date()

    const desdeParam = searchParams.get("desde")
    const hastaParam = searchParams.get("hasta")
    const desdeDate = desdeParam ? new Date(desdeParam) : null
    const hastaDate = hastaParam ? new Date(hastaParam + "T23:59:59") : hoy

    const rangoFecha = { ...(desdeDate ? { gte: desdeDate } : {}), lte: hastaDate }

    const [facturas, pagos, notas] = await Promise.all([
      prisma.facturaProveedor.findMany({
        where: { proveedorId: params.id, fechaCbte: rangoFecha },
        select: {
          id: true,
          fechaCbte: true,
          total: true,
          nroComprobante: true,
          ptoVenta: true,
          tipoCbte: true,
          esPorCuentaDeFletero: true,
        },
      }),
      prisma.pagoProveedor.findMany({
        where: { facturaProveedor: { proveedorId: params.id }, fecha: rangoFecha, anulado: false },
        select: { id: true, fecha: true, monto: true, tipo: true, observaciones: true },
      }),
      prisma.notaCreditoDebito.findMany({
        where: {
          facturaProveedor: { proveedorId: params.id },
          fechaComprobanteExterno: rangoFecha,
        },
        select: {
          id: true,
          tipo: true,
          fechaComprobanteExterno: true,
          creadoEn: true,
          montoTotal: true,
          nroComprobanteExterno: true,
        },
      }),
    ])

    type MovRaw = Omit<MovimientoCCProveedorPDF, "saldo"> & { fechaRaw: Date }
    const movimientos: MovRaw[] = []

    for (const f of facturas) {
      movimientos.push({
        fechaRaw: f.fechaCbte,
        fecha: f.fechaCbte.toISOString(),
        concepto: f.esPorCuentaDeFletero ? "Factura Proveedor (x cuenta fletero)" : "Factura Proveedor",
        comprobante: `${f.tipoCbte} ${formatearNroExterno(f.ptoVenta, f.nroComprobante) || "s/n"}`,
        debe: f.total,
        haber: 0,
      })
    }

    for (const p of pagos) {
      movimientos.push({
        fechaRaw: p.fecha,
        fecha: p.fecha.toISOString(),
        concepto: `Pago — ${capitalize(p.tipo.toLowerCase().replace(/_/g, " "))}`,
        comprobante: p.observaciones ?? "",
        debe: 0,
        haber: p.monto,
      })
    }

    for (const n of notas) {
      const esNC = n.tipo === "NC_RECIBIDA"
      const esND = n.tipo === "ND_RECIBIDA"
      if (!esNC && !esND) continue
      const fechaRaw = n.fechaComprobanteExterno ?? n.creadoEn
      movimientos.push({
        fechaRaw,
        fecha: fechaRaw.toISOString(),
        concepto: esNC ? "Nota de Crédito" : "Nota de Débito",
        comprobante: n.nroComprobanteExterno ?? "",
        debe: esND ? n.montoTotal : 0,
        haber: esNC ? n.montoTotal : 0,
      })
    }

    movimientos.sort((a, b) => a.fechaRaw.getTime() - b.fechaRaw.getTime())

    let saldo = 0
    const movimientosConSaldo: MovimientoCCProveedorPDF[] = movimientos.map((m) => {
      saldo += m.debe - m.haber
      return { fecha: m.fecha, concepto: m.concepto, comprobante: m.comprobante, debe: m.debe, haber: m.haber, saldo }
    })

    const totalDebe = sumarImportes(movimientos.map((m) => m.debe))
    const totalHaber = sumarImportes(movimientos.map((m) => m.haber))
    const saldoFinal = restarImportes(totalDebe, totalHaber)

    const emisor = await obtenerDatosEmisor()

    const pdf = await generarPDFCCProveedor({
      proveedor,
      movimientos: movimientosConSaldo,
      totalDebe,
      totalHaber,
      saldoFinal,
      desde: desdeDate,
      hasta: hastaDate,
      logo: emisor.logoComprobante,
    })

    const nombreArchivo = `cc-${proveedor.razonSocial.replace(/[^a-zA-Z0-9]+/g, "-").toLowerCase()}.pdf`

    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${nombreArchivo}"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    console.error("[GET /api/proveedores/[id]/cuenta-corriente/pdf]", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    )
  }
}
