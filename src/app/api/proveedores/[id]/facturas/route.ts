/**
 * API Route para facturas de proveedor.
 * POST /api/proveedores/[id]/facturas - Carga factura de proveedor y genera asiento IVA COMPRAS
 *
 * Solo accesible para ADMIN_TRANSMAGG y OPERADOR_TRANSMAGG.
 */

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { esRolInterno } from "@/lib/permissions"
import type { Rol } from "@/types"
import { calcularIva, sumarImportes, maxMonetario, restarImportes } from "@/lib/money"

const crearFacturaProveedorSchema = z.object({
  nroComprobante: z.string().min(1, "El número de comprobante es requerido"),
  tipoCbte: z.enum(["A", "B", "C", "M", "X"]),
  neto: z.number().positive("El neto debe ser mayor a 0"),
  alicuotaIva: z.number().min(0).default(21),
  total: z.number().positive("El total debe ser mayor a 0"),
  fechaCbte: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida (YYYY-MM-DD)"),
  concepto: z.string().optional(),
})

/**
 * POST: NextRequest { params: { id } } -> Promise<NextResponse>
 *
 * Dado el id del proveedor y el body { nroComprobante, tipoCbte, neto, alicuotaIva, total, fechaCbte },
 * crea una FacturaProveedor y su correspondiente asiento IVA COMPRAS en una transacción.
 * Existe para registrar las facturas recibidas de proveedores y actualizar
 * automáticamente el libro IVA de compras del período correspondiente.
 *
 * Ejemplos:
 * POST /api/proveedores/p1/facturas { nroComprobante: "0001-00000123", tipoCbte: "A", neto: 10000, alicuotaIva: 21, total: 12100, fechaCbte: "2026-03-15" }
 * // => 201 { id, nroComprobante: "0001-00000123", total: 12100, asientoIva: { montoIva: 2100 } }
 * POST /api/proveedores/noexiste/facturas { ... }
 * // => 404 { error: "Proveedor no encontrado" }
 * POST /api/proveedores/p1/facturas { neto: -100 }
 * // => 400 { error: "Datos inválidos", detalles: {...} }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const rol = session.user.rol as Rol
  if (!esRolInterno(rol)) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  try {
    const proveedor = await prisma.proveedor.findUnique({ where: { id: params.id, activo: true } })
    if (!proveedor) return NextResponse.json({ error: "Proveedor no encontrado" }, { status: 404 })

    const body = await request.json()
    const parsed = crearFacturaProveedorSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos", detalles: parsed.error.flatten() }, { status: 400 })
    }

    const { nroComprobante, tipoCbte, neto, alicuotaIva, total, fechaCbte, concepto } = parsed.data
    const ivaMonto = calcularIva(neto, alicuotaIva)
    const periodo = fechaCbte.slice(0, 7)

    const result = await prisma.$transaction(async (tx) => {
      const factura = await tx.facturaProveedor.create({
        data: {
          proveedorId: params.id,
          nroComprobante,
          tipoCbte,
          neto,
          ivaMonto,
          total,
          fechaCbte: new Date(fechaCbte),
          concepto: concepto ?? null,
        },
      })

      const asientoIva = await tx.asientoIva.create({
        data: {
          facturaProvId: factura.id,
          tipoReferencia: "FACTURA_PROVEEDOR",
          tipo: "COMPRA",
          baseImponible: neto,
          alicuota: alicuotaIva,
          montoIva: ivaMonto,
          periodo,
        },
      })

      return { factura, asientoIva }
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error("[POST /api/proveedores/[id]/facturas]", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

/**
 * GET: NextRequest { params: { id } } -> Promise<NextResponse>
 *
 * Dado el id del proveedor, devuelve sus facturas con pagos y saldo pendiente.
 * Existe para mostrar el historial de comprobantes de un proveedor
 * con información sobre el estado de pago de cada uno.
 *
 * Ejemplos:
 * GET /api/proveedores/p1/facturas
 * // => 200 [{ id, nroComprobante, total, saldoPendiente, pagos: [...] }]
 * GET /api/proveedores/noexiste/facturas
 * // => 404 { error: "Proveedor no encontrado" }
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const rol = session.user.rol as Rol
  if (!esRolInterno(rol)) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  const proveedor = await prisma.proveedor.findUnique({ where: { id: params.id } })
  if (!proveedor) return NextResponse.json({ error: "Proveedor no encontrado" }, { status: 404 })

  const facturas = await prisma.facturaProveedor.findMany({
    where: { proveedorId: params.id },
    include: { pagos: { select: { monto: true, tipo: true, fecha: true } } },
    orderBy: { fechaCbte: "desc" },
  })

  const facturasConSaldo = facturas.map((f) => {
    const pagado = sumarImportes(f.pagos.map((p) => p.monto))
    return { ...f, saldoPendiente: maxMonetario(0, restarImportes(f.total, pagado)) }
  })

  return NextResponse.json(facturasConSaldo)
}
