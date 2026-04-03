import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { esAdmin } from "@/lib/permissions"
import { CuentasAbm } from "@/components/abm/cuentas-abm"
import type { Rol } from "@/types"

export default async function CuentasPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const rol = (session.user.rol ?? "OPERADOR_TRANSMAGG") as Rol
  if (!esAdmin(rol)) redirect("/dashboard")

  const cuentas = await prisma.cuenta.findMany({
    orderBy: { nombre: "asc" },
    select: { id: true, nombre: true, tipo: true, bancoOEntidad: true, moneda: true, activa: true, tieneChequera: true, tienePlanillaEmisionMasiva: true, tieneCuentaRemunerada: true, tieneTarjetasPrepagasChoferes: true, tieneImpuestoDebcred: true, alicuotaImpuesto: true },
  })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Cuentas</h2>
        <p className="text-muted-foreground">Gestión de cuentas bancarias del sistema.</p>
      </div>
      <CuentasAbm cuentas={cuentas} />
    </div>
  )
}
