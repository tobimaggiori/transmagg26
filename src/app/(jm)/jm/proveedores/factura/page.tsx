/**
 * Ingresar factura de proveedor JM.
 */

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prismaJm } from "@/jm/prisma"
import { esRolInterno } from "@/lib/permissions"
import type { Rol } from "@/types"
import { IngresarFacturaProveedorJmClient } from "./ingresar-factura-proveedor-jm-client"

export default async function IngresarFacturaProveedorJmPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (!esRolInterno(session.user.rol as Rol)) redirect("/dashboard")

  const proveedores = await prismaJm.proveedor.findMany({
    where: { activo: true },
    select: { id: true, razonSocial: true, cuit: true, condicionIva: true, tipo: true },
    orderBy: { razonSocial: "asc" },
  })

  return <IngresarFacturaProveedorJmClient proveedores={proveedores} />
}
