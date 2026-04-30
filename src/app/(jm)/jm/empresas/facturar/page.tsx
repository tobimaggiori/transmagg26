/**
 * Página servidora de Facturar JM. Carga empresas y delega al cliente.
 */

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prismaJm } from "@/jm/prisma"
import { esRolInterno } from "@/lib/permissions"
import type { Rol } from "@/types"
import { FacturarJmClient } from "./facturar-jm-client"

export default async function FacturarJmPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (!esRolInterno(session.user.rol as Rol)) redirect("/dashboard")

  const empresas = await prismaJm.empresa.findMany({
    where: { activa: true },
    select: { id: true, razonSocial: true, cuit: true, condicionIva: true, padronFce: true },
    orderBy: { razonSocial: "asc" },
  })

  return <FacturarJmClient empresas={empresas} />
}
