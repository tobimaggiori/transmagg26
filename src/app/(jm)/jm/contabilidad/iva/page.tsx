/**
 * Libro IVA JM. Listado de asientos por período.
 */

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prismaJm } from "@/jm/prisma"
import { esRolInterno } from "@/lib/permissions"
import type { Rol } from "@/types"
import { LibroIvaJmClient } from "./libro-iva-jm-client"

export default async function LibroIvaJmPage({ searchParams }: { searchParams: Promise<{ periodo?: string }> }) {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (!esRolInterno(session.user.rol as Rol)) redirect("/dashboard")

  const sp = await searchParams
  const periodo = sp.periodo || new Date().toISOString().slice(0, 7)

  const asientosRaw = await prismaJm.asientoIva.findMany({
    where: { periodo },
    include: {
      facturaEmitida: { include: { empresa: { select: { razonSocial: true, cuit: true } } } },
      facturaProveedor: { include: { proveedor: { select: { razonSocial: true, cuit: true } } } },
      facturaSeguro: { include: { aseguradora: { select: { razonSocial: true, cuit: true } } } },
      notaCreditoDebito: true,
    },
    orderBy: { id: "asc" },
  })

  const asientos = asientosRaw.map((a) => ({
    id: a.id,
    tipo: a.tipo,
    tipoReferencia: a.tipoReferencia,
    baseImponible: a.baseImponible.toString(),
    alicuota: a.alicuota,
    montoIva: a.montoIva.toString(),
    cuit: a.facturaEmitida?.empresa.cuit ?? a.facturaProveedor?.proveedor.cuit ?? a.facturaSeguro?.aseguradora.cuit ?? null,
    razonSocial: a.facturaEmitida?.empresa.razonSocial ?? a.facturaProveedor?.proveedor.razonSocial ?? a.facturaSeguro?.aseguradora.razonSocial ?? null,
    nroComprobante: a.facturaEmitida?.nroComprobante ?? a.facturaProveedor?.nroComprobante ?? a.facturaSeguro?.nroComprobante ?? null,
    fecha: (a.facturaEmitida?.emitidaEn ?? a.facturaProveedor?.fechaCbte ?? a.facturaSeguro?.fecha)?.toISOString() ?? null,
  }))

  return <LibroIvaJmClient periodo={periodo} asientos={asientos} />
}
