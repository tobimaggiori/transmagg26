import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { tienePermiso } from "@/lib/permissions"
import type { Rol } from "@/types"
import { FciDetalleClient } from "./fci-detalle-client"

export default async function FciDetallePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")
  const rol = session.user.rol as Rol
  if (!(await tienePermiso(session.user.id, rol, "contabilidad.fci"))) redirect("/dashboard")

  const { id } = await params

  const [fci, cuentas] = await Promise.all([
    prisma.fci.findUnique({ where: { id }, include: { cuenta: true } }),
    prisma.cuenta.findMany({
      where: { activa: true },
      select: { id: true, nombre: true, tipo: true, moneda: true },
      orderBy: { nombre: "asc" },
    }),
  ])

  if (!fci) redirect("/contabilidad/fci")

  return <FciDetalleClient fciId={id} cuentasTodas={cuentas} />
}
