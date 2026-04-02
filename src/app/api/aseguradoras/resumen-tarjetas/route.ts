/**
 * API Route: POST /api/aseguradoras/resumen-tarjetas
 * Cierra el resumen mensual de cuotas de seguro de una tarjeta y registra el pago.
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireFinancialAccess, serverErrorResponse, badRequestResponse } from "@/lib/financial-api"
import { resolverOperadorId } from "@/lib/session-utils"

export async function POST(request: NextRequest): Promise<NextResponse> {
  const acceso = await requireFinancialAccess()
  if (!acceso.ok) return acceso.response

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return badRequestResponse("JSON inválido")
  }

  const data = body as {
    tarjetaId: string
    mesAnio: string
    cuentaPagoId: string
    fechaPago: string
  }

  if (!data.tarjetaId || !data.mesAnio || !data.cuentaPagoId || !data.fechaPago) {
    return badRequestResponse("Campos requeridos: tarjetaId, mesAnio, cuentaPagoId, fechaPago")
  }

  try {
    const operadorId = await resolverOperadorId({
      id: acceso.session.user.id,
      email: acceso.session.user.email,
    })

    const tarjeta = await prisma.tarjeta.findUnique({ where: { id: data.tarjetaId } })
    if (!tarjeta) return badRequestResponse("Tarjeta no encontrada")

    const resumen = await prisma.$transaction(async (tx) => {
      // 1. Buscar cuotas pendientes para la tarjeta y mes
      const cuotas = await tx.cuotaFacturaSeguro.findMany({
        where: {
          tarjetaId: data.tarjetaId,
          mesAnio: data.mesAnio,
          estado: "PENDIENTE",
        },
      })

      if (cuotas.length === 0) {
        throw new Error("No hay cuotas pendientes para este período y tarjeta")
      }

      // 2. Sumar montos
      const totalCuotas = cuotas.reduce((acc, c) => acc + c.monto, 0)

      // 3. Crear o actualizar ResumenTarjeta
      const resumenExistente = await tx.resumenTarjeta.findFirst({
        where: { tarjetaId: data.tarjetaId, periodo: data.mesAnio },
      })

      const nuevoResumen = resumenExistente
        ? await tx.resumenTarjeta.update({
            where: { id: resumenExistente.id },
            data: {
              totalARS: totalCuotas,
              pagado: true,
              fechaVtoPago: new Date(data.fechaPago),
            },
          })
        : await tx.resumenTarjeta.create({
            data: {
              tarjetaId: data.tarjetaId,
              periodo: data.mesAnio,
              totalARS: totalCuotas,
              pagado: true,
              fechaVtoPago: new Date(data.fechaPago),
            },
          })

      // 4. Marcar cuotas como PAGADA y vincular al resumen
      await tx.cuotaFacturaSeguro.updateMany({
        where: {
          tarjetaId: data.tarjetaId,
          mesAnio: data.mesAnio,
          estado: "PENDIENTE",
        },
        data: {
          estado: "PAGADA",
          resumenTarjetaId: nuevoResumen.id,
        },
      })

      // 5. Crear MovimientoSinFactura EGRESO
      await tx.movimientoSinFactura.create({
        data: {
          cuentaId: data.cuentaPagoId,
          tipo: "EGRESO",
          categoria: "PAGO_TARJETA",
          monto: totalCuotas,
          fecha: new Date(data.fechaPago),
          descripcion: `Pago resumen tarjeta ${tarjeta.nombre} ${data.mesAnio}`,
          operadorId,
        },
      })

      return nuevoResumen
    })

    return NextResponse.json({ resumen }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message.includes("No hay cuotas")) {
      return badRequestResponse(error.message)
    }
    return serverErrorResponse("POST /api/aseguradoras/resumen-tarjetas", error)
  }
}
