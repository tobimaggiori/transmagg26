/**
 * GET /api/fci/[id]/detalle
 *
 * Devuelve todo lo que necesita la vista de detalle del FCI:
 * - datos del FCI + cuenta asociada
 * - último SaldoFci informado (saldo anterior)
 * - movimientos desde la última conciliación (para preview del cálculo)
 * - historial de saldos (últimos 30)
 * - días hábiles desde la última conciliación (para alerta)
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  notFoundResponse,
  requireFinancialAccess,
  serverErrorResponse,
} from "@/lib/financial-api"
import { contarDiasHabilesEntre } from "@/lib/feriados"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const access = await requireFinancialAccess()
  if (!access.ok) return access.response

  try {
    const { id } = await params
    const fci = await prisma.fci.findUnique({
      where: { id },
      include: {
        cuenta: { select: { id: true, nombre: true, tipo: true, moneda: true, activa: true } },
      },
    })
    if (!fci) return notFoundResponse("FCI")

    const saldoAnterior = await prisma.saldoFci.findFirst({
      where: { fciId: id },
      orderBy: { fechaActualizacion: "desc" },
      include: { operador: { select: { nombre: true, apellido: true } } },
    })

    const fechaDesde = saldoAnterior?.fechaActualizacion ?? new Date(0)

    const [movimientosPeriodo, historialSaldos] = await Promise.all([
      prisma.movimientoFci.findMany({
        where: { fciId: id, fecha: { gt: fechaDesde } },
        orderBy: { fecha: "asc" },
        include: {
          cuentaOrigenDestino: { select: { id: true, nombre: true } },
          operador: { select: { nombre: true, apellido: true } },
        },
      }),
      prisma.saldoFci.findMany({
        where: { fciId: id },
        orderBy: { fechaActualizacion: "desc" },
        take: 30,
        include: { operador: { select: { nombre: true, apellido: true } } },
      }),
    ])

    const suscripciones = movimientosPeriodo
      .filter((m) => m.tipo === "SUSCRIPCION")
      .reduce((a, m) => a + Number(m.monto), 0)
    const rescates = movimientosPeriodo
      .filter((m) => m.tipo === "RESCATE")
      .reduce((a, m) => a + Number(m.monto), 0)

    const hoy = new Date()
    const diasHabilesSinConciliar = saldoAnterior
      ? Math.max(0, (await contarDiasHabilesEntre(saldoAnterior.fechaActualizacion, hoy)) - 1)
      : null

    return NextResponse.json({
      fci: {
        id: fci.id,
        nombre: fci.nombre,
        moneda: fci.moneda,
        activo: fci.activo,
        diasHabilesAlerta: fci.diasHabilesAlerta,
        saldoActual: Number(fci.saldoActual),
        saldoActualizadoEn: fci.saldoActualizadoEn,
        cuenta: fci.cuenta,
      },
      saldoAnterior: saldoAnterior
        ? {
            saldoInformado: Number(saldoAnterior.saldoInformado),
            fechaActualizacion: saldoAnterior.fechaActualizacion,
            rendimientoPeriodo: Number(saldoAnterior.rendimientoPeriodo),
            operador: saldoAnterior.operador,
          }
        : null,
      movimientosPeriodo: movimientosPeriodo.map((m) => ({
        id: m.id,
        tipo: m.tipo,
        monto: Number(m.monto),
        fecha: m.fecha,
        descripcion: m.descripcion,
        cuentaOrigenDestino: m.cuentaOrigenDestino,
        operador: m.operador,
      })),
      totalesPeriodo: {
        suscripciones,
        rescates,
        baseEsperada: Number(saldoAnterior?.saldoInformado ?? 0) + suscripciones - rescates,
      },
      historialSaldos: historialSaldos.map((s) => ({
        id: s.id,
        saldoInformado: Number(s.saldoInformado),
        fechaActualizacion: s.fechaActualizacion,
        rendimientoPeriodo: Number(s.rendimientoPeriodo),
        operador: s.operador,
      })),
      diasHabilesSinConciliar,
    })
  } catch (error) {
    return serverErrorResponse("GET /api/fci/[id]/detalle", error)
  }
}
