/**
 * GET /api/tarjetas/gastos-sin-asignar
 *
 * Devuelve pagos registrados con tarjeta que aún no fueron incluidos
 * en ningún cierre de resumen:
 *   - PagoProveedor con tipo="TARJETA" y anulado=false
 *   - PagoImpuesto con medioPago="TARJETA"
 */

import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { esRolInterno } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"
import type { Rol } from "@/types"

export async function GET(): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (!esRolInterno((session.user.rol ?? "") as Rol))
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  try {
    // IDs de facturas de proveedor ya incluidas en algún cierre
    const facturasProveedorEnCierre = await prisma.pagoFacturaTarjeta.findMany({
      where: { facturaProveedorId: { not: null } },
      select: { facturaProveedorId: true },
    })
    const idsProveedorEnCierre = new Set(
      facturasProveedorEnCierre.map((p) => p.facturaProveedorId).filter(Boolean)
    )

    // IDs de facturas de seguro ya incluidas en algún cierre
    const [pagosProveedor, pagosImpuesto] = await Promise.all([
      // Pagos a proveedor hechos con tarjeta, no anulados
      prisma.pagoProveedor.findMany({
        where: { tipo: "TARJETA", anulado: false },
        include: {
          facturaProveedor: {
            select: {
              id: true,
              nroComprobante: true,
              tipoCbte: true,
              ptoVenta: true,
              total: true,
              proveedor: { select: { razonSocial: true } },
            },
          },
          tarjeta: { select: { id: true, nombre: true } },
        },
        orderBy: { fecha: "desc" },
      }),
      // Pagos de impuestos hechos con tarjeta
      prisma.pagoImpuesto.findMany({
        where: { medioPago: "TARJETA" },
        include: {
          tarjeta: { select: { id: true, nombre: true } },
        },
        orderBy: { fechaPago: "desc" },
      }),
    ])

    // Filtrar pagos proveedor cuya factura NO está en un cierre
    const proveedorSinAsignar = pagosProveedor
      .filter((p) => !idsProveedorEnCierre.has(p.facturaProveedorId))
      .map((p) => ({
        id: p.id,
        origen: "PROVEEDOR" as const,
        descripcion: `${p.facturaProveedor.proveedor.razonSocial} — ${p.facturaProveedor.tipoCbte}-${p.facturaProveedor.ptoVenta}-${p.facturaProveedor.nroComprobante}`,
        monto: p.monto,
        fecha: p.fecha,
        tarjetaNombre: p.tarjeta?.nombre ?? "Sin tarjeta",
        tarjetaId: p.tarjeta?.id ?? null,
      }))

    const impuestoSinAsignar = pagosImpuesto.map((p) => ({
      id: p.id,
      origen: "IMPUESTO" as const,
      descripcion: `${p.tipoImpuesto}${p.descripcion ? ` — ${p.descripcion}` : ""} (${p.periodo})`,
      monto: p.monto,
      fecha: p.fechaPago,
      tarjetaNombre: p.tarjeta?.nombre ?? "Sin tarjeta",
      tarjetaId: p.tarjeta?.id ?? null,
    }))

    const gastos = [...proveedorSinAsignar, ...impuestoSinAsignar]
    gastos.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())

    return NextResponse.json(gastos)
  } catch (error) {
    console.error("GET /api/tarjetas/gastos-sin-asignar error:", error)
    return NextResponse.json({ error: "Error al obtener gastos sin asignar" }, { status: 500 })
  }
}
