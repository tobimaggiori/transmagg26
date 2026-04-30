import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { tienePermiso } from "@/lib/permissions"
import { EmpleadosAbm } from "@/components/abm/empleados-abm"
import type { Rol } from "@/types"

export default async function EmpleadosPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const rol = (session.user.rol ?? "OPERADOR_TRANSMAGG") as Rol
  if (!(await tienePermiso(session.user.id, rol, "abm.empleados"))) redirect("/dashboard")

  const empleados = await prisma.empleado.findMany({
    orderBy: [{ activo: "desc" }, { apellido: "asc" }],
    select: { id: true, nombre: true, apellido: true, cuit: true, cargo: true, fechaIngreso: true, activo: true },
  })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Empleados</h2>
        <p className="text-muted-foreground">Gestión de empleados del sistema.</p>
      </div>
      <EmpleadosAbm empleados={empleados.map(e => ({ ...e, fechaIngreso: e.fechaIngreso.toISOString() }))} />
    </div>
  )
}
