/**
 * Propósito: Página de cuenta corriente de proveedores (ruta /proveedores/cuenta-corriente).
 * Server component: carga saldos de proveedores y renderiza ProveedoresCCClient.
 */

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { esRolInterno } from "@/lib/permissions"
import { ProveedoresCCClient } from "./proveedores-cc-client"
import type { Rol } from "@/types"

/**
 * ProveedoresCuentaCorrientePage: () -> Promise<JSX.Element>
 *
 * Verifica autenticación y permisos (solo roles internos).
 * Carga proveedores con sus facturas y pagos para calcular saldos.
 * Existe como entry point para el módulo de CC de proveedores.
 *
 * Ejemplos:
 * // Sesión ADMIN_TRANSMAGG → lista de proveedores con saldo a pagar
 * <ProveedoresCuentaCorrientePage />
 * // Sin sesión → redirect /login
 * <ProveedoresCuentaCorrientePage />
 */
export default async function ProveedoresCuentaCorrientePage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const rol = (session.user.rol ?? "OPERADOR_EMPRESA") as Rol
  if (!esRolInterno(rol)) redirect("/dashboard")

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

  const saldos = proveedores
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
          return {
            id: f.id,
            nroComprobante: f.nroComprobante,
            tipoCbte: f.tipoCbte,
            total: f.total,
            fechaCbte: f.fechaCbte,
            saldo: Math.max(0, f.total - pagado),
          }
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
    .filter((s) => s.totalFacturado > 0)
    .sort((a, b) => b.saldoAPagar - a.saldoAPagar)

  return <ProveedoresCCClient saldos={saldos} />
}
