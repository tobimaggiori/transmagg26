/**
 * API Route: GET /api/cuentas-corrientes/empresas
 * Devuelve la deuda de cada empresa (facturas emitidas menos pagos recibidos).
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
 * Devuelve todas las empresas con saldo deudor calculado como
 * suma(facturas.total) - suma(pagos.monto), ordenadas por saldo desc.
 * Para cada empresa incluye el detalle de facturas impagas (estado != COBRADA).
 * Existe para el módulo de cuentas corrientes donde el operador
 * monitorea qué empresas tienen deuda pendiente con Transmagg.
 *
 * Ejemplos:
 * GET /api/cuentas-corrientes/empresas (sesión ADMIN_TRANSMAGG)
 * // => 200 [{ empresa: { id, razonSocial }, saldoDeudor: 150000, facturasImpagas: [...] }]
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

  const empresas = await prisma.empresa.findMany({
    where: { activa: true },
    include: {
      facturasEmitidas: {
        where: { estado: { not: "ANULADA" } },
        include: {
          pagos: { select: { monto: true } },
        },
        orderBy: { emitidaEn: "desc" },
      },
    },
    orderBy: { razonSocial: "asc" },
  })

  const resultado = empresas.map((emp) => {
    const facturasConSaldo = emp.facturasEmitidas.map((f) => {
      const pagado = f.pagos.reduce((acc, p) => acc + p.monto, 0)
      const saldo = Math.max(0, f.total - pagado)
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
    const saldoDeudor = facturasImpagas.reduce((acc, f) => acc + f.saldo, 0)

    return {
      empresa: { id: emp.id, razonSocial: emp.razonSocial, cuit: emp.cuit },
      saldoDeudor,
      facturasImpagas,
      totalFacturado: emp.facturasEmitidas.reduce((acc, f) => acc + f.total, 0),
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
      where: { empresaId, estado: { not: "ANULADA" } },
      include: { pagos: { select: { monto: true } } },
      orderBy: { emitidaEn: "asc" },
    })

    let montoRestante = parseFloat(String(monto))
    const pagosCreados = []

    for (const f of facturas) {
      if (montoRestante <= 0) break
      const pagado = f.pagos.reduce((acc, p) => acc + p.monto, 0)
      const saldo = f.total - pagado
      if (saldo <= 0) continue

      const montoAplicar = Math.min(montoRestante, saldo)
      const pago = await prisma.pagoDeEmpresa.create({
        data: {
          empresaId,
          facturaId: f.id,
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
    console.error("[POST /api/cuentas-corrientes/empresas]", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
