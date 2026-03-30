/**
 * API Route: GET /api/dashboard-financiero/cheques-cartera?tipo=al_dia|no_al_dia
 * Devuelve los cheques en cartera filtrados por tipo (al día o no al día).
 * Solo accesible para ADMIN_TRANSMAGG y OPERADOR_TRANSMAGG.
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireFinancialAccess, serverErrorResponse } from "@/lib/financial-api"

/**
 * GET: NextRequest -> Promise<NextResponse>
 *
 * Dado [el query param tipo (al_dia|no_al_dia)], devuelve [la lista de cheques en cartera correspondiente].
 * Esta función existe para poblar los sub-modales del dashboard de cheques en cartera.
 *
 * Ejemplos:
 * GET(?tipo=al_dia)    === NextResponse.json([{ id, empresa, nroCheque, bancoEmisor, monto, fechaCobro, estado }])
 * GET(?tipo=no_al_dia) === NextResponse.json([{ id, empresa, nroCheque, bancoEmisor, monto, fechaCobro, estado }])
 * GET()                === NextResponse.json([...todos...])
 */
export async function GET(request: NextRequest) {
  const access = await requireFinancialAccess()
  if (!access.ok) return access.response

  try {
    const { searchParams } = new URL(request.url)
    const tipo = searchParams.get("tipo")
    const hoy = new Date()

    let fechaFiltro: { lte?: Date; gt?: Date } = {}
    if (tipo === "al_dia") {
      fechaFiltro = { lte: hoy }
    } else if (tipo === "no_al_dia") {
      fechaFiltro = { gt: hoy }
    }

    const cheques = await prisma.chequeRecibido.findMany({
      where: {
        estado: "EN_CARTERA",
        ...(tipo ? { fechaCobro: fechaFiltro } : {}),
      },
      include: {
        empresa: { select: { razonSocial: true } },
      },
      orderBy: { fechaCobro: "asc" },
    })

    const resultado = cheques.map((c) => ({
      id: c.id,
      empresa: c.empresa.razonSocial,
      nroCheque: c.nroCheque,
      bancoEmisor: c.bancoEmisor,
      monto: c.monto,
      fechaCobro: c.fechaCobro.toISOString(),
      estado: c.estado,
    }))

    return NextResponse.json(resultado)
  } catch (error) {
    return serverErrorResponse("GET /api/dashboard-financiero/cheques-cartera", error)
  }
}
