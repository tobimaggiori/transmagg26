/**
 * API Route: DELETE /api/facturas-proveedor/[id]
 * Elimina una factura de proveedor solo si el libro de IVA del mes no fue generado.
 * Solo accesible para ADMIN_TRANSMAGG y OPERADOR_TRANSMAGG.
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { esRolInterno } from "@/lib/permissions"
import type { Rol } from "@/types"

function formatearMesAnio(mesAnio: string): string {
  const [anio, mes] = mesAnio.split("-")
  const meses = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
  ]
  const nombreMes = meses[parseInt(mes, 10) - 1] ?? mes
  return `${nombreMes} ${anio}`
}

/**
 * DELETE: (NextRequest, { params }) -> Promise<NextResponse>
 *
 * Dado el id de la factura, la elimina con todos sus asientos IVA, ítems y pagos,
 * siempre que el libro de IVA del mes de la factura no haya sido generado.
 * Si el libro ya fue generado devuelve 422.
 *
 * Ejemplos:
 * DELETE /api/facturas-proveedor/uuid (libro no generado) => 200 { ok: true }
 * DELETE /api/facturas-proveedor/uuid (libro generado) => 422 { error: "..." }
 * DELETE /api/facturas-proveedor/uuid-inexistente => 404 { error: "..." }
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const rol = session.user.rol as Rol
  if (!esRolInterno(rol)) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  const { id } = await params

  try {
    const factura = await prisma.facturaProveedor.findUnique({
      where: { id },
      select: { id: true, fechaCbte: true },
    })

    if (!factura) {
      return NextResponse.json({ error: "Factura no encontrada" }, { status: 404 })
    }

    const mesAnio = factura.fechaCbte.toISOString().slice(0, 7)
    const libroGenerado = await prisma.libroIva.findUnique({ where: { mesAnio } })

    if (libroGenerado) {
      return NextResponse.json(
        {
          error: `Esta factura no puede eliminarse porque el libro de IVA de ${formatearMesAnio(mesAnio)} ya fue generado.`,
        },
        { status: 422 }
      )
    }

    // Eliminar en orden para respetar FKs:
    // 1. HistorialPago → PagoProveedor
    // 2. AsientoIva (facturaProvId)
    // 3. GastoFletero (si existe)
    // 4. PagoProveedor
    // 5. FacturaProveedor (ItemFacturaProveedor tiene onDelete: Cascade)

    const pagos = await prisma.pagoProveedor.findMany({
      where: { facturaProveedorId: id },
      select: { id: true },
    })
    const pagoIds = pagos.map((p) => p.id)

    await prisma.$transaction([
      prisma.historialPago.deleteMany({ where: { pagoProveedorId: { in: pagoIds } } }),
      prisma.asientoIva.deleteMany({ where: { facturaProvId: id } }),
      prisma.gastoFletero.deleteMany({ where: { facturaProveedorId: id } }),
      prisma.pagoProveedor.deleteMany({ where: { facturaProveedorId: id } }),
      prisma.facturaProveedor.delete({ where: { id } }),
    ])

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("[DELETE /api/facturas-proveedor/[id]]", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
