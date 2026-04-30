import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { tienePermiso } from "@/lib/permissions"
import { ConsultarPagosImpuestoClient } from "./consultar-pagos-impuesto-client"
import type { Rol } from "@/types"

export default async function ConsultarImpuestosPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (!(await tienePermiso(session.user.id, session.user.rol as Rol, "cuentas"))) redirect("/dashboard")

  return <ConsultarPagosImpuestoClient />
}
