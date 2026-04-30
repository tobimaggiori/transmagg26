/**
 * Libro IIBB JM. Asientos por provincia y período.
 */

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prismaJm } from "@/jm/prisma"
import { esRolInterno } from "@/lib/permissions"
import type { Rol } from "@/types"
import { LibroIibbJmClient } from "./libro-iibb-jm-client"

export default async function LibroIibbJmPage({ searchParams }: { searchParams: Promise<{ periodo?: string }> }) {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (!esRolInterno(session.user.rol as Rol)) redirect("/dashboard")

  const sp = await searchParams
  const periodo = sp.periodo || new Date().toISOString().slice(0, 7)

  const asientosRaw = await prismaJm.asientoIibb.findMany({
    where: { periodo },
    include: {
      viajeEnFactura: {
        include: { factura: { include: { empresa: { select: { razonSocial: true } } } } },
      },
    },
    orderBy: { provincia: "asc" },
  })

  const asientos = asientosRaw.map((a) => ({
    id: a.id,
    provincia: a.provincia,
    montoIngreso: a.montoIngreso.toString(),
    empresa: a.viajeEnFactura?.factura?.empresa?.razonSocial ?? null,
    nroComprobante: a.viajeEnFactura?.factura?.nroComprobante ?? null,
  }))

  return <LibroIibbJmClient periodo={periodo} asientos={asientos} />
}
