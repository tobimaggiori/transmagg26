/**
 * POST /api/contabilidad/iva/validar
 *   body: { mesAnio: "YYYY-MM" }
 *   Valida el período aplicando ajustes activos sin generar TXT.
 */

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { tienePermiso } from "@/lib/permissions"
import type { Rol } from "@/types"
import { obtenerOCrearPeriodoIva } from "@/lib/iva-portal/periodo"
import { recolectarDatosIvaPeriodo } from "@/lib/iva-portal/recolectar-datos"
import { obtenerAjustesActivos } from "@/lib/iva-portal/ajustes"
import { aplicarAjustes } from "@/lib/iva-portal/aplicar-ajustes"
import { validarPeriodo } from "@/lib/iva-portal/validaciones"

const schema = z.object({ mesAnio: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/) })

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const rol = session.user.rol as Rol
  if (!(await tienePermiso(session.user.id, rol, "contabilidad.iva.ver"))) {
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 })
  }

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })

  const periodo = await obtenerOCrearPeriodoIva(parsed.data.mesAnio)
  const datosBase = await recolectarDatosIvaPeriodo(parsed.data.mesAnio)
  const ajustes = await obtenerAjustesActivos(periodo.id)
  const datosFinales = aplicarAjustes(datosBase, ajustes)
  const validaciones = validarPeriodo(datosFinales)

  return NextResponse.json({
    mesAnio: parsed.data.mesAnio,
    periodo: { id: periodo.id, estado: periodo.estado },
    validaciones,
    datosFinales,
  })
}
