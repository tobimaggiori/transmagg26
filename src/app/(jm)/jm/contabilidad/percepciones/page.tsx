/**
 * Libro Percepciones JM.
 */

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prismaJm } from "@/jm/prisma"
import { esRolInterno } from "@/lib/permissions"
import type { Rol } from "@/types"
import { LibroPercepcionesJmClient } from "./libro-percepciones-jm-client"

export default async function LibroPercepcionesJmPage({ searchParams }: { searchParams: Promise<{ periodo?: string }> }) {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (!esRolInterno(session.user.rol as Rol)) redirect("/dashboard")

  const sp = await searchParams
  const periodo = sp.periodo || new Date().toISOString().slice(0, 7)

  const percepcionesRaw = await prismaJm.percepcionImpuesto.findMany({
    where: { periodo },
    include: {
      facturaProveedor: { include: { proveedor: { select: { razonSocial: true, cuit: true } } } },
      facturaSeguro: { include: { aseguradora: { select: { razonSocial: true, cuit: true } } } },
    },
    orderBy: { tipo: "asc" },
  })

  const percepciones = percepcionesRaw.map((p) => ({
    id: p.id,
    tipo: p.tipo,
    categoria: p.categoria,
    descripcion: p.descripcion,
    monto: p.monto.toString(),
    proveedor: p.facturaProveedor?.proveedor.razonSocial ?? p.facturaSeguro?.aseguradora.razonSocial ?? null,
    cuit: p.facturaProveedor?.proveedor.cuit ?? p.facturaSeguro?.aseguradora.cuit ?? null,
    nroComprobante: p.facturaProveedor?.nroComprobante ?? p.facturaSeguro?.nroComprobante ?? null,
  }))

  return <LibroPercepcionesJmClient periodo={periodo} percepciones={percepciones} />
}
