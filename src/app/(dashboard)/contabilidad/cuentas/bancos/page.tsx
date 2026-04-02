/**
 * Propósito: Página de cuentas bancarias — muestra árbol de bancos con sub-cuentas por moneda.
 * Solo accesible para ADMIN_TRANSMAGG y OPERADOR_TRANSMAGG.
 */

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { puedeAcceder } from "@/lib/permissions"
import { BancosClient } from "./bancos-client"
import type { Rol } from "@/types"

export default async function BancosPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const rol = (session.user.rol ?? "OPERADOR_TRANSMAGG") as Rol
  if (!puedeAcceder(rol, "cuentas")) redirect("/dashboard")

  return <BancosClient />
}
