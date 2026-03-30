/**
 * API Routes para gestión de facturas emitidas.
 * GET  /api/facturas - Lista facturas (filtrado por rol)
 * POST /api/facturas - Crea factura asociando viajes existentes + asientos IVA
 *
 * SEGURIDAD: tarifaEmpresa en ViajeEnFactura es NUNCA visible para fleteros/choferes.
 * Los viajes ya deben existir en estado PENDIENTE. El POST los marca como EN_FACTURA.
 */

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { esRolInterno, esRolEmpresa } from "@/lib/permissions"
import type { Rol } from "@/types"

const viajeEnFactSchema = z.object({
  viajeId: z.string().uuid(),
  tarifaEmpresa: z.number().positive("La tarifa de empresa debe ser mayor a 0"),
})

const crearFacturaSchema = z.object({
  empresaId: z.string().uuid(),
  tipoCbte: z.enum(["A", "B", "C", "M", "X"]),
  alicuotaIva: z.number().positive().default(21),
  viajes: z.array(viajeEnFactSchema).min(1, "Debe incluir al menos un viaje"),
})

/**
 * GET: () -> Promise<NextResponse>
 *
 * Devuelve hasta 50 facturas ordenadas por fecha desc.
 * Roles empresa solo ven sus facturas; roles internos ven todas. Fletero/Chofer: 403.
 * Existe para el listado de facturas en el panel, donde cada empresa
 * accede solo a las facturas emitidas a su nombre.
 *
 * Ejemplos:
 * GET /api/facturas (sesión ADMIN_TRANSMAGG)
 * // => 200 [{ id, estado, total, empresa: { razonSocial }, _count: { viajes } }]
 * GET /api/facturas (sesión ADMIN_EMPRESA)
 * // => 200 [{ id, estado, total, ... }] (solo las de su empresa)
 * GET /api/facturas (sesión FLETERO)
 * // => 403 { error: "Acceso denegado" }
 */
export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const rol = session.user.rol as Rol
  let whereClause: Record<string, unknown> = {}

  if (esRolEmpresa(rol)) {
    const empUsr = await prisma.empresaUsuario.findFirst({
      where: { usuario: { email: session.user.email } },
      select: { empresaId: true },
    })
    if (!empUsr) return NextResponse.json([])
    whereClause = { empresaId: empUsr.empresaId }
  } else if (!esRolInterno(rol)) {
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })
  }

  const facturas = await prisma.facturaEmitida.findMany({
    where: whereClause,
    include: {
      empresa: { select: { razonSocial: true } },
      _count: { select: { viajes: true } },
    },
    orderBy: { emitidaEn: "desc" },
    take: 50,
  })

  return NextResponse.json(facturas)
}

/**
 * POST: NextRequest -> Promise<NextResponse>
 *
 * Dado el body { empresaId, tipoCbte, alicuotaIva, viajes: [{ viajeId, tarifaEmpresa }] },
 * crea una factura, genera el asiento de IVA, crea ViajeEnFactura con tarifaEmpresa,
 * genera asientos IIBB por provincia y marca los viajes como EN_FACTURA.
 * Existe para facturar los viajes pendientes de una empresa, calculando
 * automáticamente neto, IVA y total.
 *
 * Ejemplos:
 * POST /api/facturas { empresaId: "e1", tipoCbte: "A", alicuotaIva: 21, viajes: [{ viajeId: "v2", tarifaEmpresa: 60000 }] }
 * // => 201 { id, estado: "PENDIENTE", total, neto, ivaMonto }
 * POST /api/facturas { empresaId: "e1", tipoCbte: "A", alicuotaIva: 21, viajes: [{ viajeId: "v3", tarifaEmpresa: 60000 }] } (v3 EN_FACTURA)
 * // => 400 { error: "Uno o más viajes no existen, no pertenecen a la empresa, o no están en estado PENDIENTE" }
 * POST /api/facturas (sesión FLETERO)
 * // => 403 { error: "Acceso denegado" }
 */
export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const rol = session.user.rol as Rol
  if (!esRolInterno(rol)) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  try {
    const body = await request.json()
    const parsed = crearFacturaSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos", detalles: parsed.error.flatten() }, { status: 400 })
    }

    const { empresaId, tipoCbte, alicuotaIva, viajes } = parsed.data

    const empresa = await prisma.empresa.findUnique({ where: { id: empresaId, activa: true } })
    if (!empresa) return NextResponse.json({ error: "Empresa no encontrada" }, { status: 404 })

    // Verificar que todos los viajes existen y están PENDIENTES para esta empresa
    const viajeIds = viajes.map((v) => v.viajeId)
    const viajesExistentes = await prisma.viaje.findMany({
      where: { id: { in: viajeIds }, empresaId, estado: "PENDIENTE" },
    })

    if (viajesExistentes.length !== viajes.length) {
      return NextResponse.json(
        { error: "Uno o más viajes no existen, no pertenecen a la empresa, o no están en estado PENDIENTE" },
        { status: 400 }
      )
    }

    const neto = viajes.reduce((acc, v) => acc + v.tarifaEmpresa, 0)
    const ivaMonto = neto * (alicuotaIva / 100)
    const total = neto + ivaMonto
    const periodo = viajesExistentes[0].fechaViaje.toISOString().slice(0, 7)

    const factura = await prisma.$transaction(async (tx) => {
      const fact = await tx.facturaEmitida.create({
        data: {
          empresaId,
          operadorId: session.user.id,
          tipoCbte,
          neto,
          ivaMonto,
          total,
          estadoArca: "PENDIENTE",
          estado: "PENDIENTE",
        },
      })

      await tx.asientoIva.create({
        data: {
          facturaEmitidaId: fact.id,
          tipoReferencia: "FACTURA_EMITIDA",
          tipo: "VENTA",
          baseImponible: neto,
          alicuota: alicuotaIva,
          montoIva: ivaMonto,
          periodo,
        },
      })

      for (const viaje of viajes) {
        const viajeData = viajesExistentes.find((v) => v.id === viaje.viajeId)!

        const enFact = await tx.viajeEnFactura.create({
          data: {
            viajeId: viaje.viajeId,
            facturaId: fact.id,
            tarifaEmpresa: viaje.tarifaEmpresa,
            subtotal: viaje.tarifaEmpresa,
          },
        })

        if (viajeData.provinciaOrigen) {
          await tx.asientoIibb.create({
            data: {
              viajeEnFactId: enFact.id,
              tablaOrigen: "viajes_en_factura",
              provincia: viajeData.provinciaOrigen,
              montoIngreso: viaje.tarifaEmpresa,
              periodo: viajeData.fechaViaje.toISOString().slice(0, 7),
            },
          })
        }
      }

      await tx.viaje.updateMany({
        where: { id: { in: viajeIds } },
        data: { estado: "EN_FACTURA" },
      })

      return fact
    })

    return NextResponse.json(factura, { status: 201 })
  } catch (error) {
    console.error("[POST /api/facturas]", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
