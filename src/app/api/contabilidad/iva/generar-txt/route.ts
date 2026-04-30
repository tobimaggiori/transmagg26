/**
 * POST /api/contabilidad/iva/generar-txt
 *   body: { mesAnio: "YYYY-MM", observaciones?: string }
 *   Valida + aplica ajustes + genera ZIP con 4 TXT + persiste ExportacionIvaArca.
 *   Si hay errores bloqueantes, devuelve 422 con la lista; no genera ZIP.
 */

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { tienePermiso } from "@/lib/permissions"
import type { Rol } from "@/types"
import { generarExportacionIvaArca } from "@/lib/iva-portal/exportar"
import { obtenerOCrearPeriodoIva, permiteGenerarTxt, type EstadoPeriodo } from "@/lib/iva-portal/periodo"

const schema = z.object({
  mesAnio: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
  observaciones: z.string().optional(),
})

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const rol = session.user.rol as Rol
  if (!(await tienePermiso(session.user.id, rol, "contabilidad.iva.generar_txt"))) {
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 })
  }

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })

  const periodo = await obtenerOCrearPeriodoIva(parsed.data.mesAnio)
  if (!permiteGenerarTxt(periodo.estado as EstadoPeriodo)) {
    return NextResponse.json(
      { error: `Período en estado ${periodo.estado} no admite generación. Reabrir primero.` },
      { status: 422 },
    )
  }

  try {
    const r = await generarExportacionIvaArca({
      mesAnio: parsed.data.mesAnio,
      generadoPorId: session.user.id,
      observaciones: parsed.data.observaciones,
    })

    if (!r.ok) {
      return NextResponse.json(
        { error: "Hay errores bloqueantes en el período", errores: r.errores, advertencias: r.advertencias },
        { status: 422 },
      )
    }

    return NextResponse.json({
      exportacionId: r.exportacionId,
      resumen: r.resumen,
      advertencias: r.advertencias ?? [],
    }, { status: 201 })
  } catch (error) {
    console.error("[POST /api/contabilidad/iva/generar-txt]", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 },
    )
  }
}
