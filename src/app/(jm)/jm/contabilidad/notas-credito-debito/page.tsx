/**
 * Listado de notas de crédito/débito JM.
 */

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prismaJm } from "@/jm/prisma"
import { esRolInterno } from "@/lib/permissions"
import type { Rol } from "@/types"
import { ListadoNotasCDJmClient } from "./listado-notas-cd-jm-client"

export default async function NotasCDJmPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (!esRolInterno(session.user.rol as Rol)) redirect("/dashboard")

  const notasRaw = await prismaJm.notaCreditoDebito.findMany({
    include: {
      factura: { include: { empresa: { select: { razonSocial: true, cuit: true } } } },
      facturaProveedor: { include: { proveedor: { select: { razonSocial: true, cuit: true } } } },
    },
    orderBy: { creadoEn: "desc" },
    take: 200,
  })

  const notas = notasRaw.map((n) => ({
    id: n.id,
    tipo: n.tipo,
    subtipo: n.subtipo,
    nroComprobante: n.nroComprobante ?? null,
    ptoVenta: n.ptoVenta ?? null,
    nroComprobanteExterno: n.nroComprobanteExterno ?? null,
    montoTotal: n.montoTotal.toString(),
    montoDescontado: n.montoDescontado.toString(),
    estado: n.estado,
    arcaEstado: n.arcaEstado ?? null,
    creadoEn: n.creadoEn.toISOString(),
    descripcion: n.descripcion,
    facturaInfo: n.factura ? `${n.factura.tipoCbte} ${n.factura.nroComprobante ?? "—"} · ${n.factura.empresa.razonSocial}` : null,
    facturaProveedorInfo: n.facturaProveedor ? `${n.facturaProveedor.tipoCbte} ${n.facturaProveedor.nroComprobante} · ${n.facturaProveedor.proveedor.razonSocial}` : null,
  }))

  return <ListadoNotasCDJmClient notas={notas} />
}
