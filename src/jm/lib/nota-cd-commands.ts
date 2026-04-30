/**
 * nota-cd-commands.ts (JM)
 *
 * Versión simplificada: emisión de NC/ND sobre factura emitida.
 * Items conceptuales con monto por concepto. IVA proporcional al de la
 * factura origen.
 *
 * Sin ARCA (numeración interna correlativa por tipoCbte/ptoVenta).
 */

import { prismaJm } from "@/jm/prisma"
import { sumarImportes } from "@/lib/money"

export type ItemNotaInput = { concepto: string; subtotal: number }

export type CrearNotaEmpresaJmInput = {
  facturaId: string
  tipo: "NC_EMITIDA" | "ND_EMITIDA"
  subtipo?: string
  items: ItemNotaInput[]
  ivaPct: number
  liberarViajes?: boolean // solo para NC
  descripcion?: string
  motivoDetalle?: string
}

type Resultado =
  | { ok: true; nota: { id: string; tipoCbte: number | null; nroComprobante: number | null; ptoVenta: number | null; montoTotal: unknown } }
  | { ok: false; status: number; error: string }

const MAPEO_TIPO_CBTE: Record<number, { nc: number; nd: number }> = {
  1: { nc: 3, nd: 2 },     // A → NC A / ND A
  6: { nc: 8, nd: 7 },     // B → NC B / ND B
  201: { nc: 203, nd: 202 }, // A MiPyME
}

export async function crearNotaEmpresaEmitidaJm(
  input: CrearNotaEmpresaJmInput,
  operadorEmail: string,
): Promise<Resultado> {
  const factura = await prismaJm.facturaEmitida.findUnique({
    where: { id: input.facturaId },
    select: {
      id: true, empresaId: true, tipoCbte: true, ptoVenta: true,
      nroComprobante: true, total: true, neto: true, ivaMonto: true,
    },
  })
  if (!factura) return { ok: false, status: 404, error: "Factura no encontrada" }

  const mapeo = MAPEO_TIPO_CBTE[factura.tipoCbte]
  if (!mapeo) return { ok: false, status: 422, error: `No se puede emitir NC/ND sobre tipoCbte ${factura.tipoCbte}` }

  const tipoCbte = input.tipo === "NC_EMITIDA" ? mapeo.nc : mapeo.nd
  const ptoVenta = factura.ptoVenta ?? 1

  // Calcular totales desde items
  const subtotalSum = sumarImportes(input.items.map((it) => it.subtotal))
  const montoNeto = subtotalSum
  const montoIva = Math.round((montoNeto * input.ivaPct / 100) * 100) / 100
  const montoTotal = sumarImportes([montoNeto, montoIva])

  if (montoTotal <= 0) return { ok: false, status: 400, error: "El total de la nota debe ser mayor a cero" }

  // NC: validar que no supere lo que queda por descontar
  if (input.tipo === "NC_EMITIDA") {
    const totalNCEmitidasPrev = await prismaJm.notaCreditoDebito.aggregate({
      where: { facturaId: factura.id, tipo: "NC_EMITIDA" },
      _sum: { montoTotal: true },
    })
    const yaEmitido = Number(totalNCEmitidasPrev._sum.montoTotal ?? 0)
    if (yaEmitido + montoTotal > Number(factura.total) + 0.01) {
      return { ok: false, status: 422, error: `El total de NCs (${yaEmitido + montoTotal}) supera el total de la factura (${factura.total})` }
    }
  }

  const nota = await prismaJm.$transaction(async (tx) => {
    // Numeración correlativa
    const ultima = await tx.notaCreditoDebito.findFirst({
      where: { tipoCbte, ptoVenta },
      orderBy: { nroComprobante: "desc" },
      select: { nroComprobante: true },
    })
    const proximoNro = (ultima?.nroComprobante ?? 0) + 1

    const periodo = new Date().toISOString().slice(0, 7)

    const n = await tx.notaCreditoDebito.create({
      data: {
        tipo: input.tipo,
        subtipo: input.subtipo,
        facturaId: factura.id,
        montoNeto,
        montoIva,
        montoTotal,
        descripcion: input.descripcion,
        motivoDetalle: input.motivoDetalle,
        estado: "EMITIDA",
        nroComprobante: proximoNro,
        ptoVenta,
        tipoCbte,
        cbteAsocTipo: factura.tipoCbte,
        cbteAsocPtoVta: factura.ptoVenta,
        cbteAsocNro: factura.nroComprobante ? parseInt(factura.nroComprobante, 10) : null,
        arcaEstado: "PENDIENTE",
        operadorEmail,
      },
    })

    // Items
    for (let i = 0; i < input.items.length; i++) {
      await tx.notaCreditoDebitoItem.create({
        data: {
          notaId: n.id,
          orden: i + 1,
          concepto: input.items[i].concepto,
          subtotal: input.items[i].subtotal,
        },
      })
    }

    // Asiento IVA — signo según tipo
    if (montoIva > 0) {
      await tx.asientoIva.create({
        data: {
          notaCreditoDebitoId: n.id,
          tipoReferencia: input.tipo,
          tipo: "VENTA",
          baseImponible: input.tipo === "NC_EMITIDA" ? -montoNeto : montoNeto,
          alicuota: input.ivaPct,
          montoIva: input.tipo === "NC_EMITIDA" ? -montoIva : montoIva,
          periodo,
        },
      })
    }

    // NC: opcionalmente liberar viajes (volver a PENDIENTE_FACTURAR)
    if (input.tipo === "NC_EMITIDA" && input.liberarViajes) {
      const enFactura = await tx.viajeEnFactura.findMany({
        where: { facturaId: factura.id },
        select: { viajeId: true },
      })
      const viajeIds = enFactura.map((vf) => vf.viajeId)
      if (viajeIds.length > 0) {
        await tx.viaje.updateMany({
          where: { id: { in: viajeIds } },
          data: { estadoFactura: "PENDIENTE_FACTURAR" },
        })
      }
    }

    return n
  })

  return {
    ok: true,
    nota: {
      id: nota.id,
      tipoCbte: nota.tipoCbte,
      nroComprobante: nota.nroComprobante,
      ptoVenta: nota.ptoVenta,
      montoTotal: nota.montoTotal,
    },
  }
}
