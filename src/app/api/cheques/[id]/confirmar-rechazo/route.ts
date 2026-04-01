/**
 * API Route: POST /api/cheques/[id]/confirmar-rechazo
 * Marca un cheque como RECHAZADO y anula atómicamente todos los pagos vinculados.
 * Recalcula estados de LP y FacturaProveedor. Opcionalmente registra costo bancario.
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { esRolInterno } from "@/lib/permissions"
import { resolverOperadorId } from "@/lib/session-utils"
import type { Rol } from "@/types"

/**
 * recalcularEstadoLiquidacion: (liquidacionId, tx) -> Promise<void>
 *
 * Recalcula y actualiza el estado de una liquidación basado en sus pagos vigentes.
 * Estados posibles: EMITIDA (0 pagado) | PARCIALMENTE_PAGADA (algo pagado) | PAGADA (total cubierto).
 */
async function recalcularEstadoLiquidacion(
  liquidacionId: string,
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]
) {
  const liq = await tx.liquidacion.findUnique({
    where: { id: liquidacionId },
    select: { total: true, estado: true, pagos: { where: { anulado: false }, select: { monto: true } } },
  })
  if (!liq || liq.estado === "ANULADA") return

  const totalPagado = liq.pagos.reduce((s, p) => s + p.monto, 0)
  let nuevoEstado: string
  if (totalPagado <= 0.01) {
    nuevoEstado = "EMITIDA"
  } else if (totalPagado >= liq.total - 0.01) {
    nuevoEstado = "PAGADA"
  } else {
    nuevoEstado = "PARCIALMENTE_PAGADA"
  }

  if (nuevoEstado !== liq.estado) {
    await tx.liquidacion.update({ where: { id: liquidacionId }, data: { estado: nuevoEstado } })
  }
}

/**
 * recalcularEstadoFacturaProveedor: (facturaId, tx) -> Promise<void>
 *
 * Recalcula y actualiza estadoPago de una FacturaProveedor basado en sus pagos vigentes.
 * Estados: PENDIENTE (0) | PARCIALMENTE_PAGADA | PAGADA.
 */
async function recalcularEstadoFacturaProveedor(
  facturaId: string,
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]
) {
  const fact = await tx.facturaProveedor.findUnique({
    where: { id: facturaId },
    select: { total: true, estadoPago: true, pagos: { where: { anulado: false }, select: { monto: true } } },
  })
  if (!fact) return

  const totalPagado = fact.pagos.reduce((s, p) => s + p.monto, 0)
  let nuevoEstado: string
  if (totalPagado <= 0.01) {
    nuevoEstado = "PENDIENTE"
  } else if (totalPagado >= fact.total - 0.01) {
    nuevoEstado = "PAGADA"
  } else {
    nuevoEstado = "PARCIALMENTE_PAGADA"
  }

  if (nuevoEstado !== fact.estadoPago) {
    await tx.facturaProveedor.update({ where: { id: facturaId }, data: { estadoPago: nuevoEstado } })

    // Si volvió a PENDIENTE o PARCIALMENTE_PAGADA y había un GastoFletero PAGADO, revertirlo
    if (nuevoEstado !== "PAGADA") {
      const gasto = await tx.gastoFletero.findUnique({
        where: { facturaProveedorId: facturaId },
        select: { id: true, estado: true },
      })
      if (gasto && gasto.estado === "PAGADO") {
        await tx.gastoFletero.update({
          where: { id: gasto.id },
          data: { estado: "PENDIENTE_PAGO" },
        })
      }
    }
  }
}

