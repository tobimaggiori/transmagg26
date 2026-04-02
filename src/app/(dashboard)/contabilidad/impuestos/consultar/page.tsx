import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { puedeAcceder } from "@/lib/permissions"
import { ConsultarPagosImpuestoClient } from "./consultar-pagos-impuesto-client"
import type { Rol } from "@/types"

export default async function ConsultarImpuestosPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (!puedeAcceder(session.user.rol as Rol, "cuentas")) redirect("/dashboard")

  return <ConsultarPagosImpuestoClient />
}
