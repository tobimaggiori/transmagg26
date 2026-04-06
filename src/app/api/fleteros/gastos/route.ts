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
import { ejecutarCrearGastoFletero, ejecutarCrearGastoSinFactura } from "@/lib/gasto-fletero-commands"
import type { Rol } from "@/types"

// ─── Schemas Zod ────────────────────────────────────────────────────────────

const itemSchema = z.object({
  descripcion: z.string().min(1, "Descripción requerida"),
  cantidad: z.number().positive(),
  precioUnitario: z.number().min(0),
  alicuotaIva: z.number().min(0).default(0),
})

const crearGastoConFacturaSchema = z.object({
  sinFactura: z.literal(false).optional().default(false),
  fleteroId: z.string().uuid("Fletero requerido"),
  proveedorId: z.string().uuid("Proveedor requerido"),
  tipoCbte: z.enum(["A", "B", "C", "M", "X", "LIQ_PROD"]),
  ptoVenta: z.string().min(1, "Punto de venta requerido"),
  nroComprobante: z.string().min(1, "Número de comprobante requerido"),
  fechaComprobante: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida (YYYY-MM-DD)"),
  tipo: z.enum(["COMBUSTIBLE", "OTRO"]),
  items: z.array(itemSchema).min(1, "Debe cargar al menos un ítem"),
})

const crearGastoSinFacturaSchema = z.object({
  sinFactura: z.literal(true),
  fleteroId: z.string().uuid("Fletero requerido"),
  tipo: z.enum(["COMBUSTIBLE", "OTRO"]),
  descripcion: z.string().min(1, "Descripción requerida"),
  monto: z.number().positive("El monto debe ser positivo"),
})

const crearGastoFleteroSchema = z.discriminatedUnion("sinFactura", [
  crearGastoSinFacturaSchema,
  crearGastoConFacturaSchema,
])

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
      select: {
        id: true,
        tipo: true,
        sinFactura: true,
        descripcion: true,
        montoPagado: true,
        montoDescontado: true,
        estado: true,
        creadoEn: true,
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

    if (parsed.data.sinFactura === true) {
      const resultado = await ejecutarCrearGastoSinFactura(parsed.data)
      if (!resultado.ok) {
        return NextResponse.json({ error: resultado.error }, { status: resultado.status })
      }
      return NextResponse.json(resultado.result, { status: 201 })
    }

    const resultado = await ejecutarCrearGastoFletero(parsed.data)

    if (!resultado.ok) {
      return NextResponse.json({ error: resultado.error }, { status: resultado.status })
    }

    return NextResponse.json(resultado.result, { status: 201 })
  } catch (error) {
    console.error("[POST /api/fleteros/gastos]", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
