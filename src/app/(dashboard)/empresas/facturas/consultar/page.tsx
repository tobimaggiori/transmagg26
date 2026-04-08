/**
 * Propósito: Página de consulta del historial de facturas a empresas (/empresas/facturas/consultar).
 * Server wrapper: verifica auth y permisos, carga empresas.
 */

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { puedeAcceder } from "@/lib/permissions"
import { ConsultarFacturasClient } from "../consultar-facturas-client"
import type { Rol } from "@/types"

export default async function EmpresasFacturasConsultarPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const rol = (session.user.rol ?? "OPERADOR_EMPRESA") as Rol
  if (!puedeAcceder(rol, "facturas")) redirect("/dashboard")

  const empresas = await prisma.empresa.findMany({
    where: { activa: true },
    select: { id: true, razonSocial: true, cuit: true },
    orderBy: { razonSocial: "asc" },
  })

  return <ConsultarFacturasClient empresas={empresas} />
}
