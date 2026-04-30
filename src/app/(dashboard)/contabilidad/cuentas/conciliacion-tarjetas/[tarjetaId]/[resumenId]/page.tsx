import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { tienePermiso } from "@/lib/permissions"
import { ConciliacionTarjetaDetalle } from "./detalle-client"
import type { Rol } from "@/types"

interface Props {
  params: Promise<{ tarjetaId: string; resumenId: string }>
}

export default async function ConciliacionTarjetaDetallePage({ params }: Props) {
  const session = await auth()
  if (!session?.user) redirect("/login")
  const rol = (session.user.rol ?? "OPERADOR_TRANSMAGG") as Rol
  if (!(await tienePermiso(session.user.id, rol, "cuentas"))) redirect("/dashboard")

  const { tarjetaId, resumenId } = await params
  const resumen = await prisma.resumenTarjeta.findUnique({
    where: { id: resumenId },
    select: { id: true, tarjetaId: true },
  })
  if (!resumen || resumen.tarjetaId !== tarjetaId) {
    redirect("/contabilidad/cuentas/conciliacion-tarjetas")
  }

  return (
    <div className="p-6 space-y-6">
      <ConciliacionTarjetaDetalle tarjetaId={tarjetaId} resumenId={resumenId} />
    </div>
  )
}
