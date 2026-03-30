/**
 * Propósito: Página de operatoria de proveedores de Transmagg.
 * Lista los proveedores en formato lista con buscador y permite ingresar facturas.
 * Para crear/modificar/eliminar proveedores: ir a /abm?tab=proveedores (solo ADMIN).
 * Solo accesible para ADMIN_TRANSMAGG y OPERADOR_TRANSMAGG.
 */

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { puedeAcceder } from "@/lib/permissions"
import type { Rol } from "@/types"
import { ProveedoresClient } from "@/components/proveedores-client"

/**
 * ProveedoresPage: () -> Promise<JSX.Element>
 *
 * Lista los proveedores activos con su deuda pendiente y botón "Ingresar factura".
 * No incluye botones de crear/editar/eliminar (operación solo en ABM).
 * Existe para la carga de facturas de proveedores en la operatoria diaria.
 *
 * Ejemplos:
 * // Sesión ADMIN_TRANSMAGG → lista de proveedores + buscador + "Ingresar factura"
 * <ProveedoresPage />
 * // Sesión FLETERO → redirect /dashboard
 * <ProveedoresPage />
 * // Sin sesión → redirect /login
 * <ProveedoresPage />
 */
export default async function ProveedoresPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const rol = (session.user.rol ?? "OPERADOR_EMPRESA") as Rol
  if (!puedeAcceder(rol, "proveedores")) redirect("/dashboard")

  const proveedores = await prisma.proveedor.findMany({
    where: { activo: true },
    include: {
      facturas: {
        include: { pagos: { select: { monto: true } } },
      },
      _count: { select: { facturas: true } },
    },
    orderBy: { razonSocial: "asc" },
  })

  const proveedoresConDeuda = proveedores.map((p) => {
    const deudaTotal = p.facturas.reduce((acc, f) => {
      const pagado = f.pagos.reduce((s, pago) => s + pago.monto, 0)
      return acc + Math.max(0, f.total - pagado)
    }, 0)
    return {
      id: p.id,
      razonSocial: p.razonSocial,
      cuit: p.cuit,
      condicionIva: p.condicionIva,
      rubro: p.rubro,
      cantFacturas: p._count.facturas,
      deudaTotal,
    }
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Proveedores</h2>
          <p className="text-muted-foreground">
            Cargá facturas de proveedores. Para gestionar el ABM ir a{" "}
            <a href="/abm?tab=proveedores" className="text-primary underline underline-offset-2">ABM → Proveedores</a>.
          </p>
        </div>
        <span className="text-sm text-muted-foreground">{proveedoresConDeuda.length} proveedor(es)</span>
      </div>

      <ProveedoresClient proveedores={proveedoresConDeuda} />
    </div>
  )
}
