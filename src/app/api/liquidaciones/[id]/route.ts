/**
 * API Routes para liquidación individual.
 * GET   /api/liquidaciones/[id] - Detalle de liquidación con viajes
 * PATCH /api/liquidaciones/[id] - Cambia estado (EMITIDA→PAGADA)
 *
 * Los documentos son inmutables: no se anulan. La corrección se hace por NC/ND.
 * CAE/nroComprobante/arcaEstado se asignan por ARCA al crear (emisión directa).
 */

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { esRolInterno, puedeVerTarifaFletero } from "@/lib/permissions"
import { EstadoLiquidacionDocumento } from "@/lib/viaje-workflow"
import { verificarPropietarioFletero } from "@/lib/session-utils"
import type { Rol } from "@/types"

const TRANSICIONES_VALIDAS: Record<string, string[]> = {
  [EstadoLiquidacionDocumento.EMITIDA]: [EstadoLiquidacionDocumento.PAGADA],
  [EstadoLiquidacionDocumento.PAGADA]: [],
}

const actualizarSchema = z.object({
  estado: z.enum([
    EstadoLiquidacionDocumento.EMITIDA,
    EstadoLiquidacionDocumento.PAGADA,
  ]),
})

/**
 * GET: NextRequest { params: { id } } -> Promise<NextResponse>
 *
 * Dado el id de la liquidación, devuelve el detalle completo con viajes copiados,
 * pagos y datos del fletero. FLETERO solo accede a las suyas; tarifaFletero oculta si no tiene permiso.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const rol = session.user.rol as Rol

  try {
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
      const esPropietario = await verificarPropietarioFletero(liquidacion.fleteroId, session.user.email!)
      if (!esPropietario) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })
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
  } catch (error) {
    console.error("[GET /api/liquidaciones/[id]]", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error desconocido", detail: String(error) },
      { status: 500 }
    )
  }
}

/**
 * PATCH: NextRequest { params: { id } } -> Promise<NextResponse>
 *
 * Dado el id de la liquidación y { estado }, avanza el estado: EMITIDA→PAGADA.
 * Documentos inmutables: la corrección se hace por NC/ND, no por anulación.
 *
 * Ejemplos:
 * PATCH /api/liquidaciones/liq1 { estado: "PAGADA" } (liq en EMITIDA)
 * // => 200 { id: "liq1", estado: "PAGADA" }
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
    })
    if (!liquidacion) return NextResponse.json({ error: "Liquidación no encontrada" }, { status: 404 })

    const transicionesPermitidas = TRANSICIONES_VALIDAS[liquidacion.estado] ?? []
    if (!transicionesPermitidas.includes(parsed.data.estado)) {
      return NextResponse.json(
        { error: `No se puede cambiar de ${liquidacion.estado} a ${parsed.data.estado}` },
        { status: 422 }
      )
    }

    const actualizada = await prisma.liquidacion.update({
      where: { id: params.id },
      data: { estado: parsed.data.estado },
    })

    return NextResponse.json(actualizada)
  } catch (error) {
    console.error("[PATCH /api/liquidaciones/[id]]", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error desconocido", detail: String(error) },
      { status: 500 }
    )
  }
}
