/**
 * Propósito: Página de gestión de cuentas bancarias de Transmagg (ruta /contabilidad/cuentas).
 * Solo accesible para ADMIN_TRANSMAGG y OPERADOR_TRANSMAGG.
 */

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { puedeAcceder } from "@/lib/permissions"
import { CuentasClient } from "./cuentas-client"
import type { Rol } from "@/types"

export default async function CuentasPage({
  searchParams,
}: {
  searchParams: { cuenta?: string; tab?: string }
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const rol = (session.user.rol ?? "OPERADOR_TRANSMAGG") as Rol
  if (!puedeAcceder(rol, "cuentas")) redirect("/dashboard")

  return (
    <CuentasClient
      cuentaInicialId={searchParams.cuenta}
      tabInicial={searchParams.tab}
    />
  )
}
