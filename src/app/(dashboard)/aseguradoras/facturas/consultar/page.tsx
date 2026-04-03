/**
 * Propósito: Página de consulta de facturas de seguro (/aseguradoras/facturas/consultar).
 * Server component: carga proveedores para filtros y renderiza el cliente.
 */

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { puedeAcceder } from "@/lib/permissions"
import { ConsultarFacturasSeguroClient } from "./consultar-facturas-seguro-client"
import type { Rol } from "@/types"

export default async function ConsultarFacturasSeguroPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const rol = (session.user.rol ?? "OPERADOR_TRANSMAGG") as Rol
  if (!puedeAcceder(rol, "aseguradoras")) redirect("/dashboard")

  const proveedores = await prisma.proveedor.findMany({
    where: { activo: true, tipo: "ASEGURADORA" },
    select: { id: true, razonSocial: true, cuit: true },
    orderBy: { razonSocial: "asc" },
  })

  return <ConsultarFacturasSeguroClient proveedores={proveedores} />
}
