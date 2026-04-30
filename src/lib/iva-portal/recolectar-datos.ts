/**
 * recolectar-datos.ts — Lee asientos IVA del período desde Prisma y los
 * convierte en DTOs (ComprobanteIva + AlicuotaIva) listos para generar TXT.
 *
 * Esta es la **única función con Prisma** del módulo Portal IVA Transmagg.
 * Cuando portemos a JM, esta función se duplica leyendo de prismaJm; el
 * resto del módulo (formatos, generar-txt, validaciones) se reusa tal cual.
 *
 * Diseño:
 * - Un asiento Prisma = una fila de alícuota.
 * - Múltiples asientos del mismo (tipoReferencia, referenciaId) = mismo
 *   comprobante con varias alícuotas → 1 fila ComprobanteIva + N AlicuotaIva.
 * - Reglas IVA respetadas: LP solo Compras, NC sobre LP solo Compras,
 *   NC/ND sobre factura solo Ventas.
 */

import { prisma } from "@/lib/prisma"
import type { ComprobanteIva, AlicuotaIva, DatosIvaPeriodo, EmisorInfo } from "./types"
import { sumarImportes } from "@/lib/money"

// ─── Tipos auxiliares para queries Prisma ────────────────────────────────────

type AsientoConRelaciones = {
  id: string
  tipo: string
  tipoReferencia: string
  baseImponible: { toString(): string }
  alicuota: number
  montoIva: { toString(): string }
  facturaEmitidaId: string | null
  facturaProvId: string | null
  liquidacionId: string | null
  notaCreditoDebitoId: string | null
  facturaSeguroId: string | null
  facturaEmitida: {
    nroComprobante: string | null
    tipoCbte: number
    ptoVenta: number | null
    emitidaEn: Date
    neto: { toString(): string }
    ivaMonto: { toString(): string }
    total: { toString(): string }
    empresa: { razonSocial: string; cuit: string }
  } | null
  liquidacion: {
    nroComprobante: number | null
    tipoCbte: number | null
    ptoVenta: number | null
    grabadaEn: Date
    neto: { toString(): string }
    ivaMonto: { toString(): string }
    total: { toString(): string }
    fletero: { razonSocial: string; cuit: string }
  } | null
  facturaProveedor: {
    nroComprobante: string
    tipoCbte: string
    ptoVenta: string | null
    fechaCbte: Date
    neto: { toString(): string }
    ivaMonto: { toString(): string }
    total: { toString(): string }
    percepcionIIBB: { toString(): string } | null
    percepcionIVA: { toString(): string } | null
    percepcionGanancias: { toString(): string } | null
    proveedor: { razonSocial: string; cuit: string }
  } | null
  notaCreditoDebito: {
    tipo: string
    tipoCbte: number | null
    ptoVenta: number | null
    nroComprobante: number | null
    creadoEn: Date
    montoNeto: { toString(): string }
    montoIva: { toString(): string }
    montoTotal: { toString(): string }
    facturaId: string | null
    liquidacionId: string | null
    facturaProveedorId: string | null
    factura: { tipoCbte: number; empresa: { razonSocial: string; cuit: string } } | null
    liquidacion: { tipoCbte: number | null; fletero: { razonSocial: string; cuit: string } } | null
    facturaProveedor: { tipoCbte: string; proveedor: { razonSocial: string; cuit: string } } | null
  } | null
  facturaSeguro: {
    nroComprobante: string
    tipoComprobante: string
    fecha: Date
    neto: { toString(): string }
    iva: { toString(): string }
    total: { toString(): string }
    aseguradora: { razonSocial: string; cuit: string }
  } | null
}

function num(v: { toString(): string } | null | undefined): number {
  if (v == null) return 0
  return Number(v.toString())
}

// ─── Mapeos de strings a códigos ARCA ────────────────────────────────────────

