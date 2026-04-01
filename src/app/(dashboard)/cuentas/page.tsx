/**
 * Propósito: Redirige /cuentas → /contabilidad/cuentas.
 */

import { redirect } from "next/navigation"

export default function CuentasPage({
  searchParams,
}: {
  searchParams: { cuenta?: string; tab?: string }
}) {
  const params = new URLSearchParams()
  if (searchParams.cuenta) params.set("cuenta", searchParams.cuenta)
  if (searchParams.tab) params.set("tab", searchParams.tab)
  const qs = params.toString()
  redirect(`/contabilidad/cuentas${qs ? `?${qs}` : ""}`)
}
