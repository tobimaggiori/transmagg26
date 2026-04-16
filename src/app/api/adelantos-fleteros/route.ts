import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  badRequestResponse,
  invalidDataResponse,
  notFoundResponse,
  requireFinancialAccess,
  serverErrorResponse,
} from "@/lib/financial-api"
import { crearAdelantoFleteroSchema } from "@/lib/financial-schemas"
import { resolverOperadorId } from "@/lib/session-utils"
import { importesIguales } from "@/lib/money"

/**
 * GET: -> Promise<NextResponse>
 *
 * Dado [ningún parámetro], devuelve [todos los adelantos a fleteros con sus descuentos, fletero y cheques relacionados].
 * Esta función existe para administrar anticipos operativos y su recuperación posterior en liquidaciones.
 *
 * Ejemplos:
 * GET() === NextResponse.json([{ id, fletero, monto, estado }])
 * GET() === NextResponse.json([{ id, descuentos, chequeEmitido, chequeRecibido }])
 * GET() === NextResponse.json([])
 */
export async function GET() {
  const access = await requireFinancialAccess()
  if (!access.ok) return access.response

  try {
    const adelantos = await prisma.adelantoFletero.findMany({
      include: {
        fletero: { select: { id: true, razonSocial: true } },
        chequeEmitido: { select: { id: true, nroCheque: true, monto: true } },
        chequeRecibido: { select: { id: true, nroCheque: true, monto: true } },
        descuentos: {
          include: {
            liquidacion: { select: { id: true, estado: true, total: true } },
          },
          orderBy: { fecha: "desc" },
        },
        operador: { select: { id: true, nombre: true, apellido: true } },
      },
      orderBy: { fecha: "desc" },
    })

    return NextResponse.json(adelantos)
  } catch (error) {
    return serverErrorResponse("GET /api/adelantos-fleteros", error)
  }
}

/**
 * POST: NextRequest -> Promise<NextResponse>
 *
 * Dado [un body con datos del adelanto a fletero], devuelve [el adelanto creado con operador autenticado si las referencias existen y los montos son consistentes].
 * Esta función existe para registrar adelantos por efectivo, transferencia, combustible o cheques.
 *
 * Para tipo CHEQUE_PROPIO: dentro de una transacción, crea un ChequeEmitido en estado EMITIDO
 * (motivo ADELANTO, beneficiario = CUIT del fletero) y lo vincula al adelanto. Eso lo hace
 * aparecer en la cartera de cheques propios.
 *
 * Para tipo CHEQUE_TERCERO: dentro de una transacción, valida que el cheque seleccionado esté
 * EN_CARTERA, fuerza el monto del adelanto al monto del cheque, y endosa el cheque al fletero
 * (estado ENDOSADO_FLETERO). Eso lo saca de la cartera de cheques de tercero.
 *
 * Ejemplos:
 * POST(request) === NextResponse.json({ id, fleteroId, estado }, { status: 201 })
 * POST(request) === NextResponse.json({ error: "Fletero no encontrado" }, { status: 404 })
 * POST(request) === NextResponse.json({ error: "El monto descontado no puede superar el monto del adelanto" }, { status: 400 })
 */
