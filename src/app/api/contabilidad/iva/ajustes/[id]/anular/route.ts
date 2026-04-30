/**
 * POST /api/contabilidad/iva/ajustes/[id]/anular
 *   Anula un ajuste (no destructivo). Body: { motivo: string }.
 */

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { tienePermiso } from "@/lib/permissions"
import type { Rol } from "@/types"

const schema = z.object({
  motivo: z.string().min(3, "Motivo obligatorio"),
})

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const rol = session.user.rol as Rol
  if (!(await tienePermiso(session.user.id, rol, "contabilidad.iva.ajustes"))) {
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 })
  }

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", detalles: parsed.error.flatten() }, { status: 400 })
  }

  const ajuste = await prisma.ajusteIvaPeriodo.findUnique({ where: { id: params.id } })
  if (!ajuste) return NextResponse.json({ error: "Ajuste no encontrado" }, { status: 404 })
  if (ajuste.anulado) return NextResponse.json({ error: "Ajuste ya anulado" }, { status: 422 })

  const actualizado = await prisma.ajusteIvaPeriodo.update({
    where: { id: params.id },
    data: {
      anulado: true,
      anuladoEn: new Date(),
      anuladoPorId: session.user.id,
      motivoAnulacion: parsed.data.motivo,
    },
  })
  return NextResponse.json(actualizado)
}
