/**
 * Consultar Facturas JM. Listado simple con filtros básicos.
 */

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prismaJm } from "@/jm/prisma"
import { esRolInterno } from "@/lib/permissions"
import type { Rol } from "@/types"
import { ConsultarFacturasJmClient } from "./consultar-facturas-jm-client"

export default async function ConsultarFacturasJmPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (!esRolInterno(session.user.rol as Rol)) redirect("/dashboard")

  const empresas = await prismaJm.empresa.findMany({
    select: { id: true, razonSocial: true, cuit: true },
    orderBy: { razonSocial: "asc" },
  })

  return <ConsultarFacturasJmClient empresas={empresas} />
}
