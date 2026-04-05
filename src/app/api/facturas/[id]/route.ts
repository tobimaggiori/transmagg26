/**
 * API Routes para factura individual.
 * GET   /api/facturas/[id] - Detalle de factura con viajes copiados
 * PATCH /api/facturas/[id] - Cambia estado (EMITIDA→COBRADA)
 *
 * Los documentos son inmutables: no se anulan. La corrección se hace por NC/ND.
 * NO se toca estadoLiquidacion.
 */

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { esRolInterno, esRolEmpresa, puedeVerTarifaEmpresa } from "@/lib/permissions"
import { EstadoFacturaDocumento } from "@/lib/viaje-workflow"
import { verificarPropietarioEmpresa } from "@/lib/session-utils"
import type { Rol } from "@/types"

const TRANSICIONES_VALIDAS: Record<string, string[]> = {
  [EstadoFacturaDocumento.EMITIDA]: [EstadoFacturaDocumento.COBRADA],
  [EstadoFacturaDocumento.COBRADA]: [],
}

const actualizarSchema = z.object({
  estado: z.enum([
    EstadoFacturaDocumento.EMITIDA,
    EstadoFacturaDocumento.COBRADA,
  ]),
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

  try {
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
      const esPropietario = await verificarPropietarioEmpresa(factura.empresaId, session.user.email!)
      if (!esPropietario) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })
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
  } catch (error) {
    console.error("[GET /api/facturas/[id]]", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error desconocido", detail: String(error) },
      { status: 500 }
    )
  }
}

/**
 * PATCH: NextRequest { params: { id } } -> Promise<NextResponse>
 *
 * Dado el id de la factura y { estado }, avanza el estado: EMITIDA→COBRADA.
 * Documentos inmutables: la corrección se hace por NC/ND, no por anulación.
 * CAE/nroComprobante/estadoArca se asignan por ARCA al crear.
 *
 * Ejemplos:
 * PATCH /api/facturas/fact1 { estado: "COBRADA" }
 * // => 200 { id: "fact1", estado: "COBRADA" }
 * PATCH /api/facturas/fact1 { estado: "COBRADA" } (fact ya COBRADA)
 * // => 422 { error: "No se puede cambiar de COBRADA a COBRADA" }
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
    })
    if (!factura) return NextResponse.json({ error: "Factura no encontrada" }, { status: 404 })

    const transicionesPermitidas = TRANSICIONES_VALIDAS[factura.estado] ?? []
    if (!transicionesPermitidas.includes(parsed.data.estado)) {
      return NextResponse.json(
        { error: `No se puede cambiar de ${factura.estado} a ${parsed.data.estado}` },
        { status: 422 }
      )
    }

    const actualizada = await prisma.facturaEmitida.update({
      where: { id: params.id },
      data: { estado: parsed.data.estado },
    })

    return NextResponse.json(actualizada)
  } catch (error) {
    console.error("[PATCH /api/facturas/[id]]", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error desconocido", detail: String(error) },
      { status: 500 }
    )
  }
}
