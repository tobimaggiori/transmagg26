/**
 * Libro de gastos JM. Listado de facturas de proveedor + facturas seguro
 * + pagos de impuestos consolidados como egresos.
 */

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prismaJm } from "@/jm/prisma"
import { esRolInterno } from "@/lib/permissions"
import type { Rol } from "@/types"
import { LibroGastosJmClient } from "./libro-gastos-jm-client"

export default async function LibroGastosJmPage({ searchParams }: { searchParams: Promise<{ desde?: string; hasta?: string }> }) {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (!esRolInterno(session.user.rol as Rol)) redirect("/dashboard")

  const sp = await searchParams
  const desdeDate = sp.desde ? new Date(sp.desde) : new Date(new Date().getFullYear(), 0, 1)
  const hastaDate = sp.hasta ? new Date(`${sp.hasta}T23:59:59`) : new Date()
  const rango = { gte: desdeDate, lte: hastaDate }

  const [fProv, fSeg, pImp] = await Promise.all([
    prismaJm.facturaProveedor.findMany({
      where: { fechaCbte: rango },
      include: { proveedor: { select: { razonSocial: true } } },
    }),
    prismaJm.facturaSeguro.findMany({
      where: { fecha: rango },
      include: { aseguradora: { select: { razonSocial: true } } },
    }),
    prismaJm.pagoImpuesto.findMany({
      where: { fechaPago: rango },
    }),
  ])

  type Gasto = { fecha: string; categoria: string; descripcion: string; total: number }
  const gastos: Gasto[] = []
  for (const f of fProv) {
    gastos.push({ fecha: f.fechaCbte.toISOString(), categoria: "Proveedor", descripcion: `${f.proveedor.razonSocial} — ${f.tipoCbte} ${f.nroComprobante}${f.concepto ? ` · ${f.concepto}` : ""}`, total: Number(f.total) })
  }
  for (const f of fSeg) {
    gastos.push({ fecha: f.fecha.toISOString(), categoria: "Seguro", descripcion: `${f.aseguradora.razonSocial} — ${f.nroComprobante}`, total: Number(f.total) })
  }
  for (const p of pImp) {
    gastos.push({ fecha: p.fechaPago.toISOString(), categoria: `Impuesto ${p.tipoImpuesto}`, descripcion: `${p.tipoImpuesto} período ${p.periodo}${p.descripcion ? ` · ${p.descripcion}` : ""}`, total: Number(p.monto) })
  }
  gastos.sort((a, b) => a.fecha.localeCompare(b.fecha))

  return (
    <LibroGastosJmClient
      desde={desdeDate.toISOString().slice(0, 10)}
      hasta={hastaDate.toISOString().slice(0, 10)}
      gastos={gastos}
    />
  )
}
