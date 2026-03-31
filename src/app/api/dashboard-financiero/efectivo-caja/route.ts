/**
 * API Route: GET /api/dashboard-financiero/efectivo-caja
 * Devuelve el saldo de efectivo en caja calculado dinámicamente.
 * Solo accesible para ADMIN_TRANSMAGG y OPERADOR_TRANSMAGG.
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireFinancialAccess, serverErrorResponse } from "@/lib/financial-api"

/**
 * GET: () -> Promise<NextResponse>
 *
 * Calcula el efectivo en caja como:
 *   Σ cobros EFECTIVO de empresas
 *   - Σ pagos EFECTIVO a fleteros
 *   - Σ pagos EFECTIVO a proveedores
 *
 * Existe para mostrar la tarjeta "Efectivo en caja" en el dashboard financiero.
 *
 * Ejemplos:
 * GET() === NextResponse.json({ efectivoEnCaja: 50000 })
 * GET() === NextResponse.json({ efectivoEnCaja: 0 })
 */
export async function GET() {
  const acceso = await requireFinancialAccess()
  if (!acceso.ok) return acceso.response

  try {
    const [cobrosEfectivo, pagosFleterosEfectivo, pagosProveedoresEfectivo] = await Promise.all([
      prisma.pagoDeEmpresa.aggregate({
        where: { tipoPago: "EFECTIVO" },
        _sum: { monto: true },
      }),
      prisma.pagoAFletero.aggregate({
        where: { tipoPago: "EFECTIVO" },
        _sum: { monto: true },
      }),
      prisma.pagoProveedor.aggregate({
        where: { tipo: "EFECTIVO" },
        _sum: { monto: true },
      }),
    ])

    const ingresos = cobrosEfectivo._sum.monto ?? 0
    const egresos =
      (pagosFleterosEfectivo._sum.monto ?? 0) + (pagosProveedoresEfectivo._sum.monto ?? 0)
    const efectivoEnCaja = ingresos - egresos

    return NextResponse.json({ efectivoEnCaja, ingresos, egresos })
  } catch (error) {
    return serverErrorResponse("GET /api/dashboard-financiero/efectivo-caja", error)
  }
}
