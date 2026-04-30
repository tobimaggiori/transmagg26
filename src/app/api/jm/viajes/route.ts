/**
 * API JM Viajes — listar y crear.
 * Solo roles internos de Transmagg.
 */

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prismaJm } from "@/jm/prisma"
import { esRolInterno } from "@/lib/permissions"
import { PROVINCIAS_ARGENTINA } from "@/lib/provincias"
import { construirWhereViajesJm } from "@/jm/lib/viaje-queries"
import type { Rol } from "@/types"

function normalizarProvincia(valor: string): string {
  const upper = valor.toUpperCase()
  return PROVINCIAS_ARGENTINA.find((p) => p.toUpperCase() === upper) ?? valor
}

const provinciaSchema = z.string().transform(normalizarProvincia)

const crearViajeSchema = z.object({
  fechaViaje: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida"),
  empresaId: z.string().min(1),
  camionId: z.string().min(1),
  choferId: z.string().min(1),
  remito: z.string().nullable().optional(),
  remitoS3Key: z.string().nullable().optional(),
  tieneCtg: z.boolean().default(false),
  nroCtg: z.string().nullable().optional(),
  ctgS3Key: z.string().nullable().optional(),
  cpe: z.string().nullable().optional(),
  tieneCupo: z.boolean().default(false),
  cupo: z.string().nullable().optional(),
  mercaderia: z.string().min(1, "Mercadería obligatoria"),
  procedencia: z.string().nullable().optional(),
  provinciaOrigen: provinciaSchema,
  destino: z.string().nullable().optional(),
  provinciaDestino: provinciaSchema,
  kilos: z.number().positive().nullable().optional(),
  tarifaEmpresa: z.number().positive(),
}).refine(
  (data) => {
    const tieneRemito = data.remito && data.remito.trim().length > 0
    const tieneCTG = data.nroCtg && data.nroCtg.trim().length > 0
    return !(tieneRemito && tieneCTG)
  },
  { message: "Un viaje no puede tener remito y CTG al mismo tiempo", path: ["remito"] }
).refine(
  (data) => {
    const tieneRemito = data.remito && data.remito.trim().length > 0
    const tieneCTG = data.nroCtg && data.nroCtg.trim().length > 0
    return tieneRemito || tieneCTG
  },
  { message: "Debe cargar al menos un Nro. de Remito o un Nro. de CTG", path: ["remito"] }
).refine(
  (data) => {
    const tieneRemito = data.remito && data.remito.trim().length > 0
    if (!tieneRemito) return true
    return data.remitoS3Key != null && data.remitoS3Key.trim().length > 0
  },
  { message: "Debe cargar PDF de remito", path: ["remitoS3Key"] }
).refine(
  (data) => {
    const tieneCTG = data.nroCtg && data.nroCtg.trim().length > 0
    if (!tieneCTG) return true
    return data.ctgS3Key != null && data.ctgS3Key.trim().length > 0
  },
  { message: "Debe cargar PDF de CTG", path: ["ctgS3Key"] }
)

/**
 * GET /api/jm/viajes — lista viajes con filtros opcionales.
 */
export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const rol = session.user.rol as Rol
  if (!esRolInterno(rol)) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const where = construirWhereViajesJm({
    empresaId: searchParams.get("empresaId"),
    desde: searchParams.get("desde"),
    hasta: searchParams.get("hasta"),
    remito: searchParams.get("remito"),
    cupo: searchParams.get("cupo"),
    cpe: searchParams.get("cpe"),
    nroCtg: searchParams.get("nroCtg"),
  })

  try {
    const viajes = await prismaJm.viaje.findMany({
      where,
      include: {
        empresa: { select: { razonSocial: true, cuit: true } },
        camion: { select: { patenteChasis: true } },
        chofer: { select: { nombre: true, apellido: true } },
      },
      orderBy: [{ fechaViaje: "desc" }, { creadoEn: "desc" }],
      take: 200,
    })
    return NextResponse.json(viajes)
  } catch (error) {
    console.error("[GET /api/jm/viajes]", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/jm/viajes — crea un viaje.
 */
export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const rol = session.user.rol as Rol
  if (!esRolInterno(rol)) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  try {
    const body = await request.json()
    const parsed = crearViajeSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos", detalles: parsed.error.flatten() }, { status: 400 })
    }

    // Unicidad de CTG dentro de JM
    if (parsed.data.nroCtg) {
      const existente = await prismaJm.viaje.findFirst({ where: { nroCtg: parsed.data.nroCtg } })
      if (existente) {
        return NextResponse.json({ error: `Ya existe un viaje con el CTG ${parsed.data.nroCtg}` }, { status: 409 })
      }
    }
    // Unicidad de remito por empresa
    if (parsed.data.remito) {
      const existente = await prismaJm.viaje.findFirst({
        where: { remito: parsed.data.remito, empresaId: parsed.data.empresaId },
      })
      if (existente) {
        return NextResponse.json(
          { error: `Ya existe un viaje con el remito ${parsed.data.remito} para esta empresa` },
          { status: 409 }
        )
      }
    }

    const { fechaViaje, tarifaEmpresa, ...resto } = parsed.data
    const creado = await prismaJm.viaje.create({
      data: {
        ...resto,
        fechaViaje: new Date(fechaViaje),
        tarifaEmpresa,
        operadorEmail: session.user.email!,
        tieneCupo: !!(parsed.data.cupo && parsed.data.cupo.trim().length > 0),
      },
      include: {
        empresa: { select: { razonSocial: true } },
        camion: { select: { patenteChasis: true } },
        chofer: { select: { nombre: true, apellido: true } },
      },
    })

    return NextResponse.json(creado, { status: 201 })
  } catch (error) {
    console.error("[POST /api/jm/viajes]", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    )
  }
}
