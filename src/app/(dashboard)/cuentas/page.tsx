/**
 * Propósito: Página de gestión de cuentas bancarias de Transmagg.
 * Muestra la lista de cuentas activas y el detalle de cada cuenta con tabs.
 * Solo accesible para ADMIN_TRANSMAGG y OPERADOR_TRANSMAGG.
 */

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { puedeAcceder } from "@/lib/permissions"
import { CuentasClient } from "./cuentas-client"
import type { Rol } from "@/types"

/**
 * CuentasPage: ({ searchParams }) -> Promise<JSX.Element>
 *
 * Dado los query params (cuenta y tab opcionales), verifica auth y renderiza el cliente de cuentas.
 * Redirige a /login si no hay sesión, o a /dashboard si no tiene permiso.
 * Existe como entry point server-side para la sección de cuentas bancarias.
 *
 * Ejemplos:
 * // GET /cuentas (sesión ADMIN_TRANSMAGG) → lista de cuentas
 * <CuentasPage searchParams={{}} />
 * // GET /cuentas?cuenta=xxx&tab=fci → cuenta abierta en tab FCI
 * <CuentasPage searchParams={{ cuenta: "xxx", tab: "fci" }} />
 * // GET /cuentas (sesión FLETERO) → redirect /dashboard
 * <CuentasPage searchParams={{}} />
 */
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
