/**
 * Página de detalle NC/ND por factura (/empresas/facturas/[id]/notas).
 * Server wrapper: verifica auth y permisos, renderiza client component.
 */

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { puedeAcceder } from "@/lib/permissions"
import { NotasFacturaClient } from "./notas-factura-client"
import type { Rol } from "@/types"

export default async function NotasFacturaPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const rol = (session.user.rol ?? "OPERADOR_EMPRESA") as Rol
  if (!puedeAcceder(rol, "facturas")) redirect("/dashboard")

  const { id } = await params

  return <NotasFacturaClient facturaId={id} />
}
