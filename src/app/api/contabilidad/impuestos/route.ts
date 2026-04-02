/**
 * GET  /api/contabilidad/impuestos  — consulta pagos de impuestos con filtros
 * POST /api/contabilidad/impuestos  — registra un nuevo pago de impuesto
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { esRolInterno } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"
import type { Rol } from "@/types"

const COMPROBANTE_PREFIX = "comprobantes-impuestos"

function tipoDisplay(tipoImpuesto: string, descripcion?: string | null): string {
  const map: Record<string, string> = {
    IIBB:      "IIBB",
    IVA:       "IVA",
    GANANCIAS: "Ganancias",
    OTRO:      descripcion ?? "Impuesto",
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

  let body: {
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

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 })
  }

  const { tipoImpuesto, descripcion, periodo, monto, fechaPago, medioPago,
          cuentaId, tarjetaId, comprobantePdfS3Key, observaciones } = body

  if (!tipoImpuesto || !periodo || !monto || !fechaPago || !medioPago) {
    return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 })
  }

  // Validaciones por medio de pago
  if (medioPago === "CUENTA_BANCARIA") {
    if (!cuentaId) {
      return NextResponse.json({ error: "Cuenta bancaria requerida" }, { status: 400 })
    }
    if (!comprobantePdfS3Key) {
      return NextResponse.json({ error: "Comprobante PDF obligatorio para pagos desde cuenta bancaria" }, { status: 400 })
    }
    // Validar que la key pertenezca al prefijo correcto (evitar path traversal)
    if (!comprobantePdfS3Key.startsWith(`${COMPROBANTE_PREFIX}/`)) {
      return NextResponse.json({ error: "S3 key de comprobante inválida" }, { status: 400 })
    }
  }

  if (medioPago === "TARJETA" && !tarjetaId) {
    return NextResponse.json({ error: "Tarjeta requerida" }, { status: 400 })
  }

  const operadorId = session.user.id

  const pago = await prisma.$transaction(async (tx) => {
    const nuevoPago = await tx.pagoImpuesto.create({
      data: {
        tipoImpuesto,
        descripcion:         descripcion         ?? null,
        periodo,
        monto,
        fechaPago:           new Date(fechaPago),
        medioPago,
        cuentaId:            cuentaId            ?? null,
        tarjetaId:           tarjetaId           ?? null,
        comprobantePdfS3Key: comprobantePdfS3Key ?? null,
        observaciones:       observaciones       ?? null,
        operadorId,
      },
    })

    const desc = `Pago ${tipoDisplay(tipoImpuesto, descripcion)} — período ${periodo}`

    if (medioPago === "CUENTA_BANCARIA" && cuentaId) {
      await tx.movimientoSinFactura.create({
        data: {
          cuentaId,
          tipo:        "EGRESO",
          categoria:   "PAGO_SERVICIO",
          monto,
          fecha:       new Date(fechaPago),
          descripcion: desc,
          operadorId,
        },
      })
    }

    if (medioPago === "TARJETA" && tarjetaId) {
      // Obtener la cuenta asociada a la tarjeta (si tiene)
      const tarjeta = await tx.tarjeta.findUnique({
        where: { id: tarjetaId },
        select: { cuentaId: true },
      })

      if (tarjeta?.cuentaId) {
        await tx.movimientoSinFactura.create({
          data: {
            cuentaId:    tarjeta.cuentaId,
            tarjetaId,
            tipo:        "EGRESO",
            categoria:   "PAGO_TARJETA",
            monto,
            fecha:       new Date(fechaPago),
            descripcion: desc,
            operadorId,
          },
        })
      } else {
        // Si la tarjeta no tiene cuenta asociada, registrar sin cuenta (tarjetaId solo)
        // Esto requiere una cuenta dummy — mejor buscar otra cuenta o simplemente omitir el movimiento bancario
        // Para tarjetas sin cuenta asociada, no se genera MovimientoSinFactura (requiere cuentaId)
        // El pago queda registrado en PagoImpuesto.tarjetaId únicamente
      }
    }

    return nuevoPago
  })

  return NextResponse.json({ pago }, { status: 201 })
}
