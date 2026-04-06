/**
 * Página de Comprobantes R2 — gestión de archivos PDF almacenados en Cloudflare R2.
 */

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { puedeAcceder, tienePermiso } from "@/lib/permissions"
import type { Rol } from "@/types"
import { ComprobantesClient } from "./comprobantes-client"

export default async function ComprobantesPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const rol = (session.user.rol ?? "OPERADOR_TRANSMAGG") as Rol
  if (!puedeAcceder(rol, "cuentas")) redirect("/dashboard")

  const tieneAcceso = await tienePermiso(session.user.id, rol, "contabilidad.comprobantes")
  if (!tieneAcceso) redirect("/dashboard")

  const puedeEliminar = await tienePermiso(session.user.id, rol, "contabilidad.comprobantes_eliminar")

  return <ComprobantesClient puedeEliminar={puedeEliminar} />
}
