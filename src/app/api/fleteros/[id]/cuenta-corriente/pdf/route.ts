/**
 * API Route: GET /api/fleteros/[id]/cuenta-corriente/pdf?desde=YYYY-MM-DD&hasta=YYYY-MM-DD
 * Devuelve el PDF (A4) de la cuenta corriente de un fletero para el período dado.
 * Solo accesible para ADMIN_TRANSMAGG y OPERADOR_TRANSMAGG.
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { esRolInterno } from "@/lib/permissions"
import { sumarImportes, restarImportes } from "@/lib/money"
import { generarPDFCCFletero, type MovimientoCCFleteroPDF } from "@/lib/pdf-cc-fletero"
import { obtenerDatosEmisor } from "@/lib/pdf-common"
import type { Rol } from "@/types"

function capitalize(s: string): string {
  if (!s) return s
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function formatearNroComprobante(ptoVenta: number | null, nro: number | null): string {
  if (ptoVenta == null || nro == null) return ""
  return `${String(ptoVenta).padStart(4, "0")}-${String(nro).padStart(8, "0")}`
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
    const fletero = await prisma.fletero.findUnique({
      where: { id: params.id },
      select: { id: true, razonSocial: true, cuit: true },
    })
    if (!fletero) return NextResponse.json({ error: "Fletero no encontrado" }, { status: 404 })

    const { searchParams } = new URL(request.url)
    const hoy = new Date()

    const desdeParam = searchParams.get("desde")
    const hastaParam = searchParams.get("hasta")
    const desdeDate = desdeParam ? new Date(desdeParam) : null
    const hastaDate = hastaParam ? new Date(hastaParam + "T23:59:59") : hoy

    const rangoFecha = { ...(desdeDate ? { gte: desdeDate } : {}), lte: hastaDate }

    const [liquidaciones, pagos, notasCreditoDebito, gastos, adelantos] = await Promise.all([
      prisma.liquidacion.findMany({
        where: { fleteroId: params.id, grabadaEn: rangoFecha },
        select: { id: true, grabadaEn: true, total: true, nroComprobante: true, ptoVenta: true },
      }),
      prisma.pagoAFletero.findMany({
        where: { fleteroId: params.id, fechaPago: rangoFecha, anulado: false },
        select: {
          id: true,
          fechaPago: true,
          monto: true,
          tipoPago: true,
          referencia: true,
          ordenPago: { select: { nro: true, anio: true } },
        },
      }),
      prisma.notaCreditoDebito.findMany({
        where: { liquidacion: { fleteroId: params.id }, creadoEn: rangoFecha },
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
      prisma.gastoFletero.findMany({
        where: {
          fleteroId: params.id,
          OR: [
            { facturaProveedor: { fechaCbte: rangoFecha } },
            { sinFactura: true, creadoEn: rangoFecha },
          ],
        },
        select: {
          id: true,
          montoPagado: true,
          tipo: true,
          descripcion: true,
          creadoEn: true,
          facturaProveedor: {
            select: {
              fechaCbte: true,
              tipoCbte: true,
              nroComprobante: true,
              proveedor: { select: { razonSocial: true } },
            },
          },
          descuentos: {
            orderBy: { fecha: "asc" },
            take: 1,
            select: {
              liquidacion: {
                select: {
                  pagos: {
                    where: { anulado: false, ordenPagoId: { not: null } },
                    take: 1,
                    select: {
                      ordenPago: { select: { nro: true, anio: true } },
                    },
                  },
                },
              },
            },
          },
        },
      }),
      prisma.adelantoFletero.findMany({
        where: { fleteroId: params.id, fecha: rangoFecha },
        select: { id: true, fecha: true, monto: true, tipo: true, descripcion: true },
      }),
    ])

    type MovRaw = Omit<MovimientoCCFleteroPDF, "saldo"> & { fechaRaw: Date }
    const movimientos: MovRaw[] = []

    for (const l of liquidaciones) {
      const nro = formatearNroComprobante(l.ptoVenta, l.nroComprobante)
      movimientos.push({
        fechaRaw: l.grabadaEn,
        fecha: l.grabadaEn.toISOString(),
        concepto: "Liquidación",
        comprobante: nro || "s/n",
        debe: l.total,
        haber: 0,
      })
    }

    for (const p of pagos) {
      const comprobante = p.ordenPago
        ? `OP ${p.ordenPago.nro}-${p.ordenPago.anio}`
        : p.referencia ?? ""
      movimientos.push({
        fechaRaw: p.fechaPago,
        fecha: p.fechaPago.toISOString(),
        concepto: `Pago — ${capitalize(p.tipoPago.toLowerCase().replace(/_/g, " "))}`,
        comprobante,
        debe: 0,
        haber: p.monto,
      })
    }

    for (const nc of notasCreditoDebito) {
      const cbteNro = formatearNroComprobante(nc.ptoVenta, nc.nroComprobante) || (nc.nroComprobanteExterno ?? "")
      const esCredito = nc.tipo === "NC_EMITIDA" || nc.tipo === "NC_RECIBIDA"
      const esDebito = nc.tipo === "ND_EMITIDA" || nc.tipo === "ND_RECIBIDA"
      if (!esCredito && !esDebito) continue
      movimientos.push({
        fechaRaw: nc.creadoEn,
        fecha: nc.creadoEn.toISOString(),
        concepto: esCredito ? "Nota de Crédito" : "Nota de Débito",
        comprobante: cbteNro,
        debe: esCredito ? 0 : nc.montoTotal,
        haber: esCredito ? nc.montoTotal : 0,
      })
    }

    for (const g of gastos) {
      const fp = g.facturaProveedor
      const opDescuento = g.descuentos[0]?.liquidacion.pagos[0]?.ordenPago ?? null
      const comprobanteGasto = fp
        ? `${fp.tipoCbte} ${fp.nroComprobante ?? "s/n"}`
        : opDescuento
        ? `OP ${opDescuento.nro}-${opDescuento.anio}`
        : ""
      movimientos.push({
        fechaRaw: fp?.fechaCbte ?? g.creadoEn,
        fecha: (fp?.fechaCbte ?? g.creadoEn).toISOString(),
        concepto: fp
          ? `Gasto ${g.tipo} — ${fp.proveedor.razonSocial}`
          : `Gasto ${g.tipo} — ${g.descripcion ?? "Sin factura"}`,
        comprobante: comprobanteGasto,
        debe: 0,
        haber: g.montoPagado,
      })
    }

    for (const a of adelantos) {
      movimientos.push({
        fechaRaw: a.fecha,
        fecha: a.fecha.toISOString(),
        concepto: `Adelanto — ${capitalize(a.tipo.toLowerCase().replace(/_/g, " "))}`,
        comprobante: a.descripcion ?? "",
        debe: 0,
        haber: a.monto,
      })
    }

    movimientos.sort((a, b) => a.fechaRaw.getTime() - b.fechaRaw.getTime())

    let saldo = 0
    const movimientosConSaldo: MovimientoCCFleteroPDF[] = movimientos.map((m) => {
      saldo += m.debe - m.haber
      return { fecha: m.fecha, concepto: m.concepto, comprobante: m.comprobante, debe: m.debe, haber: m.haber, saldo }
    })

    const totalDebe = sumarImportes(movimientos.map(m => m.debe))
    const totalHaber = sumarImportes(movimientos.map(m => m.haber))
    const saldoFinal = restarImportes(totalDebe, totalHaber)

    const emisor = await obtenerDatosEmisor()

    const pdf = await generarPDFCCFletero({
      fletero,
      movimientos: movimientosConSaldo,
      totalDebe,
      totalHaber,
      saldoFinal,
      desde: desdeDate,
      hasta: hastaDate,
      logo: emisor.logoComprobante,
    })

    const nombreArchivo = `cc-${fletero.razonSocial.replace(/[^a-zA-Z0-9]+/g, "-").toLowerCase()}.pdf`

    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${nombreArchivo}"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    console.error("[GET /api/fleteros/[id]/cuenta-corriente/pdf]", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    )
  }
}
