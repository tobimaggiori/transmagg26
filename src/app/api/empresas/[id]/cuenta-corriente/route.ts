/**
 * API Route: GET /api/empresas/[id]/cuenta-corriente?desde=YYYY-MM-DD&hasta=YYYY-MM-DD
 * Devuelve movimientos cronológicos de la CC de una empresa.
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
    const noventa = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)

    const desdeParam = searchParams.get("desde")
    const hastaParam = searchParams.get("hasta")

    const desdeDate = desdeParam ? new Date(desdeParam) : noventa
    const hastaDate = hastaParam ? new Date(hastaParam + "T23:59:59") : hoy

    const [facturas, pagos, notasCreditoDebito] = await Promise.all([
      prisma.facturaEmitida.findMany({
        where: {
          empresaId: params.id,
          estado: { not: "ANULADA" },
          emitidaEn: { gte: desdeDate, lte: hastaDate },
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
          fechaPago: { gte: desdeDate, lte: hastaDate },
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
          factura: { empresaId: params.id },
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
    ])

    const movimientos: (Omit<Movimiento, "saldo"> & { fechaRaw: Date })[] = []

    for (const f of facturas) {
      movimientos.push({
        fechaRaw: f.emitidaEn,
        fecha: f.emitidaEn.toISOString(),
        concepto: "Factura",
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
      if (nc.tipo === "NC_EMITIDA") {
        movimientos.push({
          fechaRaw: nc.creadoEn,
          fecha: nc.creadoEn.toISOString(),
          concepto: "Nota de Crédito",
          comprobante: nc.nroComprobanteExterno ?? "",
          debe: 0,
          haber: nc.montoTotal,
        })
      } else if (nc.tipo === "ND_EMITIDA") {
        movimientos.push({
          fechaRaw: nc.creadoEn,
          fecha: nc.creadoEn.toISOString(),
          concepto: "Nota de Débito",
          comprobante: nc.nroComprobanteExterno ?? "",
          debe: nc.montoTotal,
          haber: 0,
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
      }
    })

    const totalDebe = movimientos.reduce((acc, m) => acc + m.debe, 0)
    const totalHaber = movimientos.reduce((acc, m) => acc + m.haber, 0)
    const saldoFinal = totalDebe - totalHaber

    return NextResponse.json({
      empresa,
      movimientos: movimientosConSaldo,
      totalDebe,
      totalHaber,
      saldoFinal,
    })
  } catch (error) {
    console.error("[GET /api/empresas/[id]/cuenta-corriente]", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    )
  }
}
