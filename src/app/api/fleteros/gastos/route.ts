/**
 * API Routes para gastos de fleteros.
 * GET  /api/fleteros/gastos - Lista gastos con filtros
 * POST /api/fleteros/gastos - Crea gasto de fletero (FacturaProveedor + GastoFletero)
 *
 * Un gasto de fletero es una factura de proveedor que Transmagg paga por cuenta
 * del fletero. La deuda queda registrada en GastoFletero y puede descontarse en LPs.
 */

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { esRolInterno } from "@/lib/permissions"
import type { Rol } from "@/types"

const itemSchema = z.object({
  descripcion: z.string().min(1, "Descripción requerida"),
  cantidad: z.number().positive(),
  precioUnitario: z.number().min(0),
  alicuotaIva: z.number().min(0).default(0),
})

const crearGastoFleteroSchema = z.object({
  fleteroId: z.string().uuid("Fletero requerido"),
  proveedorId: z.string().uuid("Proveedor requerido"),
  tipoCbte: z.enum(["A", "B", "C", "M", "X", "LIQ_PROD"]),
  ptoVenta: z.string().min(1, "Punto de venta requerido"),
  nroComprobante: z.string().min(1, "Número de comprobante requerido"),
  fechaComprobante: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida (YYYY-MM-DD)"),
  tipo: z.enum(["COMBUSTIBLE", "OTRO"]),
  items: z.array(itemSchema).min(1, "Debe cargar al menos un ítem"),
})

const TIPOS_CON_IVA = new Set(["A", "M", "LIQ_PROD"])

/**
 * GET: NextRequest -> Promise<NextResponse>
 *
 * Devuelve la lista de gastos de fleteros con filtros opcionales.
 * Incluye datos de factura proveedor y descuentos aplicados en LPs.
 *
 * Ejemplos:
 * GET /api/fleteros/gastos (sesión ADMIN_TRANSMAGG)
 * // => 200 [{ id, fletero, facturaProveedor, tipo, montoPagado, montoDescontado, estado }]
 * GET /api/fleteros/gastos?fleteroId=f1&estado=PENDIENTE_PAGO
 * // => 200 gastos filtrados
 */
export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const rol = session.user.rol as Rol
  if (!esRolInterno(rol)) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  try {
    const { searchParams } = new URL(request.url)
    const fleteroId = searchParams.get("fleteroId")
    const estado = searchParams.get("estado")
    const desde = searchParams.get("desde")
    const hasta = searchParams.get("hasta")

    const where: {
      fleteroId?: string
      estado?: string
      creadoEn?: { gte?: Date; lte?: Date }
    } = {}

    if (fleteroId) where.fleteroId = fleteroId
    if (estado) where.estado = estado
    if (desde || hasta) {
      where.creadoEn = {}
      if (desde) where.creadoEn.gte = new Date(desde)
      if (hasta) where.creadoEn.lte = new Date(hasta + "T23:59:59")
    }

    const gastos = await prisma.gastoFletero.findMany({
      where,
      include: {
        fletero: { select: { id: true, razonSocial: true, cuit: true } },
        facturaProveedor: {
          select: {
            id: true,
            tipoCbte: true,
            nroComprobante: true,
            fechaCbte: true,
            total: true,
            estadoPago: true,
            proveedor: { select: { id: true, razonSocial: true, cuit: true } },
          },
        },
        descuentos: {
          select: {
            id: true,
            montoDescontado: true,
            fecha: true,
            liquidacion: { select: { id: true } },
          },
          orderBy: { fecha: "asc" },
        },
      },
      orderBy: { creadoEn: "desc" },
      take: 200,
    })

    return NextResponse.json(gastos)
  } catch (error) {
    console.error("[GET /api/fleteros/gastos]", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

/**
 * POST: NextRequest -> Promise<NextResponse>
 *
 * Dado el body con fleteroId, proveedorId, ítems y datos del comprobante,
 * crea la FacturaProveedor (sin PDF) y el GastoFletero en una transacción atómica.
 * La deuda del fletero queda en estado PENDIENTE_PAGO.
 *
 * Ejemplos:
 * POST { fleteroId, proveedorId, tipoCbte: "A", items: [{...}] }
 * // => 201 { gastoId, facturaProveedorId, total }
 * POST { fleteroId: "noexiste", ... }
 * // => 404 { error: "Fletero no encontrado" }
 */
export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const rol = session.user.rol as Rol
  if (!esRolInterno(rol)) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  try {
    const body = await request.json()
    const parsed = crearGastoFleteroSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos", detalles: parsed.error.flatten() }, { status: 400 })
    }

    const data = parsed.data
    const discriminaIVA = TIPOS_CON_IVA.has(data.tipoCbte)

    const [fletero, proveedor] = await Promise.all([
      prisma.fletero.findUnique({ where: { id: data.fleteroId, activo: true } }),
      prisma.proveedor.findUnique({ where: { id: data.proveedorId, activo: true } }),
    ])

    if (!fletero) return NextResponse.json({ error: "Fletero no encontrado" }, { status: 404 })
    if (!proveedor) return NextResponse.json({ error: "Proveedor no encontrado" }, { status: 404 })

    const itemsCalculados = data.items.map((item) => {
      const subtotalNeto = item.cantidad * item.precioUnitario
      const alicuota = discriminaIVA ? item.alicuotaIva : 0
      const montoIva = alicuota > 0 ? subtotalNeto * alicuota / 100 : 0
      return {
        descripcion: item.descripcion,
        cantidad: item.cantidad,
        precioUnitario: item.precioUnitario,
        alicuotaIva: alicuota,
        esExento: false,
        subtotalNeto,
        montoIva,
        subtotalTotal: subtotalNeto + montoIva,
      }
    })

    const totalNeto = itemsCalculados.reduce((acc, i) => acc + i.subtotalNeto, 0)
    const totalIvaMonto = itemsCalculados.reduce((acc, i) => acc + i.montoIva, 0)
    const total = totalNeto + totalIvaMonto

    const nroComprobanteFormateado =
      data.ptoVenta.padStart(4, "0") + "-" + data.nroComprobante.padStart(8, "0")

    const result = await prisma.$transaction(async (tx) => {
      const factura = await tx.facturaProveedor.create({
        data: {
          proveedorId: data.proveedorId,
          nroComprobante: nroComprobanteFormateado,
          ptoVenta: data.ptoVenta.padStart(4, "0"),
          tipoCbte: data.tipoCbte,
          neto: totalNeto,
          ivaMonto: totalIvaMonto,
          total,
          fechaCbte: new Date(data.fechaComprobante),
          esPorCuentaDeFletero: true,
          fleteroId: data.fleteroId,
          tipoGastoFletero: data.tipo,
        },
      })

      await tx.itemFacturaProveedor.createMany({
        data: itemsCalculados.map((item) => ({
          facturaProveedorId: factura.id,
          ...item,
        })),
      })

      const gasto = await tx.gastoFletero.create({
        data: {
          fleteroId: data.fleteroId,
          facturaProveedorId: factura.id,
          tipo: data.tipo,
          montoPagado: total,
          montoDescontado: 0,
          estado: "PENDIENTE_PAGO",
        },
      })

      return { gasto, factura }
    })

    return NextResponse.json(
      {
        gastoId: result.gasto.id,
        facturaProveedorId: result.factura.id,
        total: result.factura.total,
        nroComprobante: result.factura.nroComprobante,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("[POST /api/fleteros/gastos]", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
