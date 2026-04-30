/**
 * GET /api/facturas-pendientes?empresaId=...
 *
 * Devuelve las facturas emitidas pendientes o parcialmente cobradas
 * para la empresa indicada, con saldoPendiente calculado y viajes
 * para el picker de faltantes.
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { puedeAcceder } from "@/lib/permissions"
import { calcularSaldoPendienteDoc } from "@/lib/cuenta-corriente"
import type { Rol } from "@/types"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (!puedeAcceder(session.user.rol as Rol, "facturas")) {
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 })
  }

  const empresaId = req.nextUrl.searchParams.get("empresaId")
  if (!empresaId) return NextResponse.json({ error: "empresaId requerido" }, { status: 400 })

  const facturas = await prisma.facturaEmitida.findMany({
    where: {
      empresaId,
      estado: "EMITIDA",
      estadoCobro: { in: ["PENDIENTE", "PARCIALMENTE_COBRADA"] },
    },
    select: {
      id: true,
      nroComprobante: true,
      tipoCbte: true,
      total: true,
      emitidaEn: true,
      neto: true,
      ivaMonto: true,
      estadoCobro: true,
      pagos: { select: { monto: true } },
      notasCreditoDebito: {
        select: {
          id: true,
          tipo: true,
          montoTotal: true,
          montoDescontado: true,
          nroComprobante: true,
          ptoVenta: true,
          nroComprobanteExterno: true,
        },
      },
      viajes: {
        select: {
          viajeId: true,
          viaje: {
            select: {
              id: true,
              fleteroId: true,
              fechaViaje: true,
              remito: true,
              procedencia: true,
              destino: true,
              kilos: true,
            },
          },
        },
      },
    },
    orderBy: { emitidaEn: "asc" },
  })

  // Calcular saldoPendiente por factura: total + ND aplicadas − NC aplicadas − pagos.
  // Las NCs/NDs no aplicadas todavía se exponen como `disponible` por nota
  // para que el operador las elija explícitamente al armar el recibo.
  const resultado = facturas.map((f) => {
    const saldoSinND = calcularSaldoPendienteDoc(f.total, {
      pagos: f.pagos.map((p) => p.monto),
      ncAplicadas: f.notasCreditoDebito
        .filter((n) => n.tipo === "NC_EMITIDA" || n.tipo === "NC_RECIBIDA")
        .map((n) => n.montoDescontado),
    })
    const ndAplicadas = f.notasCreditoDebito
      .filter((n) => n.tipo === "ND_EMITIDA" || n.tipo === "ND_RECIBIDA")
      .reduce((acc, n) => acc + Number(n.montoDescontado), 0)
    const saldoPendiente = saldoSinND + ndAplicadas

    return {
      id: f.id,
      nroComprobante: f.nroComprobante,
      tipoCbte: f.tipoCbte,
      total: f.total,
      emitidaEn: f.emitidaEn,
      neto: f.neto,
      ivaMonto: f.ivaMonto,
      estadoCobro: f.estadoCobro,
      saldoPendiente,
      notasCD: f.notasCreditoDebito.map((n) => ({
        id: n.id,
        tipo: n.tipo,
        montoTotal: Number(n.montoTotal),
        montoDescontado: Number(n.montoDescontado),
        disponible: Math.max(0, Number(n.montoTotal) - Number(n.montoDescontado)),
        nro: n.nroComprobante
          ? `${String(n.ptoVenta ?? 1).padStart(4, "0")}-${String(n.nroComprobante).padStart(8, "0")}`
          : n.nroComprobanteExterno ?? null,
      })),
      viajes: f.viajes
        .filter((v) => v.viaje.fleteroId) // Solo viajes con fletero para faltantes
        .map((v) => ({
          viajeId: v.viajeId,
          fleteroId: v.viaje.fleteroId!,
          fechaViaje: v.viaje.fechaViaje,
          remito: v.viaje.remito,
          procedencia: v.viaje.procedencia,
          destino: v.viaje.destino,
          kilos: v.viaje.kilos,
        })),
    }
  })

  return NextResponse.json(resultado)
}
