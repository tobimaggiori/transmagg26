/**
 * Propósito: Página de cuentas corrientes de Transmagg.
 * Muestra la deuda de empresas (facturas impagas) y la deuda a fleteros (liquidaciones sin pagar).
 * Solo accesible para ADMIN_TRANSMAGG y OPERADOR_TRANSMAGG.
 */

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { puedeAcceder } from "@/lib/permissions"
import { formatearMoneda, formatearFecha, formatearCuit } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Rol } from "@/types"

/**
 * CuentasCorrientesPage: () -> Promise<JSX.Element>
 *
 * Muestra dos secciones: deuda de empresas (ordenada por mayor saldo) y
 * deuda a fleteros (ordenada por mayor adeudado), con detalle de comprobantes.
 * Solo accesible para roles internos; redirige a /dashboard si no tiene permiso.
 * Existe para que los operadores monitoreen en tiempo real la posición financiera
 * de cuentas por cobrar y cuentas por pagar.
 *
 * Ejemplos:
 * // Sesión ADMIN_TRANSMAGG → dos secciones con deudas
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

  // Calcular saldos de empresas
  const deudaEmpresas = empresas.map((emp) => {
    const saldoDeudor = emp.facturasEmitidas.reduce((acc, f) => {
      const pagado = f.pagos.reduce((s, p) => s + p.monto, 0)
      return acc + Math.max(0, f.total - pagado)
    }, 0)
    const facturasImpagas = emp.facturasEmitidas.filter((f) => {
      const pagado = f.pagos.reduce((s, p) => s + p.monto, 0)
      return f.total - pagado > 0.01
    })
    return { empresa: emp, saldoDeudor, facturasImpagas }
  }).sort((a, b) => b.saldoDeudor - a.saldoDeudor)

  // Calcular deudas a fleteros
  const deudaFleteros = fleteros.map((flet) => {
    const saldoAPagar = flet.liquidaciones.reduce((acc, l) => {
      const pagado = l.pagos.reduce((s, p) => s + p.monto, 0)
      return acc + Math.max(0, l.total - pagado)
    }, 0)
    const liquidacionesImpagas = flet.liquidaciones.filter((l) => {
      const pagado = l.pagos.reduce((s, p) => s + p.monto, 0)
      return l.total - pagado > 0.01
    })
    return { fletero: flet, saldoAPagar, liquidacionesImpagas }
  }).sort((a, b) => b.saldoAPagar - a.saldoAPagar)

  const totalDeudaEmpresas = deudaEmpresas.reduce((acc, e) => acc + e.saldoDeudor, 0)
  const totalDeudaFleteros = deudaFleteros.reduce((acc, f) => acc + f.saldoAPagar, 0)

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Cuentas Corrientes</h2>
        <p className="text-muted-foreground">Posición financiera: cuentas por cobrar y cuentas por pagar</p>
      </div>

      {/* Resumen */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total a cobrar (Empresas)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-destructive">{formatearMoneda(totalDeudaEmpresas)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {deudaEmpresas.filter((e) => e.saldoDeudor > 0).length} empresa(s) con saldo pendiente
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total a pagar (Fleteros)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-orange-600">{formatearMoneda(totalDeudaFleteros)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {deudaFleteros.filter((f) => f.saldoAPagar > 0).length} fletero(s) con liquidaciones sin pagar
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Deuda de empresas */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Deuda de Empresas</h3>
        {deudaEmpresas.filter((e) => e.saldoDeudor > 0).length === 0 ? (
          <Card>
            <CardContent className="pt-4">
              <p className="text-muted-foreground text-center py-4">Sin deudas pendientes de empresas.</p>
            </CardContent>
          </Card>
        ) : (
          deudaEmpresas.filter((e) => e.saldoDeudor > 0).map(({ empresa, saldoDeudor, facturasImpagas }) => (
            <Card key={empresa.id}>
              <CardContent className="pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{empresa.razonSocial}</p>
                    <p className="text-sm text-muted-foreground">CUIT: {formatearCuit(empresa.cuit)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-destructive">{formatearMoneda(saldoDeudor)}</p>
                    <p className="text-xs text-muted-foreground">{facturasImpagas.length} factura(s) impaga(s)</p>
                  </div>
                </div>
                <div className="border rounded-md divide-y">
                  {facturasImpagas.map((f) => {
                    const pagado = f.pagos.reduce((s, p) => s + p.monto, 0)
                    const saldo = f.total - pagado
                    return (
                      <div key={f.id} className="flex items-center justify-between px-3 py-2 text-sm">
                        <div>
                          <span className="font-medium">Factura {f.tipoCbte}{f.nroComprobante ? " " + f.nroComprobante : ""}</span>
                          <span className="text-muted-foreground ml-2">{formatearFecha(f.emitidaEn)}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-semibold text-destructive">{formatearMoneda(saldo)}</span>
                          <span className="text-muted-foreground ml-2">/ {formatearMoneda(f.total)}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Deuda a fleteros */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Deuda a Fleteros</h3>
        {deudaFleteros.filter((f) => f.saldoAPagar > 0).length === 0 ? (
          <Card>
            <CardContent className="pt-4">
              <p className="text-muted-foreground text-center py-4">Sin deudas pendientes a fleteros.</p>
            </CardContent>
          </Card>
        ) : (
          deudaFleteros.filter((f) => f.saldoAPagar > 0).map(({ fletero, saldoAPagar, liquidacionesImpagas }) => (
            <Card key={fletero.id}>
              <CardContent className="pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{fletero.razonSocial}</p>
                    <p className="text-sm text-muted-foreground">CUIT: {formatearCuit(fletero.cuit)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-orange-600">{formatearMoneda(saldoAPagar)}</p>
                    <p className="text-xs text-muted-foreground">{liquidacionesImpagas.length} liquidación(es) impaga(s)</p>
                  </div>
                </div>
                <div className="border rounded-md divide-y">
                  {liquidacionesImpagas.map((l) => {
                    const pagado = l.pagos.reduce((s, p) => s + p.monto, 0)
                    const saldo = l.total - pagado
                    return (
                      <div key={l.id} className="flex items-center justify-between px-3 py-2 text-sm">
                        <div>
                          <span className="font-medium">Liquidación</span>
                          <span className="text-muted-foreground ml-2">{formatearFecha(l.grabadaEn)}</span>
                          <span className={`ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${l.estado === "EMITIDA" ? "bg-blue-100 text-blue-800" : "bg-yellow-100 text-yellow-800"}`}>
                            {l.estado}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-semibold text-orange-600">{formatearMoneda(saldo)}</span>
                          <span className="text-muted-foreground ml-2">/ {formatearMoneda(l.total)}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
