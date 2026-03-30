/**
 * API Route: GET /api/dashboard-financiero/deuda-empresas
 * Devuelve el desglose de deuda por empresa con detalle de facturas.
 * Solo accesible para ADMIN_TRANSMAGG y OPERADOR_TRANSMAGG.
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireFinancialAccess, serverErrorResponse } from "@/lib/financial-api"

/**
 * GET: -> Promise<NextResponse>
 *
 * Dado [ningún parámetro], devuelve [la lista de empresas con su deuda total y el detalle de facturas con saldo pendiente].
 * Esta función existe para mostrar el desglose en el modal del dashboard financiero.
 *
 * Ejemplos:
 * GET() === NextResponse.json([{ empresaId, razonSocial, totalFacturado, totalPagado, saldoDeudor, facturas }])
 * GET() === NextResponse.json([{ empresaId: "...", saldoDeudor: 150000, facturas: [{ id, total, saldo }] }])
 * GET() === NextResponse.json([])
 */
export async function GET() {
  const access = await requireFinancialAccess()
  if (!access.ok) return access.response

  try {
    const empresas = await prisma.empresa.findMany({
      where: { activa: true },
      include: {
        facturasEmitidas: {
          where: { estado: { not: "ANULADA" } },
          include: { pagos: { select: { monto: true } } }, // PagoDeEmpresa
          orderBy: { emitidaEn: "desc" },
        },
      },
      orderBy: { razonSocial: "asc" },
    })

    const resultado = empresas.map((emp) => {
      const facturas = emp.facturasEmitidas.map((f) => {
        const totalPagado = f.pagos.reduce((acc, p) => acc + p.monto, 0)
        return {
          id: f.id,
          nroComprobante: f.nroComprobante,
          total: f.total,
          totalPagado,
          saldo: Math.max(0, f.total - totalPagado),
          emitidaEn: f.emitidaEn.toISOString(),
          estado: f.estado,
        }
      })
      const totalFacturado = facturas.reduce((acc, f) => acc + f.total, 0)
      const totalPagado = facturas.reduce((acc, f) => acc + f.totalPagado, 0)
      const saldoDeudor = facturas.reduce((acc, f) => acc + f.saldo, 0)

      return {
        empresaId: emp.id,
        razonSocial: emp.razonSocial,
        cuit: emp.cuit,
        totalFacturado,
        totalPagado,
        saldoDeudor,
        facturas,
      }
    }).filter((e) => e.saldoDeudor > 0)
      .sort((a, b) => b.saldoDeudor - a.saldoDeudor)

    return NextResponse.json(resultado)
  } catch (error) {
    return serverErrorResponse("GET /api/dashboard-financiero/deuda-empresas", error)
  }
}