/**
 * inferirTipoCbteProveedor: string -> number
 *
 * El campo `tipoCbte` de FacturaProveedor es un string libre. En producción
 * vienen valores variados según cómo se cargó:
 *   "A", "B", "C", "M", "X" — letras
 *   "001", "006", "011" — códigos zero-padded
 *   "1", "6", "11" — códigos sin padding
 *
 * Este helper mapea cualquiera de esos a un código ARCA. Si no reconoce,
 * devuelve 0 (que el caller debe tratar como "asiento descartable").
 *
 * Ejemplos:
 * inferirTipoCbteProveedor("A")    === 1
 * inferirTipoCbteProveedor("001")  === 1
 * inferirTipoCbteProveedor("1")    === 1
 * inferirTipoCbteProveedor("B")    === 6
 * inferirTipoCbteProveedor("M")    === 51
 * inferirTipoCbteProveedor("XXX")  === 0
 */
function inferirTipoCbteProveedor(tipoCbteRaw: string): number {
  const v = (tipoCbteRaw ?? "").trim().toUpperCase()
  if (!v) return 0
  // Letras de tipo de comprobante
  const letras: Record<string, number> = {
    A: 1, B: 6, C: 11, M: 51, X: 0,  // X no aplica fiscalmente
    // Notas (mismas letras pero contexto NC/ND — recibidas)
  }
  if (letras[v] !== undefined) return letras[v]
  // Numérico: parseInt funciona tanto con "001" como con "1"
  const n = parseInt(v, 10)
  if (Number.isFinite(n) && n > 0) return n
  return 0
}

/**
 * parseNroComprobante: string -> number
 *
 * El campo `nro_comprobante` de FacturaProveedor viene con formato variado:
 *   "0015-00011666" — formato completo PPPP-NNNNNNNN
 *   "00011666"      — solo número con padding
 *   "11666"         — número limpio
 *
 * Si tiene guión/espacio, tomamos la parte FINAL (que es el nro real);
 * si no, parseamos todo el string.
 *
 * Ejemplos:
 * parseNroComprobante("0015-00011666")   === 11666
 * parseNroComprobante("00011666")        === 11666
 * parseNroComprobante("11666")           === 11666
 * parseNroComprobante("")                === 0
 */
function parseNroComprobante(raw: string | null | undefined): number {
  if (!raw) return 0
  const trim = raw.trim()
  const partes = trim.split(/[\s\-_/]+/).filter(p => p.length > 0)
  const ultima = partes.length > 1 ? partes[partes.length - 1] : trim
  const n = parseInt(ultima, 10)
  return Number.isFinite(n) && n > 0 ? n : 0
}

/**
 * parsePuntoVenta: string -> number
 *
 * Si el campo trae "PPPP-NNNNNNNN", tomamos la PRIMERA parte (el ptoVenta).
 * Si no, parseamos directo. Default 1.
 *
 * Ejemplos:
 * parsePuntoVenta("0015")            === 15
 * parsePuntoVenta("0015-00011666")   === 15
 * parsePuntoVenta(null)              === 1
 */
function parsePuntoVenta(raw: string | null | undefined): number {
  if (!raw) return 1
  const trim = raw.trim()
  const partes = trim.split(/[\s\-_/]+/).filter(p => p.length > 0)
  const primera = partes[0] ?? trim
  const n = parseInt(primera, 10)
  return Number.isFinite(n) && n > 0 ? n : 1
}

/**
 * inferirTipoCbteNotaCD: NotaCD relations -> number
 *
 * Cuando NotaCreditoDebito.tipoCbte es null (NC sin CAE), derivar del tipo
 * de la nota + tipoCbte de la factura asociada usando la matriz cerrada:
 *
 *  Factura origen 1 (A)   → NC 3, ND 2
 *  Factura origen 6 (B)   → NC 8, ND 7
 *  Factura origen 201     → NC 203, ND 202
 *  CVLP origen 60         → NC 3, ND 2
 *  CVLP origen 61         → NC 8, ND 7
 *
 * Si no se puede determinar, devuelve 0.
 */
function inferirTipoCbteNotaCD(
  tipoNota: string,
  tipoCbteOrigen: number | null | undefined,
): number {
  if (!tipoCbteOrigen) return 0
  const esNC = tipoNota === "NC_EMITIDA" || tipoNota === "NC_RECIBIDA"
  const esND = tipoNota === "ND_EMITIDA" || tipoNota === "ND_RECIBIDA"
  if (!esNC && !esND) return 0
  // Matriz: la NC/ND usa el código de su grupo (A, B, FCE)
  if (tipoCbteOrigen === 1 || tipoCbteOrigen === 60) return esNC ? 3 : 2
  if (tipoCbteOrigen === 6 || tipoCbteOrigen === 61) return esNC ? 8 : 7
  if (tipoCbteOrigen === 201) return esNC ? 203 : 202
  return 0
}

