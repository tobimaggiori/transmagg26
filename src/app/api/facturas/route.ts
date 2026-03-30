/**
 * API Routes para gestión de facturas emitidas.
 * GET  /api/facturas?empresaId=XXX - Viajes pendientes + facturas
 * POST /api/facturas - Crea factura asociando viajes existentes + asientos IVA/IIBB
 *
 * SEGURIDAD: tarifaEmpresa en ViajeEnFactura es NUNCA visible para fleteros/choferes.
 * Los viajes se filtran por estadoFactura="PENDIENTE_FACTURAR".
 * El POST los marca como estadoFactura="FACTURADO" (NO toca estadoLiquidacion).
 */

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { esRolInterno, esRolEmpresa } from "@/lib/permissions"
import { calcularToneladas, calcularTotalViaje, calcularFactura } from "@/lib/viajes"
import { obtenerTarifaOperativaInicial } from "@/lib/viaje-serialization"
import { EstadoFacturaDocumento, EstadoFacturaViaje } from "@/lib/viaje-workflow"
import type { Rol } from "@/types"

const viajeEnFactSchema = z.object({
  viajeId: z.string().uuid(),
  camionId: z.string().uuid().optional(),
  choferId: z.string().uuid().optional(),
  fechaViaje: z.string(),
  remito: z.string().nullable().optional(),
  cupo: z.string().nullable().optional(),
  mercaderia: z.string().nullable().optional(),
  procedencia: z.string().nullable().optional(),
  provinciaOrigen: z.string().nullable().optional(),
  destino: z.string().nullable().optional(),
  provinciaDestino: z.string().nullable().optional(),
  kilos: z.number().positive("Kilos debe ser mayor a 0"),
  tarifaEmpresa: z.number().positive("La tarifa de empresa debe ser mayor a 0"),
})

const crearFacturaSchema = z.object({
  empresaId: z.string().uuid(),
  tipoCbte: z.enum(["A", "B", "C", "M", "X"]),
  ivaPct: z.number().min(0).max(100).default(21),
  viajes: z.array(viajeEnFactSchema).min(1, "Debe incluir al menos un viaje"),
})

