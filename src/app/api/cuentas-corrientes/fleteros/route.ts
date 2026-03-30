/**
 * API Route: GET /api/cuentas-corrientes/fleteros
 * Devuelve la deuda de Transmagg hacia cada fletero (liquidaciones emitidas menos pagos realizados).
 * Solo accesible para ADMIN_TRANSMAGG y OPERADOR_TRANSMAGG.
 */

import { NextResponse } from "next/server"
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
