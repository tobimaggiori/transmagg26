/**
 * Queries Prisma para listar comprobantes con pdfS3Key por tipo y rango de fecha.
 * Soporta 7 tipos de comprobante almacenados en R2.
 */

import { prisma } from "@/lib/prisma"

export const TIPOS_COMPROBANTE = [
  "facturas-emitidas",
  "liquidaciones",
  "notas-credito-debito",
  "ordenes-pago",
  "recibos-cobranza",
  "facturas-proveedor",
  "resumenes-bancarios",
  "resumenes-tarjeta",
] as const

export type TipoComprobante = (typeof TIPOS_COMPROBANTE)[number]

export interface ComprobanteListado {
  id: string
  tipo: TipoComprobante
  nombreArchivo: string
  fecha: Date
  r2Key: string
  r2KeysExtra: string[]
}

interface FiltroComprobantes {
  tipo: TipoComprobante
  desde: Date
  hasta: Date
}

async function listarFacturasEmitidas(desde: Date, hasta: Date): Promise<ComprobanteListado[]> {
  const items = await prisma.facturaEmitida.findMany({
    where: { pdfS3Key: { not: null }, emitidaEn: { gte: desde, lte: hasta } },
    select: { id: true, tipoCbte: true, nroComprobante: true, emitidaEn: true, pdfS3Key: true },
    orderBy: { emitidaEn: "desc" },
  })
  return items.map((f) => ({
    id: f.id,
    tipo: "facturas-emitidas",
    nombreArchivo: `FAC-${f.tipoCbte}-${f.nroComprobante ?? "SN"}.pdf`,
    fecha: f.emitidaEn,
    r2Key: f.pdfS3Key!,
    r2KeysExtra: [],
  }))
}

async function listarLiquidaciones(desde: Date, hasta: Date): Promise<ComprobanteListado[]> {
  const items = await prisma.liquidacion.findMany({
    where: { pdfS3Key: { not: null }, grabadaEn: { gte: desde, lte: hasta } },
    select: { id: true, nroComprobante: true, grabadaEn: true, pdfS3Key: true },
    orderBy: { grabadaEn: "desc" },
  })
  return items.map((l) => ({
    id: l.id,
    tipo: "liquidaciones",
    nombreArchivo: `LP-${l.nroComprobante ?? "SN"}.pdf`,
    fecha: l.grabadaEn,
    r2Key: l.pdfS3Key!,
    r2KeysExtra: [],
  }))
}

async function listarOrdenesPago(desde: Date, hasta: Date): Promise<ComprobanteListado[]> {
  const items = await prisma.ordenPago.findMany({
    where: { pdfS3Key: { not: null }, fecha: { gte: desde, lte: hasta } },
    select: {
      id: true, nro: true, fecha: true, pdfS3Key: true,
      pagos: { select: { comprobanteS3Key: true } },
    },
    orderBy: { fecha: "desc" },
  })
  return items.map((o) => ({
    id: o.id,
    tipo: "ordenes-pago",
    nombreArchivo: `OP-${o.nro}.pdf`,
    fecha: o.fecha,
    r2Key: o.pdfS3Key!,
    r2KeysExtra: o.pagos
      .map((p) => p.comprobanteS3Key)
      .filter((k): k is string => k != null),
  }))
}

async function listarRecibosCobranza(desde: Date, hasta: Date): Promise<ComprobanteListado[]> {
  const items = await prisma.reciboCobranza.findMany({
    where: { pdfS3Key: { not: null }, fecha: { gte: desde, lte: hasta } },
    select: { id: true, nro: true, fecha: true, pdfS3Key: true },
    orderBy: { fecha: "desc" },
  })
  return items.map((r) => ({
    id: r.id,
    tipo: "recibos-cobranza",
    nombreArchivo: `RC-${r.nro}.pdf`,
    fecha: r.fecha,
    r2Key: r.pdfS3Key!,
    r2KeysExtra: [],
  }))
}

async function listarFacturasProveedor(desde: Date, hasta: Date): Promise<ComprobanteListado[]> {
  const items = await prisma.facturaProveedor.findMany({
    where: { pdfS3Key: { not: null }, fechaCbte: { gte: desde, lte: hasta } },
    select: {
      id: true, nroComprobante: true, fechaCbte: true, pdfS3Key: true,
      pagos: { select: { comprobantePdfS3Key: true } },
    },
    orderBy: { fechaCbte: "desc" },
  })
  return items.map((f) => ({
    id: f.id,
    tipo: "facturas-proveedor",
    nombreArchivo: `FPROV-${f.nroComprobante}.pdf`,
    fecha: f.fechaCbte,
    r2Key: f.pdfS3Key!,
    r2KeysExtra: f.pagos
      .map((p) => p.comprobantePdfS3Key)
      .filter((k): k is string => k != null),
  }))
}

