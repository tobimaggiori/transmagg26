import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { esRolInterno } from "@/lib/permissions"
import type { Rol } from "@/types"
import { MovimientosClient } from "./movimientos-client"

export default async function MovimientosPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (!esRolInterno(session.user.rol as Rol)) redirect("/dashboard")

  const cuentas = await prisma.cuenta.findMany({
    where: { activa: true },
    select: { id: true, nombre: true },
    orderBy: { nombre: "asc" },
  })

  return <MovimientosClient cuentas={cuentas} />
}
