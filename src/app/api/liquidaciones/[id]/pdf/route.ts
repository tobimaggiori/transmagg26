/**
 * GET /api/liquidaciones/[id]/pdf
 *
 * Si la liquidación tiene pdfS3Key, devuelve URL firmada de R2.
 * Si no, genera el PDF con pdfkit, sube a R2, guarda la key y devuelve URL firmada.
 * Soporta acceso con token HMAC para el QR del pie del LP.
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

  if (token) {
    if (!verificarToken(params.id, token)) {
      return NextResponse.json({ error: "Token inválido" }, { status: 403 })
    }
  } else {
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

  if (!storageConfigurado()) {
    return NextResponse.json({ error: "Almacenamiento no configurado" }, { status: 503 })
  }

  let key = liq.pdfS3Key

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
        { error: "No se pudo generar el PDF. Intentá de nuevo." },
        { status: 500 }
      )
    }
  }

  try {
    const url = await obtenerUrlFirmada(key, 900)
    return NextResponse.json({ url })
  } catch (signError) {
    console.error("[GET /api/liquidaciones/[id]/pdf] Error obteniendo URL firmada:", signError)
    return NextResponse.json({ error: "No se pudo obtener la URL del PDF" }, { status: 500 })
  }
}
