/**
 * API Route: GET /api/proveedores/[id]/cuenta-corriente?desde=YYYY-MM-DD&hasta=YYYY-MM-DD
 * Devuelve movimientos cronológicos de la CC de un proveedor.
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
  esPorCuentaDeFletero?: boolean
  fleteroRazonSocial?: string | null
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
 * signedUrl: (string | null | undefined) -> string | null
 *
 * Dada una key de R2 opcional, devuelve el endpoint del signed-url que el
 * client consume. null si no hay key.
 */
function signedUrl(key: string | null | undefined): string | null {
  if (!key) return null
  return `/api/storage/signed-url?key=${encodeURIComponent(key)}`
}

/**
 * formatearNroExterno: (string | null, string | null) -> string
 *
 * Formatea PtoVenta-NroComprobante para comprobantes recibidos (strings).
 * Intenta normalizar a "PPPP-NNNNNNNN" si son numéricos; si no, concatena.
 */
function formatearNroExterno(ptoVenta: string | null, nro: string | null): string {
  if (!nro) return ""
  const pv = ptoVenta ? ptoVenta.padStart(4, "0") : null
  const nn = /^\d+$/.test(nro) ? nro.padStart(8, "0") : nro
  return pv ? `${pv}-${nn}` : nn
}

/**
 * GET: NextRequest { params: { id } } -> Promise<NextResponse>
 *
 * Dado el id de un proveedor y los query params desde/hasta,
 * devuelve los movimientos cronológicos de su cuenta corriente:
 * facturas del proveedor (DEBE — Transmagg le debe), pagos realizados (HABER),
 * NC recibidas (HABER — reducen la deuda con el proveedor) y
 * ND recibidas (DEBE — aumentan la deuda con el proveedor).
 * Incluye pdfEndpoint por fila cuando haya comprobante descargable.
 * Solo accesible para roles internos (ADMIN_TRANSMAGG, OPERADOR_TRANSMAGG).
 *
 * Ejemplos:
 * GET /api/proveedores/p1/cuenta-corriente
 * // => { proveedor, movimientos, totalDebe, totalHaber, saldoFinal, desde, hasta }
 * GET /api/proveedores/noexiste/cuenta-corriente
 * // => 404 { error: "Proveedor no encontrado" }
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
        where: {
          proveedorId: params.id,
          fechaCbte: rangoFecha,
        },
        select: {
          id: true,
          fechaCbte: true,
          total: true,
          nroComprobante: true,
          ptoVenta: true,
          tipoCbte: true,
          pdfS3Key: true,
          esPorCuentaDeFletero: true,
          fletero: { select: { razonSocial: true } },
        },
      }),
      prisma.pagoProveedor.findMany({
        where: {
          facturaProveedor: { proveedorId: params.id },
          fecha: rangoFecha,
          anulado: false,
        },
        select: {
          id: true,
          fecha: true,
          monto: true,
          tipo: true,
          observaciones: true,
          comprobantePdfS3Key: true,
        },
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

    const movimientos: (Omit<Movimiento, "saldo"> & { fechaRaw: Date })[] = []

    for (const f of facturas) {
      movimientos.push({
        fechaRaw: f.fechaCbte,
        fecha: f.fechaCbte.toISOString(),
        concepto: f.esPorCuentaDeFletero ? "Factura Proveedor (x cuenta fletero)" : "Factura Proveedor",
        comprobante: `${f.tipoCbte} ${formatearNroExterno(f.ptoVenta, f.nroComprobante) || "s/n"}`,
        debe: f.total,
        haber: 0,
        pdfEndpoint: signedUrl(f.pdfS3Key),
        esPorCuentaDeFletero: f.esPorCuentaDeFletero,
        fleteroRazonSocial: f.fletero?.razonSocial ?? null,
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
        pdfEndpoint: signedUrl(p.comprobantePdfS3Key),
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
        pdfEndpoint: null,
      })
    }

    movimientos.sort((a, b) => a.fechaRaw.getTime() - b.fechaRaw.getTime())

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
        esPorCuentaDeFletero: m.esPorCuentaDeFletero,
        fleteroRazonSocial: m.fleteroRazonSocial,
      }
    })

    const totalDebe = sumarImportes(movimientos.map((m) => m.debe))
    const totalHaber = sumarImportes(movimientos.map((m) => m.haber))
    const saldoFinal = restarImportes(totalDebe, totalHaber)

    return NextResponse.json({
      proveedor,
      movimientos: movimientosConSaldo,
      totalDebe,
      totalHaber,
      saldoFinal,
      desde: desdeDate ? desdeDate.toISOString() : null,
      hasta: hastaDate.toISOString(),
    })
  } catch (error) {
    console.error("[GET /api/proveedores/[id]/cuenta-corriente]", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    )
  }
}
