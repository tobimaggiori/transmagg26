/**
 * API JM Recibos de Cobranza — listar y crear.
 */

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prismaJm } from "@/jm/prisma"
import { esRolInterno } from "@/lib/permissions"
import type { Rol } from "@/types"
import { ejecutarCrearReciboCobranzaJm } from "@/jm/lib/recibo-cobranza-commands"

const medioPagoSchema = z.object({
  tipo: z.enum(["TRANSFERENCIA", "ECHEQ", "CHEQUE_FISICO", "EFECTIVO", "SALDO_CTA_CTE"]),
  monto: z.number().positive(),
  cuentaId: z.string().optional(),
  fechaTransferencia: z.string().optional(),
  referencia: z.string().optional(),
  nroCheque: z.string().optional(),
  bancoEmisor: z.string().optional(),
  fechaEmision: z.string().optional(),
  fechaPago: z.string().optional(),
})

const crearSchema = z.object({
  empresaId: z.string().min(1),
  facturasAplicadas: z.array(z.object({
    facturaId: z.string().min(1),
    montoAplicado: z.number().positive(),
  })).min(1),
  notasAplicadas: z.array(z.object({
    notaId: z.string().min(1),
    monto: z.number().positive(),
  })).default([]),
  mediosPago: z.array(medioPagoSchema).default([]),
  retencionGanancias: z.number().min(0).default(0),
  retencionIIBB: z.number().min(0).default(0),
  retencionSUSS: z.number().min(0).default(0),
  faltantes: z.array(z.object({
    viajeId: z.string().min(1),
    monto: z.number().positive(),
    descripcion: z.string().optional(),
  })).default([]),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
})

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (!esRolInterno(session.user.rol as Rol)) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const empresaId = searchParams.get("empresaId")
  const desde = searchParams.get("desde")
  const hasta = searchParams.get("hasta")

  const recibos = await prismaJm.reciboCobranza.findMany({
    where: {
      ...(empresaId ? { empresaId } : {}),
      ...(desde || hasta ? {
        fecha: {
          ...(desde ? { gte: new Date(desde) } : {}),
          ...(hasta ? { lte: new Date(`${hasta}T23:59:59.999Z`) } : {}),
        },
      } : {}),
    },
    include: { empresa: { select: { id: true, razonSocial: true, cuit: true } } },
    orderBy: [{ fecha: "desc" }, { nro: "desc" }],
    take: 200,
  })
  return NextResponse.json(recibos)
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (!esRolInterno(session.user.rol as Rol)) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  const body = await request.json()
  const parsed = crearSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos", detalles: parsed.error.flatten() }, { status: 400 })

  const resultado = await ejecutarCrearReciboCobranzaJm(parsed.data, session.user.email!)
  if (!resultado.ok) return NextResponse.json({ error: resultado.error }, { status: resultado.status })

  return NextResponse.json(resultado.result, { status: 201 })
}
