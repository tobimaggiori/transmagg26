import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prismaJm } from "@/jm/prisma"
import { esRolInterno } from "@/lib/permissions"
import type { Rol } from "@/types"

const schema = z.object({
  nombre: z.string().min(1),
  tipo: z.enum(["BANCO", "BILLETERA_VIRTUAL", "BROKER"]),
  bancoId: z.string().nullable().optional(),
  billeteraId: z.string().nullable().optional(),
  brokerId: z.string().nullable().optional(),
  moneda: z.enum(["PESOS", "DOLARES", "OTRO"]),
  saldoInicial: z.number().default(0),
  fechaSaldoInicial: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  nroCuenta: z.string().nullable().optional(),
  cbu: z.string().nullable().optional(),
  alias: z.string().nullable().optional(),
})

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (!esRolInterno(session.user.rol as Rol)) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  return NextResponse.json(await prismaJm.cuenta.findMany({
    include: { banco: true, billetera: true, broker: true },
    orderBy: [{ activa: "desc" }, { nombre: "asc" }],
  }))
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (!esRolInterno(session.user.rol as Rol)) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos", detalles: parsed.error.flatten() }, { status: 400 })

  const dup = await prismaJm.cuenta.findUnique({ where: { nombre: parsed.data.nombre } })
  if (dup) return NextResponse.json({ error: "Ya existe una cuenta con ese nombre" }, { status: 409 })

  // Validar consistencia: el tipo debe coincidir con la FK provista
  const data = parsed.data
  if (data.tipo === "BANCO" && !data.bancoId) return NextResponse.json({ error: "Falta bancoId" }, { status: 400 })
  if (data.tipo === "BILLETERA_VIRTUAL" && !data.billeteraId) return NextResponse.json({ error: "Falta billeteraId" }, { status: 400 })
  if (data.tipo === "BROKER" && !data.brokerId) return NextResponse.json({ error: "Falta brokerId" }, { status: 400 })

  const { fechaSaldoInicial, ...resto } = data
  const cuenta = await prismaJm.cuenta.create({
    data: {
      ...resto,
      ...(fechaSaldoInicial ? { fechaSaldoInicial: new Date(fechaSaldoInicial) } : {}),
    },
  })
  return NextResponse.json(cuenta, { status: 201 })
}
