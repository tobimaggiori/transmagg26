/**
 * GET /api/logo
 * Sirve el logo de comprobantes desde R2. Público (sin auth) para usarlo en la página de login.
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { obtenerArchivo, storageConfigurado } from "@/lib/storage"

export async function GET() {
  if (!storageConfigurado()) {
    return new NextResponse(null, { status: 404 })
  }

  try {
    const config = await prisma.configuracionArca.findUnique({
      where: { id: "unico" },
      select: { logoComprobanteR2Key: true },
    })

    const key = config?.logoComprobanteR2Key ?? null
    if (!key) {
      return new NextResponse(null, { status: 404 })
    }

    const buffer = await obtenerArchivo(key)
    const ext = key.toLowerCase().endsWith(".jpg") || key.toLowerCase().endsWith(".jpeg") ? "jpeg" : "png"
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": `image/${ext}`,
        "Cache-Control": "public, max-age=3600",
      },
    })
  } catch {
    return new NextResponse(null, { status: 404 })
  }
}
