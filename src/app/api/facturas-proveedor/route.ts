/**
 * API Route: GET /api/facturas-proveedor — Lista facturas con filtros.
 * API Route: POST /api/facturas-proveedor — Crea factura con ítems, asientos IVA y PDF.
 * Solo accesible para ADMIN_TRANSMAGG y OPERADOR_TRANSMAGG.
 */

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { esRolInterno } from "@/lib/permissions"
import { resolverOperadorId } from "@/lib/session-utils"
import { ejecutarCrearFacturaProveedor } from "@/lib/factura-proveedor-commands"
import { sumarImportes, restarImportes, maxMonetario } from "@/lib/money"
import type { Rol } from "@/types"

// ─── Schemas Zod ────────────────────────────────────────────────────────────

const itemSchema = z.object({
  descripcion: z.string().min(1, "Descripción requerida"),
  cantidad: z.number().positive("Cantidad debe ser mayor a 0"),
  precioUnitario: z.number().min(0, "Precio unitario inválido"),
  alicuotaIva: z.number().min(0).default(0),
  esExento: z.boolean().default(false),
})

const pagoOpcionalSchema = z.object({
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha de pago inválida"),
  monto: z.number().positive("El monto del pago debe ser mayor a 0"),
  tipo: z.enum([
    "TRANSFERENCIA",
    "CHEQUE_PROPIO",
    "CHEQUE_FISICO_TERCERO",
    "CHEQUE_ELECTRONICO_TERCERO",
    "TARJETA",
    "EFECTIVO",
  ]),
  observaciones: z.string().optional().nullable(),
  comprobantePdfS3Key: z.string().optional().nullable(),
  cuentaId: z.string().optional().nullable(),
  chequeRecibidoId: z.string().optional().nullable(),
  tarjetaId: z.string().optional().nullable(),
  chequePropio: z.object({
    nroCheque: z.string().optional().nullable(),
    tipoDocBeneficiario: z.string().min(1),
    nroDocBeneficiario: z.string().min(1),
    mailBeneficiario: z.string().optional().nullable(),
    fechaEmision: z.string().min(1),
    fechaPago: z.string().min(1),
    clausula: z.string().optional().nullable(),
    descripcion1: z.string().optional().nullable(),
    descripcion2: z.string().optional().nullable(),
  }).optional().nullable(),
})

const percepcionSchema = z.object({
  tipo: z.string().min(1),
  categoria: z.enum(["PERCEPCION", "IMPUESTO_INTERNO"]),
  descripcion: z.string().nullable().optional(),
  monto: z.number().positive("El monto de la percepción debe ser mayor a 0"),
})

const crearFacturaProveedorV2Schema = z.object({
  proveedorId: z.string().min(1, "Proveedor requerido"),
  tipoCbte: z.enum(["A", "B", "C", "M", "X", "LIQ_PROD"]),
  ptoVenta: z.string().min(1, "Punto de venta requerido"),
  nroComprobante: z.string().min(1, "Número de comprobante requerido"),
  fechaComprobante: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida (YYYY-MM-DD)"),
  concepto: z.string().optional(),
  percepcionIIBB: z.number().min(0).optional(),
  percepcionIVA: z.number().min(0).optional(),
  percepcionGanancias: z.number().min(0).optional(),
  pdfS3Key: z.string().min(1, "El PDF de la factura es obligatorio"),
  items: z.array(itemSchema).min(1, "Debe cargar al menos un ítem"),
  percepciones: z.array(percepcionSchema).optional(),
  pago: pagoOpcionalSchema.optional().nullable(),
})

/**
 * GET: NextRequest -> Promise<NextResponse>
 *
 * Dado los query params (desde?, hasta?, proveedorId?, nroComprobante?, estadoPago?),
 * devuelve la lista de facturas de proveedores con saldo pendiente, historial de pagos e ítems.
 *
 * Ejemplos:
 * GET /api/facturas-proveedor === 200 [{ id, nroComprobante, proveedor, total, saldoPendiente, pagos, items }]
 * GET /api/facturas-proveedor?estadoPago=PENDIENTE === solo facturas pendientes
 */
