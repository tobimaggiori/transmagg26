/**
 * GET /api/liquidaciones/[id]/pdf
 *
 * Sirve el PDF de la liquidación como application/pdf.
 * Si tiene pdfS3Key y R2 está configurado, lo descarga de R2.
 * Si no, lo genera al vuelo con pdfkit (generarPDFLiquidacion).
 * Soporta acceso con token HMAC para el QR del pie del LP.
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { esRolInterno } from "@/lib/permissions"
import { obtenerArchivo, storageConfigurado } from "@/lib/storage"
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

  const nro = liq.nroComprobante
    ? `LP-${String(liq.ptoVenta ?? 1).padStart(4, "0")}-${String(liq.nroComprobante).padStart(8, "0")}`
    : `LP-${liq.id.slice(0, 8)}`
  const filename = `${nro}.pdf`

  // Intentar obtener de R2
  if (liq.pdfS3Key && storageConfigurado()) {
    try {
      const buffer = await obtenerArchivo(liq.pdfS3Key)
      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `inline; filename="${filename}"`,
        },
      })
    } catch {
      // Fallthrough: regenerar con pdfkit
    }
  }

  // Generar al vuelo con pdfkit
  try {
    const buffer = await generarPDFLiquidacion(liq.id)
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
      },
    })
  } catch (err) {
    console.error("[GET /api/liquidaciones/[id]/pdf] Error generando PDF:", err)
    return NextResponse.json({ error: "No se pudo generar el PDF" }, { status: 500 })
  }
}
