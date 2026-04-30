/**
 * Propósito: Página de cuentas corrientes de Transmagg.
 * Muestra la deuda de empresas (facturas impagas) y la deuda a fleteros (liquidaciones sin pagar).
 * Solo accesible para ADMIN_TRANSMAGG y OPERADOR_TRANSMAGG.
 */

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { tienePermiso } from "@/lib/permissions"
import { CuentasCorrientesClient } from "./cuentas-corrientes-client"
import { sumarImportes, restarImportes, maxMonetario, importesIguales } from "@/lib/money"
import type { Rol } from "@/types"

/**
 * CuentasCorrientesPage: () -> Promise<JSX.Element>
 *
 * Obtiene los datos de deudas de empresas y fleteros y los pasa al componente client.
 * Solo accesible para roles internos; redirige a /dashboard si no tiene permiso.
 * Existe para servir los datos iniciales al componente client con interactividad mejorada.
 *
 * Ejemplos:
 * // Sesión ADMIN_TRANSMAGG → CuentasCorrientesClient con datos
 * <CuentasCorrientesPage />
 * // Sesión FLETERO → redirect /dashboard
 * <CuentasCorrientesPage />
 * // Sin sesión → redirect /login
 * <CuentasCorrientesPage />
 */
export default async function CuentasCorrientesPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const rol = (session.user.rol ?? "OPERADOR_EMPRESA") as Rol
  if (!(await tienePermiso(session.user.id, rol, "cuentas_corrientes"))) redirect("/dashboard")

  const [empresas, fleteros] = await Promise.all([
    prisma.empresa.findMany({
      where: { activa: true },
      include: {
        facturasEmitidas: {
          where: {},
          include: { pagos: { select: { monto: true } } },
          orderBy: { emitidaEn: "desc" },
        },
      },
    }),
    prisma.fletero.findMany({
      where: { activo: true },
      include: {
        liquidaciones: {
          where: { estado: "EMITIDA" },
          include: { pagos: { select: { monto: true } } },
          orderBy: { grabadaEn: "desc" },
        },
      },
    }),
  ])

  // Calcular saldos de empresas
  const deudaEmpresas = empresas.map((emp) => {
    const saldoDeudor = sumarImportes(emp.facturasEmitidas.map(f => {
      const pagado = sumarImportes(f.pagos.map(p => p.monto))
      return maxMonetario(0, restarImportes(f.total, pagado))
    }))
    const facturasImpagas = emp.facturasEmitidas
      .filter((f) => {
        const pagado = sumarImportes(f.pagos.map(p => p.monto))
        return !importesIguales(f.total, pagado) && f.total > pagado
      })
      .map((f) => {
        const pagado = sumarImportes(f.pagos.map(p => p.monto))
        return { ...f, saldo: restarImportes(f.total, pagado), emitidaEn: f.emitidaEn }
      })
    return { empresa: { id: emp.id, razonSocial: emp.razonSocial, cuit: emp.cuit }, saldoDeudor, facturasImpagas, totalFacturado: sumarImportes(emp.facturasEmitidas.map(f => f.total)) }
  }).sort((a, b) => b.saldoDeudor - a.saldoDeudor)

  // Calcular deudas a fleteros
  const deudaFleteros = fleteros.map((flet) => {
    const saldoAPagar = sumarImportes(flet.liquidaciones.map(l => {
      const pagado = sumarImportes(l.pagos.map(p => p.monto))
      return maxMonetario(0, restarImportes(l.total, pagado))
    }))
    const liquidacionesImpagas = flet.liquidaciones
      .filter((l) => {
        const pagado = sumarImportes(l.pagos.map(p => p.monto))
        return !importesIguales(l.total, pagado) && l.total > pagado
      })
      .map((l) => {
        const pagado = sumarImportes(l.pagos.map(p => p.monto))
        return { ...l, saldo: restarImportes(l.total, pagado), grabadaEn: l.grabadaEn }
      })
    return { fletero: { id: flet.id, razonSocial: flet.razonSocial, cuit: flet.cuit }, saldoAPagar, liquidacionesImpagas, totalLiquidado: sumarImportes(flet.liquidaciones.map(l => l.total)) }
  }).sort((a, b) => b.saldoAPagar - a.saldoAPagar)

  const totalDeudaEmpresas = sumarImportes(deudaEmpresas.map(e => e.saldoDeudor))
  const totalDeudaFleteros = sumarImportes(deudaFleteros.map(f => f.saldoAPagar))

  return (
    <CuentasCorrientesClient
      totalDeudaEmpresas={totalDeudaEmpresas}
      totalDeudaFleteros={totalDeudaFleteros}
      deudaEmpresas={deudaEmpresas}
      deudaFleteros={deudaFleteros}
    />
  )
}
