/**
 * API Route: GET/POST /api/cuentas-corrientes/proveedores
 * GET: Devuelve la deuda de Transmagg hacia cada proveedor (facturas menos pagos).
 * POST: Registra un pago a proveedor distribuyendo FIFO contra facturas impagas.
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
 * Devuelve todos los proveedores con saldo a pagar calculado como
 * suma(facturas.total) - suma(pagos.monto).
 * Solo se incluyen proveedores con facturas. Ordenados por saldoAPagar desc.
 * Existe para el módulo de cuentas corrientes de proveedores.
 *
 * Ejemplos:
 * GET /api/cuentas-corrientes/proveedores (sesión ADMIN_TRANSMAGG)
 * // => 200 [{ proveedor: { id, razonSocial }, saldoAPagar, facturasImpagas }]
 * GET /api/cuentas-corrientes/proveedores (sesión FLETERO)
 * // => 403 { error: "Acceso denegado" }
 */
export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const rol = session.user.rol as Rol
  if (!esRolInterno(rol)) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  // Supress unused variable warning
  void request

  try {
    const proveedores = await prisma.proveedor.findMany({
      where: { activo: true },
      include: {
        facturas: {
          include: { pagos: { select: { monto: true } } },
          orderBy: { fechaCbte: "asc" },
        },
      },
      orderBy: { razonSocial: "asc" },
    })

    const resultado = proveedores
      .map((prov) => {
        const totalFacturado = prov.facturas.reduce((acc, f) => acc + f.total, 0)
        const totalPagado = prov.facturas.reduce(
          (acc, f) => acc + f.pagos.reduce((s, p) => s + p.monto, 0),
          0
        )
        const saldoAPagar = Math.max(0, totalFacturado - totalPagado)

        const facturasImpagas = prov.facturas
          .map((f) => {
            const pagado = f.pagos.reduce((s, p) => s + p.monto, 0)
            return { ...f, saldo: Math.max(0, f.total - pagado) }
          })
          .filter((f) => f.saldo > 0.01)

        return {
          proveedor: { id: prov.id, razonSocial: prov.razonSocial, cuit: prov.cuit },
          saldoAPagar,
          totalFacturado,
          totalPagado,
          facturasImpagas,
        }
      })
      .filter((p) => p.totalFacturado > 0)
      .sort((a, b) => b.saldoAPagar - a.saldoAPagar)

    return NextResponse.json(resultado)
  } catch (error) {
    console.error("[GET /api/cuentas-corrientes/proveedores]", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

/**
 * POST: NextRequest -> Promise<NextResponse>
 *
 * Dado un body con { proveedorId, monto, tipo, referencia?, fecha },
 * registra un pago a proveedor distribuyendo FIFO contra facturas impagas.
 * Existe para registrar pagos desde /proveedores/cuenta-corriente.
 *
 * Ejemplos:
 * POST({ proveedorId, monto: 50000, tipo: "TRANSFERENCIA", fecha: "2026-03-31" }) === 201 [{ id, facturaProveedorId, monto }]
 * POST({ proveedorId: "invalido" }) === 404 { error: "Proveedor no encontrado" }
 */
export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const rol = session.user.rol as Rol
  if (!esRolInterno(rol)) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  try {
    const body = await request.json()
    const { proveedorId, monto, tipo, referencia, fecha } = body as {
      proveedorId?: string
      monto?: number
      tipo?: string
      referencia?: string
      fecha?: string
    }

    if (!proveedorId || !monto || !tipo || !fecha) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })
    }

    const proveedor = await prisma.proveedor.findUnique({ where: { id: proveedorId } })
    if (!proveedor) return NextResponse.json({ error: "Proveedor no encontrado" }, { status: 404 })

    // Distribuir pago contra facturas impagas (FIFO por fechaCbte)
    const facturas = await prisma.facturaProveedor.findMany({
      where: { proveedorId },
      include: { pagos: { select: { monto: true } } },
      orderBy: { fechaCbte: "asc" },
    })

    let montoRestante = parseFloat(String(monto))
    const pagosCreados: { id: string; facturaProveedorId: string; monto: number }[] = []

    for (const f of facturas) {
      if (montoRestante <= 0) break
      const pagado = f.pagos.reduce((acc, p) => acc + p.monto, 0)
      const saldo = f.total - pagado
      if (saldo <= 0) continue

      const montoAplicar = Math.min(montoRestante, saldo)
      const pago = await prisma.pagoAProveedor.create({
        data: {
          facturaProveedorId: f.id,
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
    console.error("[POST /api/cuentas-corrientes/proveedores]", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
