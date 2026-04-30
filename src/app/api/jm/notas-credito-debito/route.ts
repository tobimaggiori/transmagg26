/**
 * API JM Notas Crédito/Débito — listar y crear (sobre factura emitida).
 */

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prismaJm } from "@/jm/prisma"
import { esRolInterno } from "@/lib/permissions"
import { crearNotaEmpresaEmitidaJm } from "@/jm/lib/nota-cd-commands"
import type { Rol } from "@/types"

const crearSchema = z.object({
  facturaId: z.string().min(1),
  tipo: z.enum(["NC_EMITIDA", "ND_EMITIDA"]),
  subtipo: z.string().optional(),
  ivaPct: z.number().min(0).max(100).default(21),
  liberarViajes: z.boolean().default(false),
  descripcion: z.string().optional(),
  motivoDetalle: z.string().optional(),
  items: z.array(z.object({
    concepto: z.string().min(1),
    subtotal: z.number().nonnegative(),
  })).min(1),
})

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (!esRolInterno(session.user.rol as Rol)) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  const facturaId = req.nextUrl.searchParams.get("facturaId")
  const notas = await prismaJm.notaCreditoDebito.findMany({
    where: { ...(facturaId ? { facturaId } : {}) },
    include: { items: { orderBy: { orden: "asc" } } },
    orderBy: { creadoEn: "desc" },
  })
  return NextResponse.json(notas)
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (!esRolInterno(session.user.rol as Rol)) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  const body = await request.json()
  const parsed = crearSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos", detalles: parsed.error.flatten() }, { status: 400 })

  const r = await crearNotaEmpresaEmitidaJm(parsed.data, session.user.email!)
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.status })
  return NextResponse.json(r.nota, { status: 201 })
}
