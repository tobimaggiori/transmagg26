/**
 * Propósito: Página server para consultar recibos de cobranza.
 * Carga empresas activas y renderiza ConsultarRecibosClient.
 */

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { tienePermiso } from "@/lib/permissions"
import { ConsultarRecibosClient } from "./consultar-recibos-client"
import type { Rol } from "@/types"

export default async function ConsultarRecibosPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const rol = session.user.rol as Rol
  if (!(await tienePermiso(session.user.id, rol, "facturas"))) redirect("/dashboard")

  const empresas = await prisma.empresa.findMany({
    where: { activa: true },
    select: { id: true, razonSocial: true, cuit: true },
    orderBy: { razonSocial: "asc" },
  })

  return <ConsultarRecibosClient empresas={empresas} />
}
