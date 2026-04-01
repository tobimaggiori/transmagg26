/**
 * POST /api/cheques-recibidos/[id]/descontar-banco
 * Descuenta el cheque en el banco.
 * Estado → DESCONTADO_BANCO.
 * Crea dos MovimientoSinFactura: INGRESO por neto + EGRESO por comisión bancaria.
 */

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { badRequestResponse, invalidDataResponse, notFoundResponse, requireFinancialAccess, serverErrorResponse } from "@/lib/financial-api"
import { resolverOperadorId } from "@/lib/session-utils"

const schema = z.object({
  cuentaId: z.string().uuid(),
  tasaDescuento: z.number().min(0).max(100),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const access = await requireFinancialAccess()
  if (!access.ok) return access.response

  let operadorId: string
  try {
    operadorId = await resolverOperadorId(access.session.user)
  } catch {
    return NextResponse.json({ error: "Sesión inválida." }, { status: 401 })
  }

  try {
    const { id } = await params
    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return invalidDataResponse(parsed.error.flatten())

    const cheque = await prisma.chequeRecibido.findUnique({
      where: { id },
      include: { empresa: { select: { razonSocial: true } } },
    })
    if (!cheque) return notFoundResponse("Cheque recibido")
    if (cheque.estado !== "EN_CARTERA") return badRequestResponse("El cheque no está EN_CARTERA")

    const cuenta = await prisma.cuenta.findUnique({ where: { id: parsed.data.cuentaId }, select: { id: true } })
    if (!cuenta) return notFoundResponse("Cuenta")

    const fecha = new Date(parsed.data.fecha)
    const comision = Math.round(cheque.monto * parsed.data.tasaDescuento / 100 * 100) / 100
    const neto = Math.round((cheque.monto - comision) * 100) / 100

    const resultado = await prisma.$transaction(async (tx) => {
      const chequeActualizado = await tx.chequeRecibido.update({
        where: { id },
        data: {
          estado: "DESCONTADO_BANCO",
          cuentaDepositoId: parsed.data.cuentaId,
          tasaDescuento: parsed.data.tasaDescuento,
          fechaAcreditacion: fecha,
        },
      })

      const movIngreso = await tx.movimientoSinFactura.create({
        data: {
          cuentaId: parsed.data.cuentaId,
          tipo: "INGRESO",
          categoria: "DESCUENTO_CHEQUE_BANCO",
          monto: neto,
          fecha,
          descripcion: `Descuento cheque ${cheque.nroCheque} — ${cheque.empresa.razonSocial} (tasa ${parsed.data.tasaDescuento}%)`,
          referencia: cheque.nroCheque,
          operadorId,
        },
      })

      const movEgreso = await tx.movimientoSinFactura.create({
        data: {
          cuentaId: parsed.data.cuentaId,
          tipo: "EGRESO",
          categoria: "OTRO",
          monto: comision,
          fecha,
          descripcion: `Comisión descuento cheque ${cheque.nroCheque} — ${cheque.empresa.razonSocial}`,
          referencia: cheque.nroCheque,
          operadorId,
        },
      })

      return { cheque: chequeActualizado, movIngreso, movEgreso, neto, comision }
    })

    return NextResponse.json(resultado)
  } catch (error) {
    return serverErrorResponse("POST /api/cheques-recibidos/[id]/descontar-banco", error)
  }
}
