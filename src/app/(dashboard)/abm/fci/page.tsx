import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { tienePermiso } from "@/lib/permissions"
import { FciAbm } from "@/components/abm/fci-abm"
import type { Rol } from "@/types"

export default async function FciPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const rol = (session.user.rol ?? "OPERADOR_TRANSMAGG") as Rol
  if (!(await tienePermiso(session.user.id, rol, "abm.fci"))) redirect("/dashboard")

  const [fcis, cuentas] = await Promise.all([
    prisma.fci.findMany({
      orderBy: { nombre: "asc" },
      include: { cuenta: { select: { nombre: true } } },
    }),
    prisma.cuenta.findMany({
      orderBy: { nombre: "asc" },
      select: {
        id: true,
        nombre: true,
        tipo: true,
        moneda: true,
        activa: true,
        tieneChequera: true,
        tieneCuentaRemunerada: true,
        tieneTarjetasPrepagasChoferes: true,
        tieneImpuestoDebcred: true,
        alicuotaImpuesto: true,
        banco: { select: { id: true, nombre: true } },
      },
    }),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">FCI</h2>
        <p className="text-muted-foreground">Gestión de Fondos Comunes de Inversión.</p>
      </div>
      <FciAbm fcis={fcis} cuentas={cuentas.map(c => ({ id: c.id, nombre: c.nombre }))} />
    </div>
  )
}
