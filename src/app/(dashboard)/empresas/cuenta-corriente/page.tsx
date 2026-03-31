/**
 * Propósito: Página de cuenta corriente de empresas (ruta /empresas/cuenta-corriente).
 * Reutiliza CuentasCorrientesClient — misma lógica que /cuentas-corrientes.
 */

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { puedeAcceder } from "@/lib/permissions"
import { CuentasCorrientesClient } from "../../cuentas-corrientes/cuentas-corrientes-client"
import type { Rol } from "@/types"

/**
 * EmpresasCuentaCorrientePage: () -> Promise<JSX.Element>
 *
 * Obtiene los datos de deudas de empresas y fleteros y los pasa al componente client.
 * Solo accesible para roles internos; redirige a /dashboard si no tiene permiso.
 * Existe como alias de /cuentas-corrientes bajo la ruta /empresas/cuenta-corriente.
 *
 * Ejemplos:
 * // Sesión ADMIN_TRANSMAGG → CuentasCorrientesClient con datos
 * <EmpresasCuentaCorrientePage />
 * // Sin sesión → redirect /login
 * <EmpresasCuentaCorrientePage />
 */
export default async function EmpresasCuentaCorrientePage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const rol = (session.user.rol ?? "OPERADOR_EMPRESA") as Rol
  if (!puedeAcceder(rol, "cuentas_corrientes")) redirect("/dashboard")

  const [empresas, fleteros] = await Promise.all([
    prisma.empresa.findMany({
      where: { activa: true },
      include: {
        facturasEmitidas: {
          where: { estado: { not: "ANULADA" } },
          include: { pagos: { select: { monto: true } } },
          orderBy: { emitidaEn: "desc" },
        },
      },
    }),
    prisma.fletero.findMany({
      where: { activo: true },
      include: {
        liquidaciones: {
          where: { estado: { in: ["EMITIDA", "BORRADOR"] } },
          include: { pagos: { select: { monto: true } } },
          orderBy: { grabadaEn: "desc" },
        },
      },
    }),
  ])

  const deudaEmpresas = empresas.map((emp) => {
    const saldoDeudor = emp.facturasEmitidas.reduce((acc, f) => {
      const pagado = f.pagos.reduce((s, p) => s + p.monto, 0)
      return acc + Math.max(0, f.total - pagado)
    }, 0)
    const facturasImpagas = emp.facturasEmitidas
      .filter((f) => {
        const pagado = f.pagos.reduce((s, p) => s + p.monto, 0)
        return f.total - pagado > 0.01
      })
      .map((f) => {
        const pagado = f.pagos.reduce((s, p) => s + p.monto, 0)
        return { ...f, saldo: f.total - pagado, emitidaEn: f.emitidaEn }
      })
    return { empresa: { id: emp.id, razonSocial: emp.razonSocial, cuit: emp.cuit }, saldoDeudor, facturasImpagas, totalFacturado: emp.facturasEmitidas.reduce((acc, f) => acc + f.total, 0) }
  }).sort((a, b) => b.saldoDeudor - a.saldoDeudor)

  const deudaFleteros = fleteros.map((flet) => {
    const saldoAPagar = flet.liquidaciones.reduce((acc, l) => {
      const pagado = l.pagos.reduce((s, p) => s + p.monto, 0)
      return acc + Math.max(0, l.total - pagado)
    }, 0)
    const liquidacionesImpagas = flet.liquidaciones
      .filter((l) => {
        const pagado = l.pagos.reduce((s, p) => s + p.monto, 0)
        return l.total - pagado > 0.01
      })
      .map((l) => {
        const pagado = l.pagos.reduce((s, p) => s + p.monto, 0)
        return { ...l, saldo: l.total - pagado, grabadaEn: l.grabadaEn }
      })
    return { fletero: { id: flet.id, razonSocial: flet.razonSocial, cuit: flet.cuit }, saldoAPagar, liquidacionesImpagas, totalLiquidado: flet.liquidaciones.reduce((acc, l) => acc + l.total, 0) }
  }).sort((a, b) => b.saldoAPagar - a.saldoAPagar)

  const totalDeudaEmpresas = deudaEmpresas.reduce((acc, e) => acc + e.saldoDeudor, 0)
  const totalDeudaFleteros = deudaFleteros.reduce((acc, f) => acc + f.saldoAPagar, 0)

  return (
    <CuentasCorrientesClient
      totalDeudaEmpresas={totalDeudaEmpresas}
      totalDeudaFleteros={totalDeudaFleteros}
      deudaEmpresas={deudaEmpresas}
      deudaFleteros={deudaFleteros}
    />
  )
}
