import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { esAdmin } from "@/lib/permissions"
import { EmpresasAbm } from "@/components/abm/empresas-abm"
import type { Rol } from "@/types"

export default async function EmpresasPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const rol = (session.user.rol ?? "OPERADOR_TRANSMAGG") as Rol
  if (!esAdmin(rol)) redirect("/dashboard")

  const empresas = await prisma.empresa.findMany({
    select: {
      id: true, razonSocial: true, cuit: true, condicionIva: true, direccion: true, padronFce: true, activa: true,
      _count: { select: { viajes: true, facturasEmitidas: true } },
      contactosEmail: {
        where: { activo: true },
        select: { id: true, email: true, nombre: true },
        orderBy: { creadoEn: "asc" },
      },
    },
    orderBy: [{ activa: "desc" }, { razonSocial: "asc" }],
  })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Empresas</h2>
        <p className="text-muted-foreground">Gestión de empresas del sistema.</p>
      </div>
      <EmpresasAbm empresas={empresas.map(e => ({
        ...e,
        puedeEliminar: e.activa && e._count.viajes === 0 && e._count.facturasEmitidas === 0,
      }))} />
    </div>
  )
}
