/**
 * Redirige a /jm/abm/empresas — la gestión de empresas vive en el módulo ABM.
 */

import { redirect } from "next/navigation"

export default function EmpresasJmIndexPage() {
  redirect("/jm/abm/empresas")
}
