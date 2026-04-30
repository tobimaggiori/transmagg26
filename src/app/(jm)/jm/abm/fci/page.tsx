/**
 * ABM FCI JM. Reusa el componente FciAbm de Transmagg porque su lógica es
 * neutra (no usa prisma directo, solo fetch a /api/...).
 *
 * Truco: el componente FciAbm hace fetch hardcoded a `/api/fci`. Para JM
 * tenemos que reescribir el wrapper pequeño que hace fetch a `/api/jm/fci`
 * o duplicar el componente. Por simplicidad, duplicamos un wrapper liviano.
 */

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prismaJm } from "@/jm/prisma"
import { esRolInterno } from "@/lib/permissions"
import type { Rol } from "@/types"
import { FciAbmJm } from "@/jm/components/fci-abm"

export default async function FciAbmJmPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (!esRolInterno(session.user.rol as Rol)) redirect("/dashboard")

  const [fcis, cuentas] = await Promise.all([
    prismaJm.fci.findMany({
      include: { cuenta: { select: { id: true, nombre: true } } },
      orderBy: [{ activo: "desc" }, { nombre: "asc" }],
    }),
    prismaJm.cuenta.findMany({
      where: { activa: true },
      select: { id: true, nombre: true },
      orderBy: { nombre: "asc" },
    }),
  ])

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">ABM FCI</h1>
      <FciAbmJm
        fcis={fcis.map((f) => ({
          id: f.id,
          nombre: f.nombre,
          cuentaId: f.cuentaId,
          moneda: f.moneda,
          activo: f.activo,
          diasHabilesAlerta: f.diasHabilesAlerta,
          cuenta: f.cuenta ? { nombre: f.cuenta.nombre } : undefined,
        }))}
        cuentas={cuentas}
      />
    </div>
  )
}
