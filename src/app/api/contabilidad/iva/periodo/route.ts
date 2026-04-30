/**
 * GET  /api/contabilidad/iva/periodo?mesAnio=YYYY-MM
 *   Devuelve datos del período: estado, resumen, validaciones (sin generar TXT),
 *   ajustes activos, exportaciones previas.
 *
 * POST /api/contabilidad/iva/periodo
 *   body: { mesAnio: "YYYY-MM" }
 *   Crea o devuelve el período.
 */

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { tienePermiso } from "@/lib/permissions"
import type { Rol } from "@/types"
import { obtenerOCrearPeriodoIva } from "@/lib/iva-portal/periodo"
import { recolectarDatosIvaPeriodo, obtenerEmisorTransmagg } from "@/lib/iva-portal/recolectar-datos"
import { obtenerAjustesActivos, obtenerAjustesTodosDelPeriodo } from "@/lib/iva-portal/ajustes"
import { aplicarAjustes } from "@/lib/iva-portal/aplicar-ajustes"
import { validarPeriodo } from "@/lib/iva-portal/validaciones"
import { calcularResumen } from "@/lib/iva-portal/resumen"

const mesAnioRegex = /^\d{4}-(0[1-9]|1[0-2])$/

const crearSchema = z.object({
  mesAnio: z.string().regex(mesAnioRegex, "Formato inválido, esperado YYYY-MM"),
})

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const rol = session.user.rol as Rol
  if (!(await tienePermiso(session.user.id, rol, "contabilidad.iva.ver"))) {
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 })
  }

  const mesAnio = request.nextUrl.searchParams.get("mesAnio")
  if (!mesAnio || !mesAnioRegex.test(mesAnio)) {
    return NextResponse.json({ error: "Parámetro mesAnio inválido (esperado YYYY-MM)" }, { status: 400 })
  }

  try {
    const periodo = await obtenerOCrearPeriodoIva(mesAnio)
    const datosBase = await recolectarDatosIvaPeriodo(mesAnio)
    const ajustesActivos = await obtenerAjustesActivos(periodo.id)
    const datosFinales = aplicarAjustes(datosBase, ajustesActivos)
    const validaciones = validarPeriodo(datosFinales)

    let resumen = null
    try {
      const emisor = await obtenerEmisorTransmagg()
      resumen = calcularResumen({
        datos: datosFinales,
        cantAjustesAplicados: ajustesActivos.length,
        emisor,
      })
    } catch {
      // ConfiguracionArca no configurada — no se calcula resumen pero el resto sigue
    }

    const [ajustesTodos, exportaciones] = await Promise.all([
      obtenerAjustesTodosDelPeriodo(periodo.id),
      prisma.exportacionIvaArca.findMany({
        where: { periodoIvaId: periodo.id },
        include: { generadoPor: { select: { nombre: true, apellido: true, email: true } } },
        orderBy: { generadoEn: "desc" },
      }),
    ])

    return NextResponse.json({
      periodo,
      resumen,
      validaciones,
      datosFinales,
      ajustes: ajustesTodos,
      exportaciones,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const rol = session.user.rol as Rol
  if (!(await tienePermiso(session.user.id, rol, "contabilidad.iva.ver"))) {
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 })
  }

  const body = await request.json()
  const parsed = crearSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", detalles: parsed.error.flatten() }, { status: 400 })
  }

  const periodo = await obtenerOCrearPeriodoIva(parsed.data.mesAnio)
  return NextResponse.json(periodo)
}
