import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import {
  requireFinancialAccess,
  badRequestResponse,
  notFoundResponse,
  invalidDataResponse,
  serverErrorResponse,
} from "@/lib/financial-api"
import { calcularSaldoCCEmpresa } from "@/lib/cuenta-corriente"
import { resolverOperadorId } from "@/lib/session-utils"

const pagoItemSchema = z.discriminatedUnion("tipoPago", [
  z.object({
    tipoPago: z.literal("CHEQUE"),
    monto: z.number().positive(),
    esElectronico: z.boolean().default(false),
    nroCheque: z.string().min(1),
    bancoEmisor: z.string().min(1),
    fechaEmision: z.string(),
    fechaCobro: z.string(),
    cuitLibrador: z.string().optional(),
  }),
  z.object({
    tipoPago: z.literal("TRANSFERENCIA"),
    monto: z.number().positive(),
    cuentaBancariaId: z.string().uuid(),
    referencia: z.string().optional(),
  }),
  z.object({
    tipoPago: z.literal("EFECTIVO"),
    monto: z.number().positive(),
    descripcion: z.string().optional(),
  }),
  z.object({
    tipoPago: z.literal("SALDO_A_FAVOR"),
    monto: z.number().positive(),
  }),
])

const cobroSchema = z.object({
  pagos: z.array(pagoItemSchema).min(1),
  fecha: z.string(),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const acceso = await requireFinancialAccess()
  if (!acceso.ok) return acceso.response

  const { id: facturaId } = await params
  let operadorId: string
  try {
    operadorId = await resolverOperadorId(acceso.session.user)
  } catch {
    return NextResponse.json({ error: "Sesión inválida. Cerrá sesión y volvé a ingresar." }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return badRequestResponse("Cuerpo JSON inválido")
  }

  const parsed = cobroSchema.safeParse(body)
  if (!parsed.success) return invalidDataResponse(parsed.error.flatten())

  const { pagos, fecha } = parsed.data

  try {
    const factura = await prisma.facturaEmitida.findUnique({
      where: { id: facturaId },
      select: {
        id: true,
        empresaId: true,
        total: true,
        estado: true,
        tipoCbte: true,
        nroComprobante: true,
        empresa: { select: { razonSocial: true } },
        pagos: { select: { monto: true } },
      },
    })

    if (!factura) return notFoundResponse("Factura")

    if (!["EMITIDA", "PARCIALMENTE_COBRADA"].includes(factura.estado)) {
      return badRequestResponse("La factura no está en estado cobrable")
    }

    const totalYaPagado = factura.pagos.reduce((sum, p) => sum + p.monto, 0)
    const saldoPendiente = factura.total - totalYaPagado
    const totalPagoActual = pagos.reduce((sum, p) => sum + p.monto, 0)

    // Validate SALDO_A_FAVOR
    const pagoSaldoAFavor = pagos.find((p) => p.tipoPago === "SALDO_A_FAVOR")
    if (pagoSaldoAFavor) {
      const { saldoAFavor } = await calcularSaldoCCEmpresa(factura.empresaId)
      if (pagoSaldoAFavor.monto > saldoAFavor) {
        return badRequestResponse("Saldo a favor insuficiente")
      }
    }

    const fechaPago = new Date(fecha)

    const nuevoEstado =
      totalPagoActual >= saldoPendiente ? "COBRADA" : "PARCIALMENTE_COBRADA"

    await prisma.$transaction(async (tx) => {
      for (const pago of pagos) {
        if (pago.tipoPago === "CHEQUE") {
          const nuevoCheque = await tx.chequeRecibido.create({
            data: {
              empresaId: factura.empresaId,
              facturaId,
              esElectronico: pago.esElectronico,
              nroCheque: pago.nroCheque,
              bancoEmisor: pago.bancoEmisor,
              monto: pago.monto,
              fechaEmision: new Date(pago.fechaEmision),
              fechaCobro: new Date(pago.fechaCobro),
              cuitLibrador: pago.cuitLibrador,
              estado: "EN_CARTERA",
              operadorId,
            },
          })
          await tx.pagoDeEmpresa.create({
            data: {
              empresaId: factura.empresaId,
              facturaId,
              tipoPago: "CHEQUE",
              monto: pago.monto,
              fechaPago,
              chequeRecibidoId: nuevoCheque.id,
              operadorId,
            },
          })
        } else if (pago.tipoPago === "TRANSFERENCIA") {
          await tx.pagoDeEmpresa.create({
            data: {
              empresaId: factura.empresaId,
              facturaId,
              tipoPago: "TRANSFERENCIA",
              monto: pago.monto,
              referencia: pago.referencia,
              fechaPago,
              cuentaId: pago.cuentaBancariaId,
              operadorId,
            },
          })
          // Registrar movimiento bancario: TRANSFERENCIA_RECIBIDA
          await tx.cuenta.findUnique({
            where: { id: pago.cuentaBancariaId },
            select: { tieneImpuestoDebcred: true, alicuotaImpuesto: true },
          })
          const nroCbte = factura.nroComprobante ?? "s/n"
          const descripcionMov = `Cobro Factura ${factura.tipoCbte} ${nroCbte} — ${factura.empresa.razonSocial}`
          await tx.movimientoSinFactura.create({
            data: {
              cuentaId: pago.cuentaBancariaId,
              tipo: "INGRESO",
              categoria: "TRANSFERENCIA_RECIBIDA",
              monto: pago.monto,
              fecha: fechaPago,
              descripcion: descripcionMov,
              referencia: pago.referencia,
              operadorId,
            },
          })
        } else if (pago.tipoPago === "EFECTIVO") {
          await tx.pagoDeEmpresa.create({
            data: {
              empresaId: factura.empresaId,
              facturaId,
              tipoPago: "EFECTIVO",
              monto: pago.monto,
              referencia: pago.descripcion,
              fechaPago,
              operadorId,
            },
          })
        } else if (pago.tipoPago === "SALDO_A_FAVOR") {
          await tx.pagoDeEmpresa.create({
            data: {
              empresaId: factura.empresaId,
              facturaId,
              tipoPago: "SALDO_A_FAVOR",
              monto: pago.monto,
              fechaPago,
              operadorId,
            },
          })
        }
      }

      await tx.facturaEmitida.update({
        where: { id: facturaId },
        data: { estado: nuevoEstado },
      })

      const excedente = totalPagoActual - saldoPendiente
      if (excedente > 0) {
        // Negative-amount payment representing saldo a favor generated
        await tx.pagoDeEmpresa.create({
          data: {
            empresaId: factura.empresaId,
            facturaId: null,
            tipoPago: "SALDO_A_FAVOR",
            monto: -excedente,
            fechaPago,
            operadorId,
          },
        })
      }
    })

    return NextResponse.json({
      ok: true,
      nuevoEstado,
      saldoRestante: Math.max(0, saldoPendiente - totalPagoActual),
      saldoAFavorGenerado: Math.max(0, totalPagoActual - saldoPendiente),
    })
  } catch (error) {
    return serverErrorResponse("POST /api/facturas/[id]/cobro", error)
  }
}
