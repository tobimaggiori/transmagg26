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
import { procesarPagoProveedor } from "@/lib/pago-proveedor"
import type { Rol } from "@/types"

// ─── Tipos de comprobante que discriminan IVA ──────────────────────────────────
const TIPOS_CON_IVA = new Set(["A", "M", "LIQ_PROD"])

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
    "TARJETA_CREDITO",
    "TARJETA_DEBITO",
    "TARJETA_PREPAGA",
    "EFECTIVO",
  ]),
  observaciones: z.string().optional().nullable(),
  comprobantePdfS3Key: z.string().optional().nullable(),
  cuentaId: z.string().optional().nullable(),
  chequeRecibidoId: z.string().optional().nullable(),
  tarjetaId: z.string().optional().nullable(),
  chequeNro: z.string().optional().nullable(),
  chequeFechaPago: z.string().optional().nullable(),
  chequeTipoDocBeneficiario: z.string().optional().nullable(),
  chequeNroDocBeneficiario: z.string().optional().nullable(),
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
      },
      orderBy: { fechaCbte: "desc" },
      take: 200,
    })

    const resultado = facturas.map((f) => {
      const totalPagado = f.pagos.reduce((acc, p) => acc + p.monto, 0)
      const saldoPendiente = Math.max(0, f.total - totalPagado)
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

    const data = parsed.data
    const discriminaIVA = TIPOS_CON_IVA.has(data.tipoCbte)

    // Validar regla B/C/X: ítems deben tener alicuotaIva=0 y no esExento=true
    if (!discriminaIVA) {
      const itemsConIVA = data.items.filter((i) => i.alicuotaIva !== 0 || i.esExento)
      if (itemsConIVA.length > 0) {
        return NextResponse.json(
          { error: `Facturas tipo ${data.tipoCbte} no discriminan IVA. Todos los ítems deben tener alícuota 0.` },
          { status: 400 }
        )
      }
    }

    // Verificar que el proveedor exista
    const proveedor = await prisma.proveedor.findUnique({
      where: { id: data.proveedorId, activo: true },
    })
    if (!proveedor) {
      return NextResponse.json({ error: "Proveedor no encontrado" }, { status: 404 })
    }

    // Calcular totales desde los ítems (el servidor no confía en valores del cliente)
    const itemsCalculados = data.items.map((item) => {
      const subtotalNeto = item.cantidad * item.precioUnitario
      const esExento = discriminaIVA && item.esExento
      const alicuota = discriminaIVA && !esExento ? item.alicuotaIva : 0
      const montoIva = alicuota > 0 ? subtotalNeto * alicuota / 100 : 0
      return {
        descripcion: item.descripcion,
        cantidad: item.cantidad,
        precioUnitario: item.precioUnitario,
        alicuotaIva: alicuota,
        esExento,
        subtotalNeto,
        montoIva,
        subtotalTotal: subtotalNeto + montoIva,
      }
    })

    const totalNeto = itemsCalculados.reduce((acc, i) => acc + i.subtotalNeto, 0)
    const totalIvaMonto = itemsCalculados.reduce((acc, i) => acc + i.montoIva, 0)
    const percIIBB = data.percepcionIIBB ?? 0
    const percIVA = data.percepcionIVA ?? 0
    const percGanancias = data.percepcionGanancias ?? 0
    const totalPercepciones = percIIBB + percIVA + percGanancias
    const total = totalNeto + totalIvaMonto + totalPercepciones

    const nroComprobanteFormateado =
      data.ptoVenta.padStart(4, "0") + "-" + data.nroComprobante.padStart(8, "0")
    const periodo = data.fechaComprobante.slice(0, 7)

    const result = await prisma.$transaction(async (tx) => {
      // 1. Crear FacturaProveedor
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
          concepto: data.concepto ?? null,
          pdfS3Key: data.pdfS3Key,
          percepcionIIBB: percIIBB > 0 ? percIIBB : null,
          percepcionIVA: percIVA > 0 ? percIVA : null,
          percepcionGanancias: percGanancias > 0 ? percGanancias : null,
        },
      })

      // 2. Crear ítems
      await tx.itemFacturaProveedor.createMany({
        data: itemsCalculados.map((item) => ({
          facturaProveedorId: factura.id,
          ...item,
        })),
      })

      // 3. Asientos IVA — solo para A, M, LIQ_PROD
      const asientosCreados = []
      if (discriminaIVA) {
        // Agrupar ítems no exentos por alícuota
        const porAlicuota = new Map<number, number>()
        let baseExenta = 0

        for (const item of itemsCalculados) {
          if (item.esExento) {
            baseExenta += item.subtotalNeto
          } else if (item.alicuotaIva > 0) {
            porAlicuota.set(item.alicuotaIva, (porAlicuota.get(item.alicuotaIva) ?? 0) + item.subtotalNeto)
          } else {
            // alicuota 0%, no exento — base gravada a 0%
            porAlicuota.set(0, (porAlicuota.get(0) ?? 0) + item.subtotalNeto)
          }
        }

        // Crear un AsientoIva por cada alícuota
        for (const [alicuota, base] of Array.from(porAlicuota)) {
          const montoIvaAsiento = base * alicuota / 100
          const asiento = await tx.asientoIva.create({
            data: {
              facturaProvId: factura.id,
              tipoReferencia: "FACTURA_PROVEEDOR",
              tipo: "COMPRA",
              baseImponible: base,
              alicuota,
              montoIva: montoIvaAsiento,
              periodo,
            },
          })
          asientosCreados.push(asiento)
        }

        // Crear AsientoIva para base exenta si hay
        if (baseExenta > 0) {
          const asientoExento = await tx.asientoIva.create({
            data: {
              facturaProvId: factura.id,
              tipoReferencia: "FACTURA_PROVEEDOR_EXENTO",
              tipo: "COMPRA",
              baseImponible: baseExenta,
              alicuota: 0,
              montoIva: 0,
              periodo,
            },
          })
          asientosCreados.push(asientoExento)
        }

        // Asientos para percepciones
        if (percIVA > 0) {
          const asientoPercIva = await tx.asientoIva.create({
            data: {
              facturaProvId: factura.id,
              tipoReferencia: "PERCEPCION_IVA",
              tipo: "COMPRA",
              baseImponible: percIVA,
              alicuota: 0,
              montoIva: percIVA,
              periodo,
            },
          })
          asientosCreados.push(asientoPercIva)
        }
        if (percIIBB > 0) {
          const asientoPercIibb = await tx.asientoIva.create({
            data: {
              facturaProvId: factura.id,
              tipoReferencia: "PERCEPCION_IIBB",
              tipo: "COMPRA",
              baseImponible: percIIBB,
              alicuota: 0,
              montoIva: percIIBB,
              periodo,
            },
          })
          asientosCreados.push(asientoPercIibb)
        }
      }

      // 4. Pago opcional — dentro de la misma transacción atómica
      let pagoResult: { nuevoEstado: string } | null = null
      if (data.pago) {
        pagoResult = await procesarPagoProveedor(
          tx,
          {
            facturaId: factura.id,
            facturaTotal: total,
            totalPagadoAnterior: 0,
            facturaNroComprobante: nroComprobanteFormateado,
            proveedorId: data.proveedorId,
            proveedorRazonSocial: proveedor.razonSocial,
            operadorId: operadorId ?? null,
          },
          {
            fecha: new Date(data.pago.fecha),
            monto: data.pago.monto,
            tipo: data.pago.tipo,
            observaciones: data.pago.observaciones,
            comprobantePdfS3Key: data.pago.comprobantePdfS3Key,
            cuentaId: data.pago.cuentaId,
            chequeRecibidoId: data.pago.chequeRecibidoId,
            tarjetaId: data.pago.tarjetaId,
            chequeNro: data.pago.chequeNro,
            chequeFechaPago: data.pago.chequeFechaPago,
            chequeTipoDocBeneficiario: data.pago.chequeTipoDocBeneficiario,
            chequeNroDocBeneficiario: data.pago.chequeNroDocBeneficiario,
          }
        )
      }

      return { factura, itemsCount: itemsCalculados.length, asientosCount: asientosCreados.length, pagoResult }
    })

    return NextResponse.json(
      {
        id: result.factura.id,
        nroComprobante: result.factura.nroComprobante,
        total: result.factura.total,
        itemsCount: result.itemsCount,
        asientosCount: result.asientosCount,
        estadoPago: result.pagoResult?.nuevoEstado ?? "PENDIENTE",
        pagoRegistrado: result.pagoResult ? data.pago?.monto : null,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("[POST /api/facturas-proveedor]", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
