/**
 * GET  /api/contabilidad/comprobantes  — lista comprobantes con PDF en R2
 * DELETE /api/contabilidad/comprobantes — elimina archivos de R2 y limpia keys en BD
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { tienePermiso } from "@/lib/permissions"
import { eliminarArchivos } from "@/lib/storage"
import {
  listarComprobantes,
  limpiarKeysEnBD,
  TIPOS_COMPROBANTE,
  type TipoComprobante,
} from "@/lib/comprobantes-queries"
import type { Rol } from "@/types"

export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const rol = (session.user.rol ?? "") as Rol
  const tieneAcceso = await tienePermiso(session.user.id, rol, "contabilidad.comprobantes")
  if (!tieneAcceso) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const tipo = searchParams.get("tipo") as TipoComprobante | null
  const desde = searchParams.get("desde")
  const hasta = searchParams.get("hasta")

  if (!tipo || !TIPOS_COMPROBANTE.includes(tipo) || !desde || !hasta) {
    return NextResponse.json({ error: "Parámetros inválidos: tipo, desde y hasta son requeridos" }, { status: 400 })
  }

  const comprobantes = await listarComprobantes({
    tipo,
    desde: new Date(desde),
    hasta: new Date(hasta + "T23:59:59.999Z"),
  })

  const totalArchivos = comprobantes.reduce(
    (acc, c) => acc + 1 + c.r2KeysExtra.length,
    0
  )

  return NextResponse.json({ cantidad: comprobantes.length, totalArchivos, comprobantes })
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const rol = (session.user.rol ?? "") as Rol
  const tieneAcceso = await tienePermiso(session.user.id, rol, "contabilidad.comprobantes_eliminar")
  if (!tieneAcceso) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  const body = await request.json()
  const { tipo, desde, hasta } = body as { tipo: TipoComprobante; desde: string; hasta: string }

  if (!tipo || !TIPOS_COMPROBANTE.includes(tipo) || !desde || !hasta) {
    return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 })
  }

  const comprobantes = await listarComprobantes({
    tipo,
    desde: new Date(desde),
    hasta: new Date(hasta + "T23:59:59.999Z"),
  })

  if (comprobantes.length === 0) {
    return NextResponse.json({ eliminados: 0 })
  }

  const todasLasKeys = comprobantes.flatMap((c) => [c.r2Key, ...c.r2KeysExtra])
  const eliminados = await eliminarArchivos(todasLasKeys)
  await limpiarKeysEnBD(comprobantes)

  return NextResponse.json({ eliminados })
}
