/**
 * API JM Facturas de Proveedor — listar y crear.
 */

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prismaJm } from "@/jm/prisma"
import { esRolInterno } from "@/lib/permissions"
import { calcularSaldoPendiente } from "@/lib/cuenta-corriente"
import type { Rol } from "@/types"

const itemSchema = z.object({
  descripcion: z.string().min(1),
  cantidad: z.number().positive().default(1),
  precioUnitario: z.number().nonnegative(),
  alicuotaIva: z.number().min(0).max(100),
  esExento: z.boolean().default(false),
  subtotalNeto: z.number().nonnegative(),
  montoIva: z.number().nonnegative(),
  subtotalTotal: z.number().nonnegative(),
})

const crearSchema = z.object({
  proveedorId: z.string().min(1),
  nroComprobante: z.string().min(1),
  ptoVenta: z.string().optional(),
  tipoCbte: z.string().min(1),
  neto: z.number().nonnegative(),
  ivaMonto: z.number().nonnegative(),
  total: z.number().positive(),
  fechaCbte: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  concepto: z.string().optional(),
  pdfS3Key: z.string().optional(),
  percepcionIIBB: z.number().nonnegative().optional(),
  percepcionIVA: z.number().nonnegative().optional(),
  percepcionGanancias: z.number().nonnegative().optional(),
  items: z.array(itemSchema).optional(),
})

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (!esRolInterno(session.user.rol as Rol)) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const proveedorId = searchParams.get("proveedorId")
  const estadoPago = searchParams.get("estadoPago")
  const desde = searchParams.get("desde")
  const hasta = searchParams.get("hasta")

  const facturas = await prismaJm.facturaProveedor.findMany({
    where: {
      ...(proveedorId ? { proveedorId } : {}),
      ...(estadoPago ? { estadoPago } : {}),
      ...(desde || hasta ? {
        fechaCbte: {
          ...(desde ? { gte: new Date(desde) } : {}),
          ...(hasta ? { lte: new Date(`${hasta}T23:59:59.999Z`) } : {}),
        },
      } : {}),
    },
    include: {
      proveedor: { select: { id: true, razonSocial: true, cuit: true } },
      pagos: { select: { monto: true, anulado: true } },
    },
    orderBy: [{ fechaCbte: "desc" }],
    take: 200,
  })

  const resultado = facturas.map((f) => {
    const pagosNoAnulados = f.pagos.filter((p) => !p.anulado).map((p) => p.monto)
    const saldoPendiente = calcularSaldoPendiente(Number(f.total), pagosNoAnulados)
    return {
      ...f,
      saldoPendiente,
    }
  })
  return NextResponse.json(resultado)
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (!esRolInterno(session.user.rol as Rol)) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  const body = await request.json()
  const parsed = crearSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos", detalles: parsed.error.flatten() }, { status: 400 })

  // Verificar duplicado por (proveedor, nroComprobante)
  const dup = await prismaJm.facturaProveedor.findFirst({
    where: { proveedorId: parsed.data.proveedorId, nroComprobante: parsed.data.nroComprobante },
  })
  if (dup) return NextResponse.json({ error: `Ya existe esa factura para ese proveedor` }, { status: 409 })

  const { items, fechaCbte, ...resto } = parsed.data

  const factura = await prismaJm.$transaction(async (tx) => {
    const f = await tx.facturaProveedor.create({
      data: {
        ...resto,
        fechaCbte: new Date(fechaCbte),
      },
    })

    if (items && items.length > 0) {
      await tx.itemFacturaProveedor.createMany({
        data: items.map((it) => ({ ...it, facturaProveedorId: f.id })),
      })
    }

    // Asiento IVA Compra
    if (parsed.data.ivaMonto > 0 && parsed.data.neto > 0) {
      const alicuota = parsed.data.ivaMonto / parsed.data.neto * 100
      await tx.asientoIva.create({
        data: {
          facturaProvId: f.id,
          tipoReferencia: "FACTURA_PROVEEDOR",
          tipo: "COMPRA",
          baseImponible: parsed.data.neto,
          alicuota: Math.round(alicuota * 100) / 100,
          montoIva: parsed.data.ivaMonto,
          periodo: fechaCbte.slice(0, 7),
        },
      })
    }

    // Percepciones
    const percepciones = []
    if (parsed.data.percepcionIIBB) percepciones.push({ tipo: "PERCEPCION_IIBB", monto: parsed.data.percepcionIIBB })
    if (parsed.data.percepcionIVA) percepciones.push({ tipo: "PERCEPCION_IVA", monto: parsed.data.percepcionIVA })
    if (parsed.data.percepcionGanancias) percepciones.push({ tipo: "PERCEPCION_GANANCIAS", monto: parsed.data.percepcionGanancias })
    for (const p of percepciones) {
      await tx.percepcionImpuesto.create({
        data: {
          facturaProveedorId: f.id,
          tipo: p.tipo,
          categoria: "PERCEPCION",
          monto: p.monto,
          periodo: fechaCbte.slice(0, 7),
        },
      })
    }

    return f
  })

  return NextResponse.json(factura, { status: 201 })
}
