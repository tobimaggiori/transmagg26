/**
 * Cuentas Corrientes Proveedores JM.
 */

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prismaJm } from "@/jm/prisma"
import { esRolInterno } from "@/lib/permissions"
import type { Rol } from "@/types"
import { CCProveedoresJmClient } from "./cc-proveedores-jm-client"

export default async function CCProveedoresJmPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (!esRolInterno(session.user.rol as Rol)) redirect("/dashboard")

  const proveedores = await prismaJm.proveedor.findMany({
    where: { activo: true },
    select: { id: true, razonSocial: true, cuit: true },
    orderBy: { razonSocial: "asc" },
  })

  return <CCProveedoresJmClient proveedores={proveedores} />
}
