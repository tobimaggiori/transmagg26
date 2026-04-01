/**
 * Propósito: Página de chequeras (/contabilidad/chequeras).
 * Muestra dos tabs: ECheq Emitidos y Cartera de Cheques Recibidos.
 */

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { puedeAcceder } from "@/lib/permissions"
import { ChiquerasClient } from "./chequeras-client"
import type { Rol } from "@/types"

/**
 * ChiquerasPage: ({ searchParams }) -> Promise<JSX.Element>
 *
 * Verifica auth y renderiza ChiquerasClient.
 */
export default async function ChiquerasPage({
  searchParams,
}: {
  searchParams: { tab?: string }
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const rol = (session.user.rol ?? "OPERADOR_TRANSMAGG") as Rol
  if (!puedeAcceder(rol, "cuentas")) redirect("/dashboard")

  return <ChiquerasClient tabInicial={searchParams.tab} />
}
