/**
 * GET /api/proveedores/[id]/facturas-pendientes
 *
 * Devuelve las facturas con estadoPago IN ['PENDIENTE', 'PARCIALMENTE_PAGADA']
 * del proveedor, con saldoPendiente calculado.
 * Solo accesible para ADMIN_TRANSMAGG y OPERADOR_TRANSMAGG.
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { esRolInterno } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"
import type { Rol } from "@/types"

/**
 * GET: NextRequest, { params } -> Promise<NextResponse>
 *
 * Devuelve facturas pendientes de pago del proveedor.
 *
 * Ejemplos:
 * GET /api/proveedores/p1/facturas-pendientes
 * // => [{ id, nroComprobante, tipoCbte, total, totalPagado, saldoPendiente, estadoPago, fechaCbte, concepto }]
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (!esRolInterno((session.user.rol ?? "") as Rol))
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  const { id: proveedorId } = await params

  try {
    const facturas = await prisma.facturaProveedor.findMany({
      where: {
        proveedorId,
        estadoPago: { in: ["PENDIENTE", "PARCIALMENTE_PAGADA"] },
      },
      include: {
        pagos: { select: { monto: true } },
      },
      orderBy: { fechaCbte: "asc" },
    })

    const resultado = facturas.map((f) => {
      const totalPagado = f.pagos.reduce((acc, p) => acc + p.monto, 0)
      const saldoPendiente = Math.max(0, f.total - totalPagado)
      return {
        id: f.id,
        nroComprobante: f.nroComprobante,
        tipoCbte: f.tipoCbte,
        fechaCbte: f.fechaCbte,
        concepto: f.concepto,
        total: f.total,
        totalPagado,
        saldoPendiente,
        estadoPago: f.estadoPago,
        pdfS3Key: f.pdfS3Key,
      }
    })

    return NextResponse.json(resultado)
  } catch (error) {
    console.error(`GET /api/proveedores/${proveedorId}/facturas-pendientes error:`, error)
    return NextResponse.json({ error: "Error al obtener facturas", detail: String(error) }, { status: 500 })
  }
}
