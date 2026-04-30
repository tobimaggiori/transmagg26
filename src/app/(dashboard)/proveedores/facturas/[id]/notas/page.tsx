/**
 * Página de NC/ND recibidas sobre una factura de proveedor
 * (/proveedores/facturas/[id]/notas).
 */

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { esRolInterno } from "@/lib/permissions"
import { NotasFacturaProveedorClient } from "./notas-factura-proveedor-client"
import type { Rol } from "@/types"

export default async function NotasFacturaProveedorPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const rol = (session.user.rol ?? "OPERADOR_EMPRESA") as Rol
  if (!esRolInterno(rol)) redirect("/dashboard")

  const { id } = await params

  return <NotasFacturaProveedorClient facturaProveedorId={id} />
}
