/**
 * API JM Facturas — listar y crear (sin ARCA por ahora).
 * GET ?empresaId=... → viajes pendientes de la empresa + facturas existentes.
 * POST → emite factura nueva.
 */

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prismaJm } from "@/jm/prisma"
import { esRolInterno } from "@/lib/permissions"
import type { Rol } from "@/types"
import { ejecutarCrearFacturaJm } from "@/jm/lib/factura-commands"

const crearSchema = z.object({
  empresaId: z.string().min(1),
  viajeIds: z.array(z.string().min(1)).min(1),
  tipoCbte: z.number().int(),
  modalidadMiPymes: z.string().optional(),
  ivaPct: z.number().min(0).max(100).default(21),
  metodoPago: z.string().optional(),
  fechaEmision: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  ediciones: z.record(z.string(), z.object({
    kilos: z.number().positive().optional(),
    tarifaEmpresa: z.number().positive().optional(),
  })).optional(),
})

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (!esRolInterno(session.user.rol as Rol)) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const empresaId = searchParams.get("empresaId")
  const desde = searchParams.get("desde")
  const hasta = searchParams.get("hasta")
  const estado = searchParams.get("estado") // "PENDIENTE" | "FACTURADO" | null (todas)

  // Si pidieron viajes pendientes (sin estado filter o estado=PENDIENTE)
  if (empresaId) {
    const viajesPendientes = await prismaJm.viaje.findMany({
      where: {
        empresaId,
        estadoFactura: "PENDIENTE_FACTURAR",
        ...(desde || hasta ? {
          fechaViaje: {
            ...(desde ? { gte: new Date(desde) } : {}),
            ...(hasta ? { lte: new Date(`${hasta}T23:59:59.999Z`) } : {}),
          },
        } : {}),
      },
      include: {
        camion: { select: { patenteChasis: true } },
        chofer: { select: { nombre: true, apellido: true } },
      },
      orderBy: [{ fechaViaje: "desc" }, { creadoEn: "desc" }],
    })

    const facturas = await prismaJm.facturaEmitida.findMany({
      where: { empresaId },
      orderBy: { emitidaEn: "desc" },
      take: 30,
    })

    return NextResponse.json({ viajesPendientes, facturas })
  }

  // Listado general de facturas
  const facturas = await prismaJm.facturaEmitida.findMany({
    where: {
      ...(estado === "FACTURADO" ? {} : {}),
    },
    include: { empresa: { select: { id: true, razonSocial: true, cuit: true } } },
    orderBy: { emitidaEn: "desc" },
    take: 200,
  })
  return NextResponse.json(facturas)
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (!esRolInterno(session.user.rol as Rol)) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  const body = await request.json()
  const parsed = crearSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos", detalles: parsed.error.flatten() }, { status: 400 })

  const resultado = await ejecutarCrearFacturaJm(parsed.data, session.user.email!)
  if (!resultado.ok) return NextResponse.json({ error: resultado.error }, { status: resultado.status })

  return NextResponse.json(resultado.factura, { status: 201 })
}
