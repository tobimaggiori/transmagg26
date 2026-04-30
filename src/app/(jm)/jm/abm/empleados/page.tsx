import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prismaJm } from "@/jm/prisma"
import { esRolInterno } from "@/lib/permissions"
import type { Rol } from "@/types"
import { EmpleadosAbmJm, type EmpleadoJmAbm } from "@/jm/components/empleados-abm"

export default async function EmpleadosAbmJmPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (!esRolInterno(session.user.rol as Rol)) redirect("/dashboard")

  const empleados = await prismaJm.empleado.findMany({ orderBy: [{ activo: "desc" }, { apellido: "asc" }] })
  const empleadosAbm: EmpleadoJmAbm[] = empleados.map((e) => ({
    id: e.id,
    nombre: e.nombre,
    apellido: e.apellido,
    cuit: e.cuit,
    cargo: e.cargo,
    email: e.email,
    fechaIngreso: e.fechaIngreso.toISOString(),
    activo: e.activo,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Empleados</h2>
        <p className="text-muted-foreground">Gestión de empleados del sistema.</p>
      </div>
      <EmpleadosAbmJm empleados={empleadosAbm} />
    </div>
  )
}
