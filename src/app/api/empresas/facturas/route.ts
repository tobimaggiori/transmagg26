/**
 * API Route para consulta de facturas de empresas.
 * GET /api/empresas/facturas?empresaId=X&nroComprobante=X&desde=YYYY-MM-DD&hasta=YYYY-MM-DD&estado=X
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { esRolInterno, esRolEmpresa } from "@/lib/permissions"
import { sumarImportes } from "@/lib/money"
import { resolverEmpresaIdPorEmail } from "@/lib/session-utils"
import type { Rol } from "@/types"

/**
 * GET: NextRequest -> Promise<NextResponse>
 *
 * Dado los filtros en query string (empresaId, nroComprobante, desde, hasta, estado),
 * devuelve hasta 200 facturas ordenadas por fecha desc con sus viajes, pagos y empresa.
 * Para roles de empresa fuerza el filtro por su propio empresaId.
 * Para roles internos permite consultar cualquier empresa o todas.
 * Calcula totalPagado para cada factura sumando sus pagos.
 * Existe para que la página /empresas/facturas pueda filtrar y consultar el historial.
 *
 * Ejemplos:
 * GET /api/empresas/facturas?empresaId=e1&desde=2026-01-01
 * // => 200 [{ id, nroComprobante, total, totalPagado, empresa, viajes, pagos, ... }]
 * GET /api/empresas/facturas (sesión ADMIN_EMPRESA, empresaId forzado)
 * // => 200 [facturas de su empresa]
 * GET /api/empresas/facturas (sin sesión)
 * // => 401
 */
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  }

  const rol = (session.user.rol ?? "OPERADOR_EMPRESA") as Rol

  if (!esRolInterno(rol) && !esRolEmpresa(rol)) {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 })
  }

  const { searchParams } = req.nextUrl
  let empresaId = searchParams.get("empresaId") ?? ""
  const nroComprobante = searchParams.get("nroComprobante") ?? ""
  const desde = searchParams.get("desde") ?? ""
  const hasta = searchParams.get("hasta") ?? ""
  const estado = searchParams.get("estado") ?? ""

  // Para roles empresa, forzar filtro por su propio empresaId
  if (esRolEmpresa(rol)) {
    const empresaIdResuelto = await resolverEmpresaIdPorEmail(session.user.email ?? "")
    if (!empresaIdResuelto) {
      return NextResponse.json({ error: "Sin empresa asociada" }, { status: 403 })
    }
    empresaId = empresaIdResuelto
  }

  const where: {
    empresaId?: string
    nroComprobante?: { contains: string }
    emitidaEn?: { gte?: Date; lte?: Date }
    estado?: string
  } = {}

  if (empresaId) where.empresaId = empresaId
  if (nroComprobante) where.nroComprobante = { contains: nroComprobante }
  if (desde) where.emitidaEn = { ...where.emitidaEn, gte: new Date(desde) }
  if (hasta) where.emitidaEn = { ...where.emitidaEn, lte: new Date(hasta + "T23:59:59") }
  if (estado) where.estado = estado

  const facturas = await prisma.facturaEmitida.findMany({
    where,
    include: {
      empresa: { select: { id: true, razonSocial: true, cuit: true } },
      viajes: {
        include: {
          viaje: {
            select: {
              fletero: { select: { razonSocial: true } },
              camion: { select: { patenteChasis: true } },
              chofer: { select: { nombre: true, apellido: true } },
            },
          },
        },
      },
      pagos: { select: { monto: true, tipoPago: true, fechaPago: true, referencia: true } },
      _count: { select: { notasCreditoDebito: true } },
    },
    orderBy: { emitidaEn: "desc" },
    take: 200,
  })

  const result = facturas.map((f) => ({
    ...f,
    totalPagado: sumarImportes(f.pagos.map((p: { monto: number }) => p.monto)),
  }))

  return NextResponse.json(result)
}
