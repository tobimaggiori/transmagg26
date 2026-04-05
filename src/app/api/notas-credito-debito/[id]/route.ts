/**
 * API Route para nota de crédito/débito individual.
 * GET /api/notas-credito-debito/[id] - Detalle completo con viajes afectados
 *
 * Solo accesible para roles internos (ADMIN_TRANSMAGG, OPERADOR_TRANSMAGG).
 * Las notas son inmutables después de la emisión ARCA. No existe PATCH.
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { esRolInterno } from "@/lib/permissions"
import type { Rol } from "@/types"

/**
 * GET: NextRequest { params: { id } } -> Promise<NextResponse>
 *
 * Dado el id de la nota, devuelve el detalle completo incluyendo
 * factura asociada (con empresa), liquidación asociada (con fletero),
 * cheque recibido asociado, operador, y viajesAfectados con datos del viaje.
 * Esta ruta existe para la vista de detalle de una NC/ND mostrando
 * todos los datos necesarios para verificar, descargar PDF y auditoría.
 *
 * Ejemplos:
 * GET /api/notas-credito-debito/nota1 (sesión ADMIN_TRANSMAGG)
 * // => 200 { id, tipo, subtipo, montoTotal, viajesAfectados: [...], factura: { empresa: { razonSocial } } }
 * GET /api/notas-credito-debito/inexistente (sesión ADMIN_TRANSMAGG)
 * // => 404 { error: "Nota no encontrada" }
 * GET /api/notas-credito-debito/nota1 (sesión FLETERO)
 * // => 403 { error: "Acceso denegado" }
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const rol = session.user.rol as Rol
  if (!esRolInterno(rol)) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  try {
    const nota = await prisma.notaCreditoDebito.findUnique({
      where: { id: params.id },
      include: {
        factura: {
          select: {
            id: true,
            nroComprobante: true,
            tipoCbte: true,
            total: true,
            estado: true,
            empresa: { select: { id: true, razonSocial: true, cuit: true, condicionIva: true } },
          },
        },
        liquidacion: {
          select: {
            id: true,
            nroComprobante: true,
            total: true,
            estado: true,
            fletero: { select: { id: true, razonSocial: true, cuit: true } },
          },
        },
        chequeRecibido: {
          select: {
            id: true,
            nroCheque: true,
            monto: true,
            bancoEmisor: true,
            estado: true,
            empresa: { select: { id: true, razonSocial: true } },
          },
        },
        operador: { select: { id: true, nombre: true, apellido: true } },
        viajesAfectados: {
          include: {
            viaje: {
              select: {
                id: true,
                fechaViaje: true,
                remito: true,
                mercaderia: true,
                procedencia: true,
                destino: true,
                kilos: true,
                estadoFactura: true,
                estadoLiquidacion: true,
              },
            },
          },
        },
      },
    })

    if (!nota) return NextResponse.json({ error: "Nota no encontrada" }, { status: 404 })

    return NextResponse.json(nota)
  } catch (error) {
    console.error("[GET /api/notas-credito-debito/[id]]", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
