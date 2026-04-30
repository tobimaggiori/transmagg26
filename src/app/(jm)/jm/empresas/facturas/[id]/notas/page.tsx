/**
 * NC/ND sobre factura JM. Server wrapper.
 */

import { auth } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { prismaJm } from "@/jm/prisma"
import { esRolInterno } from "@/lib/permissions"
import type { Rol } from "@/types"
import { NotasFacturaJmClient } from "./notas-factura-jm-client"

export default async function NotasFacturaJmPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (!esRolInterno(session.user.rol as Rol)) redirect("/dashboard")

  const { id } = await params
  const factura = await prismaJm.facturaEmitida.findUnique({
    where: { id },
    include: {
      empresa: { select: { id: true, razonSocial: true, cuit: true, condicionIva: true } },
      viajes: true,
    },
  })
  if (!factura) notFound()

  const notasRaw = await prismaJm.notaCreditoDebito.findMany({
    where: { facturaId: id },
    include: { items: { orderBy: { orden: "asc" } } },
    orderBy: { creadoEn: "desc" },
  })

  const facturaSerial = {
    id: factura.id,
    nroComprobante: factura.nroComprobante,
    ptoVenta: factura.ptoVenta,
    tipoCbte: factura.tipoCbte,
    total: factura.total.toString(),
    neto: factura.neto.toString(),
    ivaMonto: factura.ivaMonto.toString(),
    ivaPct: factura.ivaPct,
    emitidaEn: factura.emitidaEn.toISOString(),
    estadoCobro: factura.estadoCobro,
    empresa: factura.empresa,
    cantViajes: factura.viajes.length,
  }

  const notas = notasRaw.map((n) => ({
    id: n.id,
    tipo: n.tipo,
    subtipo: n.subtipo,
    nroComprobante: n.nroComprobante,
    ptoVenta: n.ptoVenta,
    tipoCbte: n.tipoCbte,
    montoNeto: n.montoNeto.toString(),
    montoIva: n.montoIva.toString(),
    montoTotal: n.montoTotal.toString(),
    montoDescontado: n.montoDescontado.toString(),
    estado: n.estado,
    arcaEstado: n.arcaEstado,
    descripcion: n.descripcion,
    creadoEn: n.creadoEn.toISOString(),
    items: n.items.map((it) => ({ orden: it.orden, concepto: it.concepto, subtotal: it.subtotal.toString() })),
  }))

  return <NotasFacturaJmClient factura={facturaSerial} notasIniciales={notas} />
}
