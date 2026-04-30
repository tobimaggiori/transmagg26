/**
 * API Route: GET /api/fleteros/[id]/cuenta-corriente?desde=YYYY-MM-DD&hasta=YYYY-MM-DD
 * Devuelve movimientos cronológicos de la CC de un fletero.
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
 * Existe para formatear valores enum (tipoPago / tipo adelanto) para UI.
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
 * formatearNroComprobante: (number | null, number | null) -> string
 *
 * Dado un pto de venta y un nro de comprobante opcionales, devuelve el string
 * canónico "PPPP-NNNNNNNN" (con padStart) o una cadena vacía si falta info.
 *
 * Ejemplos:
 * formatearNroComprobante(1, 42) === "0001-00000042"
 * formatearNroComprobante(null, 42) === ""
 */
function formatearNroComprobante(ptoVenta: number | null, nro: number | null): string {
  if (ptoVenta == null || nro == null) return ""
  return `${String(ptoVenta).padStart(4, "0")}-${String(nro).padStart(8, "0")}`
}

/**
 * signedUrl: (string | null | undefined) -> string | null
 *
 * Dada una key de R2 opcional, devuelve el endpoint de signed-url firmado
 * que el client puede consumir. null si no hay key.
 *
 * Ejemplos:
 * signedUrl("liquidaciones/abc.pdf") === "/api/storage/signed-url?key=liquidaciones%2Fabc.pdf"
 * signedUrl(null) === null
 */
function signedUrl(key: string | null | undefined): string | null {
  if (!key) return null
  return `/api/storage/signed-url?key=${encodeURIComponent(key)}`
}

/**
 * GET: NextRequest { params: { id } } -> Promise<NextResponse>
 *
 * Dado el id de un fletero y los query params desde/hasta,
 * devuelve los movimientos cronológicos de su cuenta corriente:
 * liquidaciones (DEBE — Transmagg le debe), pagos realizados (HABER),
 * notas de crédito/débito vinculadas a sus liquidaciones, gastos ingresados
 * (HABER — reducen lo que Transmagg le debe) y adelantos entregados (HABER).
 * Calcula saldo acumulado por movimiento.
 * Solo accesible para roles internos (ADMIN_TRANSMAGG, OPERADOR_TRANSMAGG).
 *
 * Ejemplos:
 * GET /api/fleteros/f1/cuenta-corriente
 * // => { fletero, movimientos: [...], totalDebe, totalHaber, saldoFinal, desde, hasta }
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

    const desdeParam = searchParams.get("desde")
    const hastaParam = searchParams.get("hasta")

    const desdeDate = desdeParam ? new Date(desdeParam) : null
    const hastaDate = hastaParam ? new Date(hastaParam + "T23:59:59") : hoy

    const rangoFecha = { ...(desdeDate ? { gte: desdeDate } : {}), lte: hastaDate }

    const [liquidaciones, pagos, notasCreditoDebito, gastos, adelantos] = await Promise.all([
      prisma.liquidacion.findMany({
        where: {
          fleteroId: params.id,
          grabadaEn: rangoFecha,
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
          fechaPago: rangoFecha,
          anulado: false,
        },
        select: {
          id: true,
          fechaPago: true,
          monto: true,
          tipoPago: true,
          referencia: true,
          comprobanteS3Key: true,
          ordenPago: { select: { id: true, nro: true, anio: true, pdfS3Key: true } },
        },
      }),
      prisma.notaCreditoDebito.findMany({
        where: {
          liquidacion: { fleteroId: params.id },
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
              pdfS3Key: true,
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
                      ordenPago: {
                        select: { id: true, nro: true, anio: true, pdfS3Key: true },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      }),
      prisma.adelantoFletero.findMany({
        where: {
          fleteroId: params.id,
          fecha: rangoFecha,
        },
        select: {
          id: true,
          fecha: true,
          monto: true,
          tipo: true,
          descripcion: true,
          comprobanteS3Key: true,
        },
      }),
    ])

    const movimientos: (Omit<Movimiento, "saldo"> & { fechaRaw: Date })[] = []

    for (const l of liquidaciones) {
      const nro = formatearNroComprobante(l.ptoVenta, l.nroComprobante)
      movimientos.push({
        fechaRaw: l.grabadaEn,
        fecha: l.grabadaEn.toISOString(),
        concepto: "Liquidación",
        comprobante: nro || "s/n",
        debe: l.total,
        haber: 0,
        pdfEndpoint: `/api/liquidaciones/${l.id}/pdf`,
      })
    }

    for (const p of pagos) {
      const pdfEndpoint = p.ordenPago?.pdfS3Key
        ? signedUrl(p.ordenPago.pdfS3Key)
        : p.ordenPago
        ? `/api/ordenes-pago/${p.ordenPago.id}/pdf`
        : signedUrl(p.comprobanteS3Key)
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
        pdfEndpoint,
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
        pdfEndpoint: `/api/notas-credito-debito/${nc.id}/pdf`,
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
      const pdfEndpointGasto = fp
        ? signedUrl(fp.pdfS3Key)
        : opDescuento?.pdfS3Key
        ? signedUrl(opDescuento.pdfS3Key)
        : opDescuento
        ? `/api/ordenes-pago/${opDescuento.id}/pdf`
        : null
      movimientos.push({
        fechaRaw: fp?.fechaCbte ?? g.creadoEn,
        fecha: (fp?.fechaCbte ?? g.creadoEn).toISOString(),
        concepto: fp
          ? `Gasto ${g.tipo} — ${fp.proveedor.razonSocial}`
          : `Gasto ${g.tipo} — ${g.descripcion ?? "Sin factura"}`,
        comprobante: comprobanteGasto,
        debe: 0,
        haber: g.montoPagado,
        pdfEndpoint: pdfEndpointGasto,
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
        pdfEndpoint: signedUrl(a.comprobanteS3Key),
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
        pdfEndpoint: m.pdfEndpoint,
      }
    })

    const totalDebe = sumarImportes(movimientos.map(m => m.debe))
    const totalHaber = sumarImportes(movimientos.map(m => m.haber))
    const saldoFinal = restarImportes(totalDebe, totalHaber)

    return NextResponse.json({
      fletero,
      movimientos: movimientosConSaldo,
      totalDebe,
      totalHaber,
      saldoFinal,
      desde: desdeDate ? desdeDate.toISOString() : null,
      hasta: hastaDate.toISOString(),
    })
  } catch (error) {
    console.error("[GET /api/fleteros/[id]/cuenta-corriente]", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    )
  }
}
