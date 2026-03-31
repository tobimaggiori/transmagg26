import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sugerirImpuestosMovimientoBancario } from "@/lib/financial"
import {
  badRequestResponse,
  invalidDataResponse,
  notFoundResponse,
  requireFinancialAccess,
  serverErrorResponse,
} from "@/lib/financial-api"
import { crearMovimientoBancarioSchema } from "@/lib/financial-schemas"
import { resolverOperadorId } from "@/lib/session-utils"

/**
 * GET: -> Promise<NextResponse>
 *
 * Dado [ningún parámetro], devuelve [todos los movimientos bancarios con cuenta, referencias opcionales y operador].
 * Esta función existe para consultar el libro bancario del módulo financiero.
 *
 * Ejemplos:
 * GET() === NextResponse.json([{ id, tipo, monto, cuenta, operador }])
 * GET() === NextResponse.json([{ id, impuestoDebitoMonto, impuestoCreditoMonto }])
 * GET() === NextResponse.json([])
 */
export async function GET(request: NextRequest) {
  const access = await requireFinancialAccess()
  if (!access.ok) return access.response

  try {
    const { searchParams } = new URL(request.url)
    const cuentaId = searchParams.get("cuentaId")

    const movimientos = await prisma.movimientoBancario.findMany({
      where: cuentaId ? { cuentaId } : undefined,
      include: {
        cuenta: { select: { id: true, nombre: true, tipo: true } },
        cuentaDestino: { select: { id: true, nombre: true } },
        cuentaBroker: { select: { id: true, nombre: true } },
        empleado: { select: { id: true, nombre: true, apellido: true } },
        operador: { select: { id: true, nombre: true, apellido: true } },
      },
      orderBy: { fecha: "desc" },
    })

    return NextResponse.json(movimientos)
  } catch (error) {
    return serverErrorResponse("GET /api/movimientos-bancarios", error)
  }
}

/**
 * POST: NextRequest -> Promise<NextResponse>
 *
 * Dado [un body con datos de movimiento bancario], devuelve [el movimiento creado sugiriendo impuestos automáticamente si no fueron informados].
 * Esta función existe para registrar ingresos y egresos bancarios con trazabilidad tributaria editable por operador.
 *
 * Ejemplos:
 * POST(request) === NextResponse.json({ id, impuestoDebitoMonto, impuestoCreditoMonto }, { status: 201 })
 * POST(request) === NextResponse.json({ error: "Cuenta no encontrado" }, { status: 404 })
 * POST(request) === NextResponse.json({ error: "Datos inválidos", detalles }, { status: 400 })
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
    const parsed = crearMovimientoBancarioSchema.safeParse(body)
    if (!parsed.success) return invalidDataResponse(parsed.error.flatten())

    const cuenta = await prisma.cuenta.findUnique({ where: { id: parsed.data.cuentaId } })
    if (!cuenta) return notFoundResponse("Cuenta")

    if (parsed.data.tipo === "TRANSFERENCIA_ENTRE_CUENTAS_PROPIAS" && !parsed.data.cuentaDestinoId) {
      return badRequestResponse("La cuenta destino es obligatoria para transferencias entre cuentas propias")
    }

    if ((parsed.data.tipo === "ENVIO_A_BROKER" || parsed.data.tipo === "RESCATE_DE_BROKER") && !parsed.data.cuentaBrokerId) {
      return badRequestResponse("La cuenta broker es obligatoria para envíos y rescates de broker")
    }

    if (parsed.data.tipo === "PAGO_SUELDO" && !parsed.data.empleadoId) {
      return badRequestResponse("El empleado es obligatorio para pagos de sueldo")
    }

    const sugerencia = sugerirImpuestosMovimientoBancario({
      tipo: parsed.data.tipo,
      monto: parsed.data.monto,
      tieneImpuestoDebcred: cuenta.tieneImpuestoDebcred,
      alicuotaImpuesto: cuenta.alicuotaImpuesto,
      esCuentaComitenteBroker: cuenta.esCuentaComitenteBroker,
    })

    const movimiento = await prisma.movimientoBancario.create({
      data: {
        ...parsed.data,
        impuestoDebitoAplica: parsed.data.impuestoDebitoAplica ?? sugerencia.impuestoDebitoAplica,
        impuestoDebitoMonto: parsed.data.impuestoDebitoMonto ?? sugerencia.impuestoDebitoMonto,
        impuestoCreditoAplica: parsed.data.impuestoCreditoAplica ?? sugerencia.impuestoCreditoAplica,
        impuestoCreditoMonto: parsed.data.impuestoCreditoMonto ?? sugerencia.impuestoCreditoMonto,
        operadorId,
      },
    })

    return NextResponse.json(movimiento, { status: 201 })
  } catch (error) {
    return serverErrorResponse("POST /api/movimientos-bancarios", error)
  }
}
