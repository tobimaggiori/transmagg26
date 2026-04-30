import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prismaJm } from "@/jm/prisma"
import { esRolInterno } from "@/lib/permissions"
import type { Rol } from "@/types"

const schema = z.object({
  tipoImpuesto: z.string().min(1),
  descripcion: z.string().optional(),
  periodo: z.string().min(1),
  monto: z.number().positive(),
  fechaPago: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  medioPago: z.enum(["TRANSFERENCIA", "EFECTIVO", "TARJETA"]),
  cuentaId: z.string().optional(),
  tarjetaId: z.string().optional(),
  observaciones: z.string().optional(),
})

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (!esRolInterno(session.user.rol as Rol)) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  const desde = req.nextUrl.searchParams.get("desde")
  const hasta = req.nextUrl.searchParams.get("hasta")

  const pagos = await prismaJm.pagoImpuesto.findMany({
    where: {
      ...(desde || hasta ? {
        fechaPago: {
          ...(desde ? { gte: new Date(desde) } : {}),
          ...(hasta ? { lte: new Date(`${hasta}T23:59:59.999Z`) } : {}),
        },
      } : {}),
    },
    include: { cuenta: { select: { id: true, nombre: true } }, tarjeta: { select: { id: true, nombre: true } } },
    orderBy: { fechaPago: "desc" },
    take: 200,
  })
  return NextResponse.json(pagos)
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (!esRolInterno(session.user.rol as Rol)) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos", detalles: parsed.error.flatten() }, { status: 400 })

  const { fechaPago, ...resto } = parsed.data
  const pago = await prismaJm.pagoImpuesto.create({
    data: { ...resto, fechaPago: new Date(fechaPago), operadorEmail: session.user.email! },
  })
  return NextResponse.json(pago, { status: 201 })
}
