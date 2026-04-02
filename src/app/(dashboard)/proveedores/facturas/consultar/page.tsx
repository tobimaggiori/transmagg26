/**
 * Propósito: Página para consultar facturas de proveedores (ruta /proveedores/facturas/consultar).
 * Server component: carga proveedores activos y renderiza FacturasProveedorClient.
 */

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { esRolInterno } from "@/lib/permissions"
import { FacturasProveedorClient } from "../facturas-proveedor-client"
import type { Rol } from "@/types"

export default async function ConsultarFacturasProveedorPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const rol = (session.user.rol ?? "OPERADOR_EMPRESA") as Rol
  if (!esRolInterno(rol)) redirect("/dashboard")

  const proveedores = await prisma.proveedor.findMany({
    where: { activo: true },
    select: { id: true, razonSocial: true, cuit: true },
    orderBy: { razonSocial: "asc" },
  })

  return <FacturasProveedorClient proveedores={proveedores} />
}
