/**
 * Cuentas Corrientes Empresas JM. Clon de /empresas/cuentas-corrientes.
 */

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prismaJm } from "@/jm/prisma"
import { esRolInterno } from "@/lib/permissions"
import type { Rol } from "@/types"
import { CCEmpresasJmClient } from "@/jm/components/cc-empresas-client"

export default async function CCEmpresasJmPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (!esRolInterno(session.user.rol as Rol)) redirect("/dashboard")

  const empresas = await prismaJm.empresa.findMany({
    where: { activa: true },
    select: { id: true, razonSocial: true, cuit: true },
    orderBy: { razonSocial: "asc" },
  })

  return <CCEmpresasJmClient empresas={empresas} />
}
