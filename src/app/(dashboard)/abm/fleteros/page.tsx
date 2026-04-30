import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { tienePermiso } from "@/lib/permissions"
import { FleterosAbm } from "@/components/abm/fleteros-abm"
import type { Rol } from "@/types"

export default async function FleterosPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const rol = (session.user.rol ?? "OPERADOR_TRANSMAGG") as Rol
  if (!(await tienePermiso(session.user.id, rol, "abm.fleteros"))) redirect("/dashboard")

  const fleteros = await prisma.fletero.findMany({
    include: {
      usuario: { select: { nombre: true, apellido: true, email: true } },
      camiones: {
        where: { activo: true },
        select: {
          id: true,
          patenteChasis: true,
          patenteAcoplado: true,
          choferHistorial: {
            where: { hasta: null },
            select: {
              chofer: {
                select: {
                  id: true, nombre: true, apellido: true,
                  usuario: { select: { email: true } },
                },
              },
            },
            take: 1,
          },
        },
        orderBy: { patenteChasis: "asc" },
      },
      empleados: {
        where: { cargo: "CHOFER", activo: true },
        select: {
          id: true, nombre: true, apellido: true,
          usuario: { select: { email: true } },
        },
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
        camiones: f.camiones.map((c) => ({
          ...c,
          choferHistorial: c.choferHistorial.map((h) => ({
            chofer: {
              id: h.chofer.id,
              nombre: h.chofer.nombre,
              apellido: h.chofer.apellido,
              email: h.chofer.usuario?.email ?? null,
            },
          })),
        })),
        choferes: f.empleados.map((e) => ({
          id: e.id, nombre: e.nombre, apellido: e.apellido,
          email: e.usuario?.email ?? null,
        })),
        puedeEliminar: f.activo && f._count.viajes === 0 && f._count.liquidaciones === 0,
      }))} />
    </div>
  )
}
