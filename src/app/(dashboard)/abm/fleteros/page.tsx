import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { esAdmin } from "@/lib/permissions"
import { FleterosAbm } from "@/components/abm/fleteros-abm"
import type { Rol } from "@/types"

export default async function FleterosPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const rol = (session.user.rol ?? "OPERADOR_TRANSMAGG") as Rol
  if (!esAdmin(rol)) redirect("/dashboard")

  const fleteros = await prisma.fletero.findMany({
    include: {
      usuario: { select: { nombre: true, apellido: true, email: true } },
      camiones: {
        where: { activo: true },
        select: {
          id: true,
          patenteChasis: true,
          patenteAcoplado: true,
          tipoCamion: true,
          choferHistorial: {
            where: { hasta: null },
            select: { chofer: { select: { id: true, nombre: true, apellido: true, email: true } } },
            take: 1,
          },
        },
        orderBy: { patenteChasis: "asc" },
      },
      choferes: {
        where: { rol: "CHOFER", activo: true },
        select: { id: true, nombre: true, apellido: true, email: true },
        orderBy: [{ apellido: "asc" }, { nombre: "asc" }],
      },
      contactosEmail: {
        where: { activo: true },
        select: { id: true, email: true, nombre: true },
        orderBy: { creadoEn: "asc" },
      },
      _count: { select: { viajes: true, liquidaciones: true } },
    },
    orderBy: [{ activo: "desc" }, { razonSocial: "asc" }],
  })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Fleteros</h2>
        <p className="text-muted-foreground">Gestión de fleteros del sistema.</p>
      </div>
      <FleterosAbm fleteros={fleteros.map(f => ({
        ...f,
        puedeEliminar: f.activo && f._count.viajes === 0 && f._count.liquidaciones === 0,
      }))} />
    </div>
  )
}
