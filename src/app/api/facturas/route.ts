/**
 * API Routes para gestión de facturas emitidas.
 * GET  /api/facturas?empresaId=XXX - Viajes pendientes de facturar + facturas emitidas
 * POST /api/facturas - Crea factura a partir de viajes seleccionados
 *
 * SEGURIDAD: tarifaEmpresa en ViajeEnFactura es NUNCA visible para fleteros/choferes.
 * El POST marca los viajes seleccionados como estadoFactura="FACTURADO" (NO toca estadoLiquidacion).
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
  viajeIds: z.array(z.string().uuid()).min(1),
  tipoCbte: z.number().int().refine((v) => [1, 6, 201].includes(v), {
    message: "tipoCbte debe ser 1 (Fact. A), 6 (Fact. B) o 201 (Fact. A MiPyme)",
  }),
  modalidadMiPymes: z.enum(["SCA", "ADC"]).optional(),
  ivaPct: z.number().min(0).max(100).default(21),
  ediciones: z.record(z.string(), z.object({
    kilos: z.number().positive().optional(),
    tarifaEmpresa: z.number().positive().optional(),
  })).optional(),
})

/**
 * GET: NextRequest -> Promise<NextResponse>
 *
 * Devuelve viajes pendientes de facturar (estadoFactura="PENDIENTE_FACTURAR")
 * y las facturas existentes de la empresa especificada.
 * Roles empresa solo ven los suyos; roles internos pueden filtrar por empresaId.
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

  const whereFacturas: Record<string, unknown> = {}
  if (empresaIdReal) whereFacturas.empresaId = empresaIdReal

  try {
    const [viajesPendientes, facturas] = await Promise.all([
      empresaIdReal
        ? prisma.viaje.findMany({
            where: {
              empresaId: empresaIdReal,
              estadoFactura: "PENDIENTE_FACTURAR",
            },
            include: {
              empresa: { select: { razonSocial: true } },
              fletero: { select: { razonSocial: true } },
              enLiquidaciones: {
                include: { liquidacion: { select: { nroComprobante: true, ptoVenta: true, id: true } } },
                take: 1,
              },
            },
            orderBy: { fechaViaje: "desc" },
            take: 200,
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

    return NextResponse.json({ viajesPendientes, facturas })
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
 * Dado el body { empresaId, viajeIds, tipoCbte, ivaPct, modalidadMiPymes?, ediciones? },
 * crea una factura a partir de los viajes seleccionados.
 * Copia los datos de cada viaje al snapshot de ViajeEnFactura.
 * Marca cada viaje como estadoFactura="FACTURADO".
 *
 * Ejemplos:
 * POST /api/facturas { empresaId: "e1", viajeIds: ["v1","v2"], tipoCbte: 1, ivaPct: 21 }
 * // => 201 { id, estado: "BORRADOR", total, neto, ivaMonto }
 * POST /api/facturas { empresaId: "e1", viajeIds: ["v-ya-facturado"], tipoCbte: 1 }
 * // => 400 { error: "Viaje(s) no están pendientes de facturar" }
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

    const { empresaId, viajeIds, tipoCbte, modalidadMiPymes, ivaPct, ediciones } = parsed.data

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

    // Buscar todos los viajes seleccionados
    const viajes = await prisma.viaje.findMany({
      where: { id: { in: viajeIds } },
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
        estadoFactura: true,
      },
    })

    // Verificar que todos los viajes existen
    if (viajes.length !== viajeIds.length) {
      const encontrados = new Set(viajes.map((v) => v.id))
      const faltantes = viajeIds.filter((id) => !encontrados.has(id))
      return NextResponse.json(
        { error: `Viaje(s) no encontrado(s): ${faltantes.join(", ")}` },
        { status: 404 }
      )
    }

    // Verificar que todos pertenecen a la empresa
    const viajesNoPertenecen = viajes.filter((v) => v.empresaId !== empresaId)
    if (viajesNoPertenecen.length > 0) {
      return NextResponse.json(
        { error: "Uno o más viajes no pertenecen a la empresa seleccionada" },
        { status: 400 }
      )
    }

    // Verificar que todos tienen estadoFactura = PENDIENTE_FACTURAR
    const viajesNoFacturables = viajes.filter((v) => v.estadoFactura !== "PENDIENTE_FACTURAR")
    if (viajesNoFacturables.length > 0) {
      return NextResponse.json(
        { error: "Uno o más viajes no están pendientes de facturar" },
        { status: 400 }
      )
    }

    // Aplicar ediciones y calcular totales
    const viajesConEdiciones = viajes.map((v) => {
      const edit = ediciones?.[v.id]
      const kilos = edit?.kilos ?? v.kilos ?? 0
      const tarifaEmpresa = edit?.tarifaEmpresa ?? v.tarifaEmpresa
      return { ...v, kilosEfectivos: kilos, tarifaEmpresaEfectiva: tarifaEmpresa }
    })

    const viajesParaCalc = viajesConEdiciones.map((v) => ({
      kilos: v.kilosEfectivos,
      tarifaEmpresa: v.tarifaEmpresaEfectiva,
    }))
    const { neto, ivaMonto, total } = calcularFactura(viajesParaCalc, ivaPct)

    const periodo = viajes[0].fechaViaje.toISOString().slice(0, 7)

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

      for (const viaje of viajesConEdiciones) {
        const kilos = viaje.kilosEfectivos
        const tarifaEmpresa = viaje.tarifaEmpresaEfectiva
        const subtotalViaje = calcularTotalViaje(kilos, tarifaEmpresa)

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
            kilos,
            tarifaEmpresa,
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
