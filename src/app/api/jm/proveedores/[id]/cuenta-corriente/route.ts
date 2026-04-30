/**
 * GET /api/jm/proveedores/[id]/cuenta-corriente
 * CC de un proveedor: facturas + pagos.
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prismaJm } from "@/jm/prisma"
import { esRolInterno } from "@/lib/permissions"
import { sumarImportes, restarImportes } from "@/lib/money"
import type { Rol } from "@/types"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (!esRolInterno(session.user.rol as Rol)) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  const proveedor = await prismaJm.proveedor.findUnique({
    where: { id: params.id },
    select: { id: true, razonSocial: true, cuit: true },
  })
  if (!proveedor) return NextResponse.json({ error: "Proveedor no encontrado" }, { status: 404 })

  const { searchParams } = new URL(request.url)
  const desde = searchParams.get("desde")
  const hasta = searchParams.get("hasta")
  const desdeDate = desde ? new Date(desde) : null
  const hastaDate = hasta ? new Date(`${hasta}T23:59:59.999Z`) : new Date()
  const rango = { ...(desdeDate ? { gte: desdeDate } : {}), lte: hastaDate }

  const [facturas, pagos] = await Promise.all([
    prismaJm.facturaProveedor.findMany({
      where: { proveedorId: params.id, fechaCbte: rango },
      select: { id: true, fechaCbte: true, total: true, nroComprobante: true, tipoCbte: true },
    }),
    prismaJm.pagoProveedor.findMany({
      where: { facturaProveedor: { proveedorId: params.id }, fecha: rango, anulado: false },
      select: { id: true, fecha: true, monto: true, tipo: true },
    }),
  ])

  type Mov = { fecha: string; concepto: string; comprobante: string; debe: number; haber: number; saldo: number }
  const movs: (Omit<Mov, "saldo"> & { fechaRaw: Date })[] = []
  for (const f of facturas) {
    movs.push({
      fechaRaw: f.fechaCbte,
      fecha: f.fechaCbte.toISOString(),
      concepto: `Factura ${f.tipoCbte}`,
      comprobante: f.nroComprobante,
      debe: 0,
      haber: Number(f.total),
    })
  }
  for (const p of pagos) {
    movs.push({
      fechaRaw: p.fecha,
      fecha: p.fecha.toISOString(),
      concepto: `Pago — ${p.tipo}`,
      comprobante: "",
      debe: Number(p.monto),
      haber: 0,
    })
  }

  movs.sort((a, b) => a.fechaRaw.getTime() - b.fechaRaw.getTime())

  let saldo = 0
  const movsConSaldo: Mov[] = movs.map((m) => {
    saldo += m.debe - m.haber
    return { fecha: m.fecha, concepto: m.concepto, comprobante: m.comprobante, debe: m.debe, haber: m.haber, saldo }
  })

  const totalDebe = sumarImportes(movs.map((m) => m.debe))
  const totalHaber = sumarImportes(movs.map((m) => m.haber))
  const saldoFinal = restarImportes(totalDebe, totalHaber)

  return NextResponse.json({
    proveedor,
    movimientos: movsConSaldo,
    totalDebe, totalHaber, saldoFinal,
    desde: desdeDate ? desdeDate.toISOString() : null,
    hasta: hastaDate.toISOString(),
  })
}
