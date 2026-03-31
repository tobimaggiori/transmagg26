/**
 * API Route: GET /api/facturas-proveedor
 * Lista facturas de proveedores con filtros opcionales.
 * Solo accesible para ADMIN_TRANSMAGG y OPERADOR_TRANSMAGG.
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { esRolInterno } from "@/lib/permissions"
import type { Rol } from "@/types"

/**
 * GET: NextRequest -> Promise<NextResponse>
 *
 * Dado los query params (desde?, hasta?, proveedorId?, nroComprobante?),
 * devuelve la lista de facturas de proveedores con saldo pendiente calculado.
 * Existe para el módulo de listado de facturas de proveedores con estado de pago.
 *
 * Ejemplos:
 * GET /api/facturas-proveedor (sesión ADMIN_TRANSMAGG)
 * // => 200 [{ id, nroComprobante, proveedor, total, saldoPendiente, estado }]
 * GET /api/facturas-proveedor?proveedorId=p1
 * // => 200 [{ id, nroComprobante, proveedor, total, saldoPendiente }]
 * GET /api/facturas-proveedor (sesión FLETERO)
 * // => 403 { error: "Acceso denegado" }
 */
export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const rol = session.user.rol as Rol
  if (!esRolInterno(rol)) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  try {
    const { searchParams } = new URL(request.url)
    const desde = searchParams.get("desde")
    const hasta = searchParams.get("hasta")
    const proveedorId = searchParams.get("proveedorId")
    const nroComprobante = searchParams.get("nroComprobante")

    const where: {
      fechaCbte?: { gte?: Date; lte?: Date }
      proveedorId?: string
      nroComprobante?: { contains: string }
    } = {}

    if (desde || hasta) {
      where.fechaCbte = {}
      if (desde) where.fechaCbte.gte = new Date(desde)
      if (hasta) where.fechaCbte.lte = new Date(hasta + "T23:59:59")
    }
    if (proveedorId) where.proveedorId = proveedorId
    if (nroComprobante) where.nroComprobante = { contains: nroComprobante }

    const facturas = await prisma.facturaProveedor.findMany({
      where,
      include: {
        proveedor: { select: { id: true, razonSocial: true, cuit: true } },
        pagos: { select: { monto: true } },
      },
      orderBy: { fechaCbte: "desc" },
      take: 200,
    })

    const resultado = facturas.map((f) => {
      const totalPagado = f.pagos.reduce((acc, p) => acc + p.monto, 0)
      const saldoPendiente = Math.max(0, f.total - totalPagado)
      const estado = saldoPendiente <= 0 ? "Pagada" : "Impaga"
      return {
        id: f.id,
        nroComprobante: f.nroComprobante,
        tipoCbte: f.tipoCbte,
        fechaCbte: f.fechaCbte,
        neto: f.neto,
        ivaMonto: f.ivaMonto,
        total: f.total,
        proveedor: f.proveedor,
        saldoPendiente,
        estado,
      }
    })

    return NextResponse.json(resultado)
  } catch (error) {
    console.error("[GET /api/facturas-proveedor]", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
