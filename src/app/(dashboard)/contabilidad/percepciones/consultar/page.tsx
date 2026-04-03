import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { puedeAcceder } from "@/lib/permissions"
import { ConsultarLibrosPercepcionesClient } from "./consultar-libros-percepciones-client"
import type { Rol } from "@/types"

export default async function ConsultarPercepcionesPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const rol = (session.user.rol ?? "OPERADOR_EMPRESA") as Rol
  const esAdmin = rol === "ADMIN_TRANSMAGG"
  const esRolInterno = rol === "ADMIN_TRANSMAGG" || rol === "OPERADOR_TRANSMAGG"
  if (!(esAdmin || (esRolInterno && puedeAcceder(rol, "cuentas")))) redirect("/dashboard")

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Libros de Percepciones Generados</h2>
        <p className="text-muted-foreground">
          Consultá los libros de percepciones generados anteriormente.
        </p>
      </div>
      <ConsultarLibrosPercepcionesClient />
    </div>
  )
}
