/**
 * Propósito: Página de cuentas bancarias (ruta /contabilidad/cuentas).
 * Reutiliza CuentasClient — misma lógica que /cuentas.
 */

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { puedeAcceder } from "@/lib/permissions"
import { CuentasClient } from "../../cuentas/cuentas-client"
import type { Rol } from "@/types"

/**
 * ContabilidadCuentasPage: ({ searchParams }) -> Promise<JSX.Element>
 *
 * Verifica auth y renderiza CuentasClient con los searchParams.
 * Existe como alias de /cuentas bajo la ruta /contabilidad/cuentas.
 *
 * Ejemplos:
 * // Sesión ADMIN_TRANSMAGG → lista de cuentas bancarias
 * <ContabilidadCuentasPage searchParams={{}} />
 * // Sin sesión → redirect /login
 * <ContabilidadCuentasPage searchParams={{}} />
 */
export default async function ContabilidadCuentasPage({
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
      esAdmin={rol === "ADMIN_TRANSMAGG"}
    />
  )
}
