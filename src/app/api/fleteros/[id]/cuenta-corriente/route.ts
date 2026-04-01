/**
 * API Route: GET /api/fleteros/[id]/cuenta-corriente?desde=YYYY-MM-DD&hasta=YYYY-MM-DD
 * Devuelve movimientos cronológicos de la CC de un fletero.
 * Solo accesible para ADMIN_TRANSMAGG y OPERADOR_TRANSMAGG.
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { esRolInterno } from "@/lib/permissions"
import type { Rol } from "@/types"

interface Movimiento {
  fecha: string
  concepto: string
  comprobante: string
  debe: number
  haber: number
  saldo: number
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
 * GET: NextRequest { params: { id } } -> Promise<NextResponse>
 *
 * Dado el id de un fletero y los query params desde/hasta,
 * devuelve los movimientos cronológicos de su cuenta corriente:
 * liquidaciones (DEBE — Transmagg le debe), pagos realizados (HABER),
 * y notas de crédito/débito vinculadas a sus liquidaciones.
 * Solo accesible para roles internos (ADMIN_TRANSMAGG, OPERADOR_TRANSMAGG).
 *
 * Ejemplos:
 * GET /api/fleteros/f1/cuenta-corriente
 * // => { fletero, movimientos: [...], totalDebe, totalHaber, saldoFinal }
 * GET /api/fleteros/noexiste/cuenta-corriente
 * // => 404 { error: "Fletero no encontrado" }
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
    const fletero = await prisma.fletero.findUnique({
      where: { id: params.id },
      select: { id: true, razonSocial: true, cuit: true },
    })
    if (!fletero) return NextResponse.json({ error: "Fletero no encontrado" }, { status: 404 })

    const { searchParams } = new URL(request.url)
    const hoy = new Date()
    const noventa = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)

    const desdeParam = searchParams.get("desde")
    const hastaParam = searchParams.get("hasta")

    const desdeDate = desdeParam ? new Date(desdeParam) : noventa
    const hastaDate = hastaParam ? new Date(hastaParam + "T23:59:59") : hoy

    const [liquidaciones, pagos, notasCreditoDebito, gastosFletero, gastoDescuentos] = await Promise.all([
      prisma.liquidacion.findMany({
        where: {
          fleteroId: params.id,
          estado: { not: "ANULADA" },
          grabadaEn: { gte: desdeDate, lte: hastaDate },
        },
        select: {
          id: true,
          grabadaEn: true,
          total: true,
          nroComprobante: true,
          ptoVenta: true,
        },
      }),
      prisma.pagoAFletero.findMany({
        where: {
          fleteroId: params.id,
          fechaPago: { gte: desdeDate, lte: hastaDate },
          anulado: false,
        },
        select: {
          id: true,
          fechaPago: true,
          monto: true,
          tipoPago: true,
          referencia: true,
        },
      }),
      prisma.notaCreditoDebito.findMany({
        where: {
          estado: { not: "ANULADA" },
          liquidacion: { fleteroId: params.id },
          creadoEn: { gte: desdeDate, lte: hastaDate },
        },
        select: {
          id: true,
          creadoEn: true,
          tipo: true,
          montoTotal: true,
          nroComprobanteExterno: true,
        },
      }),
      prisma.gastoFletero.findMany({
        where: {
          fleteroId: params.id,
          facturaProveedor: { fechaCbte: { gte: desdeDate, lte: hastaDate } },
        },
        select: {
          id: true,
          montoPagado: true,
          tipo: true,
          facturaProveedor: {
            select: {
              fechaCbte: true,
              tipoCbte: true,
              nroComprobante: true,
              proveedor: { select: { razonSocial: true } },
            },
          },
        },
      }),
      prisma.gastoDescuento.findMany({
        where: {
          gasto: { fleteroId: params.id },
          fecha: { gte: desdeDate, lte: hastaDate },
        },
        select: {
          id: true,
          montoDescontado: true,
          fecha: true,
          liquidacion: { select: { nroComprobante: true, ptoVenta: true } },
        },
      }),
    ])

    const movimientos: (Omit<Movimiento, "saldo"> & { fechaRaw: Date })[] = []

    for (const l of liquidaciones) {
      movimientos.push({
        fechaRaw: l.grabadaEn,
        fecha: l.grabadaEn.toISOString(),
        concepto: "Liquidación",
        comprobante: `${l.ptoVenta ?? 1}-${l.nroComprobante ?? "s/n"}`,
        debe: l.total,
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
      if (nc.tipo === "NC_RECIBIDA") {
        // Reduce lo que Transmagg le debe al fletero
        movimientos.push({
          fechaRaw: nc.creadoEn,
          fecha: nc.creadoEn.toISOString(),
          concepto: "Nota de Crédito",
          comprobante: nc.nroComprobanteExterno ?? "",
          debe: 0,
          haber: nc.montoTotal,
        })
      } else if (nc.tipo === "ND_RECIBIDA") {
        // Aumenta lo que Transmagg le debe al fletero
        movimientos.push({
          fechaRaw: nc.creadoEn,
          fecha: nc.creadoEn.toISOString(),
          concepto: "Nota de Débito",
          comprobante: nc.nroComprobanteExterno ?? "",
          debe: nc.montoTotal,
          haber: 0,
        })
      } else if (nc.tipo === "NC_EMITIDA") {
        movimientos.push({
          fechaRaw: nc.creadoEn,
          fecha: nc.creadoEn.toISOString(),
          concepto: "Nota de Crédito Emitida",
          comprobante: nc.nroComprobanteExterno ?? "",
          debe: 0,
          haber: nc.montoTotal,
        })
      } else if (nc.tipo === "ND_EMITIDA") {
        movimientos.push({
          fechaRaw: nc.creadoEn,
          fecha: nc.creadoEn.toISOString(),
          concepto: "Nota de Débito Emitida",
          comprobante: nc.nroComprobanteExterno ?? "",
          debe: nc.montoTotal,
          haber: 0,
        })
      }
    }

    for (const g of gastosFletero) {
      movimientos.push({
        fechaRaw: g.facturaProveedor.fechaCbte,
        fecha: g.facturaProveedor.fechaCbte.toISOString(),
        concepto: `Gasto ${g.tipo} — ${g.facturaProveedor.proveedor.razonSocial}`,
        comprobante: `${g.facturaProveedor.tipoCbte} ${g.facturaProveedor.nroComprobante ?? "s/n"}`,
        debe: g.montoPagado,
        haber: 0,
      })
    }

    for (const d of gastoDescuentos) {
      const nroLiq =
        d.liquidacion.ptoVenta != null && d.liquidacion.nroComprobante != null
          ? `Liq. ${String(d.liquidacion.ptoVenta).padStart(4, "0")}-${String(d.liquidacion.nroComprobante).padStart(8, "0")}`
          : "Liquidación s/n"
      movimientos.push({
        fechaRaw: d.fecha,
        fecha: d.fecha.toISOString(),
        concepto: "Descuento gasto",
        comprobante: nroLiq,
        debe: 0,
        haber: d.montoDescontado,
      })
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
      }
    })

    const totalDebe = movimientos.reduce((acc, m) => acc + m.debe, 0)
    const totalHaber = movimientos.reduce((acc, m) => acc + m.haber, 0)
    const saldoFinal = totalDebe - totalHaber

    return NextResponse.json({
      fletero,
      movimientos: movimientosConSaldo,
      totalDebe,
      totalHaber,
      saldoFinal,
    })
  } catch (error) {
    console.error("[GET /api/fleteros/[id]/cuenta-corriente]", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    )
  }
}
