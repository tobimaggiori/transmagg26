/**
 * POST /api/proveedores/pagos
 *
 * Registra un pago batch contra varias facturas de un proveedor en una sola
 * transacción atómica. Cada medio de pago se distribuye oldest-first entre
 * las facturas seleccionadas, generando los PagoProveedor correspondientes
 * y los instrumentos financieros únicos por medio.
 *
 * Solo accesible para ADMIN_TRANSMAGG y OPERADOR_TRANSMAGG.
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { esRolInterno } from "@/lib/permissions"
import { resolverOperadorId } from "@/lib/session-utils"
import { ejecutarRegistrarPagosProveedor } from "@/lib/pago-proveedor"
import { z } from "zod"
import type { Rol } from "@/types"

const chequePropioSchema = z.object({
  nroCheque: z.string().optional().nullable(),
  tipoDocBeneficiario: z.string().min(1),
  nroDocBeneficiario: z.string().min(1),
  mailBeneficiario: z.string().optional().nullable(),
  fechaEmision: z.string().min(1),
  fechaPago: z.string().min(1),
  clausula: z.string().optional().nullable(),
  descripcion1: z.string().optional().nullable(),
  descripcion2: z.string().optional().nullable(),
  cuentaId: z.string().min(1),
})

const medioSchema = z.discriminatedUnion("tipo", [
  z.object({
    tipo: z.literal("TRANSFERENCIA"),
    monto: z.number().positive(),
    cuentaId: z.string().min(1),
    comprobantePdfS3Key: z.string().optional().nullable(),
  }),
  z.object({
    tipo: z.literal("CHEQUE_PROPIO"),
    monto: z.number().positive(),
    comprobantePdfS3Key: z.string().optional().nullable(),
    chequePropio: chequePropioSchema,
  }),
  z.object({
    tipo: z.literal("CHEQUE_FISICO_TERCERO"),
    monto: z.number().positive(),
    chequeRecibidoId: z.string().min(1),
    comprobantePdfS3Key: z.string().optional().nullable(),
  }),
  z.object({
    tipo: z.literal("CHEQUE_ELECTRONICO_TERCERO"),
    monto: z.number().positive(),
    chequeRecibidoId: z.string().min(1),
    comprobantePdfS3Key: z.string().optional().nullable(),
  }),
  z.object({
    tipo: z.literal("TARJETA"),
    monto: z.number().positive(),
    comprobantePdfS3Key: z.string().optional().nullable(),
  }),
  z.object({
    tipo: z.literal("EFECTIVO"),
    monto: z.number().positive(),
    comprobantePdfS3Key: z.string().optional().nullable(),
  }),
])

const bodySchema = z.object({
  proveedorId: z.string().min(1),
  facturaIds: z.array(z.string().min(1)).min(1),
  fecha: z.string().datetime(),
  observaciones: z.string().optional().nullable(),
  medios: z.array(medioSchema).min(1),
})

export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const rol = (session.user.rol ?? "") as Rol
  if (!esRolInterno(rol)) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", detail: parsed.error.flatten() }, { status: 400 })
  }

  let operadorId: string
  try {
    operadorId = await resolverOperadorId(session.user)
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Operador no encontrado" }, { status: 401 })
  }

  try {
    const resultado = await ejecutarRegistrarPagosProveedor(parsed.data, operadorId)
    if (!resultado.ok) {
      return NextResponse.json({ error: resultado.error }, { status: resultado.status })
    }
    return NextResponse.json(resultado.result, { status: 201 })
  } catch (error) {
    console.error("POST /api/proveedores/pagos error:", error)
    return NextResponse.json({ error: "Error al registrar pagos", detail: String(error) }, { status: 500 })
  }
}
