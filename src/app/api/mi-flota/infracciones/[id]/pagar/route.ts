/**
 * PATCH /api/mi-flota/infracciones/[id]/pagar — registra el pago de una infracción
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { esRolInterno } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"
import type { Rol } from "@/types"
import { registrarMovimiento } from "@/lib/movimiento-cuenta"
import { resolverOperadorId } from "@/lib/session-utils"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const rol = (session.user.rol ?? "") as Rol
  if (!esRolInterno(rol)) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  const { id } = await params

  let body: {
    medioPago: string
    cuentaId?: string
    fechaPago: string
    comprobantePdfS3Key?: string
  }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 })
  }

  const { medioPago, cuentaId, fechaPago, comprobantePdfS3Key } = body
  if (!medioPago || !fechaPago) {
    return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 })
  }

  const infraccion = await prisma.infraccion.findUnique({ where: { id } })
  if (!infraccion) return NextResponse.json({ error: "Infracción no encontrada" }, { status: 404 })
  if (infraccion.estado === "PAGADA") {
    return NextResponse.json({ error: "La infracción ya está pagada" }, { status: 400 })
  }

  const operadorId = await resolverOperadorId(session.user)

  const updated = await prisma.$transaction(async (tx) => {
    const upd = await tx.infraccion.update({
      where: { id },
      data: {
        estado: "PAGADA",
        fechaPago: new Date(fechaPago),
        medioPago,
        cuentaId: cuentaId ?? null,
        comprobantePdfS3Key: comprobantePdfS3Key ?? null,
      },
    })

    if (medioPago === "TRANSFERENCIA" && cuentaId) {
      await registrarMovimiento(tx, {
        cuentaId,
        tipo: "EGRESO",
        categoria: "PAGO_INFRACCION",
        monto: infraccion.monto,
        fecha: new Date(fechaPago),
        descripcion: `Pago infracción — ${infraccion.organismo}`,
        infraccionId: id,
        operadorCreacionId: operadorId,
      })
    }
    return upd
  })

  return NextResponse.json({ infraccion: updated })
}