// ─── Mapeo asiento → identidad de comprobante ────────────────────────────────

interface IdentidadComprobante {
  tipoComprobanteArca: number
  puntoVenta: number
  numeroDesde: number
  numeroHasta: number
  fecha: Date
  cuitContraparte: string
  razonSocialContraparte: string
  totalOperacion: number
  netoGravado: number
  ivaMonto: number
  percepcionIibb: number
  percepcionIva: number
  percepcionGanancias: number
  // Identidad lógica para agrupar asientos de un mismo comprobante
  claveAgrupamiento: string
}

/**
 * extraerIdentidad: extrae los campos del comprobante origen del asiento.
 * Devuelve null si no se puede determinar (por ejemplo, asiento huérfano).
 */
function extraerIdentidad(a: AsientoConRelaciones): IdentidadComprobante | null {
  // FACTURA_EMITIDA → usa facturaEmitida
  if (a.tipoReferencia === "FACTURA_EMITIDA" && a.facturaEmitida) {
    const f = a.facturaEmitida
    const numero = parseInt(f.nroComprobante ?? "0", 10) || 0
    if (!f.tipoCbte || numero === 0) return null
    return {
      tipoComprobanteArca: f.tipoCbte,
      puntoVenta: f.ptoVenta ?? 1,
      numeroDesde: numero,
      numeroHasta: numero,
      fecha: f.emitidaEn,
      cuitContraparte: f.empresa.cuit,
      razonSocialContraparte: f.empresa.razonSocial,
      totalOperacion: 0,
      netoGravado: 0,
      ivaMonto: 0,
      percepcionIibb: 0,
      percepcionIva: 0,
      percepcionGanancias: 0,
      claveAgrupamiento: `FE:${a.facturaEmitidaId}`,
    }
  }

  // LIQUIDACION → usa liquidacion (CVLP — siempre Compras)
  if (a.tipoReferencia === "LIQUIDACION" && a.liquidacion) {
    const l = a.liquidacion
    const numero = l.nroComprobante ?? 0
    if (numero === 0) return null
    return {
      tipoComprobanteArca: l.tipoCbte ?? 60,
      puntoVenta: l.ptoVenta ?? 1,
      numeroDesde: numero,
      numeroHasta: numero,
      fecha: l.grabadaEn,
      cuitContraparte: l.fletero.cuit,
      razonSocialContraparte: l.fletero.razonSocial,
      totalOperacion: 0,
      netoGravado: 0,
      ivaMonto: 0,
      percepcionIibb: 0,
      percepcionIva: 0,
      percepcionGanancias: 0,
      claveAgrupamiento: `LIQ:${a.liquidacionId}`,
    }
  }

  // FACTURA_PROVEEDOR → usa facturaProveedor
  if (a.tipoReferencia === "FACTURA_PROVEEDOR" && a.facturaProveedor) {
    const fp = a.facturaProveedor
    const tipoNum = inferirTipoCbteProveedor(fp.tipoCbte)
    // El nroComprobante puede venir como "0015-00011666" en lugar de solo el nro
    const numero = parseNroComprobante(fp.nroComprobante)
    // ptoVenta también puede venir embebido en el nroComprobante
    let ptoNum = parsePuntoVenta(fp.ptoVenta)
    // Si ptoVenta no venía, intentar extraerlo del nroComprobante
    if ((!fp.ptoVenta || fp.ptoVenta === "1") && fp.nroComprobante.includes("-")) {
      ptoNum = parsePuntoVenta(fp.nroComprobante)
    }
    if (tipoNum === 0 || numero === 0) return null
    return {
      tipoComprobanteArca: tipoNum,
      puntoVenta: ptoNum,
      numeroDesde: numero,
      numeroHasta: numero,
      fecha: fp.fechaCbte,
      cuitContraparte: fp.proveedor.cuit,
      razonSocialContraparte: fp.proveedor.razonSocial,
      totalOperacion: 0,
      netoGravado: 0,
      ivaMonto: 0,
      percepcionIibb: 0,
      percepcionIva: 0,
      percepcionGanancias: 0,
      claveAgrupamiento: `FP:${a.facturaProvId}`,
    }
  }

  // FACTURA_SEGURO → usa facturaSeguro
  if (a.tipoReferencia === "FACTURA_SEGURO" && a.facturaSeguro) {
    const fs = a.facturaSeguro
    // tipoComprobante puede ser "A", "B", "C", o variantes
    const codArca = inferirTipoCbteProveedor(fs.tipoComprobante)
    const numero = parseNroComprobante(fs.nroComprobante)
    if (codArca === 0 || numero === 0) return null
    return {
      tipoComprobanteArca: codArca,
      puntoVenta: 1,
      numeroDesde: numero,
      numeroHasta: numero,
      fecha: fs.fecha,
      cuitContraparte: fs.aseguradora.cuit,
      razonSocialContraparte: fs.aseguradora.razonSocial,
      totalOperacion: 0,
      netoGravado: 0,
      ivaMonto: 0,
      percepcionIibb: 0,
      percepcionIva: 0,
      percepcionGanancias: 0,
      claveAgrupamiento: `FS:${a.facturaSeguroId}`,
    }
  }

  // NOTA C/D → tomar contraparte de la entidad relacionada
  if (a.notaCreditoDebito) {
    const nc = a.notaCreditoDebito
    const numComp = nc.nroComprobante ?? 0

    // Si tipoCbte está null (NC sin CAE), derivarlo del comprobante asociado
    let tipoNum = nc.tipoCbte ?? 0
    if (tipoNum === 0) {
      const tipoOrigen =
        nc.factura?.tipoCbte ?? nc.liquidacion?.tipoCbte ?? null
      tipoNum = inferirTipoCbteNotaCD(nc.tipo, tipoOrigen)
    }

    let cuit = ""
    let razon = ""
    if (nc.factura) {
      cuit = nc.factura.empresa.cuit
      razon = nc.factura.empresa.razonSocial
    } else if (nc.liquidacion) {
      cuit = nc.liquidacion.fletero.cuit
      razon = nc.liquidacion.fletero.razonSocial
    } else if (nc.facturaProveedor) {
      cuit = nc.facturaProveedor.proveedor.cuit
      razon = nc.facturaProveedor.proveedor.razonSocial
    }

    if (tipoNum === 0 || numComp === 0) return null

    return {
      tipoComprobanteArca: tipoNum,
      puntoVenta: nc.ptoVenta ?? 1,
      numeroDesde: numComp,
      numeroHasta: numComp,
      fecha: nc.creadoEn,
      cuitContraparte: cuit,
      razonSocialContraparte: razon,
      totalOperacion: 0,
      netoGravado: 0,
      ivaMonto: 0,
      percepcionIibb: 0,
      percepcionIva: 0,
      percepcionGanancias: 0,
      claveAgrupamiento: `NCD:${a.notaCreditoDebitoId}`,
    }
  }

  return null
}

