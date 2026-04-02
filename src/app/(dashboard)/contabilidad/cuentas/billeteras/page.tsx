/**
 * Propósito: Página de billeteras virtuales.
 * Solo accesible para ADMIN_TRANSMAGG y OPERADOR_TRANSMAGG.
 */

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { puedeAcceder } from "@/lib/permissions"
import { BilleterasClient } from "./billeteras-client"
import type { Rol } from "@/types"

export default async function BilleterasPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const rol = (session.user.rol ?? "OPERADOR_TRANSMAGG") as Rol
  if (!puedeAcceder(rol, "cuentas")) redirect("/dashboard")

  return <BilleterasClient />
}
