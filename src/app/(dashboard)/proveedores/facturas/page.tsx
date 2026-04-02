/**
 * Propósito: Landing de Facturas de Proveedores (ruta /proveedores/facturas).
 * Muestra accesos directos para ingresar o consultar facturas.
 */

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { esRolInterno } from "@/lib/permissions"
import { ActionCard } from "@/components/ui/action-card"
import type { Rol } from "@/types"

export default async function FacturasProveedorPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const rol = (session.user.rol ?? "OPERADOR_EMPRESA") as Rol
  if (!esRolInterno(rol)) redirect("/dashboard")

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Facturas de Proveedores</h2>
        <p className="text-muted-foreground">Seleccioná una opción para continuar</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
        <ActionCard
          title="INGRESAR"
          subtitle="FACTURA"
          href="/proveedores/factura"
        />
        <ActionCard
          title="CONSULTAR"
          subtitle="FACTURAS"
          href="/proveedores/facturas/consultar"
        />
      </div>
    </div>
  )
}