export async function POST(request: NextRequest) {
  const access = await requireFinancialAccess()
  if (!access.ok) return access.response

  let operadorId: string
  try {
    operadorId = await resolverOperadorId(access.session.user)
  } catch {
    return NextResponse.json({ error: "Sesión inválida. Cerrá sesión y volvé a ingresar." }, { status: 401 })
  }

  try {
    const body = await request.json()
    const parsed = crearAdelantoFleteroSchema.safeParse(body)
    if (!parsed.success) return invalidDataResponse(parsed.error.flatten())

    const data = parsed.data

    if (data.montoDescontado > data.monto) {
      return badRequestResponse("El monto descontado no puede superar el monto del adelanto")
    }

    const fletero = await prisma.fletero.findUnique({
      where: { id: data.fleteroId },
      select: { id: true, cuit: true },
    })
    if (!fletero) return notFoundResponse("Fletero")

    // ── CHEQUE_PROPIO: crear ChequeEmitido + Adelanto en transacción ─────────
    if (data.tipo === "CHEQUE_PROPIO") {
      const ch = data.chequePropio!
      const cuenta = await prisma.cuenta.findUnique({
        where: { id: ch.cuentaId },
        select: { id: true, tieneChequera: true },
      })
      if (!cuenta) return notFoundResponse("Cuenta (chequera)")
      if (!cuenta.tieneChequera) {
        return badRequestResponse("La cuenta seleccionada no tiene chequera habilitada")
      }
      const duplicado = await prisma.chequeEmitido.findFirst({
        where: { nroCheque: ch.nroCheque, cuentaId: ch.cuentaId },
        select: { id: true },
      })
      if (duplicado) {
        return badRequestResponse(`Ya existe un cheque emitido Nro ${ch.nroCheque} en esa cuenta`)
      }

      const adelanto = await prisma.$transaction(async (tx) => {
        const chequeEmitido = await tx.chequeEmitido.create({
          data: {
            fleteroId: fletero.id,
            cuentaId: ch.cuentaId,
            nroCheque: ch.nroCheque,
            tipoDocBeneficiario: "CUIT",
            nroDocBeneficiario: fletero.cuit.replace(/\D/g, ""),
            mailBeneficiario: ch.mailBeneficiario ?? null,
            monto: data.monto,
            fechaEmision: new Date(ch.fechaEmision),
            fechaPago: new Date(ch.fechaPago),
            motivoPago: "ADELANTO",
            clausula: ch.clausula,
            descripcion1: ch.descripcion1 ?? null,
            descripcion2: ch.descripcion2 ?? null,
            esElectronico: true,
            estado: "EMITIDO",
            operadorId,
          },
        })
        return tx.adelantoFletero.create({
          data: {
            fleteroId: data.fleteroId,
            tipo: data.tipo,
            monto: data.monto,
            fecha: data.fecha,
            descripcion: data.descripcion ?? null,
            chequeEmitidoId: chequeEmitido.id,
            comprobanteS3Key: data.comprobanteS3Key ?? null,
            montoDescontado: data.montoDescontado,
            estado: data.estado,
            operadorId,
          },
        })
      })

      return NextResponse.json(adelanto, { status: 201 })
    }

    // ── CHEQUE_TERCERO: endosar cheque + crear Adelanto en transacción ───────
    if (data.tipo === "CHEQUE_TERCERO") {
      const cheque = await prisma.chequeRecibido.findUnique({
        where: { id: data.chequeRecibidoId! },
        select: { id: true, monto: true, estado: true },
      })
      if (!cheque) return notFoundResponse("Cheque recibido")
      if (cheque.estado !== "EN_CARTERA") {
        return badRequestResponse(`El cheque no está en cartera (estado actual: ${cheque.estado})`)
      }
      if (!importesIguales(data.monto, cheque.monto)) {
        return badRequestResponse(
          `El monto del adelanto debe coincidir exactamente con el del cheque (${cheque.monto})`,
        )
      }

      const adelanto = await prisma.$transaction(async (tx) => {
        await tx.chequeRecibido.update({
          where: { id: cheque.id },
          data: {
            estado: "ENDOSADO_FLETERO",
            endosadoATipo: "FLETERO",
            endosadoAFleteroId: fletero.id,
          },
        })
        return tx.adelantoFletero.create({
          data: {
            fleteroId: data.fleteroId,
            tipo: data.tipo,
            monto: data.monto,
            fecha: data.fecha,
            descripcion: data.descripcion ?? null,
            chequeRecibidoId: cheque.id,
            comprobanteS3Key: data.comprobanteS3Key ?? null,
            montoDescontado: data.montoDescontado,
            estado: data.estado,
            operadorId,
          },
        })
      })

      return NextResponse.json(adelanto, { status: 201 })
    }

    // ── Resto de tipos: EFECTIVO, TRANSFERENCIA, COMBUSTIBLE ────────────────
    const adelanto = await prisma.adelantoFletero.create({
      data: {
        fleteroId: data.fleteroId,
        tipo: data.tipo,
        monto: data.monto,
        fecha: data.fecha,
        descripcion: data.descripcion ?? null,
        comprobanteS3Key: data.comprobanteS3Key ?? null,
        montoDescontado: data.montoDescontado,
        estado: data.estado,
        operadorId,
      },
    })

    return NextResponse.json(adelanto, { status: 201 })
  } catch (error) {
    return serverErrorResponse("POST /api/adelantos-fleteros", error)
  }
}
