/**
 * POST /api/facturas/[id]/autorizar-arca
 *
 * Autoriza una factura emitida en ARCA/AFIP. Obtiene CAE, número definitivo
 * y genera QR fiscal. Requiere que ARCA esté configurada y activa.
 *
 * Body: { idempotencyKey: string } — UUID único por intento de autorización.
 * Response 200: { ok: true, cae, caeVto, nroComprobante, ptoVenta, tipoCbte, qrData }
 * Response 4xx/5xx: { error: string, code?: string }
 */

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { requireFinancialAccess } from "@/lib/financial-api"
import { autorizarFacturaArca, ArcaError } from "@/lib/arca"

const bodySchema = z.object({
  idempotencyKey: z.string().uuid(),
})

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const acceso = await requireFinancialAccess()
  if (!acceso.ok) return acceso.response

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Body JSON inválido" }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Se requiere idempotencyKey (UUID) en el body" },
      { status: 400 }
    )
  }

  try {
    const result = await autorizarFacturaArca(params.id, parsed.data.idempotencyKey)
    return NextResponse.json(result)
  } catch (err) {
    if (err instanceof ArcaError) {
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status: err.statusCode }
      )
    }
    console.error("[POST /api/facturas/[id]/autorizar-arca]", err)
    return NextResponse.json(
      { error: "Error interno al autorizar en ARCA" },
      { status: 500 }
    )
  }
}
