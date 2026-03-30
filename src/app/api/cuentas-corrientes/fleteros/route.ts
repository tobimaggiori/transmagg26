/**
 * API Route: GET /api/cuentas-corrientes/fleteros
 * Devuelve la deuda de Transmagg hacia cada fletero (liquidaciones emitidas menos pagos realizados).
 * Solo accesible para ADMIN_TRANSMAGG y OPERADOR_TRANSMAGG.
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { esRolInterno } from "@/lib/permissions"
import type { Rol } from "@/types"

/**
 * GET: () -> Promise<NextResponse>
 *
 * Devuelve todos los fleteros con saldo a pagar calculado como
 * suma(liquidaciones.total) - suma(pagos.monto), ordenados por saldo desc.
 * Para cada fletero incluye el detalle de liquidaciones impagas (estado != PAGADA).
 * Existe para el módulo de cuentas corrientes donde el operador
 * monitorea qué fleteros tienen cobros pendientes de Transmagg.
 *
 * Ejemplos:
 * GET /api/cuentas-corrientes/fleteros (sesión ADMIN_TRANSMAGG)
 * // => 200 [{ fletero: { id, razonSocial }, saldoAPagar: 80000, liquidacionesImpagas: [...] }]
 * GET /api/cuentas-corrientes/fleteros (sesión FLETERO)
 * // => 403 { error: "Acceso denegado" }
 * GET /api/cuentas-corrientes/fleteros (sin sesión)
 * // => 401 { error: "No autorizado" }
 */
export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const rol = session.user.rol as Rol
  if (!esRolInterno(rol)) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  const fleteros = await prisma.fletero.findMany({
    where: { activo: true },
    include: {
      liquidaciones: {
        where: { estado: { in: ["EMITIDA", "BORRADOR"] } },
        include: {
          pagos: { select: { monto: true } },
        },
        orderBy: { grabadaEn: "desc" },
      },
    },
    orderBy: { razonSocial: "asc" },
  })

  const resultado = fleteros.map((flet) => {
    const liquidacionesConSaldo = flet.liquidaciones.map((liq) => {
      const pagado = liq.pagos.reduce((acc, p) => acc + p.monto, 0)
      const saldo = Math.max(0, liq.total - pagado)
      return {
        id: liq.id,
        total: liq.total,
        neto: liq.neto,
        estado: liq.estado,
        grabadaEn: liq.grabadaEn,
        saldo,
      }
    })

    const liquidacionesImpagas = liquidacionesConSaldo.filter((l) => l.saldo > 0)
    const saldoAPagar = liquidacionesImpagas.reduce((acc, l) => acc + l.saldo, 0)

    return {
      fletero: { id: flet.id, razonSocial: flet.razonSocial, cuit: flet.cuit },
      saldoAPagar,
      liquidacionesImpagas,
      totalLiquidado: flet.liquidaciones.reduce((acc, l) => acc + l.total, 0),
    }
  }).sort((a, b) => b.saldoAPagar - a.saldoAPagar)

  return NextResponse.json(resultado)
}

/**
 * POST: NextRequest -> Promise<NextResponse>
 *
 * Dado [un body con fleteroId, monto, tipo, referencia y fecha], registra un pago a fletero
 * distribuyendo el monto contra las liquidaciones impagas más antiguas.
 * Existe para registrar pagos desde /pagos y /cuentas-corrientes.
 *
 * Ejemplos:
 * POST({ fleteroId, monto: 80000, tipo: "TRANSFERENCIA" }) === 201 [{ id, liquidacionId, monto }]
 * POST({ fleteroId: "invalido", monto: 80000 }) === 404 { error: "Fletero no encontrado" }
 * POST({ monto: -1 }) === 400 { error: "Datos inválidos" }
 */
export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const rol = session.user.rol as Rol
  if (!esRolInterno(rol)) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  try {
    const body = await request.json()
    const { fleteroId, monto, tipo, referencia, fecha } = body

    if (!fleteroId || !monto || !tipo || !fecha) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })
    }

    const fletero = await prisma.fletero.findUnique({ where: { id: fleteroId } })
    if (!fletero) return NextResponse.json({ error: "Fletero no encontrado" }, { status: 404 })

    // Distribuir pago contra liquidaciones impagas (FIFO)
    const liquidaciones = await prisma.liquidacion.findMany({
      where: { fleteroId, estado: { not: "ANULADA" } },
      include: { pagos: { select: { monto: true } } },
      orderBy: { grabadaEn: "asc" },
    })

    let montoRestante = parseFloat(String(monto))
    const pagosCreados = []

    for (const l of liquidaciones) {
      if (montoRestante <= 0) break
      const pagado = l.pagos.reduce((acc, p) => acc + p.monto, 0)
      const saldo = l.total - pagado
      if (saldo <= 0) continue

      const montoAplicar = Math.min(montoRestante, saldo)
      const pago = await prisma.pagoAFletero.create({
        data: {
          fleteroId,
          liquidacionId: l.id,
          tipoPago: tipo,
          monto: montoAplicar,
          referencia: referencia ?? null,
          fechaPago: new Date(fecha),
        },
      })
      pagosCreados.push(pago)
      montoRestante -= montoAplicar
    }

    return NextResponse.json(pagosCreados, { status: 201 })
  } catch (error) {
    console.error("[POST /api/cuentas-corrientes/fleteros]", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
