/**
 * Consultar facturas de proveedor JM.
 */

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prismaJm } from "@/jm/prisma"
import { esRolInterno } from "@/lib/permissions"
import type { Rol } from "@/types"
import { ConsultarFacturasProveedorJmClient } from "./consultar-facturas-proveedor-jm-client"

export default async function ConsultarFacturasProveedorJmPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (!esRolInterno(session.user.rol as Rol)) redirect("/dashboard")

  const proveedores = await prismaJm.proveedor.findMany({
    select: { id: true, razonSocial: true, cuit: true },
    orderBy: { razonSocial: "asc" },
  })

  return <ConsultarFacturasProveedorJmClient proveedores={proveedores} />
}
