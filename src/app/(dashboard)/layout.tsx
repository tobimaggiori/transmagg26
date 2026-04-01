/**
 * Propósito: Layout del área de dashboard de Transmagg.
 * Envuelve todas las páginas del dashboard con la barra lateral de navegación.
 * Verifica que el usuario esté autenticado y obtiene su rol para el sidebar.
 */

import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Sidebar } from "@/components/sidebar"
import type { Rol } from "@/types"

/**
 * DashboardLayout: { children: ReactNode } -> Promise<JSX.Element>
 *
 * Dado el contenido de la página hija, envuelve todas las páginas del dashboard
 * con la barra lateral de navegación filtrada por el rol del usuario autenticado.
 * Redirige a /login si no hay sesión activa.
 * Existe para garantizar que todas las páginas del área privada tengan el mismo
 * layout con sidebar y que solo usuarios autenticados accedan al dashboard.
 *
 * Ejemplos:
 * // Sesión ADMIN_TRANSMAGG → layout con sidebar completo + children
 * <DashboardLayout><FleterosPage /></DashboardLayout>
 * // Sesión FLETERO → layout con sidebar reducido (solo sus secciones) + children
 * <DashboardLayout><LiquidacionesPage /></DashboardLayout>
 * // Sin sesión → redirect /login (children nunca se renderiza)
 * <DashboardLayout><AdminPage /></DashboardLayout>
 * // Sesión CHOFER empleado de Transmagg → sidebar minimalista con solo "Mi Panel"
 * <DashboardLayout><DashboardChoferPage /></DashboardLayout>
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  const rol = (session.user.rol ?? "OPERADOR_EMPRESA") as Rol
  const nombre = session.user.name ?? undefined
  const email = session.user.email ?? undefined

  // Para CHOFER: detectar si es empleado de Transmagg (tiene Empleado asociado y no tiene fleteroId)
  let esChoferTransmagg = false
  if (rol === "CHOFER") {
    const usuario = await prisma.usuario.findFirst({
      where: { email: session.user.email ?? "" },
      select: { fleteroId: true, empleado: { select: { id: true } } },
    })
    esChoferTransmagg = !!usuario?.empleado && !usuario.fleteroId
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar rol={rol} nombreUsuario={nombre} emailUsuario={email} esChoferTransmagg={esChoferTransmagg} />
      <main className="flex-1 overflow-auto">
        <div className="h-full p-6">{children}</div>
      </main>
    </div>
  )
}
