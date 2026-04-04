/**
 * POST /api/configuracion-arca/probar-wsaa
 *
 * Intenta autenticarse con WSAA usando la configuración actual.
 * Devuelve éxito/error sin exponer token/sign.
 */

import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { esAdmin } from "@/lib/permissions"
import { cargarConfigArca } from "@/lib/arca/config"
import { obtenerTicketWsaa } from "@/lib/arca/wsaa"
import { ArcaError } from "@/lib/arca/errors"
import type { Rol } from "@/types"

export async function POST() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  if (!esAdmin(session.user.rol as Rol)) return NextResponse.json({ error: "Sin permisos" }, { status: 403 })

  const inicio = Date.now()

  try {
    const config = await cargarConfigArca()
    const ticket = await obtenerTicketWsaa(config)

    return NextResponse.json({
      ok: true,
      mensaje: "Autenticación WSAA exitosa",
      expiresAt: ticket.expiresAt.toISOString(),
      tiempoMs: Date.now() - inicio,
    })
  } catch (err) {
    const mensaje = err instanceof ArcaError
      ? err.message
      : "Error desconocido al probar WSAA"
    const retryable = err instanceof ArcaError ? err.retryable : false

    return NextResponse.json({
      ok: false,
      mensaje,
      retryable,
      tiempoMs: Date.now() - inicio,
    }, { status: err instanceof ArcaError ? err.statusCode : 500 })
  }
}
