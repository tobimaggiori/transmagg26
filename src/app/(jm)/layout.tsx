/**
 * Layout del sistema "Javier Maggiori".
 * Solo accesible para roles internos de Transmagg (ADMIN_TRANSMAGG, OPERADOR_TRANSMAGG).
 */

import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { esRolInterno } from "@/lib/permissions"
import { JmShell } from "@/jm/components/jm-shell"
import "@/jm/theme.css"
import type { Rol } from "@/types"

export default async function JmLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const rol = (session.user.rol ?? "") as Rol
  if (!esRolInterno(rol)) redirect("/dashboard")

  return (
    <JmShell
      nombreUsuario={session.user.name ?? undefined}
      emailUsuario={session.user.email ?? undefined}
    >
      {children}
    </JmShell>
  )
}
