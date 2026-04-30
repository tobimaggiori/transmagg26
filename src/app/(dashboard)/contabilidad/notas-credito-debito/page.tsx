/**
 * Propósito: Página de Notas de Crédito y Débito (ruta /contabilidad/notas-credito-debito).
 * Reutiliza NotasCDClient — misma lógica que /notas-credito-debito.
 */

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { tienePermiso } from "@/lib/permissions"
import { NotasCDClient } from "../../notas-credito-debito/notas-cd-client"
import type { Rol } from "@/types"

/**
 * ContabilidadNotasCDPage: () -> Promise<JSX.Element>
 *
 * Verifica sesión y permisos. Renderiza NotasCDClient para la gestión de NC/ND.
 * Existe como alias de /notas-credito-debito bajo /contabilidad/notas-credito-debito.
 *
 * Ejemplos:
 * // Sesión ADMIN_TRANSMAGG → renderiza NotasCDClient
 * <ContabilidadNotasCDPage />
 * // Sin sesión → redirect /login
 * <ContabilidadNotasCDPage />
 */
export default async function ContabilidadNotasCDPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const rol = (session.user.rol ?? "OPERADOR_EMPRESA") as Rol
  if (!(await tienePermiso(session.user.id, rol, "notas_credito_debito"))) redirect("/dashboard")

  return <NotasCDClient />
}
