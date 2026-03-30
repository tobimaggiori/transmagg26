/**
 * Redirige a /abm — la administración de usuarios fue consolidada en el módulo ABM.
 */

import { redirect } from "next/navigation"

export default function AdminPage() {
  redirect("/abm?tab=usuarios")
}
