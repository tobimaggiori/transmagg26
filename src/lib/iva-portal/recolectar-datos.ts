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
    factura: { empresa: { razonSocial: string; cuit: string } } | null
    liquidacion: { fletero: { razonSocial: string; cuit: string } } | null
    facturaProveedor: { proveedor: { razonSocial: string; cuit: string } } | null
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
    const num = parseInt(f.nroComprobante ?? "0", 10) || 0
    return {
      tipoComprobanteArca: f.tipoCbte,
      puntoVenta: f.ptoVenta ?? 1,
      numeroDesde: num,
      numeroHasta: num,
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
    return {
      tipoComprobanteArca: l.tipoCbte ?? 60,
      puntoVenta: l.ptoVenta ?? 1,
      numeroDesde: l.nroComprobante ?? 0,
      numeroHasta: l.nroComprobante ?? 0,
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
    // Convertir tipoCbte string ("001"|"006") a número
    const tipoNum = parseInt(fp.tipoCbte, 10) || 0
    const num = parseInt(fp.nroComprobante, 10) || 0
    const ptoNum = parseInt(fp.ptoVenta ?? "1", 10) || 1
    return {
      tipoComprobanteArca: tipoNum,
      puntoVenta: ptoNum,
      numeroDesde: num,
      numeroHasta: num,
      fecha: fp.fechaCbte,
      cuitContraparte: fp.proveedor.cuit,
      razonSocialContraparte: fp.proveedor.razonSocial,
      totalOperacion: 0,
      netoGravado: 0,
      ivaMonto: 0,
      percepcionIibb: num,
      percepcionIva: 0,
      percepcionGanancias: 0,
      claveAgrupamiento: `FP:${a.facturaProvId}`,
    }
  }

  // FACTURA_SEGURO → usa facturaSeguro
  if (a.tipoReferencia === "FACTURA_SEGURO" && a.facturaSeguro) {
    const fs = a.facturaSeguro
    // tipoComprobante string ("A"|"B") → ARCA 1 o 6
    const codArca = fs.tipoComprobante === "A" ? 1 : fs.tipoComprobante === "B" ? 6 : 0
    const num = parseInt(fs.nroComprobante, 10) || 0
    return {
      tipoComprobanteArca: codArca,
      puntoVenta: 1,
      numeroDesde: num,
      numeroHasta: num,
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
    const tipoNum = nc.tipoCbte ?? 0
    const numComp = nc.nroComprobante ?? 0
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
          factura: { select: { empresa: { select: { razonSocial: true, cuit: true } } } },
          liquidacion: { select: { fletero: { select: { razonSocial: true, cuit: true } } } },
          facturaProveedor: { select: { proveedor: { select: { razonSocial: true, cuit: true } } } },
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

    // Acumular neto e IVA por alícuota
    const baseAsiento = num(a.baseImponible)
    const ivaAsiento = num(a.montoIva)
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