/**
 * extraerPercepciones: si el asiento es de FACTURA_PROVEEDOR, lee las
 * percepciones del modelo. En otros casos devuelve ceros.
 */
function extraerPercepciones(a: AsientoConRelaciones): {
  percepcionIibb: number
  percepcionIva: number
  percepcionGanancias: number
} {
  if (a.tipoReferencia === "FACTURA_PROVEEDOR" && a.facturaProveedor) {
    return {
      percepcionIibb: num(a.facturaProveedor.percepcionIIBB),
      percepcionIva: num(a.facturaProveedor.percepcionIVA),
      percepcionGanancias: num(a.facturaProveedor.percepcionGanancias),
    }
  }
  return { percepcionIibb: 0, percepcionIva: 0, percepcionGanancias: 0 }
}

/**
 * extraerTotalOperacion: deriva el total del comprobante origen.
 */
function extraerTotalOperacion(a: AsientoConRelaciones): number {
  if (a.facturaEmitida) return num(a.facturaEmitida.total)
  if (a.liquidacion) return num(a.liquidacion.total)
  if (a.facturaProveedor) return num(a.facturaProveedor.total)
  if (a.facturaSeguro) return num(a.facturaSeguro.total)
  if (a.notaCreditoDebito) return num(a.notaCreditoDebito.montoTotal)
  return 0
}

// ─── Recolección principal ───────────────────────────────────────────────────

