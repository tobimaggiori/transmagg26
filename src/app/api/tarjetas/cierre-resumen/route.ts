/**
 * GET  /api/tarjetas/cierre-resumen?tarjetaId=  — Historial de cierres
 * POST /api/tarjetas/cierre-resumen             — Crear cierre de resumen
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { esRolInterno } from "@/lib/permissions"
import { resolverOperadorId } from "@/lib/session-utils"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import type { Rol } from "@/types"

const pagoSchema = z.object({
  facturaId: z.string(),
  tipo: z.enum(["PROVEEDOR", "SEGURO"]),
  montoPagado: z.number().positive(),
})

const cierreSchema = z.object({
  tarjetaId: z.string().min(1),
  mesAnio: z.string().regex(/^\d{4}-\d{2}$/),
  cuentaPagoId: z.string().min(1),
  fechaPago: z.string().min(1),
  pdfS3Key: z.string().optional().nullable(),
  diferencia: z.number().default(0),
  descripcionDiferencia: z.string().optional().nullable(),
  pagos: z.array(pagoSchema).min(1),
})

export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (!esRolInterno((session.user.rol ?? "") as Rol))
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const tarjetaId = searchParams.get("tarjetaId")
  if (!tarjetaId) return NextResponse.json({ error: "tarjetaId requerido" }, { status: 400 })

  try {
    const cierres = await prisma.cierreResumenTarjeta.findMany({
      where: { tarjetaId },
      include: {
        cuentaPago: { select: { nombre: true } },
        pagos: {
          include: {
            facturaProveedor: { select: { nroComprobante: true, proveedor: { select: { razonSocial: true } } } },
            facturaSeguro: { select: { nroComprobante: true, aseguradora: { select: { razonSocial: true } } } },
          },
        },
      },
      orderBy: { fechaPago: "desc" },
    })
    return NextResponse.json(cierres)
  } catch (error) {
    console.error("GET /api/tarjetas/cierre-resumen error:", error)
    return NextResponse.json({ error: "Error al obtener cierres" }, { status: 500 })
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (!esRolInterno((session.user.rol ?? "") as Rol))
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 })
  }

  const parsed = cierreSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", detail: parsed.error.flatten() }, { status: 400 })
  }

  const data = parsed.data

  try {
    const operadorId = await resolverOperadorId({
      id: session.user.id,
      email: session.user.email,
    })

    const sumaFacturas = data.pagos.reduce((sum, p) => sum + p.montoPagado, 0)
    const diferencia = data.diferencia ?? 0
    const totalPagado = sumaFacturas + diferencia

    const result = await prisma.$transaction(async (tx) => {
      // 1. Crear CierreResumenTarjeta
      const cierre = await tx.cierreResumenTarjeta.create({
        data: {
          tarjetaId: data.tarjetaId,
          mesAnio: data.mesAnio,
          totalPagado,
          diferencia,
          descripcionDiferencia: data.descripcionDiferencia ?? null,
          cuentaPagoId: data.cuentaPagoId,
          fechaPago: new Date(data.fechaPago),
          pdfS3Key: data.pdfS3Key ?? null,
          operadorId,
        },
      })

      // 2. Crear PagoFacturaTarjeta por cada factura incluida
      for (const pago of data.pagos) {
        await tx.pagoFacturaTarjeta.create({
          data: {
            cierreResumenId: cierre.id,
            facturaProveedorId: pago.tipo === "PROVEEDOR" ? pago.facturaId : null,
            facturaSeguroId: pago.tipo === "SEGURO" ? pago.facturaId : null,
            montoPagado: pago.montoPagado,
          },
        })

        // 3. Actualizar estadoPago de cada factura
        if (pago.tipo === "PROVEEDOR") {
          const factura = await tx.facturaProveedor.findUniqueOrThrow({ where: { id: pago.facturaId } })
          const totalPagadoFactura = (
            await tx.pagoFacturaTarjeta.aggregate({
              where: { facturaProveedorId: pago.facturaId },
              _sum: { montoPagado: true },
            })
          )._sum.montoPagado ?? 0
          const nuevoEstado = totalPagadoFactura >= factura.total ? "PAGADA" : "PAGADA_PARCIAL"
          await tx.facturaProveedor.update({
            where: { id: pago.facturaId },
            data: { estadoPago: nuevoEstado },
          })
        } else {
          const factura = await tx.facturaSeguro.findUniqueOrThrow({ where: { id: pago.facturaId } })
          const totalPagadoFactura = (
            await tx.pagoFacturaTarjeta.aggregate({
              where: { facturaSeguroId: pago.facturaId },
              _sum: { montoPagado: true },
            })
          )._sum.montoPagado ?? 0
          const nuevoEstado = totalPagadoFactura >= factura.total ? "PAGADA" : "PAGADA_PARCIAL"
          await tx.facturaSeguro.update({
            where: { id: pago.facturaId },
            data: { estadoPago: nuevoEstado },
          })
        }
      }

      // 4. Crear MovimientoSinFactura EGRESO en la cuenta de pago
      const tarjeta = await tx.tarjeta.findUniqueOrThrow({ where: { id: data.tarjetaId } })
      await tx.movimientoSinFactura.create({
        data: {
          cuentaId: data.cuentaPagoId,
          tipo: "EGRESO",
          categoria: "PAGO_TARJETA",
          monto: totalPagado,
          fecha: new Date(data.fechaPago),
          descripcion: `Cierre resumen ${tarjeta.nombre} — ${data.mesAnio}`,
          tarjetaId: data.tarjetaId,
          operadorId,
        },
      })

      return cierre
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error("POST /api/tarjetas/cierre-resumen error:", error)
    return NextResponse.json({ error: "Error al crear cierre de resumen", detail: String(error) }, { status: 500 })
  }
}
