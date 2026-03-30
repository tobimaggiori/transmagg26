/**
 * Redirige a /abm — la gestión de fleteros fue consolidada en el módulo ABM.
 */

import { redirect } from "next/navigation"

export default function FleterosPage() {
  redirect("/abm?tab=fleteros")
}