export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const rol = session.user.rol as Rol
  if (!esRolInterno(rol)) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  try {
    const { searchParams } = new URL(request.url)
    const desde = searchParams.get("desde")
    const hasta = searchParams.get("hasta")
    const proveedorId = searchParams.get("proveedorId")
    const nroComprobante = searchParams.get("nroComprobante")
    const estadoPago = searchParams.get("estadoPago")

    const where: {
      fechaCbte?: { gte?: Date; lte?: Date }
      proveedorId?: string
      nroComprobante?: { contains: string }
      estadoPago?: string
    } = {}

    if (desde || hasta) {
      where.fechaCbte = {}
      if (desde) where.fechaCbte.gte = new Date(desde)
      if (hasta) where.fechaCbte.lte = new Date(hasta + "T23:59:59")
    }
    if (proveedorId) where.proveedorId = proveedorId
    if (nroComprobante) where.nroComprobante = { contains: nroComprobante }
    if (estadoPago) where.estadoPago = estadoPago

    const facturas = await prisma.facturaProveedor.findMany({
      where,
      include: {
        proveedor: { select: { id: true, razonSocial: true, cuit: true } },
        pagos: {
          where: { anulado: false },
          select: {
            id: true,
            monto: true,
            tipo: true,
            fecha: true,
            observaciones: true,
            comprobantePdfS3Key: true,
            resumenTarjeta: { select: { id: true, periodo: true, s3Key: true } },
          },
          orderBy: { fecha: "asc" },
        },
        items: {
          orderBy: { id: "asc" },
        },
        notasCreditoDebito: {
          select: { id: true, tipo: true, montoTotal: true },
        },
      },
      orderBy: { fechaCbte: "desc" },
      take: 200,
    })

    const resultado = facturas.map((f) => {
      const totalPagado = sumarImportes(f.pagos.map((p) => p.monto))
      const totalNC = sumarImportes(
        f.notasCreditoDebito.filter((n) => n.tipo === "NC_RECIBIDA").map((n) => n.montoTotal)
      )
      const totalND = sumarImportes(
        f.notasCreditoDebito.filter((n) => n.tipo === "ND_RECIBIDA").map((n) => n.montoTotal)
      )
      const saldoBruto = restarImportes(
        restarImportes(sumarImportes([f.total, totalND]), totalPagado),
        totalNC
      )
      const saldoPendiente = maxMonetario(0, saldoBruto)
      return {
        ...f,
        saldoPendiente,
      }
    })

    return NextResponse.json(resultado)
  } catch (error) {
    console.error("[GET /api/facturas-proveedor]", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

/**
 * POST: NextRequest -> Promise<NextResponse>
 *
 * Dado un body con proveedorId, tipoCbte, ítems y pdfS3Key, crea la factura con sus ítems
 * y asientos IVA en una transacción atómica. El PDF es obligatorio.
 * Para tipos B/C/X no se generan asientos IVA. Para A/M/LIQ_PROD se agrupan por alícuota.
 *
 * Ejemplos:
 * POST { proveedorId, tipoCbte: "A", items: [{...}], pdfS3Key } => 201 { id, nroComprobante, total }
 * POST { tipoCbte: "B", items: [{alicuotaIva: 21}] } => 400 { error: "Facturas tipo B no discriminan IVA" }
 * POST { pdfS3Key: "" } => 400 { error: "El PDF de la factura es obligatorio" }
 */
export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const rol = session.user.rol as Rol
  if (!esRolInterno(rol)) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  let operadorId: string | undefined
  try {
    operadorId = await resolverOperadorId(session.user)
  } catch {
    // operadorId optional for this endpoint
  }

  try {
    const body = await request.json()
    const parsed = crearFacturaProveedorV2Schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos", detalles: parsed.error.flatten() }, { status: 400 })
    }

    const resultado = await ejecutarCrearFacturaProveedor(parsed.data, operadorId)

    if (!resultado.ok) {
      return NextResponse.json({ error: resultado.error }, { status: resultado.status })
    }

    return NextResponse.json(resultado.result, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("DUPLICATE_CHEQUE:")) {
      const nro = error.message.split(":")[1]
      return NextResponse.json(
        { error: `El cheque N° ${nro} ya existe para esa cuenta. Verificá el número.` },
        { status: 409 }
      )
    }
    console.error("[POST /api/facturas-proveedor]", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
