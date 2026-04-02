/**
 * GET /api/tarjetas/facturas-pendientes
 * Devuelve facturas de proveedor y seguro con estadoPago IN [PENDIENTE_TARJETA, PAGADA_PARCIAL].
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
    const [facturasProveedor, facturasSeguro] = await Promise.all([
      prisma.facturaProveedor.findMany({
        where: { estadoPago: { in: ["PENDIENTE_TARJETA", "PAGADA_PARCIAL"] } },
        include: {
          proveedor: { select: { razonSocial: true } },
          pagosTarjeta: { select: { montoPagado: true } },
        },
        orderBy: { fechaCbte: "desc" },
      }),
      prisma.facturaSeguro.findMany({
        where: { estadoPago: { in: ["PENDIENTE_TARJETA", "PAGADA_PARCIAL"] } },
        include: {
          aseguradora: { select: { razonSocial: true } },
          pagosTarjeta: { select: { montoPagado: true } },
        },
        orderBy: { fecha: "desc" },
      }),
    ])

    const pendientes = [
      ...facturasProveedor.map((f) => ({
        id: f.id,
        tipo: "PROVEEDOR" as const,
        razonSocial: f.proveedor.razonSocial,
        nroComprobante: `${f.tipoCbte}-${f.ptoVenta}-${f.nroComprobante}`,
        fecha: f.fechaCbte,
        total: f.total,
        pagado: f.pagosTarjeta.reduce((sum, p) => sum + p.montoPagado, 0),
        pendiente: f.total - f.pagosTarjeta.reduce((sum, p) => sum + p.montoPagado, 0),
        estadoPago: f.estadoPago,
      })),
      ...facturasSeguro.map((f) => ({
        id: f.id,
        tipo: "SEGURO" as const,
        razonSocial: f.aseguradora.razonSocial,
        nroComprobante: `${f.tipoComprobante}-${f.nroComprobante}`,
        fecha: f.fecha,
        total: f.total,
        pagado: f.pagosTarjeta.reduce((sum, p) => sum + p.montoPagado, 0),
        pendiente: f.total - f.pagosTarjeta.reduce((sum, p) => sum + p.montoPagado, 0),
        estadoPago: f.estadoPago,
      })),
    ]

    pendientes.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())

    return NextResponse.json(pendientes)
  } catch (error) {
    console.error("GET /api/tarjetas/facturas-pendientes error:", error)
    return NextResponse.json({ error: "Error al obtener facturas pendientes" }, { status: 500 })
  }
}
