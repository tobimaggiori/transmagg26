/**
 * Consultar facturas de seguro JM.
 */

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prismaJm } from "@/jm/prisma"
import { esRolInterno } from "@/lib/permissions"
import type { Rol } from "@/types"
import { ConsultarFacturasSeguroJmClient } from "./consultar-facturas-seguro-jm-client"

export default async function ConsultarFacturasSeguroJmPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (!esRolInterno(session.user.rol as Rol)) redirect("/dashboard")

  const aseguradoras = await prismaJm.proveedor.findMany({
    where: { activo: true, tipo: "ASEGURADORA" },
    select: { id: true, razonSocial: true, cuit: true },
    orderBy: { razonSocial: "asc" },
  })

  return <ConsultarFacturasSeguroJmClient aseguradoras={aseguradoras} />
}
