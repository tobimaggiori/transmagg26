/**
 * GET /api/padron/[cuit]
 * Consulta el padrón ARCA (servicio `ws_sr_constancia_inscripcion`) para
 * autocompletar datos al alta de Empresa / Fletero / Proveedor.
 * Requiere acceso financiero (rol interno Transmagg).
 */

import { NextResponse } from "next/server"
import { consultarPadronArca } from "@/lib/padron-arca/client"
import { PadronArcaError, PadronArcaCuitInvalidoError, PadronArcaNoEncontradoError } from "@/lib/padron-arca/errors"
import { requireFinancialAccess, serverErrorResponse } from "@/lib/financial-api"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ cuit: string }> }
) {
  const access = await requireFinancialAccess()
  if (!access.ok) return access.response

  const { cuit } = await params

  try {
    const data = await consultarPadronArca(cuit)
    return NextResponse.json(data)
  } catch (err) {
    if (err instanceof PadronArcaCuitInvalidoError) {
      return NextResponse.json({ error: err.message }, { status: 400 })
    }
    if (err instanceof PadronArcaNoEncontradoError) {
      return NextResponse.json({ error: err.message }, { status: 404 })
    }
    if (err instanceof PadronArcaError) {
      return NextResponse.json({ error: err.message }, { status: err.retryable ? 503 : 502 })
    }
    return serverErrorResponse("GET /api/padron/[cuit]", err)
  }
}
