/**
 * GET /api/liquidaciones/[id]/notas
 *
 * Retorna la liquidacion con sus NC/ND asociadas y los viajes de la liquidacion.
 * Usado por la página de detalle NC/ND por liquidacion.
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
    const liquidacion = await prisma.liquidacion.findUnique({
      where: { id },
      select: {
        id: true,
        nroComprobante: true,
        ptoVenta: true,
        comisionPct: true,
        ivaPct: true,
        subtotalBruto: true,
        comisionMonto: true,
        neto: true,
        ivaMonto: true,
        total: true,
        estado: true,
        arcaEstado: true,
        grabadaEn: true,
        fletero: { select: { id: true, razonSocial: true, cuit: true } },
      },
    })

    if (!liquidacion) {
      return NextResponse.json({ error: "Liquidacion no encontrada" }, { status: 404 })
    }

    const notas = await prisma.notaCreditoDebito.findMany({
      where: { liquidacionId: id },
      include: {
        items: { orderBy: { orden: "asc" } },
        viajesAfectados: true,
        operador: { select: { nombre: true, apellido: true } },
      },
      orderBy: { creadoEn: "desc" },
    })

    return NextResponse.json({ liquidacion, notas })
  } catch (error) {
    console.error("[GET /api/liquidaciones/[id]/notas]", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
