import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prismaJm } from "@/jm/prisma"
import { esRolInterno } from "@/lib/permissions"
import type { Rol } from "@/types"

const schema = z.object({
  aseguradoraId: z.string().min(1),
  nroComprobante: z.string().min(1),
  tipoComprobante: z.string().default("A"),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  periodoDesde: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  periodoHasta: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  neto: z.number().nonnegative(),
  iva: z.number().nonnegative(),
  total: z.number().positive(),
  formaPago: z.enum(["CONTADO", "TARJETA"]),
  medioPagoContado: z.enum(["TRANSFERENCIA", "EFECTIVO"]).optional(),
  cuentaId: z.string().optional(),
  tarjetaId: z.string().optional(),
  cantCuotas: z.number().int().positive().optional(),
  montoCuota: z.number().positive().optional(),
})

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (!esRolInterno(session.user.rol as Rol)) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  const aseguradoraId = req.nextUrl.searchParams.get("aseguradoraId")
  const facturas = await prismaJm.facturaSeguro.findMany({
    where: { ...(aseguradoraId ? { aseguradoraId } : {}) },
    include: {
      aseguradora: { select: { id: true, razonSocial: true, cuit: true } },
      cuenta: { select: { id: true, nombre: true } },
      tarjeta: { select: { id: true, nombre: true } },
      polizas: { select: { id: true, nroPoliza: true, vigenciaHasta: true } },
    },
    orderBy: { fecha: "desc" },
    take: 200,
  })
  return NextResponse.json(facturas)
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (!esRolInterno(session.user.rol as Rol)) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos", detalles: parsed.error.flatten() }, { status: 400 })

  const dup = await prismaJm.facturaSeguro.findFirst({
    where: { aseguradoraId: parsed.data.aseguradoraId, nroComprobante: parsed.data.nroComprobante },
  })
  if (dup) return NextResponse.json({ error: `Ya existe esa factura para esa aseguradora` }, { status: 409 })

  const { fecha, periodoDesde, periodoHasta, ...resto } = parsed.data

  const f = await prismaJm.facturaSeguro.create({
    data: {
      ...resto,
      fecha: new Date(fecha),
      periodoDesde: new Date(periodoDesde),
      periodoHasta: new Date(periodoHasta),
      operadorEmail: session.user.email!,
    },
  })
  return NextResponse.json(f, { status: 201 })
}
