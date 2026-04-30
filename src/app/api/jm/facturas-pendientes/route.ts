/**
 * GET /api/jm/facturas-pendientes?empresaId=...
 * Facturas pendientes/parcialmente cobradas con saldoPendiente y notasCD
 * disponibles para aplicar en el recibo.
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prismaJm } from "@/jm/prisma"
import { esRolInterno } from "@/lib/permissions"
import { calcularSaldoPendienteDoc } from "@/lib/cuenta-corriente"
import type { Rol } from "@/types"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (!esRolInterno(session.user.rol as Rol)) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  const empresaId = req.nextUrl.searchParams.get("empresaId")
  if (!empresaId) return NextResponse.json({ error: "empresaId requerido" }, { status: 400 })

  const facturas = await prismaJm.facturaEmitida.findMany({
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
          id: true, tipo: true, montoTotal: true, montoDescontado: true,
          nroComprobante: true, ptoVenta: true, nroComprobanteExterno: true,
        },
      },
      viajes: {
        select: {
          viajeId: true,
          viaje: { select: { id: true, fechaViaje: true, remito: true, procedencia: true, destino: true, kilos: true } },
        },
      },
    },
    orderBy: { emitidaEn: "asc" },
  })

  const resultado = facturas.map((f) => {
    const saldoSinND = calcularSaldoPendienteDoc(Number(f.total), {
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
      total: Number(f.total),
      emitidaEn: f.emitidaEn,
      neto: Number(f.neto),
      ivaMonto: Number(f.ivaMonto),
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
      viajes: f.viajes.map((v) => ({
        viajeId: v.viajeId,
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