async function listarResumenesBancarios(desde: Date, hasta: Date): Promise<ComprobanteListado[]> {
  const desdeAnio = desde.getFullYear()
  const desdeMes = desde.getMonth() + 1
  const hastaAnio = hasta.getFullYear()
  const hastaMes = hasta.getMonth() + 1
  const items = await prisma.resumenBancario.findMany({
    where: {
      pdfS3Key: { not: null },
      OR: [
        { anio: { gt: desdeAnio, lt: hastaAnio } },
        { anio: desdeAnio, mes: { gte: desdeMes } },
        { anio: hastaAnio, mes: { lte: hastaMes } },
      ],
    },
    select: { id: true, mes: true, anio: true, pdfS3Key: true, cuenta: { select: { nombre: true } } },
    orderBy: [{ anio: "desc" }, { mes: "desc" }],
  })
  return items.map((r) => ({
    id: r.id,
    tipo: "resumenes-bancarios",
    nombreArchivo: `RES-${r.cuenta.nombre}-${r.anio}-${String(r.mes).padStart(2, "0")}.pdf`,
    fecha: new Date(r.anio, r.mes - 1, 1),
    r2Key: r.pdfS3Key!,
    r2KeysExtra: [],
  }))
}

async function listarResumenesTarjeta(desde: Date, hasta: Date): Promise<ComprobanteListado[]> {
  const items = await prisma.cierreResumenTarjeta.findMany({
    where: { pdfS3Key: { not: null }, fechaPago: { gte: desde, lte: hasta } },
    select: {
      id: true, mesAnio: true, fechaPago: true, pdfS3Key: true,
      tarjeta: { select: { nombre: true } },
    },
    orderBy: { fechaPago: "desc" },
  })
  return items.map((t) => ({
    id: t.id,
    tipo: "resumenes-tarjeta",
    nombreArchivo: `TARJ-${t.tarjeta.nombre}-${t.mesAnio}.pdf`,
    fecha: t.fechaPago,
    r2Key: t.pdfS3Key!,
    r2KeysExtra: [],
  }))
}

async function listarNotasCreditoDebito(desde: Date, hasta: Date): Promise<ComprobanteListado[]> {
  const items = await prisma.notaCreditoDebito.findMany({
    where: { pdfS3Key: { not: null }, creadoEn: { gte: desde, lte: hasta }, tipo: { in: ["NC_EMITIDA", "ND_EMITIDA"] } },
    select: { id: true, tipo: true, tipoCbte: true, nroComprobante: true, creadoEn: true, pdfS3Key: true },
    orderBy: { creadoEn: "desc" },
  })
  return items.map((n) => {
    const prefijo = n.tipo === "NC_EMITIDA" ? "NC" : "ND"
    return {
      id: n.id,
      tipo: "notas-credito-debito" as const,
      nombreArchivo: `${prefijo}-${n.tipoCbte ?? 0}-${n.nroComprobante ?? "SN"}.pdf`,
      fecha: n.creadoEn,
      r2Key: n.pdfS3Key!,
      r2KeysExtra: [],
    }
  })
}

const HANDLERS: Record<TipoComprobante, (desde: Date, hasta: Date) => Promise<ComprobanteListado[]>> = {
  "facturas-emitidas": listarFacturasEmitidas,
  "liquidaciones": listarLiquidaciones,
  "notas-credito-debito": listarNotasCreditoDebito,
  "ordenes-pago": listarOrdenesPago,
  "recibos-cobranza": listarRecibosCobranza,
  "facturas-proveedor": listarFacturasProveedor,
  "resumenes-bancarios": listarResumenesBancarios,
  "resumenes-tarjeta": listarResumenesTarjeta,
}

export async function listarComprobantes(filtro: FiltroComprobantes): Promise<ComprobanteListado[]> {
  const handler = HANDLERS[filtro.tipo]
  if (!handler) return []
  return handler(filtro.desde, filtro.hasta)
}

export async function limpiarKeysEnBD(comprobantes: ComprobanteListado[]): Promise<void> {
  const porTipo = new Map<TipoComprobante, string[]>()
  for (const c of comprobantes) {
    const ids = porTipo.get(c.tipo) ?? []
    ids.push(c.id)
    porTipo.set(c.tipo, ids)
  }

  const modelMap: Record<string, string> = {
    "facturas-emitidas": "facturaEmitida",
    "liquidaciones": "liquidacion",
    "notas-credito-debito": "notaCreditoDebito",
    "ordenes-pago": "ordenPago",
    "recibos-cobranza": "reciboCobranza",
    "facturas-proveedor": "facturaProveedor",
    "resumenes-bancarios": "resumenBancario",
    "resumenes-tarjeta": "cierreResumenTarjeta",
  }

  for (const [tipo, ids] of Array.from(porTipo.entries())) {
    const model = modelMap[tipo]
    if (!model) continue
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (prisma as any)[model].updateMany({
      where: { id: { in: ids } },
      data: { pdfS3Key: null },
    })
  }
}
