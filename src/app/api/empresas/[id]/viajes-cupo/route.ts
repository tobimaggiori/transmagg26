/**
 * GET /api/empresas/[id]/viajes-cupo?cupo=X
 *
 * Devuelve los viajes pendientes de facturar para una empresa con un cupo
 * dado. Sirve para autocompletar al crear/editar viajes con el mismo cupo.
 *
 * Respuesta:
 *   { existe: false }                                    si no hay match
 *   { existe: true, fuente: ViajeFuente, hermanos: [] } si hay
 *
 * Roles: solo internos.
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { esRolInterno } from "@/lib/permissions"
import type { Rol } from "@/types"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const rol = session.user.rol as Rol
  if (!esRolInterno(rol)) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  const { id: empresaId } = await params
  const cupo = request.nextUrl.searchParams.get("cupo")?.trim()
  if (!cupo) return NextResponse.json({ error: "cupo requerido" }, { status: 400 })

  const viajes = await prisma.viaje.findMany({
    where: {
      empresaId,
      cupo,
      tieneCupo: true,
      estadoFactura: "PENDIENTE_FACTURAR",
    },
    select: {
      id: true,
      fechaViaje: true,
      remito: true,
      nroCtg: true,
      kilos: true,
      mercaderia: true,
      procedencia: true,
      provinciaOrigen: true,
      destino: true,
      provinciaDestino: true,
      tarifa: true,
      tarifaEmpresa: true,
      comisionPct: true,
      fleteroId: true,
      camionId: true,
      choferId: true,
      esCamionPropio: true,
      tieneCtg: true,
    },
    orderBy: { creadoEn: "asc" },
  })

  if (viajes.length === 0) return NextResponse.json({ existe: false })

  // El "viaje fuente" es el más antiguo (orden ascendente). Sus campos
  // lockeados son la referencia para los nuevos viajes con este cupo.
  const [fuente, ...resto] = viajes
  return NextResponse.json({ existe: true, fuente, hermanos: resto })
}
