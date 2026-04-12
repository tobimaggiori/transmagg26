/**
 * GET /api/facturas/[id]/notas
 *
 * Retorna la factura con sus NC/ND asociadas y los viajes de la factura.
 * Usado por la página de detalle NC/ND por factura.
 * Solo roles internos.
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { esRolInterno } from "@/lib/permissions"
import type { Rol } from "@/types"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const rol = session.user.rol as Rol
  if (!esRolInterno(rol)) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  const { id } = await params

  try {
    const factura = await prisma.facturaEmitida.findUnique({
      where: { id },
      select: {
        id: true,
        nroComprobante: true,
        ptoVenta: true,
        tipoCbte: true,
        modalidadMiPymes: true,
        neto: true,
        ivaPct: true,
        ivaMonto: true,
        total: true,
        estado: true,
        estadoArca: true,
        emitidaEn: true,
        empresa: { select: { id: true, razonSocial: true, cuit: true } },
      },
    })

    if (!factura) {
      return NextResponse.json({ error: "Factura no encontrada" }, { status: 404 })
    }

    const [notas, viajes] = await Promise.all([
      prisma.notaCreditoDebito.findMany({
        where: { facturaId: id },
        include: {
          items: { orderBy: { orden: "asc" } },
          viajesAfectados: true,
          operador: { select: { nombre: true, apellido: true } },
        },
        orderBy: { creadoEn: "desc" },
      }),
      prisma.viajeEnFactura.findMany({
        where: { facturaId: id },
        select: {
          id: true,
          viajeId: true,
          fechaViaje: true,
          remito: true,
          mercaderia: true,
          procedencia: true,
          destino: true,
          kilos: true,
          tarifaEmpresa: true,
          subtotal: true,
          viaje: {
            select: {
              fletero: { select: { id: true, razonSocial: true } },
            },
          },
        },
      }),
    ])

    return NextResponse.json({ factura, notas, viajes })
  } catch (error) {
    console.error("[GET /api/facturas/[id]/notas]", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
