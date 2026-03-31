/**
 * POST /api/proveedores/[id]/pago
 *
 * Registra un pago a un proveedor contra una factura específica (transacción atómica).
 * Solo accesible para ADMIN_TRANSMAGG y OPERADOR_TRANSMAGG.
 *
 * Efectos secundarios delegados a procesarPagoProveedor() en src/lib/pago-proveedor.ts:
 *   TRANSFERENCIA              → MovimientoSinFactura EGRESO
 *   CHEQUE_PROPIO              → ChequeEmitido (estado EMITIDO)
 *   CHEQUE_FISICO_TERCERO      → ChequeRecibido.estado = ENDOSADO_PROVEEDOR
 *   CHEQUE_ELECTRONICO_TERCERO → ChequeRecibido.estado = ENDOSADO_PROVEEDOR
 *   TARJETA_*                  → busca o crea ResumenTarjeta del mes; crea GastoTarjeta
 *   EFECTIVO                   → solo PagoProveedor
 *
 * Actualiza estadoPago de la factura: PAGADA | PARCIALMENTE_PAGADA
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { esRolInterno } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"
import { resolverOperadorId } from "@/lib/session-utils"
import { procesarPagoProveedor } from "@/lib/pago-proveedor"
import { z } from "zod"
import type { Rol } from "@/types"

const pagoSchema = z.object({
  facturaProveedorId: z.string().min(1),
  fecha: z.string().datetime(),
  monto: z.number().positive(),
  tipo: z.enum([
    "TRANSFERENCIA",
    "CHEQUE_PROPIO",
    "CHEQUE_FISICO_TERCERO",
    "CHEQUE_ELECTRONICO_TERCERO",
    "TARJETA_CREDITO",
    "TARJETA_DEBITO",
    "TARJETA_PREPAGA",
    "EFECTIVO",
  ]),
  observaciones: z.string().optional().nullable(),
  comprobantePdfS3Key: z.string().optional().nullable(),
  cuentaId: z.string().optional().nullable(),
  chequeRecibidoId: z.string().optional().nullable(),
  tarjetaId: z.string().optional().nullable(),
  chequeNro: z.string().optional().nullable(),
  chequeFechaPago: z.string().optional().nullable(),
  chequeTipoDocBeneficiario: z.string().optional().nullable(),
  chequeNroDocBeneficiario: z.string().optional().nullable(),
})

/**
 * POST: NextRequest, { params } -> Promise<NextResponse>
 *
 * Registra un pago a proveedor en transacción atómica con todos los efectos secundarios.
 *
 * Ejemplos:
 * POST({ facturaProveedorId, fecha, monto, tipo: "EFECTIVO" }) === 201 { pago }
 * POST({ tipo: "TARJETA_CREDITO", tarjetaId }) === 201 { pago, resumenTarjetaId }
 * POST (sin auth) === 401
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const rol = (session.user.rol ?? "") as Rol
  if (!esRolInterno(rol)) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  const { id: proveedorId } = await params

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 })
  }

  const parsed = pagoSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", detail: parsed.error.flatten() }, { status: 400 })
  }

  const data = parsed.data
  const fechaPago = new Date(data.fecha)

  let operadorId: string | null = null
  try {
    operadorId = await resolverOperadorId(session.user)
  } catch {
    // operadorId optional
  }

  try {
    const proveedor = await prisma.proveedor.findUnique({
      where: { id: proveedorId },
      select: { id: true, razonSocial: true },
    })
    if (!proveedor) return NextResponse.json({ error: "Proveedor no encontrado" }, { status: 404 })

    const factura = await prisma.facturaProveedor.findUnique({
      where: { id: data.facturaProveedorId },
      include: { pagos: { select: { monto: true } } },
    })
    if (!factura || factura.proveedorId !== proveedorId) {
      return NextResponse.json({ error: "Factura no encontrada" }, { status: 404 })
    }

    const totalPagadoAnterior = factura.pagos.reduce((acc, p) => acc + p.monto, 0)

    const result = await prisma.$transaction(async (tx) => {
      return procesarPagoProveedor(
        tx,
        {
          facturaId: factura.id,
          facturaTotal: factura.total,
          totalPagadoAnterior,
          facturaNroComprobante: factura.nroComprobante,
          proveedorId,
          proveedorRazonSocial: proveedor.razonSocial,
          operadorId,
        },
        {
          fecha: fechaPago,
          monto: data.monto,
          tipo: data.tipo,
          observaciones: data.observaciones,
          comprobantePdfS3Key: data.comprobantePdfS3Key,
          cuentaId: data.cuentaId,
          chequeRecibidoId: data.chequeRecibidoId,
          tarjetaId: data.tarjetaId,
          chequeNro: data.chequeNro,
          chequeFechaPago: data.chequeFechaPago,
          chequeTipoDocBeneficiario: data.chequeTipoDocBeneficiario,
          chequeNroDocBeneficiario: data.chequeNroDocBeneficiario,
        }
      )
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error(`POST /api/proveedores/${proveedorId}/pago error:`, error)
    return NextResponse.json({ error: "Error al registrar pago", detail: String(error) }, { status: 500 })
  }
}
