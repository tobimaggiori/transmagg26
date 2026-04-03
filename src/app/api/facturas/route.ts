/**
 * API Routes para gestión de facturas emitidas.
 * GET  /api/facturas?empresaId=XXX - LPs pendientes de facturar + facturas emitidas
 * POST /api/facturas - Crea factura a partir de una LP (1 LP = 1 Factura)
 *
 * SEGURIDAD: tarifaEmpresa en ViajeEnFactura es NUNCA visible para fleteros/choferes.
 * El POST marca los viajes de la LP como estadoFactura="FACTURADO" (NO toca estadoLiquidacion).
 */

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { esRolInterno, esRolEmpresa } from "@/lib/permissions"
import { calcularTotalViaje, calcularFactura } from "@/lib/viajes"
import { EstadoFacturaDocumento, EstadoFacturaViaje } from "@/lib/viaje-workflow"
import { resolverOperadorId } from "@/lib/session-utils"
import type { Rol } from "@/types"

const crearFacturaSchema = z.object({
  empresaId: z.string().uuid(),
  liquidacionId: z.string().uuid(),
  tipoCbte: z.number().int().refine((v) => [1, 6, 201].includes(v), {
    message: "tipoCbte debe ser 1 (Fact. A), 6 (Fact. B) o 201 (Fact. A MiPyme)",
  }),
  modalidadMiPymes: z.enum(["SCA", "ADC"]).optional(),
  ivaPct: z.number().min(0).max(100).default(21),
})

/**
 * GET: NextRequest -> Promise<NextResponse>
 *
 * Devuelve liquidaciones pendientes de facturar (estado="EMITIDA", facturaEmitidaId=null)
 * y las facturas existentes de la empresa especificada.
 * Una LP es pendiente si está EMITIDA, no tiene factura asociada, y sus viajes
 * pertenecen a la empresa seleccionada.
 * Roles empresa solo ven los suyos; roles internos pueden filtrar por empresaId.
 *
 * Ejemplos:
 * GET /api/facturas?empresaId=e1 (sesión ADMIN_TRANSMAGG)
 * // => 200 { liquidacionesPendientes: [...], facturas: [...] }
 * GET /api/facturas (sesión ADMIN_EMPRESA)
 * // => 200 { liquidacionesPendientes: [...], facturas: [...] } (solo los suyos)
 * GET /api/facturas (sesión FLETERO)
 * // => 403 { error: "Acceso denegado" }
 */
export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const rol = session.user.rol as Rol
  const { searchParams } = new URL(request.url)
  const empresaId = searchParams.get("empresaId")

  if (!esRolEmpresa(rol) && !esRolInterno(rol)) {
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })
  }

  // Determinar el empresaId real según el rol
  let empresaIdReal: string | null = empresaId

  if (esRolEmpresa(rol)) {
    const empUsr = await prisma.empresaUsuario.findFirst({
      where: { usuario: { email: session.user.email ?? "" } },
      select: { empresaId: true },
    })
    if (!empUsr) return NextResponse.json({ liquidacionesPendientes: [], facturas: [] })
    empresaIdReal = empUsr.empresaId
  }

  const whereFacturas: Record<string, unknown> = {}
  if (empresaIdReal) whereFacturas.empresaId = empresaIdReal

  try {
    const [liquidacionesPendientes, facturas] = await Promise.all([
      // LPs disponibles para facturación: EMITIDA, sin factura, con viajes de la empresa
      empresaIdReal
        ? prisma.liquidacion.findMany({
            where: {
              estado: "EMITIDA",
              facturaEmitidaId: null,
              viajes: {
                some: {
                  viaje: { empresaId: empresaIdReal },
                },
              },
            },
            include: {
              fletero: { select: { razonSocial: true } },
              viajes: {
                include: {
                  viaje: {
                    select: {
                      id: true,
                      empresaId: true,
                      kilos: true,
                      tarifaEmpresa: true,
                      procedencia: true,
                      provinciaOrigen: true,
                      destino: true,
                      provinciaDestino: true,
                      mercaderia: true,
                      remito: true,
                      cupo: true,
                      fechaViaje: true,
                      nroCartaPorte: true,
                      tieneCpe: true,
                    },
                  },
                },
              },
            },
            orderBy: { grabadaEn: "desc" },
          })
        : [],
      prisma.facturaEmitida.findMany({
        where: whereFacturas,
        include: {
          empresa: { select: { razonSocial: true } },
          viajes: true,
          pagos: { select: { monto: true } },
        },
        orderBy: { emitidaEn: "desc" },
        take: 100,
      }),
    ])

    return NextResponse.json({ liquidacionesPendientes, facturas })
  } catch (error) {
    console.error("[GET /api/facturas]", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error desconocido", detail: String(error) },
      { status: 500 }
    )
  }
}