/**
 * GET: NextRequest -> Promise<NextResponse>
 *
 * Devuelve viajes pendientes de facturar (estadoFactura="PENDIENTE_FACTURAR")
 * y las facturas existentes de la empresa especificada.
 * Roles empresa solo ven los suyos; roles internos pueden filtrar por empresaId.
 * Existe para el panel de facturas mostrando qué facturar y qué ya está facturado.
 *
 * Ejemplos:
 * GET /api/facturas?empresaId=e1 (sesión ADMIN_TRANSMAGG)
 * // => 200 { viajesPendientes: [...], facturas: [...] }
 * GET /api/facturas (sesión ADMIN_EMPRESA)
 * // => 200 { viajesPendientes: [...], facturas: [...] } (solo los suyos)
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
    if (!empUsr) return NextResponse.json({ viajesPendientes: [], facturas: [] })
    empresaIdReal = empUsr.empresaId
  }

  const whereViajes: Record<string, unknown> = {
    estadoFactura: EstadoFacturaViaje.PENDIENTE_FACTURAR,
  }
  if (empresaIdReal) whereViajes.empresaId = empresaIdReal

  const whereFacturas: Record<string, unknown> = {}
  if (empresaIdReal) whereFacturas.empresaId = empresaIdReal

  const [viajesRaw, facturas] = await Promise.all([
    prisma.viaje.findMany({
      where: whereViajes,
      select: {
        id: true,
        fechaViaje: true,
        fleteroId: true,
        empresaId: true,
        empresa: { select: { razonSocial: true } },
        fletero: { select: { razonSocial: true } },
        camionId: true,
        camion: { select: { patenteChasis: true } },
        choferId: true,
        chofer: { select: { nombre: true, apellido: true } },
        remito: true,
        cupo: true,
        mercaderia: true,
        procedencia: true,
        provinciaOrigen: true,
        destino: true,
        provinciaDestino: true,
        kilos: true,
        tarifaOperativaInicial: true,
        estadoLiquidacion: true,
        estadoFactura: true,
      },
      orderBy: { fechaViaje: "desc" },
      take: 200,
    }),
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

  // Calcular toneladas y total en los viajes pendientes
  const viajesPendientes = viajesRaw.map((v) => ({
    ...v,
    tarifaOperativaInicial: obtenerTarifaOperativaInicial(v.tarifaOperativaInicial),
    toneladas: v.kilos != null ? calcularToneladas(v.kilos) : null,
    total: v.kilos != null ? calcularTotalViaje(v.kilos, v.tarifaOperativaInicial) : null,
    // No incluir tarifaOperativaInicial a roles empresa
    ...(esRolEmpresa(rol) ? { tarifaOperativaInicial: undefined } : {}),
  }))

  return NextResponse.json({ viajesPendientes, facturas })
}

/**
 * POST: NextRequest -> Promise<NextResponse>
 *
 * Dado el body { empresaId, tipoCbte, ivaPct, viajes: [{ viajeId, fechaViaje, kilos, tarifaEmpresa, ...campos }] },
 * crea una factura en BORRADOR con los datos copiados del viaje al momento de facturar.
 * Actualiza estadoFactura="FACTURADO" en cada viaje (NO toca estadoLiquidacion).
 * Existe para facturar viajes pendientes de una empresa, calculando neto, IVA y total.
 *
 * Ejemplos:
 * POST /api/facturas { empresaId: "e1", tipoCbte: "A", ivaPct: 21, viajes: [{ viajeId: "v2", kilos: 25000, tarifaEmpresa: 60, ... }] }
 * // => 201 { id, estado: "BORRADOR", total, neto, ivaMonto }
 * POST /api/facturas { empresaId: "e1", tipoCbte: "A", viajes: [{ viajeId: "v3", ... }] } (v3 ya FACTURADO)
 * // => 400 { error: "Uno o más viajes no existen, no pertenecen a la empresa o ya están facturados" }
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

    const { empresaId, tipoCbte, ivaPct, viajes } = parsed.data

    const empresa = await prisma.empresa.findFirst({ where: { id: empresaId, activa: true } })
    if (!empresa) return NextResponse.json({ error: "Empresa no encontrada" }, { status: 404 })

    // Verificar que todos los viajes existen, pertenecen a la empresa y están pendientes de facturar
    const viajeIds = viajes.map((v) => v.viajeId)
    const viajesExistentes = await prisma.viaje.findMany({
      where: { id: { in: viajeIds }, empresaId, estadoFactura: EstadoFacturaViaje.PENDIENTE_FACTURAR },
    })

    if (viajesExistentes.length !== viajes.length) {
      return NextResponse.json(
        { error: "Uno o más viajes no existen, no pertenecen a la empresa o ya están facturados" },
        { status: 400 }
      )
    }

    // Calcular totales usando calcularFactura
    const viajesParaCalc = viajes.map((v) => ({ kilos: v.kilos, tarifaEmpresa: v.tarifaEmpresa }))
    const { neto, ivaMonto, total } = calcularFactura(viajesParaCalc, ivaPct)

    const periodo = new Date(viajes[0].fechaViaje).toISOString().slice(0, 7)

    const factura = await prisma.$transaction(async (tx) => {
      const fact = await tx.facturaEmitida.create({
        data: {
          empresaId,
          operadorId: session.user.id,
          tipoCbte,
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

      for (const viaje of viajes) {
        const subtotalViaje = calcularTotalViaje(viaje.kilos, viaje.tarifaEmpresa)
        const viajeData = viajesExistentes.find((v) => v.id === viaje.viajeId)!

        if (viaje.camionId || viaje.choferId) {
          const [camion, chofer] = await Promise.all([
            viaje.camionId
              ? tx.camion.findFirst({
                  where: { id: viaje.camionId, fleteroId: viajeData.fleteroId, activo: true },
                  select: { id: true },
                })
              : Promise.resolve({ id: viajeData.camionId }),
            viaje.choferId
              ? tx.usuario.findFirst({
                  where: { id: viaje.choferId, rol: "CHOFER", activo: true },
                  select: { id: true },
                })
              : Promise.resolve({ id: viajeData.choferId }),
          ])

          if (!camion) {
            throw new Error(`Camión inválido para el viaje ${viaje.viajeId}`)
          }

          if (!chofer) {
            throw new Error(`Chofer inválido para el viaje ${viaje.viajeId}`)
          }
        }

        await tx.viaje.update({
          where: { id: viaje.viajeId },
          data: {
            camionId: viaje.camionId ?? viajeData.camionId,
            choferId: viaje.choferId ?? viajeData.choferId,
            fechaViaje: new Date(viaje.fechaViaje),
            remito: viaje.remito ?? null,
            cupo: viaje.cupo ?? null,
            mercaderia: viaje.mercaderia ?? null,
            procedencia: viaje.procedencia ?? null,
            provinciaOrigen: viaje.provinciaOrigen ?? null,
            destino: viaje.destino ?? null,
            provinciaDestino: viaje.provinciaDestino ?? null,
            kilos: viaje.kilos,
          },
        })

        const enFact = await tx.viajeEnFactura.create({
          data: {
            viajeId: viaje.viajeId,
            facturaId: fact.id,
            fechaViaje: new Date(viaje.fechaViaje),
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

        const provincia = viaje.provinciaOrigen ?? viajeData.provinciaOrigen
        if (provincia) {
          await tx.asientoIibb.create({
            data: {
              viajeEnFactId: enFact.id,
              tablaOrigen: "viajes_en_factura",
              provincia,
              montoIngreso: subtotalViaje,
              periodo: new Date(viaje.fechaViaje).toISOString().slice(0, 7),
            },
          })
        }
      }

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
      { error: error instanceof Error ? error.message : "Error interno del servidor" },
      { status: 500 }
    )
  }
}
