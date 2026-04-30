/**
 * GET /api/facturas-proveedor/[id]/notas
 *
 * Devuelve la factura de proveedor junto con sus NC/ND recibidas y el
 * saldo pendiente (total − pagos − NC + ND). Usado por la página
 * /proveedores/facturas/[id]/notas.
 */

import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { esRolInterno } from "@/lib/permissions"
import { sumarImportes, restarImportes, maxMonetario } from "@/lib/money"
import type { Rol } from "@/types"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const rol = session.user.rol as Rol
  if (!esRolInterno(rol)) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  const { id } = await params

  try {
    const factura = await prisma.facturaProveedor.findUnique({
      where: { id },
      include: {
        proveedor: { select: { id: true, razonSocial: true, cuit: true, condicionIva: true } },
        pagos: { where: { anulado: false }, select: { monto: true } },
        notasCreditoDebito: {
          orderBy: { creadoEn: "desc" },
          include: {
            operador: { select: { nombre: true, apellido: true } },
          },
        },
      },
    })
    if (!factura) return NextResponse.json({ error: "Factura no encontrada" }, { status: 404 })

    const totalPagos = sumarImportes(factura.pagos.map((p) => p.monto))
    const totalNC = sumarImportes(
      factura.notasCreditoDebito
        .filter((n) => n.tipo === "NC_RECIBIDA")
        .map((n) => n.montoTotal)
    )
    const totalND = sumarImportes(
      factura.notasCreditoDebito
        .filter((n) => n.tipo === "ND_RECIBIDA")
        .map((n) => n.montoTotal)
    )
    // saldo = total + ND_recibidas − pagos − NC_recibidas
    const saldoBruto = restarImportes(
      restarImportes(sumarImportes([factura.total, totalND]), totalPagos),
      totalNC
    )
    const saldoPendiente = maxMonetario(0, saldoBruto)

    return NextResponse.json({
      factura: {
        id: factura.id,
        proveedor: factura.proveedor,
        nroComprobante: factura.nroComprobante,
        ptoVenta: factura.ptoVenta,
        tipoCbte: factura.tipoCbte,
        fechaCbte: factura.fechaCbte,
        neto: factura.neto,
        ivaMonto: factura.ivaMonto,
        total: factura.total,
        estadoPago: factura.estadoPago,
        saldoPendiente,
      },
      notas: factura.notasCreditoDebito,
    })
  } catch (error) {
    console.error("[GET /api/facturas-proveedor/[id]/notas]", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
