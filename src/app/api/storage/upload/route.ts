/**
 * POST /api/storage/upload
 *
 * Sube un archivo PDF a Cloudflare R2 y devuelve su key en el bucket.
 * Solo accesible para ADMIN_TRANSMAGG y OPERADOR_TRANSMAGG.
 *
 * Body: multipart/form-data
 *   file: File (PDF, max 10 MB)
 *   prefijo: StoragePrefijo
 *
 * Response: { key: string }
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { esRolInterno } from "@/lib/permissions"
import { subirPDF, storageConfigurado, PREFIJOS_VALIDOS } from "@/lib/storage"
import type { StoragePrefijo } from "@/lib/storage"
import type { Rol } from "@/types"

const MAX_SIZE = 10 * 1024 * 1024 // 10 MB

/**
 * POST: NextRequest -> Promise<NextResponse>
 *
 * Dado un form-data con file (PDF ≤ 10 MB) y prefijo, sube el archivo a R2.
 *
 * Ejemplos:
 * POST (multipart con file PDF + prefijo "liquidaciones")
 * === { key: "liquidaciones/uuid.pdf" }
 * POST (sin autenticación) === { error: "No autorizado" } 401
 * POST (R2 no configurado) === { error: "Almacenamiento no configurado" } 503
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
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

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: "No se pudo parsear el form-data" }, { status: 400 })
  }

  const file = formData.get("file")
  const prefijo = formData.get("prefijo")

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "Campo 'file' requerido" }, { status: 400 })
  }
  if (!prefijo || typeof prefijo !== "string") {
    return NextResponse.json({ error: "Campo 'prefijo' requerido" }, { status: 400 })
  }
  if (!(PREFIJOS_VALIDOS as string[]).includes(prefijo)) {
    return NextResponse.json(
      { error: `Prefijo inválido. Valores permitidos: ${PREFIJOS_VALIDOS.join(", ")}` },
      { status: 400 }
    )
  }
  if (file.type !== "application/pdf") {
    return NextResponse.json({ error: "Solo se aceptan archivos PDF" }, { status: 400 })
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "El archivo supera el límite de 10 MB" }, { status: 400 })
  }

  try {
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const key = await subirPDF(buffer, prefijo as StoragePrefijo, file.name)
    return NextResponse.json({ key })
  } catch (error) {
    console.error("Error al subir archivo a R2:", error)
    return NextResponse.json({ error: "Error al subir el archivo al almacenamiento" }, { status: 500 })
  }
}
