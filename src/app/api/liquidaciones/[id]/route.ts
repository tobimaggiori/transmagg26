/**
 * API Routes para liquidación individual.
 * GET   /api/liquidaciones/[id] - Detalle de liquidación con viajes
 * PATCH /api/liquidaciones/[id] - Cambia estado (BORRADOR→EMITIDA / ANULADA)
 *
 * Cuando se ANULA una liquidación, sus viajes vuelven a estadoLiquidacion="PENDIENTE_LIQUIDAR".
 * Al pasar a EMITIDA el operador confirma que está cargada en ARCA.
 */

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { esRolInterno, puedeVerTarifaFletero } from "@/lib/permissions"
import type { Rol } from "@/types"

const TRANSICIONES_VALIDAS: Record<string, string[]> = {
  BORRADOR: ["EMITIDA", "ANULADA"],
  EMITIDA: ["PAGADA", "ANULADA"],
  PAGADA: [],
  ANULADA: [],
}

const actualizarSchema = z.object({
  estado: z.enum(["EMITIDA", "PAGADA", "ANULADA"]),
})

/**
 * GET: NextRequest { params: { id } } -> Promise<NextResponse>
 *
 * Dado el id de la liquidación, devuelve el detalle completo con viajes copiados,
 * pagos y datos del fletero. FLETERO solo accede a las suyas; tarifaFletero oculta si no tiene permiso.
 * Existe para la vista de detalle de una liquidación con toda la información
 * necesaria para verificar y aprobar el pago al fletero.
 *
 * Ejemplos:
 * GET /api/liquidaciones/liq1 (sesión ADMIN_TRANSMAGG)
 * // => 200 { id: "liq1", total, viajes: [{ tarifaFletero, subtotal, kilos, ... }], pagos: [...] }
 * GET /api/liquidaciones/liq1 (sesión FLETERO dueño)
 * // => 200 { id: "liq1", viajes: [{ tarifaFletero, subtotal, kilos, ... }] }
 * GET /api/liquidaciones/liq1 (sesión ADMIN_EMPRESA)
 * // => 403 { error: "Acceso denegado" }
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const rol = session.user.rol as Rol

  const liquidacion = await prisma.liquidacion.findUnique({
    where: { id: params.id },
    include: {
      fletero: { select: { razonSocial: true, cuit: true } },
      operador: { select: { nombre: true, apellido: true } },
      viajes: true,
      pagos: true,
    },
  })

  if (!liquidacion) return NextResponse.json({ error: "Liquidación no encontrada" }, { status: 404 })

  if (rol === "FLETERO") {
    const fleteroPropio = await prisma.fletero.findFirst({
      where: { id: liquidacion.fleteroId, usuario: { email: session.user.email } },
    })
    if (!fleteroPropio) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })
  } else if (!esRolInterno(rol)) {
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })
  }

  // Ocultar tarifaFletero si no tiene permiso
  if (!puedeVerTarifaFletero(rol)) {
    const liqSinTarifas = {
      ...liquidacion,
      viajes: liquidacion.viajes.map((v) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { tarifaFletero, subtotal, ...resto } = v
        return resto
      }),
    }
    return NextResponse.json(liqSinTarifas)
  }

  return NextResponse.json(liquidacion)
}

/**
 * PATCH: NextRequest { params: { id } } -> Promise<NextResponse>
 *
 * Dado el id de la liquidación y { estado }, avanza el estado según
 * las transiciones válidas: BORRADOR→EMITIDA/ANULADA, EMITIDA→PAGADA/ANULADA.
 * Al anular, devuelve todos los viajes asociados a estadoLiquidacion="PENDIENTE_LIQUIDAR".
 * Existe para gestionar el ciclo de vida de una liquidación y permitir correcciones.
 *
 * Ejemplos:
 * PATCH /api/liquidaciones/liq1 { estado: "EMITIDA" } (liq en BORRADOR)
 * // => 200 { id: "liq1", estado: "EMITIDA" }
 * PATCH /api/liquidaciones/liq1 { estado: "ANULADA" } (liq en EMITIDA)
 * // => 200 { id: "liq1", estado: "ANULADA" } (viajes vuelven a PENDIENTE_LIQUIDAR)
 * PATCH /api/liquidaciones/liq1 { estado: "BORRADOR" } (transición inválida)
 * // => 422 { error: "No se puede cambiar de EMITIDA a BORRADOR" }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const rol = session.user.rol as Rol
  if (!esRolInterno(rol)) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  try {
    const body = await request.json()
    const parsed = actualizarSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Estado inválido" }, { status: 400 })
    }

    const liquidacion = await prisma.liquidacion.findUnique({
      where: { id: params.id },
      include: { viajes: { select: { viajeId: true } } },
    })
    if (!liquidacion) return NextResponse.json({ error: "Liquidación no encontrada" }, { status: 404 })

    const transicionesPermitidas = TRANSICIONES_VALIDAS[liquidacion.estado] ?? []
    if (!transicionesPermitidas.includes(parsed.data.estado)) {
      return NextResponse.json(
        { error: `No se puede cambiar de ${liquidacion.estado} a ${parsed.data.estado}` },
        { status: 422 }
      )
    }

    const actualizada = await prisma.$transaction(async (tx) => {
      const liq = await tx.liquidacion.update({
        where: { id: params.id },
        data: { estado: parsed.data.estado },
      })

      // Si se anula, liberar viajes (solo estadoLiquidacion, NO tocar estadoFactura)
      if (parsed.data.estado === "ANULADA") {
        const viajeIds = liquidacion.viajes.map((v) => v.viajeId)
        if (viajeIds.length > 0) {
          await tx.viaje.updateMany({
            where: { id: { in: viajeIds } },
            data: { estadoLiquidacion: "PENDIENTE_LIQUIDAR" },
          })
        }
      }

      return liq
    })

    return NextResponse.json(actualizada)
  } catch (error) {
    console.error("[PATCH /api/liquidaciones/[id]]", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
