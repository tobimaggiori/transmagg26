/**
 * POST /api/contabilidad/iva/periodo/[id]/estado
 *   body: { nuevoEstado: EstadoPeriodo, motivo?: string, observaciones?: string }
 *   Valida transición + permiso adecuado. REABIERTO requiere admin + motivo.
 */

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { tienePermiso } from "@/lib/permissions"
import type { Rol } from "@/types"
import { cambiarEstadoPeriodo, ESTADOS_PERIODO } from "@/lib/iva-portal/periodo"

const schema = z.object({
  nuevoEstado: z.enum(ESTADOS_PERIODO),
  motivo: z.string().optional(),
  observaciones: z.string().optional(),
})

// Permisos requeridos por estado destino.
const PERMISO_POR_ESTADO: Record<string, string> = {
  EN_REVISION_CONTADOR: "contabilidad.iva.ver",
  TXT_GENERADO: "contabilidad.iva.generar_txt",
  CONCILIADO: "contabilidad.iva.marcar_conciliado",
  PRESENTADO: "contabilidad.iva.marcar_presentado",
  REABIERTO: "contabilidad.iva.reabrir_periodo",
  ABIERTO: "contabilidad.iva.ver",
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const rol = session.user.rol as Rol

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })

  const permisoRequerido = PERMISO_POR_ESTADO[parsed.data.nuevoEstado]
  if (!permisoRequerido) {
    return NextResponse.json({ error: "Estado no soportado" }, { status: 400 })
  }
  if (!(await tienePermiso(session.user.id, rol, permisoRequerido))) {
    return NextResponse.json({ error: "Sin permiso para esta transición" }, { status: 403 })
  }

  // REABIERTO obliga a motivo
  if (parsed.data.nuevoEstado === "REABIERTO" && (!parsed.data.motivo || parsed.data.motivo.trim().length < 3)) {
    return NextResponse.json({ error: "Motivo obligatorio para REABRIR período" }, { status: 422 })
  }

  try {
    const periodo = await cambiarEstadoPeriodo({
      periodoId: params.id,
      nuevoEstado: parsed.data.nuevoEstado,
      usuarioId: session.user.id,
      observaciones: parsed.data.observaciones ?? parsed.data.motivo,
    })
    return NextResponse.json(periodo)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error" },
      { status: 422 },
    )
  }
}
