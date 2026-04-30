/**
 * API JM Pagos a Proveedor — listar y crear.
 * Versión simple sin tarjeta/cheque (esos vienen después).
 */

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prismaJm } from "@/jm/prisma"
import { esRolInterno } from "@/lib/permissions"
import { sumarImportes } from "@/lib/money"
import { calcularSaldoPendiente } from "@/lib/cuenta-corriente"
import type { Rol } from "@/types"

const crearSchema = z.object({
  facturaProveedorId: z.string().min(1),
  monto: z.number().positive(),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  tipo: z.enum(["TRANSFERENCIA", "EFECTIVO", "CHEQUE_PROPIO", "CHEQUE_FISICO_TERCERO", "CHEQUE_ELECTRONICO_TERCERO", "TARJETA"]),
  cuentaId: z.string().optional(),
  observaciones: z.string().optional(),
  comprobantePdfS3Key: z.string().optional(),
})

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (!esRolInterno(session.user.rol as Rol)) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  const proveedorId = req.nextUrl.searchParams.get("proveedorId")
  const pagos = await prismaJm.pagoProveedor.findMany({
    where: { ...(proveedorId ? { facturaProveedor: { proveedorId } } : {}), anulado: false },
    include: { facturaProveedor: { include: { proveedor: { select: { razonSocial: true } } } } },
    orderBy: { fecha: "desc" },
    take: 200,
  })
  return NextResponse.json(pagos)
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (!esRolInterno(session.user.rol as Rol)) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  const body = await request.json()
  const parsed = crearSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos", detalles: parsed.error.flatten() }, { status: 400 })

  const factura = await prismaJm.facturaProveedor.findUnique({
    where: { id: parsed.data.facturaProveedorId },
    include: { pagos: { where: { anulado: false }, select: { monto: true } } },
  })
  if (!factura) return NextResponse.json({ error: "Factura no encontrada" }, { status: 404 })

  const saldo = calcularSaldoPendiente(Number(factura.total), factura.pagos.map((p) => p.monto))
  if (parsed.data.monto > saldo + 0.01) {
    return NextResponse.json({ error: `El monto ($${parsed.data.monto.toFixed(2)}) supera el saldo pendiente ($${saldo.toFixed(2)})` }, { status: 400 })
  }

  const { fecha, ...resto } = parsed.data
  const pago = await prismaJm.$transaction(async (tx) => {
    const p = await tx.pagoProveedor.create({
      data: {
        ...resto,
        fecha: new Date(fecha),
        operadorEmail: session.user.email!,
      },
    })
    // Actualizar estadoPago
    const totalPagadoNuevo = sumarImportes([...factura.pagos.map((x) => x.monto), parsed.data.monto])
    const saldoFinal = Number(factura.total) - totalPagadoNuevo
    const nuevoEstado = saldoFinal <= 0.01 ? "PAGADA" : "PARCIALMENTE_PAGADA"
    await tx.facturaProveedor.update({ where: { id: factura.id }, data: { estadoPago: nuevoEstado } })
    return p
  })

  return NextResponse.json(pago, { status: 201 })
}
