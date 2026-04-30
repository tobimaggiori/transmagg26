/**
 * GET  /api/cuentas/[id]/movimientos — Libro de la cuenta. Devuelve los movimientos
 *       con saldo corrido y el flag `conciliado` por día.
 * POST /api/cuentas/[id]/movimientos — Crea un movimiento manual (esManual=true).
 * Solo accesible para ADMIN_TRANSMAGG y OPERADOR_TRANSMAGG.
 */

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import {
  invalidDataResponse,
  notFoundResponse,
  requireFinancialAccess,
  serverErrorResponse,
} from "@/lib/financial-api"
import { resolverOperadorId } from "@/lib/session-utils"
import {
  listarMovimientosConSaldoCorrido,
  calcularSaldoActual,
  registrarMovimientoManualConImpuestos,
} from "@/lib/movimiento-cuenta"
import { estadoMesCuenta } from "@/lib/conciliacion"

const crearManualSchema = z.object({
  tipo: z.enum(["INGRESO", "EGRESO"]),
  categoria: z.string().min(1, "Categoría requerida"),
  monto: z.number().positive("El monto debe ser mayor a 0"),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida (YYYY-MM-DD)"),
  descripcion: z.string().min(1, "Descripción requerida"),
  comprobanteS3Key: z.string().optional().nullable(),
  cuentaDestinoId: z.string().uuid().optional().nullable(),
  aplicarImpuestoDebcred: z.boolean().optional().default(false),
  aplicarIibbSircreb: z.boolean().optional().default(false),
})

/**
 * GET: NextRequest, { params: { id } } -> Promise<NextResponse>
 *
 * Dado el id de una cuenta y filtros opcionales (desde, hasta, tipo, categoria,
 * soloConciliados, soloNoConciliados), devuelve los movimientos del libro
 * ordenados por (fecha, orden) con su saldo corrido, junto con el saldo actual
 * total de la cuenta y (si el rango cae dentro de un mes) el estado del mes.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const access = await requireFinancialAccess()
  if (!access.ok) return access.response

  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)

    const cuenta = await prisma.cuenta.findUnique({
      where: { id },
      select: { id: true, nombre: true, moneda: true, saldoInicial: true, fechaSaldoInicial: true },
    })
    if (!cuenta) return notFoundResponse("Cuenta")

    const desde = searchParams.get("desde")
    const hasta = searchParams.get("hasta")
    const tipo = searchParams.get("tipo")
    const categoria = searchParams.get("categoria")
    const soloConciliados = searchParams.get("soloConciliados") === "true"
    const soloNoConciliados = searchParams.get("soloNoConciliados") === "true"

    const movimientos = await listarMovimientosConSaldoCorrido({
      cuentaId: id,
      desde: desde ? new Date(desde) : undefined,
      hasta: hasta ? new Date(hasta) : undefined,
      tipo: tipo === "INGRESO" || tipo === "EGRESO" ? tipo : undefined,
      categoria: categoria ?? undefined,
      soloConciliados: soloConciliados || undefined,
      soloNoConciliados: soloNoConciliados || undefined,
    })

    const saldoActual = await calcularSaldoActual(id)

    let estadoMes: Awaited<ReturnType<typeof estadoMesCuenta>> | null = null
    const mesParam = searchParams.get("mes")
    const anioParam = searchParams.get("anio")
    if (mesParam && anioParam) {
      const mes = parseInt(mesParam, 10)
      const anio = parseInt(anioParam, 10)
      if (!Number.isNaN(mes) && !Number.isNaN(anio)) {
        estadoMes = await estadoMesCuenta(id, mes, anio)
      }
    }

    return NextResponse.json({
      cuenta,
      movimientos,
      saldoActual,
      estadoMes,
    })
  } catch (error) {
    return serverErrorResponse("GET /api/cuentas/[id]/movimientos", error)
  }
}

/**
 * POST: NextRequest, { params: { id } } -> Promise<NextResponse>
 *
 * Dado el id de la cuenta y el body del movimiento manual, crea un
 * MovimientoCuenta con esManual=true.
 */
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
    const { id: cuentaId } = await params
    const cuenta = await prisma.cuenta.findUnique({
      where: { id: cuentaId },
      select: {
        id: true,
        activa: true,
        tieneImpuestoDebcred: true,
        alicuotaImpuesto: true,
        tieneIibbSircrebTucuman: true,
        alicuotaIibbSircrebTucuman: true,
      },
    })
    if (!cuenta) return notFoundResponse("Cuenta")
    if (!cuenta.activa) {
      return NextResponse.json(
        { error: "La cuenta está cerrada. No se pueden registrar movimientos." },
        { status: 400 }
      )
    }

    const body = await request.json()
    const parsed = crearManualSchema.safeParse(body)
    if (!parsed.success) return invalidDataResponse(parsed.error.flatten())

    if (parsed.data.aplicarImpuestoDebcred && !cuenta.tieneImpuestoDebcred) {
      return NextResponse.json(
        { error: "La cuenta no tiene configurado el impuesto débito/crédito." },
        { status: 400 }
      )
    }
    if (parsed.data.aplicarIibbSircreb && !cuenta.tieneIibbSircrebTucuman) {
      return NextResponse.json(
        { error: "La cuenta no tiene configurado IIBB SIRCREB Tucumán." },
        { status: 400 }
      )
    }

    const creado = await prisma.$transaction(async (tx) => {
      return registrarMovimientoManualConImpuestos(
        tx,
        {
          cuentaId,
          fecha: new Date(parsed.data.fecha),
          tipo: parsed.data.tipo,
          categoria: parsed.data.categoria,
          monto: parsed.data.monto,
          descripcion: parsed.data.descripcion,
          esManual: true,
          comprobanteS3Key: parsed.data.comprobanteS3Key ?? null,
          cuentaDestinoId: parsed.data.cuentaDestinoId ?? null,
          operadorCreacionId: operadorId,
        },
        {
          debcred: parsed.data.aplicarImpuestoDebcred
            ? { aplica: true, alicuota: cuenta.alicuotaImpuesto }
            : undefined,
          iibbSircreb: parsed.data.aplicarIibbSircreb
            ? { aplica: true, alicuota: cuenta.alicuotaIibbSircrebTucuman }
            : undefined,
        }
      )
    })

    return NextResponse.json(creado, { status: 201 })
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return serverErrorResponse("POST /api/cuentas/[id]/movimientos", error)
  }
}