/**
 * POST: NextRequest -> Promise<NextResponse>
 *
 * Dado el body { empresaId, liquidacionId, tipoCbte, ivaPct, modalidadMiPymes? },
 * crea una factura a partir de la LP seleccionada (1 LP = 1 Factura).
 * Copia los datos de cada viaje de la LP al snapshot de ViajeEnFactura.
 * Actualiza liquidacion.facturaEmitidaId y estadoFactura="FACTURADO" en cada viaje.
 *
 * Ejemplos:
 * POST /api/facturas { empresaId: "e1", liquidacionId: "liq1", tipoCbte: 1, ivaPct: 21 }
 * // => 201 { id, estado: "BORRADOR", total, neto, ivaMonto }
 * POST /api/facturas { empresaId: "e1", liquidacionId: "liq-ya-facturada", tipoCbte: 1 }
 * // => 400 { error: "La liquidación ya tiene una factura asociada" }
 */
export async function POST(request: NextRequest) {
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

  try {
    const body = await request.json()
    const parsed = crearFacturaSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos", detalles: parsed.error.flatten() }, { status: 400 })
    }

    const { empresaId, liquidacionId, tipoCbte, modalidadMiPymes, ivaPct } = parsed.data

    const empresa = await prisma.empresa.findFirst({ where: { id: empresaId, activa: true } })
    if (!empresa) return NextResponse.json({ error: "Empresa no encontrada" }, { status: 404 })

    // Validar tipoCbte según condición IVA de la empresa
    if (empresa.condicionIva === "RESPONSABLE_INSCRIPTO") {
      if (![1, 201].includes(tipoCbte)) {
        return NextResponse.json(
          { error: "Para empresas RI solo se puede emitir Factura A (1) o Factura A MiPyme (201)" },
          { status: 422 }
        )
      }
    } else {
      if (tipoCbte !== 6) {
        return NextResponse.json(
          { error: "Para empresas no RI solo se puede emitir Factura B (6)" },
          { status: 422 }
        )
      }
    }

    // Para MiPyme, modalidad es obligatoria
    if (tipoCbte === 201 && !modalidadMiPymes) {
      return NextResponse.json(
        { error: "Para Factura A MiPyme se debe especificar la modalidad (SCA o ADC)" },
        { status: 422 }
      )
    }

    // Buscar la liquidación con sus viajes
    const liquidacion = await prisma.liquidacion.findUnique({
      where: { id: liquidacionId },
      include: {
        viajes: {
          include: {
            viaje: {
              select: {
                id: true,
                empresaId: true,
                kilos: true,
                tarifaEmpresa: true,
                fechaViaje: true,
                remito: true,
                cupo: true,
                mercaderia: true,
                procedencia: true,
                provinciaOrigen: true,
                destino: true,
                provinciaDestino: true,
                fleteroId: true,
                camionId: true,
                choferId: true,
              },
            },
          },
        },
      },
    })

    if (!liquidacion) {
      return NextResponse.json({ error: "Liquidación no encontrada" }, { status: 404 })
    }

    // Verificar que está EMITIDA y no tiene factura asociada
    if (liquidacion.estado !== "EMITIDA") {
      return NextResponse.json({ error: "La liquidación no está en estado EMITIDA" }, { status: 400 })
    }

    if (liquidacion.facturaEmitidaId) {
      return NextResponse.json({ error: "La liquidación ya tiene una factura asociada" }, { status: 400 })
    }

    // Verificar que todos los viajes pertenecen a la empresa
    const viajesDeLP = liquidacion.viajes.map((vl) => vl.viaje)
    const viajesNoPertenecen = viajesDeLP.filter((v) => v.empresaId !== empresaId)
    if (viajesNoPertenecen.length > 0) {
      return NextResponse.json(
        { error: "Uno o más viajes de la LP no pertenecen a la empresa seleccionada" },
        { status: 400 }
      )
    }

    // Calcular totales desde los viajes de la LP
    const viajesParaCalc = viajesDeLP.map((v) => ({
      kilos: v.kilos ?? 0,
      tarifaEmpresa: v.tarifaEmpresa,
    }))
    const { neto, ivaMonto, total } = calcularFactura(viajesParaCalc, ivaPct)

    const periodo = viajesDeLP[0].fechaViaje.toISOString().slice(0, 7)
    const viajeIds = viajesDeLP.map((v) => v.id)

    const factura = await prisma.$transaction(async (tx) => {
      const fact = await tx.facturaEmitida.create({
        data: {
          empresaId,
          operadorId,
          tipoCbte,
          modalidadMiPymes: modalidadMiPymes ?? null,
          ivaPct,
          neto,
          ivaMonto,
          total,
          estadoArca: "PENDIENTE",
          estado: EstadoFacturaDocumento.BORRADOR,
        },
      })

      await tx.asientoIva.create({
        data: {
          facturaEmitidaId: fact.id,
          tipoReferencia: "FACTURA_EMITIDA",
          tipo: "VENTA",
          baseImponible: neto,
          alicuota: ivaPct,
          montoIva: ivaMonto,
          periodo,
        },
      })

      for (const viaje of viajesDeLP) {
        const subtotalViaje = calcularTotalViaje(viaje.kilos ?? 0, viaje.tarifaEmpresa)

        const enFact = await tx.viajeEnFactura.create({
          data: {
            viajeId: viaje.id,
            facturaId: fact.id,
            fechaViaje: viaje.fechaViaje,
            remito: viaje.remito ?? null,
            cupo: viaje.cupo ?? null,
            mercaderia: viaje.mercaderia ?? null,
            procedencia: viaje.procedencia ?? null,
            provinciaOrigen: viaje.provinciaOrigen ?? null,
            destino: viaje.destino ?? null,
            provinciaDestino: viaje.provinciaDestino ?? null,
            kilos: viaje.kilos,
            tarifaEmpresa: viaje.tarifaEmpresa,
            subtotal: subtotalViaje,
          },
        })

        const provincia = viaje.provinciaOrigen
        if (provincia) {
          await tx.asientoIibb.create({
            data: {
              viajeEnFactId: enFact.id,
              tablaOrigen: "viajes_en_factura",
              provincia,
              montoIngreso: subtotalViaje,
              periodo: viaje.fechaViaje.toISOString().slice(0, 7),
            },
          })
        }
      }

      // Vincular la LP con la factura
      await tx.liquidacion.update({
        where: { id: liquidacionId },
        data: { facturaEmitidaId: fact.id },
      })

      // Marcar viajes como FACTURADO (sin tocar estadoLiquidacion)
      await tx.viaje.updateMany({
        where: { id: { in: viajeIds } },
        data: { estadoFactura: EstadoFacturaViaje.FACTURADO },
      })

      return fact
    })

    return NextResponse.json(factura, { status: 201 })
  } catch (error) {
    console.error("[POST /api/facturas]", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error desconocido", detail: String(error) },
      { status: 500 }
    )
  }
}
