/**
 * Redirige a /abm — la gestión de camiones fue consolidada en el módulo ABM (tab fleteros).
 */

import { redirect } from "next/navigation"

export default function CamionesPage() {
  redirect("/abm?tab=fleteros")
}
