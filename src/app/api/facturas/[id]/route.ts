/**
 * API Routes para factura individual.
 * GET   /api/facturas/[id] - Detalle de factura con viajes copiados
 * PATCH /api/facturas/[id] - Cambia estado (BORRADOR→EMITIDA→COBRADA / ANULADA)
 *
 * Cuando se ANULA una factura, sus viajes vuelven a estadoFactura="PENDIENTE_FACTURAR".
 * NO se toca estadoLiquidacion.
 */

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { esRolInterno, esRolEmpresa, puedeVerTarifaEmpresa } from "@/lib/permissions"
import type { Rol } from "@/types"

const TRANSICIONES_VALIDAS: Record<string, string[]> = {
  BORRADOR: ["EMITIDA", "ANULADA"],
  EMITIDA: ["COBRADA", "ANULADA"],
  COBRADA: [],
  ANULADA: [],
}

const actualizarSchema = z.object({
  estado: z.enum(["EMITIDA", "COBRADA", "ANULADA"]),
  nroComprobante: z.string().optional(),
  estadoArca: z.enum(["PENDIENTE", "ACEPTADA", "RECHAZADA"]).optional(),
})

/**
 * GET: NextRequest { params: { id } } -> Promise<NextResponse>
 *
 * Dado el id de la factura, devuelve el detalle completo con viajes copiados, pagos y empresa.
 * Roles empresa solo acceden a sus propias facturas; tarifaEmpresa oculta si no tiene permiso.
 * Existe para la vista de detalle de una factura con toda la información
 * necesaria para verificar importes y gestionar el cobro.
 *
 * Ejemplos:
 * GET /api/facturas/fact1 (sesión ADMIN_TRANSMAGG)
 * // => 200 { id: "fact1", total, viajes: [{ tarifaEmpresa, subtotal, kilos, ... }], pagos: [...] }
 * GET /api/facturas/fact1 (sesión ADMIN_EMPRESA dueño)
 * // => 200 { id: "fact1", viajes: [{ subtotal, kilos, ... }] } (sin tarifaEmpresa)
 * GET /api/facturas/fact1 (sesión FLETERO)
 * // => 403 { error: "Acceso denegado" }
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const rol = session.user.rol as Rol

  const factura = await prisma.facturaEmitida.findUnique({
    where: { id: params.id },
    include: {
      empresa: { select: { razonSocial: true, cuit: true } },
      operador: { select: { nombre: true, apellido: true } },
      viajes: true,
      pagos: true,
    },
  })

  if (!factura) return NextResponse.json({ error: "Factura no encontrada" }, { status: 404 })

  if (esRolEmpresa(rol)) {
    const empUsr = await prisma.empresaUsuario.findFirst({
      where: { usuario: { email: session.user.email }, empresaId: factura.empresaId },
    })
    if (!empUsr) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })
  } else if (!esRolInterno(rol)) {
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })
  }

  // Ocultar tarifaEmpresa si no tiene permiso
  if (!puedeVerTarifaEmpresa(rol)) {
    const factSinTarifas = {
      ...factura,
      viajes: factura.viajes.map((v) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { tarifaEmpresa, ...resto } = v
        return resto
      }),
    }
    return NextResponse.json(factSinTarifas)
  }

  return NextResponse.json(factura)
}

/**
 * PATCH: NextRequest { params: { id } } -> Promise<NextResponse>
 *
 * Dado el id de la factura y { estado, nroComprobante?, estadoArca? },
 * avanza el estado: BORRADOR→EMITIDA/ANULADA, EMITIDA→COBRADA/ANULADA.
 * Al anular, devuelve todos los viajes asociados a estadoFactura="PENDIENTE_FACTURAR"
 * sin tocar estadoLiquidacion.
 * Existe para gestionar el ciclo de vida de una factura.
 *
 * Ejemplos:
 * PATCH /api/facturas/fact1 { estado: "EMITIDA", nroComprobante: "0001-00000001" }
 * // => 200 { id: "fact1", estado: "EMITIDA", nroComprobante: "0001-00000001" }
 * PATCH /api/facturas/fact1 { estado: "ANULADA" }
 * // => 200 { id: "fact1", estado: "ANULADA" } (viajes vuelven a PENDIENTE_FACTURAR)
 * PATCH /api/facturas/fact1 { estado: "COBRADA" } (fact en BORRADOR)
 * // => 422 { error: "No se puede cambiar de BORRADOR a COBRADA" }
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
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })
    }

    const factura = await prisma.facturaEmitida.findUnique({
      where: { id: params.id },
      include: { viajes: { select: { viajeId: true } } },
    })
    if (!factura) return NextResponse.json({ error: "Factura no encontrada" }, { status: 404 })

    const transicionesPermitidas = TRANSICIONES_VALIDAS[factura.estado] ?? []
    if (!transicionesPermitidas.includes(parsed.data.estado)) {
      return NextResponse.json(
        { error: `No se puede cambiar de ${factura.estado} a ${parsed.data.estado}` },
        { status: 422 }
      )
    }

    const actualizada = await prisma.$transaction(async (tx) => {
      const fact = await tx.facturaEmitida.update({
        where: { id: params.id },
        data: {
          estado: parsed.data.estado,
          ...(parsed.data.nroComprobante ? { nroComprobante: parsed.data.nroComprobante } : {}),
          ...(parsed.data.estadoArca ? { estadoArca: parsed.data.estadoArca } : {}),
        },
      })

      // Al anular, liberar viajes (solo estadoFactura, NO tocar estadoLiquidacion)
      if (parsed.data.estado === "ANULADA") {
        const viajeIds = factura.viajes.map((v) => v.viajeId)
        if (viajeIds.length > 0) {
          await tx.viaje.updateMany({
            where: { id: { in: viajeIds } },
            data: { estadoFactura: "PENDIENTE_FACTURAR" },
          })
        }
      }

      return fact
    })

    return NextResponse.json(actualizada)
  } catch (error) {
    console.error("[PATCH /api/facturas/[id]]", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
