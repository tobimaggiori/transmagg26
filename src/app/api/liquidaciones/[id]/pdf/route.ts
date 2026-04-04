/**
 * GET /api/liquidaciones/[id]/pdf
 *
 * Devuelve una URL firmada (15 min) para visualizar el PDF del LP en R2.
 * Si no existe el PDF, lo genera con Puppeteer, sube a R2, guarda la key y responde.
 * También soporta acceso con token HMAC para el QR del pie del LP.
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { esRolInterno } from "@/lib/permissions"
import { obtenerUrlFirmada, subirPDF, storageConfigurado } from "@/lib/storage"
import { generarPDFLiquidacion } from "@/lib/pdf-liquidacion"
import { verificarPropietarioFletero } from "@/lib/session-utils"
import crypto from "crypto"
import type { Rol } from "@/types"

function verificarToken(liquidacionId: string, token: string): boolean {
  const key = process.env.ENCRYPTION_KEY ?? "transmagg-default-key"
  const expected = crypto.createHmac("sha256", key).update(liquidacionId).digest("hex").slice(0, 32)
  return token === expected
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const token = request.nextUrl.searchParams.get("token")

  // Si tiene token HMAC válido, acceso público (para QR)
  if (token) {
    if (!verificarToken(params.id, token)) {
      return NextResponse.json({ error: "Token inválido" }, { status: 403 })
    }
  } else {
    // Sin token: requiere autenticación
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    const rol = session.user.rol as Rol
    const esInterno = esRolInterno(rol)
    const esFletero = rol === "FLETERO"

    if (!esInterno && !esFletero) {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })
    }

    if (esFletero) {
      const liq = await prisma.liquidacion.findUnique({
        where: { id: params.id },
        select: { fleteroId: true },
      })
      if (!liq) return NextResponse.json({ error: "No encontrada" }, { status: 404 })
      const esPropietario = await verificarPropietarioFletero(liq.fleteroId, session.user.email!)
      if (!esPropietario) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })
    }
  }

  const liq = await prisma.liquidacion.findUnique({
    where: { id: params.id },
    select: { id: true, nroComprobante: true, ptoVenta: true, pdfS3Key: true },
  })

  if (!liq) return NextResponse.json({ error: "Liquidación no encontrada" }, { status: 404 })

  // Si storage no está configurado, devolver error
  if (!storageConfigurado()) {
    return NextResponse.json({ error: "Almacenamiento no configurado" }, { status: 503 })
  }

  let key = liq.pdfS3Key

  // Si no tiene PDF, generarlo
  if (!key) {
    try {
      const buf = await generarPDFLiquidacion(liq.id)
      const nro = liq.nroComprobante
        ? `LP-${String(liq.ptoVenta ?? 1).padStart(4, "0")}-${String(liq.nroComprobante).padStart(8, "0")}`
        : `LP-borrador-${liq.id.slice(0, 8)}`
      key = await subirPDF(buf, "liquidaciones", `${nro}.pdf`)
      await prisma.liquidacion.update({
        where: { id: liq.id },
        data: { pdfS3Key: key },
      })
    } catch (pdfError) {
      console.error("[GET /api/liquidaciones/[id]/pdf] Error generando PDF:", pdfError)
      return NextResponse.json(
        { error: "No se pudo generar el PDF. Intentá de nuevo desde Consultar LP." },
        { status: 500 }
      )
    }
  }

  try {
    const url = await obtenerUrlFirmada(key, 900)
    return NextResponse.json({ url })
  } catch (signError) {
    console.error("[GET /api/liquidaciones/[id]/pdf] Error obteniendo URL firmada:", signError)
    return NextResponse.json(
      { error: "No se pudo obtener la URL del PDF" },
      { status: 500 }
    )
  }
}
