import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { tienePermiso } from "@/lib/permissions"
import { ConciliacionTarjetasListado } from "./listado-client"
import type { Rol } from "@/types"

export default async function ConciliacionTarjetasPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  const rol = (session.user.rol ?? "OPERADOR_TRANSMAGG") as Rol
  if (!(await tienePermiso(session.user.id, rol, "cuentas"))) redirect("/dashboard")

  const tarjetas = await prisma.tarjeta.findMany({
    where: { activa: true },
    orderBy: [{ tipo: "asc" }, { nombre: "asc" }],
    select: {
      id: true,
      nombre: true,
      tipo: true,
      banco: true,
      ultimos4: true,
      diaCierre: true,
      diaVencimiento: true,
    },
  })

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Conciliación de tarjetas</h1>
        <p className="text-muted-foreground">
          Conciliá cada tarjeta por ciclo (fecha desde/hasta). Cada día del ciclo se concilia
          individualmente contra el resumen emitido por el banco.
        </p>
      </div>
      <ConciliacionTarjetasListado tarjetas={tarjetas} />
    </div>
  )
}
