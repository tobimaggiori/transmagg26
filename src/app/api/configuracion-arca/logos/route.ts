/**
 * POST /api/configuracion-arca/logos
 * Sube un logo (comprobante o ARCA) a R2 y guarda la key en ConfiguracionArca.
 * Body: FormData con campo "file" (imagen) y campo "tipo" ("comprobante" | "arca")
 *
 * DELETE /api/configuracion-arca/logos?tipo=comprobante|arca
 * Elimina el logo de R2 y limpia la key en ConfiguracionArca.
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { esAdmin } from "@/lib/permissions"
import { subirPDF, eliminarArchivo, obtenerArchivo, storageConfigurado } from "@/lib/storage"
import type { Rol } from "@/types"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  if (!esAdmin(session.user.rol as Rol)) return NextResponse.json({ error: "Sin permisos" }, { status: 403 })

  const tipo = req.nextUrl.searchParams.get("tipo")
  if (!tipo || (tipo !== "comprobante" && tipo !== "arca")) {
    return NextResponse.json({ error: "Se requiere ?tipo=comprobante|arca" }, { status: 400 })
  }

  const field = tipo === "comprobante" ? "logoComprobanteR2Key" : "logoArcaR2Key"
  const config = await prisma.configuracionArca.findUnique({
    where: { id: "unico" },
    select: { [field]: true },
  })

  const key = (config?.[field] as unknown as string | null) ?? null
  if (!key || !storageConfigurado()) {
    return new NextResponse(null, { status: 404 })
  }

  try {
    const buffer = await obtenerArchivo(key)
    const ext = key.toLowerCase().endsWith(".jpg") || key.toLowerCase().endsWith(".jpeg") ? "jpeg" : "png"
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": `image/${ext}`,
        "Cache-Control": "private, max-age=300",
      },
    })
  } catch {
    return new NextResponse(null, { status: 404 })
  }
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  if (!esAdmin(session.user.rol as Rol)) return NextResponse.json({ error: "Sin permisos" }, { status: 403 })

  if (!storageConfigurado()) {
    return NextResponse.json({ error: "Almacenamiento R2 no configurado" }, { status: 503 })
  }

  const formData = await req.formData()
  const file = formData.get("file") as File | null
  const tipo = formData.get("tipo") as string | null

  if (!file || !tipo || (tipo !== "comprobante" && tipo !== "arca")) {
    return NextResponse.json({ error: "Se requiere file y tipo (comprobante|arca)" }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const nombre = tipo === "comprobante" ? "logo-comprobante.png" : "logo-arca.png"
  const key = await subirPDF(buffer, "logos", nombre)

  const field = tipo === "comprobante" ? "logoComprobanteR2Key" : "logoArcaR2Key"
  await prisma.configuracionArca.upsert({
    where: { id: "unico" },
    update: { [field]: key, actualizadoPor: session.user.email ?? undefined },
    create: { id: "unico", cuit: "30709381683", razonSocial: "", [field]: key, actualizadoPor: session.user.email ?? undefined },
  })

  return NextResponse.json({ ok: true, key })
}

export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  if (!esAdmin(session.user.rol as Rol)) return NextResponse.json({ error: "Sin permisos" }, { status: 403 })

  const tipo = req.nextUrl.searchParams.get("tipo")
  if (!tipo || (tipo !== "comprobante" && tipo !== "arca")) {
    return NextResponse.json({ error: "Se requiere ?tipo=comprobante|arca" }, { status: 400 })
  }

  const field = tipo === "comprobante" ? "logoComprobanteR2Key" : "logoArcaR2Key"

  const config = await prisma.configuracionArca.findUnique({
    where: { id: "unico" },
    select: { [field]: true },
  })

  const existingKey = (config?.[field] as unknown as string | null) ?? null
  if (existingKey && storageConfigurado()) {
    try { await eliminarArchivo(existingKey) } catch { /* ignore */ }
  }

  await prisma.configuracionArca.update({
    where: { id: "unico" },
    data: { [field]: null, actualizadoPor: session.user.email ?? undefined },
  })

  return NextResponse.json({ ok: true })
}
