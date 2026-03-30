/**
 * Redirige a /abm — la gestión de empresas fue consolidada en el módulo ABM.
 */

import { redirect } from "next/navigation"

export default function EmpresasPage() {
  redirect("/abm?tab=empresas")
}
