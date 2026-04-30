/**
 * POST /api/contabilidad/iva/ajustes
 *   Crea un ajuste manual auditado en un período. Requiere permiso
 *   `contabilidad.iva.ajustes` y motivo no vacío.
 */

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { tienePermiso } from "@/lib/permissions"
import type { Rol } from "@/types"
import { permiteAjustes, type EstadoPeriodo } from "@/lib/iva-portal/periodo"

const crearAjusteSchema = z.object({
  periodoIvaId: z.string().min(1),
  tipoLibro: z.enum(["VENTAS", "COMPRAS"]),
  tipoAjuste: z.enum(["AGREGAR", "MODIFICAR", "EXCLUIR", "REDONDEO", "RECLASIFICAR"]),
  referenciaTipo: z.enum([
    "FACTURA_EMITIDA",
    "LIQUIDACION",
    "FACTURA_PROVEEDOR",
    "FACTURA_SEGURO",
    "NC_EMITIDA",
    "ND_EMITIDA",
    "NC_RECIBIDA",
    "ND_RECIBIDA",
    "MANUAL",
  ]).nullable().optional(),
  referenciaId: z.string().nullable().optional(),
  tipoComprobanteArca: z.number().int().optional(),
  puntoVenta: z.number().int().optional(),
  numeroDesde: z.number().int().optional(),
  numeroHasta: z.number().int().optional(),
  fechaComprobante: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  cuitContraparte: z.string().optional(),
  razonSocialContraparte: z.string().optional(),
  netoGravado: z.number().optional(),
  iva: z.number().optional(),
  exento: z.number().optional(),
  noGravado: z.number().optional(),
  percepcionIva: z.number().optional(),
  percepcionIibb: z.number().optional(),
  percepcionGanancias: z.number().optional(),
  total: z.number().optional(),
  alicuota: z.number().optional(),
  motivo: z.string().min(3, "Motivo obligatorio (mínimo 3 caracteres)"),
})

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const rol = session.user.rol as Rol
  if (!(await tienePermiso(session.user.id, rol, "contabilidad.iva.ajustes"))) {
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 })
  }

  const body = await request.json()
  const parsed = crearAjusteSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", detalles: parsed.error.flatten() }, { status: 400 })
  }

  const periodo = await prisma.periodoIva.findUnique({ where: { id: parsed.data.periodoIvaId } })
  if (!periodo) return NextResponse.json({ error: "Período no encontrado" }, { status: 404 })

  if (!permiteAjustes(periodo.estado as EstadoPeriodo)) {
    return NextResponse.json(
      { error: `El período está en estado ${periodo.estado} y no admite ajustes. Reabrir antes.` },
      { status: 422 },
    )
  }

  const { fechaComprobante, ...resto } = parsed.data
  const ajuste = await prisma.ajusteIvaPeriodo.create({
    data: {
      ...resto,
      mesAnio: periodo.mesAnio,
      fechaComprobante: fechaComprobante ? new Date(fechaComprobante) : null,
      creadoPorId: session.user.id,
    },
  })
  return NextResponse.json(ajuste, { status: 201 })
}
