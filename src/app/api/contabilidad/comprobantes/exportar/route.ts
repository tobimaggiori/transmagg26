/**
 * POST /api/contabilidad/comprobantes/exportar — descarga ZIP con PDFs desde R2
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { tienePermiso } from "@/lib/permissions"
import { obtenerArchivo } from "@/lib/storage"
import {
  listarComprobantes,
  TIPOS_COMPROBANTE,
  type TipoComprobante,
} from "@/lib/comprobantes-queries"
import type { Rol } from "@/types"
import archiver from "archiver"
import { PassThrough } from "stream"

export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const rol = (session.user.rol ?? "") as Rol
  const tieneAcceso = await tienePermiso(session.user.id, rol, "contabilidad.comprobantes")
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
    return NextResponse.json({ error: "No hay comprobantes para exportar" }, { status: 404 })
  }

  const passthrough = new PassThrough()
  const archive = archiver("zip", { zlib: { level: 5 } })
  archive.pipe(passthrough)

  for (const comp of comprobantes) {
    try {
      const buf = await obtenerArchivo(comp.r2Key)
      archive.append(buf, { name: comp.nombreArchivo })
    } catch {
      // Skip files that fail to download
    }

    for (let i = 0; i < comp.r2KeysExtra.length; i++) {
      try {
        const buf = await obtenerArchivo(comp.r2KeysExtra[i])
        const base = comp.nombreArchivo.replace(".pdf", "")
        archive.append(buf, { name: `${base}-comprobante-${i + 1}.pdf` })
      } catch {
        // Skip files that fail to download
      }
    }
  }

  await archive.finalize()

  // Read the full ZIP into a buffer for the response
  const chunks: Buffer[] = []
  for await (const chunk of passthrough) {
    chunks.push(Buffer.from(chunk))
  }
  const zipBuffer = Buffer.concat(chunks)

  return new NextResponse(zipBuffer, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="comprobantes-${tipo}-${desde}-${hasta}.zip"`,
    },
  })
}
