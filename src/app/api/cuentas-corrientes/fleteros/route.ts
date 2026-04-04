/**
 * API Route: GET /api/cuentas-corrientes/fleteros
 * Devuelve la deuda de Transmagg hacia cada fletero (liquidaciones emitidas menos pagos realizados).
 * Solo accesible para ADMIN_TRANSMAGG y OPERADOR_TRANSMAGG.
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { esRolInterno } from "@/lib/permissions"
import { resolverOperadorId } from "@/lib/session-utils"
import { sumarImportes, restarImportes, maxMonetario, parsearImporte, m } from "@/lib/money"
import type { Rol } from "@/types"

/**
 * GET: () -> Promise<NextResponse>
 *
 * Devuelve todos los fleteros con saldo a pagar calculado como
 * suma(liquidaciones.total) - suma(pagos.monto) + ajuste por NC_RECIBIDA:
 *   - NC_RECIBIDA/ANULACION_LIQUIDACION reduce lo que Transmagg debe al fletero
 *     (la liquidación anulada ya no cuenta como deuda).
 * Solo se incluyen NC/ND con estado distinto de ANULADA.
 * Ordenados por saldo desc.
 * Existe para el módulo de cuentas corrientes donde el operador
 * monitorea qué fleteros tienen cobros pendientes de Transmagg,
 * reflejando el impacto de NC recibidas que anulan liquidaciones.
 *
 * Ejemplos:
 * GET /api/cuentas-corrientes/fleteros (sesión ADMIN_TRANSMAGG)
 * // => 200 [{ fletero: { id, razonSocial }, saldoAPagar: 80000, liquidacionesImpagas: [...], ajusteNotasCD: -5000 }]
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

  const [fleteros, notasCD] = await Promise.all([
    prisma.fletero.findMany({
      where: { activo: true },
      include: {
        liquidaciones: {
          where: { estado: { in: ["EMITIDA", "BORRADOR"] } },
          include: {
            pagos: { where: { anulado: false }, select: { monto: true } },
          },
          orderBy: { grabadaEn: "desc" },
        },
      },
      orderBy: { razonSocial: "asc" },
    }),
    prisma.notaCreditoDebito.findMany({
      where: {
        estado: { not: "ANULADA" },
        tipo: "NC_RECIBIDA",
        liquidacionId: { not: null },
      },
      include: {
        liquidacion: { select: { fleteroId: true } },
      },
    }),
  ])

  // Agrupar ajustes NC_RECIBIDA por fletero
  const ajustesPorFletero = new Map<string, number>()
  for (const nota of notasCD) {
    const fleteroId = nota.liquidacion?.fleteroId
    if (!fleteroId) continue
    const actual = ajustesPorFletero.get(fleteroId) ?? 0
    // NC_RECIBIDA reduce lo que Transmagg le debe al fletero
    ajustesPorFletero.set(fleteroId, restarImportes(actual, nota.montoTotal))
  }

  const resultado = fleteros.map((flet) => {
    const liquidacionesConSaldo = flet.liquidaciones.map((liq) => {
      const pagado = sumarImportes(liq.pagos.map(p => p.monto))
      const saldo = maxMonetario(0, restarImportes(liq.total, pagado))
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
    const saldoBaseLiquidaciones = sumarImportes(liquidacionesImpagas.map(l => l.saldo))
    const ajusteNotasCD = ajustesPorFletero.get(flet.id) ?? 0
    const saldoAPagar = maxMonetario(0, sumarImportes([saldoBaseLiquidaciones, ajusteNotasCD]))

    return {
      fletero: { id: flet.id, razonSocial: flet.razonSocial, cuit: flet.cuit },
      saldoAPagar,
      liquidacionesImpagas,
      ajusteNotasCD,
      totalLiquidado: sumarImportes(flet.liquidaciones.map(l => l.total)),
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

  let operadorId: string
  try {
    operadorId = await resolverOperadorId(session.user)
  } catch {
    return NextResponse.json({ error: "Sesión inválida. Cerrá sesión y volvé a ingresar." }, { status: 401 })
  }

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
      include: { pagos: { where: { anulado: false }, select: { monto: true } } },
      orderBy: { grabadaEn: "asc" },
    })

    let montoRestante = parsearImporte(String(monto))
    const pagosCreados = []

    for (const l of liquidaciones) {
      if (montoRestante <= 0) break
      const pagado = sumarImportes(l.pagos.map(p => p.monto))
      const saldo = restarImportes(l.total, pagado)
      if (saldo <= 0) continue

      const montoAplicar = m(Math.min(montoRestante, saldo))
      const pago = await prisma.pagoAFletero.create({
        data: {
          fleteroId,
          liquidacionId: l.id,
          tipoPago: tipo,
          monto: montoAplicar,
          referencia: referencia ?? null,
          fechaPago: new Date(fecha),
          operadorId,
        },
      })
      pagosCreados.push(pago)
      montoRestante = restarImportes(montoRestante, montoAplicar)
    }

    return NextResponse.json(pagosCreados, { status: 201 })
  } catch (error) {
    console.error("[POST /api/cuentas-corrientes/fleteros]", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
