/**
 * API Route: GET /api/cuentas-corrientes/empresas
 * Devuelve la deuda de cada empresa (facturas emitidas menos pagos recibidos).
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
 * Devuelve todas las empresas con saldo deudor calculado como
 * suma(facturas.total) - suma(pagos.monto) + ajuste por NC/ND emitidas:
 *   - NC_EMITIDA reduce la deuda (crédito a favor de la empresa)
 *   - ND_EMITIDA aumenta la deuda (cargo adicional a la empresa)
 *   - ND_RECIBIDA aumenta la deuda (revertir pago rechazado — cheque rechazado)
 * Se incluyen todas las NC/ND (los documentos son inmutables).
 * Ordenadas por saldo desc.
 * Existe para el módulo de cuentas corrientes donde el operador
 * monitorea qué empresas tienen deuda pendiente con Transmagg,
 * reflejando el impacto real de las NC/ND emitidas y recibidas.
 *
 * Ejemplos:
 * GET /api/cuentas-corrientes/empresas (sesión ADMIN_TRANSMAGG)
 * // => 200 [{ empresa: { id, razonSocial }, saldoDeudor: 150000, facturasImpagas: [...], ajusteNotasCD: -5000 }]
 * GET /api/cuentas-corrientes/empresas (sesión FLETERO)
 * // => 403 { error: "Acceso denegado" }
 * GET /api/cuentas-corrientes/empresas (sin sesión)
 * // => 401 { error: "No autorizado" }
 */
export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const rol = session.user.rol as Rol
  if (!esRolInterno(rol)) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  const [empresas, notasCD] = await Promise.all([
    prisma.empresa.findMany({
      where: { activa: true },
      include: {
        facturasEmitidas: {
          include: {
            pagos: { select: { monto: true } },
          },
          orderBy: { emitidaEn: "desc" },
        },
      },
      orderBy: { razonSocial: "asc" },
    }),
    prisma.notaCreditoDebito.findMany({
      where: {
        tipo: { in: ["NC_EMITIDA", "ND_EMITIDA", "ND_RECIBIDA"] },
        facturaId: { not: null },
      },
      include: {
        factura: { select: { empresaId: true } },
      },
    }),
  ])

  // Agrupar ajustes NC/ND por empresa
  const ajustesPorEmpresa = new Map<string, number>()
  for (const nota of notasCD) {
    const empresaId = nota.factura?.empresaId
    if (!empresaId) continue
    const actual = ajustesPorEmpresa.get(empresaId) ?? 0
    if (nota.tipo === "NC_EMITIDA") {
      // NC reduce deuda (empresa debe menos)
      ajustesPorEmpresa.set(empresaId, restarImportes(actual, nota.montoTotal))
    } else if (nota.tipo === "ND_EMITIDA" || nota.tipo === "ND_RECIBIDA") {
      // ND aumenta deuda (empresa debe más)
      ajustesPorEmpresa.set(empresaId, sumarImportes([actual, nota.montoTotal]))
    }
  }

  const resultado = empresas.map((emp) => {
    const facturasConSaldo = emp.facturasEmitidas.map((f) => {
      const pagado = sumarImportes(f.pagos.map(p => p.monto))
      const saldo = maxMonetario(0, restarImportes(f.total, pagado))
      return {
        id: f.id,
        nroComprobante: f.nroComprobante,
        tipoCbte: f.tipoCbte,
        total: f.total,
        ivaMonto: f.ivaMonto,
        estado: f.estado,
        emitidaEn: f.emitidaEn,
        saldo,
      }
    })

    const facturasImpagas = facturasConSaldo.filter((f) => f.saldo > 0)
    const saldoBaseFacturas = sumarImportes(facturasImpagas.map(f => f.saldo))
    const ajusteNotasCD = ajustesPorEmpresa.get(emp.id) ?? 0
    const saldoDeudor = maxMonetario(0, sumarImportes([saldoBaseFacturas, ajusteNotasCD]))

    return {
      empresa: { id: emp.id, razonSocial: emp.razonSocial, cuit: emp.cuit },
      saldoDeudor,
      facturasImpagas,
      ajusteNotasCD,
      totalFacturado: sumarImportes(emp.facturasEmitidas.map(f => f.total)),
    }
  }).sort((a, b) => b.saldoDeudor - a.saldoDeudor)

  return NextResponse.json(resultado)
}

/**
 * POST: NextRequest -> Promise<NextResponse>
 *
 * Dado [un body con empresaId, monto, tipo, referencia y fecha], registra un pago de empresa
 * distribuyendo el monto contra las facturas impagas más antiguas.
 * Existe para permitir registrar pagos desde /pagos y /cuentas-corrientes.
 *
 * Ejemplos:
 * POST({ empresaId, monto: 50000, tipo: "TRANSFERENCIA" }) === 201 [{ id, facturaId, monto }]
 * POST({ empresaId: "invalido", monto: 50000 }) === 404 { error: "Empresa no encontrada" }
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
    const { empresaId, monto, tipo, referencia, fecha } = body

    if (!empresaId || !monto || !tipo || !fecha) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })
    }

    const empresa = await prisma.empresa.findUnique({ where: { id: empresaId } })
    if (!empresa) return NextResponse.json({ error: "Empresa no encontrada" }, { status: 404 })

    // Distribuir pago contra facturas impagas (FIFO)
    const facturas = await prisma.facturaEmitida.findMany({
      where: { empresaId },
      include: { pagos: { select: { monto: true } } },
      orderBy: { emitidaEn: "asc" },
    })

    let montoRestante = parsearImporte(String(monto))
    const pagosCreados = []

    for (const f of facturas) {
      if (montoRestante <= 0) break
      const pagado = sumarImportes(f.pagos.map(p => p.monto))
      const saldo = restarImportes(f.total, pagado)
      if (saldo <= 0) continue

      const montoAplicar = m(Math.min(montoRestante, saldo))
      const pago = await prisma.pagoDeEmpresa.create({
        data: {
          empresaId,
          facturaId: f.id,
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
    console.error("[POST /api/cuentas-corrientes/empresas]", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