/**
 * recolectarDatosIvaPeriodo: string -> Promise<DatosIvaPeriodo>
 *
 * Lee todos los AsientoIva del período (YYYY-MM) desde la DB de Transmagg,
 * los agrupa por comprobante origen, y devuelve los DTOs listos para
 * generar TXT.
 *
 * No aplica ajustes manuales — eso lo hace aplicar-ajustes.ts después.
 *
 * Ejemplo:
 * recolectarDatosIvaPeriodo("2026-04")
 *   // => { mesAnio, ventas: { comprobantes, alicuotas }, compras: {...} }
 */
export async function recolectarDatosIvaPeriodo(
  mesAnio: string,
): Promise<DatosIvaPeriodo> {
  const asientos = await prisma.asientoIva.findMany({
    where: { periodo: mesAnio },
    include: {
      facturaEmitida: {
        select: {
          nroComprobante: true,
          tipoCbte: true,
          ptoVenta: true,
          emitidaEn: true,
          neto: true,
          ivaMonto: true,
          total: true,
          empresa: { select: { razonSocial: true, cuit: true } },
        },
      },
      liquidacion: {
        select: {
          nroComprobante: true,
          tipoCbte: true,
          ptoVenta: true,
          grabadaEn: true,
          neto: true,
          ivaMonto: true,
          total: true,
          fletero: { select: { razonSocial: true, cuit: true } },
        },
      },
      facturaProveedor: {
        select: {
          nroComprobante: true,
          tipoCbte: true,
          ptoVenta: true,
          fechaCbte: true,
          neto: true,
          ivaMonto: true,
          total: true,
          percepcionIIBB: true,
          percepcionIVA: true,
          percepcionGanancias: true,
          proveedor: { select: { razonSocial: true, cuit: true } },
        },
      },
      notaCreditoDebito: {
        select: {
          tipo: true,
          tipoCbte: true,
          ptoVenta: true,
          nroComprobante: true,
          creadoEn: true,
          montoNeto: true,
          montoIva: true,
          montoTotal: true,
          facturaId: true,
          liquidacionId: true,
          facturaProveedorId: true,
          factura: { select: { tipoCbte: true, empresa: { select: { razonSocial: true, cuit: true } } } },
          liquidacion: { select: { tipoCbte: true, fletero: { select: { razonSocial: true, cuit: true } } } },
          facturaProveedor: { select: { tipoCbte: true, proveedor: { select: { razonSocial: true, cuit: true } } } },
        },
      },
      facturaSeguro: {
        select: {
          nroComprobante: true,
          tipoComprobante: true,
          fecha: true,
          neto: true,
          iva: true,
          total: true,
          aseguradora: { select: { razonSocial: true, cuit: true } },
        },
      },
    },
  })

  // Agrupar por (tipo VENTA/COMPRA, claveAgrupamiento) → ComprobanteIva + alícuotas[]
  type AgrupadoEntry = {
    cbte: ComprobanteIva
    alicuotas: AlicuotaIva[]
  }
  const ventasMap = new Map<string, AgrupadoEntry>()
  const comprasMap = new Map<string, AgrupadoEntry>()

  for (const a of asientos as unknown as AsientoConRelaciones[]) {
    const id = extraerIdentidad(a)
    if (!id) continue // asiento huérfano, lo ignoramos

    const map = a.tipo === "VENTA" ? ventasMap : comprasMap
    const tipoLibro = a.tipo === "VENTA" ? "VENTAS" : "COMPRAS"

    let entry = map.get(id.claveAgrupamiento)
    if (!entry) {
      const { percepcionIibb, percepcionIva, percepcionGanancias } = extraerPercepciones(a)
      const total = extraerTotalOperacion(a)
      const cbte: ComprobanteIva = {
        tipoLibro,
        tipoReferencia: a.tipoReferencia as ComprobanteIva["tipoReferencia"],
        referenciaId: a.facturaEmitidaId
          ?? a.liquidacionId
          ?? a.facturaProvId
          ?? a.notaCreditoDebitoId
          ?? a.facturaSeguroId,
        fecha: id.fecha,
        tipoComprobanteArca: id.tipoComprobanteArca,
        puntoVenta: id.puntoVenta,
        numeroDesde: id.numeroDesde,
        numeroHasta: id.numeroHasta,
        cuitContraparte: id.cuitContraparte,
        razonSocialContraparte: id.razonSocialContraparte,
        totalOperacion: total,
        netoGravado: 0, // se acumula con asientos
        noGravado: 0,
        noCategorizados: 0,
        exento: 0,
        pagosACuenta: 0,
        percepcionIibb,
        impuestosMunicipales: 0,
        impuestosInternos: 0,
        otrosTributos: 0,
        percepcionIva,
        percepcionGanancias,
        codigoMoneda: "PES",
        tipoCambio: 1,
        cantidadAlicuotas: 0, // se acumula
        codigoOperacion: "0",
        fechaPago: null,
      }
      entry = { cbte, alicuotas: [] }
      map.set(id.claveAgrupamiento, entry)
    }

    // Acumular neto e IVA por alícuota.
    // Para NCs los AsientoIva guardan baseImponible/montoIva negativos (para
    // restarse del IVA del período en cálculos internos). Pero el LID ARCA
    // espera importes POSITIVOS — el código de comprobante (3, 8, 13, 53,
    // 113, 203) ya identifica que es crédito, ARCA aplica el signo en su
    // motor. Si escribiéramos los componentes negativos no coincidirían con
    // el totalOperacion (que viene de montoTotal, siempre positivo) y ARCA
    // rechaza con "El Importe Total no coincide con la suma de los demás
    // montos".
    const esNotaCredito =
      a.tipoReferencia === "NC_EMITIDA" || a.tipoReferencia === "NC_RECIBIDA"
    const baseAsiento = esNotaCredito ? Math.abs(num(a.baseImponible)) : num(a.baseImponible)
    const ivaAsiento = esNotaCredito ? Math.abs(num(a.montoIva)) : num(a.montoIva)
    entry.cbte.netoGravado = sumarImportes([entry.cbte.netoGravado, baseAsiento])
    entry.cbte.cantidadAlicuotas += 1
    entry.alicuotas.push({
      tipoLibro,
      tipoComprobanteArca: id.tipoComprobanteArca,
      puntoVenta: id.puntoVenta,
      numeroComprobante: id.numeroDesde,
      netoGravado: baseAsiento,
      alicuotaPorcentaje: a.alicuota,
      montoIva: ivaAsiento,
      cuitProveedor: tipoLibro === "COMPRAS" ? id.cuitContraparte : undefined,
    })
  }

  const ventasComprobantes = Array.from(ventasMap.values()).map((e) => e.cbte)
  const ventasAlicuotas = Array.from(ventasMap.values()).flatMap((e) => e.alicuotas)
  const comprasComprobantes = Array.from(comprasMap.values()).map((e) => e.cbte)
  const comprasAlicuotas = Array.from(comprasMap.values()).flatMap((e) => e.alicuotas)

  // Ordenar por fecha y luego número
  const ordenar = <T extends { fecha?: Date; numeroComprobante?: number; numeroDesde?: number }>(arr: T[]) =>
    arr.sort((a, b) => {
      const fa = a.fecha?.getTime() ?? 0
      const fb = b.fecha?.getTime() ?? 0
      if (fa !== fb) return fa - fb
      const na = a.numeroDesde ?? a.numeroComprobante ?? 0
      const nb = b.numeroDesde ?? b.numeroComprobante ?? 0
      return na - nb
    })

  return {
    mesAnio,
    ventas: {
      comprobantes: ordenar(ventasComprobantes),
      alicuotas: ordenar(ventasAlicuotas),
    },
    compras: {
      comprobantes: ordenar(comprasComprobantes),
      alicuotas: ordenar(comprasAlicuotas),
    },
  }
}

/**
 * obtenerEmisorTransmagg: lee CUIT y razón social del singleton ConfiguracionArca.
 * Devuelve EmisorInfo para inyectar en la generación de TXT (cabecera de archivos).
 */
export async function obtenerEmisorTransmagg(): Promise<EmisorInfo> {
  const config = await prisma.configuracionArca.findUnique({ where: { id: "unico" } })
  if (!config) {
    throw new Error("ConfiguracionArca no encontrada — configurar CUIT y razón social antes de exportar IVA")
  }
  return {
    cuit: config.cuit,
    razonSocial: config.razonSocial,
  }
}