/**
 * POST: NextRequest -> Promise<NextResponse>
 *
 * Dado el id de un cheque, lo marca como RECHAZADO y anula atómicamente todos los
 * PagoAFletero y PagoProveedor vinculados. Recalcula estados de LP y FacturaProveedor.
 * Si se provee costoBancarioMonto > 0 y el cheque era EMITIDO, crea un MovimientoSinFactura EGRESO.
 * Solo accesible para roles internos.
 *
 * Body: { costoBancarioMonto?: number }
 *
 * Ejemplos:
 * POST /api/cheques/abc/confirmar-rechazo {} === 200 { ok: true, impactosAplicados: 2 }
 * POST /api/cheques/abc/confirmar-rechazo (ya RECHAZADO) === 409 { error: "El cheque ya está rechazado" }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const rol = session.user.rol as Rol
  if (!esRolInterno(rol)) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  let operadorId: string
  try {
    operadorId = await resolverOperadorId(session.user)
  } catch {
    return NextResponse.json({ error: "Sesión inválida. Cerrá sesión y volvé a ingresar." }, { status: 401 })
  }

  const { id } = await params
  const body = await request.json().catch(() => ({})) as { costoBancarioMonto?: number }
  const costoBancarioMonto = typeof body.costoBancarioMonto === "number" && body.costoBancarioMonto > 0
    ? body.costoBancarioMonto
    : null

  const motivoAnulacion = "Cheque rechazado por el banco"

  try {
    // Verificar emitido
    const chequeEmitido = await prisma.chequeEmitido.findUnique({
      where: { id },
      select: {
        id: true,
        estado: true,
        monto: true,
        cuentaId: true,
        pagosFletero: {
          where: { anulado: false },
          select: { id: true, liquidacionId: true },
        },
        pagosProveedor: {
          where: { anulado: false },
          select: { id: true, facturaProveedorId: true },
        },
      },
    })

    if (chequeEmitido) {
      if (chequeEmitido.estado === "RECHAZADO") {
        return NextResponse.json({ error: "El cheque ya está rechazado" }, { status: 409 })
      }

      let impactosAplicados = 0

      await prisma.$transaction(async (tx) => {
        // 1. Marcar cheque RECHAZADO
        await tx.chequeEmitido.update({ where: { id }, data: { estado: "RECHAZADO" } })

        // 2. Anular PagoAFletero vinculados
        const liqIds = new Set<string>()
        for (const pago of chequeEmitido.pagosFletero) {
          await tx.pagoAFletero.update({
            where: { id: pago.id },
            data: { anulado: true, motivoAnulacion },
          })
          if (pago.liquidacionId) liqIds.add(pago.liquidacionId)
          impactosAplicados++
        }

        // 3. Anular PagoProveedor vinculados
        const factIds = new Set<string>()
        for (const pago of chequeEmitido.pagosProveedor) {
          await tx.pagoProveedor.update({
            where: { id: pago.id },
            data: { anulado: true, motivoAnulacion },
          })
          factIds.add(pago.facturaProveedorId)
          impactosAplicados++
        }

        // 4. Recalcular estados
        for (const liqId of Array.from(liqIds)) {
          await recalcularEstadoLiquidacion(liqId, tx)
        }
        for (const factId of Array.from(factIds)) {
          await recalcularEstadoFacturaProveedor(factId, tx)
        }

        // 5. Costo bancario si aplica
        if (costoBancarioMonto && chequeEmitido.estado === "EMITIDO") {
          await tx.movimientoSinFactura.create({
            data: {
              cuentaId: chequeEmitido.cuentaId,
              tipo: "EGRESO",
              categoria: "MANTENIMIENTO_CUENTA",
              monto: costoBancarioMonto,
              fecha: new Date(),
              descripcion: "Costo bancario por cheque rechazado",
              operadorId,
            },
          })
        }
      })

      return NextResponse.json({ ok: true, impactosAplicados })
    }

    // Verificar recibido
    const chequeRecibido = await prisma.chequeRecibido.findUnique({
      where: { id },
      select: {
        id: true,
        estado: true,
        pagosFletero: {
          where: { anulado: false },
          select: { id: true, liquidacionId: true },
        },
        pagosProveedor: {
          where: { anulado: false },
          select: { id: true, facturaProveedorId: true },
        },
      },
    })

    if (chequeRecibido) {
      if (chequeRecibido.estado === "RECHAZADO") {
        return NextResponse.json({ error: "El cheque ya está rechazado" }, { status: 409 })
      }

      let impactosAplicados = 0

      await prisma.$transaction(async (tx) => {
        // 1. Marcar cheque RECHAZADO
        await tx.chequeRecibido.update({ where: { id }, data: { estado: "RECHAZADO" } })

        // 2. Anular PagoAFletero vinculados
        const liqIds = new Set<string>()
        for (const pago of chequeRecibido.pagosFletero) {
          await tx.pagoAFletero.update({
            where: { id: pago.id },
            data: { anulado: true, motivoAnulacion },
          })
          if (pago.liquidacionId) liqIds.add(pago.liquidacionId)
          impactosAplicados++
        }

        // 3. Anular PagoProveedor vinculados
        const factIds = new Set<string>()
        for (const pago of chequeRecibido.pagosProveedor) {
          await tx.pagoProveedor.update({
            where: { id: pago.id },
            data: { anulado: true, motivoAnulacion },
          })
          factIds.add(pago.facturaProveedorId)
          impactosAplicados++
        }

        // 4. Recalcular estados
        for (const liqId of Array.from(liqIds)) {
          await recalcularEstadoLiquidacion(liqId, tx)
        }
        for (const factId of Array.from(factIds)) {
          await recalcularEstadoFacturaProveedor(factId, tx)
        }
      })

      return NextResponse.json({ ok: true, impactosAplicados })
    }

    return NextResponse.json({ error: "Cheque no encontrado" }, { status: 404 })
  } catch (error) {
    console.error("[POST /api/cheques/[id]/confirmar-rechazo]", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
