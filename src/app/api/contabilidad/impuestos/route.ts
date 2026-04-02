/**
 * GET  /api/contabilidad/impuestos  — consulta pagos de impuestos con filtros
 * POST /api/contabilidad/impuestos  — registra un nuevo pago de impuesto
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { esRolInterno } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"
import type { Rol } from "@/types"

function tipoDisplay(tipoImpuesto: string, descripcion?: string | null): string {
  const map: Record<string, string> = {
    IIBB: "IIBB",
    IVA: "IVA",
    GANANCIAS: "Ganancias",
    OTRO: descripcion ?? "Impuesto",
  }
  return map[tipoImpuesto] ?? tipoImpuesto
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const rol = (session.user.rol ?? "") as Rol
  if (!esRolInterno(rol)) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const tipoImpuesto = searchParams.get("tipoImpuesto") ?? ""
  const anio = searchParams.get("anio") ?? ""
  const medioPago = searchParams.get("medioPago") ?? ""

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: Record<string, any> = {}
  if (tipoImpuesto) where.tipoImpuesto = tipoImpuesto
  if (medioPago) where.medioPago = medioPago
  if (anio) {
    where.periodo = { startsWith: anio }
  }

  const pagos = await prisma.pagoImpuesto.findMany({
    where,
    include: { cuenta: { select: { nombre: true } } },
    orderBy: { fechaPago: "desc" },
  })

  return NextResponse.json({
    pagos: pagos.map((p) => ({
      id: p.id,
      tipoImpuesto: p.tipoImpuesto,
      descripcion: p.descripcion,
      periodo: p.periodo,
      monto: p.monto,
      fechaPago: p.fechaPago.toISOString(),
      medioPago: p.medioPago,
      cuentaId: p.cuentaId,
      cuentaNombre: p.cuenta?.nombre ?? null,
      comprobantePdfS3Key: p.comprobantePdfS3Key,
      observaciones: p.observaciones,
    })),
  })
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const rol = (session.user.rol ?? "") as Rol
  if (!esRolInterno(rol)) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  let body: {
    tipoImpuesto: string
    descripcion?: string
    periodo: string
    monto: number
    fechaPago: string
    medioPago: string
    cuentaId?: string
    comprobantePdfS3Key?: string
    observaciones?: string
  }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 })
  }

  const { tipoImpuesto, descripcion, periodo, monto, fechaPago, medioPago, cuentaId, comprobantePdfS3Key, observaciones } = body

  if (!tipoImpuesto || !periodo || !monto || !fechaPago || !medioPago) {
    return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 })
  }

  const operadorId = session.user.id

  // Create PagoImpuesto
  const pago = await prisma.pagoImpuesto.create({
    data: {
      tipoImpuesto,
      descripcion: descripcion ?? null,
      periodo,
      monto,
      fechaPago: new Date(fechaPago),
      medioPago,
      cuentaId: cuentaId ?? null,
      comprobantePdfS3Key: comprobantePdfS3Key ?? null,
      observaciones: observaciones ?? null,
      operadorId,
    },
  })

  // Create MovimientoSinFactura EGRESO if cuenta bancaria
  if (medioPago === "CUENTA_BANCARIA" && cuentaId) {
    const desc = `Pago ${tipoDisplay(tipoImpuesto, descripcion)} — período ${periodo}`
    await prisma.movimientoSinFactura.create({
      data: {
        cuentaId,
        tipo: "EGRESO",
        categoria: "PAGO_SERVICIO",
        monto,
        fecha: new Date(fechaPago),
        descripcion: desc,
        operadorId,
      },
    })
  }

  return NextResponse.json({ pago }, { status: 201 })
}
