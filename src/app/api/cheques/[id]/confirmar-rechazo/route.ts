/**
 * API Route: POST /api/cheques/[id]/confirmar-rechazo
 * Marca un cheque como RECHAZADO y anula atomicamente todos los pagos vinculados.
 * Recalcula estados de LP y FacturaProveedor. Opcionalmente registra costo bancario.
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { esRolInterno } from "@/lib/permissions"
import { resolverOperadorId } from "@/lib/session-utils"
import { ejecutarConfirmarRechazoCheque } from "@/lib/cheque-rechazo-commands"
import type { Rol } from "@/types"

/**
 * POST: NextRequest -> Promise<NextResponse>
 *
 * Dado el id de un cheque, lo marca como RECHAZADO y anula atomicamente todos los
 * PagoAFletero y PagoProveedor vinculados. Recalcula estados de LP y FacturaProveedor.
 * Si se provee costoBancarioMonto > 0 y el cheque era EMITIDO, crea un MovimientoSinFactura EGRESO.
 * Solo accesible para roles internos.
 *
 * Body: { costoBancarioMonto?: number }
 *
 * Ejemplos:
 * POST /api/cheques/abc/confirmar-rechazo {} === 200 { ok: true, impactosAplicados: 2 }
 * POST /api/cheques/abc/confirmar-rechazo (ya RECHAZADO) === 409 { error: "El cheque ya está rechazado" }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const rol = session.user.rol as Rol
  if (!esRolInterno(rol)) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  let operadorId: string
  try {
    operadorId = await resolverOperadorId(session.user)
  } catch {
    return NextResponse.json({ error: "Sesión inválida. Cerrá sesión y volvé a ingresar." }, { status: 401 })
  }

  const { id } = await params
  const body = await request.json().catch(() => ({})) as { costoBancarioMonto?: number }
  const costoBancarioMonto = typeof body.costoBancarioMonto === "number" && body.costoBancarioMonto > 0
    ? body.costoBancarioMonto
    : null

  try {
    const result = await ejecutarConfirmarRechazoCheque(
      { chequeId: id, costoBancarioMonto },
      operadorId
    )

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }

    return NextResponse.json({ ok: true, impactosAplicados: result.impactosAplicados })
  } catch (error) {
    console.error("[POST /api/cheques/[id]/confirmar-rechazo]", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
