/**
 * GET  /api/contabilidad/impuestos  — consulta pagos de impuestos con filtros
 * POST /api/contabilidad/impuestos  — registra un nuevo pago de impuesto
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { esRolInterno } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"
import { ejecutarRegistrarPagoImpuesto } from "@/lib/impuesto-commands"
import type { Rol } from "@/types"

export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const rol = (session.user.rol ?? "") as Rol
  if (!esRolInterno(rol)) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const tipoImpuesto = searchParams.get("tipoImpuesto") ?? ""
  const anio        = searchParams.get("anio")         ?? ""
  const medioPago   = searchParams.get("medioPago")    ?? ""

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: Record<string, any> = {}
  if (tipoImpuesto) where.tipoImpuesto = tipoImpuesto
  if (medioPago)    where.medioPago    = medioPago
  if (anio)         where.periodo      = { startsWith: anio }

  const pagos = await prisma.pagoImpuesto.findMany({
    where,
    include: {
      cuenta:  { select: { nombre: true } },
      tarjeta: { select: { nombre: true, banco: true, ultimos4: true } },
    },
    orderBy: { fechaPago: "desc" },
  })

  return NextResponse.json({
    pagos: pagos.map((p) => ({
      id:                  p.id,
      tipoImpuesto:        p.tipoImpuesto,
      descripcion:         p.descripcion,
      periodo:             p.periodo,
      monto:               p.monto,
      fechaPago:           p.fechaPago.toISOString(),
      medioPago:           p.medioPago,
      cuentaId:            p.cuentaId,
      cuentaNombre:        p.cuenta?.nombre ?? null,
      tarjetaId:           p.tarjetaId,
      tarjetaNombre:       p.tarjeta ? `${p.tarjeta.nombre} — ${p.tarjeta.banco} ···${p.tarjeta.ultimos4}` : null,
      comprobantePdfS3Key: p.comprobantePdfS3Key,
      observaciones:       p.observaciones,
    })),
  })
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const rol = (session.user.rol ?? "") as Rol
  if (!esRolInterno(rol)) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 })
  }

  const data = body as {
    tipoImpuesto: string
    descripcion?: string
    periodo: string
    monto: number
    fechaPago: string
    medioPago: string
    cuentaId?: string
    tarjetaId?: string
    comprobantePdfS3Key?: string
    observaciones?: string
  }

  const operadorId = session.user.id

  const resultado = await ejecutarRegistrarPagoImpuesto(data, operadorId)

  if (!resultado.ok) {
    return NextResponse.json({ error: resultado.error }, { status: resultado.status })
  }

  return NextResponse.json({ pago: resultado.result }, { status: 201 })
}
