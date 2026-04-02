/**
 * Propósito: Página de cuentas broker con FCI actualizables.
 * Solo accesible para ADMIN_TRANSMAGG y OPERADOR_TRANSMAGG.
 */

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { puedeAcceder, tienePermiso } from "@/lib/permissions"
import { BrokersClient } from "./brokers-client"
import type { Rol } from "@/types"

export default async function BrokersPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const rol = (session.user.rol ?? "OPERADOR_TRANSMAGG") as Rol
  if (!puedeAcceder(rol, "cuentas")) redirect("/dashboard")

  const tieneAcceso = await tienePermiso(session.user.id, rol, "cuentas.brokers")
  if (!tieneAcceso) redirect("/dashboard")

  return <BrokersClient />
}
