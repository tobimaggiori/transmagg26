/**
 * GET /api/storage/signed-url?key=<key>
 *
 * Genera una URL temporal firmada (15 min) para visualizar un PDF en R2.
 * Solo accesible para usuarios autenticados con rol interno.
 * La key debe comenzar con uno de los prefijos válidos para evitar acceso arbitrario.
 *
 * Response: { url: string }
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { esRolInterno } from "@/lib/permissions"
import { obtenerUrlFirmada, storageConfigurado, PREFIJOS_VALIDOS } from "@/lib/storage"
import type { Rol } from "@/types"

/**
 * GET: NextRequest -> Promise<NextResponse>
 *
 * Dado el query param key, devuelve una URL firmada temporal para acceder al archivo.
 *
 * Ejemplos:
 * GET ?key=liquidaciones/uuid.pdf === { url: "https://.../?X-Amz-Signature=..." }
 * GET ?key=../../secreto           === { error: "Key inválida" } 400
 * GET (sin autenticación)          === { error: "No autorizado" } 401
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }
  const rol = (session.user.rol ?? "") as Rol
  if (!esRolInterno(rol)) {
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })
  }

  if (!storageConfigurado()) {
    return NextResponse.json(
      { error: "Almacenamiento no configurado. Verificá las variables de entorno R2_*." },
      { status: 503 }
    )
  }

  const { searchParams } = new URL(request.url)
  const key = searchParams.get("key")

  if (!key) {
    return NextResponse.json({ error: "Parámetro 'key' requerido" }, { status: 400 })
  }

  // Seguridad: la key debe comenzar con un prefijo válido conocido
  const prefijoValido = (PREFIJOS_VALIDOS as string[]).some((p) => key.startsWith(`${p}/`))
  if (!prefijoValido) {
    return NextResponse.json(
      { error: "Key inválida. Debe comenzar con uno de los prefijos permitidos." },
      { status: 400 }
    )
  }

  try {
    const url = await obtenerUrlFirmada(key)
    return NextResponse.json({ url })
  } catch (error) {
    console.error("Error al generar URL firmada:", error)
    return NextResponse.json({ error: "Error al generar la URL de acceso" }, { status: 500 })
  }
}
