import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { puedeAcceder } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"
import { NuevaPolizaClient } from "./nueva-poliza-client"
import type { Rol } from "@/types"

export default async function NuevaPolizaPage({
  searchParams,
}: {
  searchParams: { camionId?: string }
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (!puedeAcceder(session.user.rol as Rol, "cuentas")) redirect("/dashboard")

  const [camiones, proveedores] = await Promise.all([
    prisma.camion.findMany({
      where: { esPropio: true, activo: true },
      select: { id: true, patenteChasis: true, patenteAcoplado: true },
      orderBy: { patenteChasis: "asc" },
    }),
    prisma.proveedor.findMany({
      where: { activo: true },
      select: { id: true, razonSocial: true, cuit: true },
      orderBy: { razonSocial: "asc" },
    }),
  ])

  return (
    <NuevaPolizaClient
      camiones={camiones}
      proveedores={proveedores}
      camionIdInicial={searchParams.camionId}
    />
  )
}
