/**
 * GET  /api/tarjetas/cierre-resumen?tarjetaId=  — Historial de cierres
 * POST /api/tarjetas/cierre-resumen             — Crear cierre de resumen
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { esRolInterno } from "@/lib/permissions"
import { resolverOperadorId } from "@/lib/session-utils"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import type { Rol } from "@/types"
import { ejecutarCierreResumenTarjeta } from "@/lib/tarjeta-commands"

const pagoSchema = z.object({
  facturaId: z.string(),
  tipo: z.enum(["PROVEEDOR", "SEGURO"]),
  montoPagado: z.number().positive(),
})

const cierreSchema = z.object({
  tarjetaId: z.string().min(1),
  mesAnio: z.string().regex(/^\d{4}-\d{2}$/),
  cuentaPagoId: z.string().min(1),
  fechaPago: z.string().min(1),
  pdfS3Key: z.string().optional().nullable(),
  diferencia: z.number().default(0),
  descripcionDiferencia: z.string().optional().nullable(),
  pagos: z.array(pagoSchema).min(1),
})

export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (!esRolInterno((session.user.rol ?? "") as Rol))
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const tarjetaId = searchParams.get("tarjetaId")
  if (!tarjetaId) return NextResponse.json({ error: "tarjetaId requerido" }, { status: 400 })

  try {
    const cierres = await prisma.cierreResumenTarjeta.findMany({
      where: { tarjetaId },
      include: {
        cuentaPago: { select: { nombre: true } },
        pagos: {
          include: {
            facturaProveedor: { select: { nroComprobante: true, proveedor: { select: { razonSocial: true } } } },
            facturaSeguro: { select: { nroComprobante: true, aseguradora: { select: { razonSocial: true } } } },
          },
        },
      },
      orderBy: { fechaPago: "desc" },
    })
    return NextResponse.json(cierres)
  } catch (error) {
    console.error("GET /api/tarjetas/cierre-resumen error:", error)
    return NextResponse.json({ error: "Error al obtener cierres" }, { status: 500 })
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (!esRolInterno((session.user.rol ?? "") as Rol))
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 })
  }

  const parsed = cierreSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", detail: parsed.error.flatten() }, { status: 400 })
  }

  try {
    const operadorId = await resolverOperadorId({
      id: session.user.id,
      email: session.user.email,
    })

    const resultado = await ejecutarCierreResumenTarjeta(parsed.data, operadorId)

    if (!resultado.ok) {
      return NextResponse.json({ error: resultado.error }, { status: resultado.status })
    }

    return NextResponse.json(resultado.result, { status: 201 })
  } catch (error) {
    console.error("POST /api/tarjetas/cierre-resumen error:", error)
    return NextResponse.json({ error: "Error al crear cierre de resumen", detail: String(error) }, { status: 500 })
  }
}
