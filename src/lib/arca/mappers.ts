/**
 * Propósito: Mapeo entre modelos internos de Transmagg y payloads de ARCA WSFEv1.
 * Aísla la transformación de datos para que la lógica de negocio y las routes
 * no necesiten conocer la estructura interna de ARCA.
 */

import type { FECAERequest, FECAEDetRequest, AlicuotaIva, ComprobanteAsociado } from "./types"
import { m, type MonetaryInput } from "@/lib/money"

// ─── Helpers de formato ──────────────────────────────────────────────────────

/**
 * formatearFechaArca: Date -> string
 *
 * Convierte una fecha a formato YYYYMMDD requerido por ARCA.
 *
 * Ejemplos:
 * formatearFechaArca(new Date("2026-04-03")) === "20260403"
 */
export function formatearFechaArca(fecha: Date): string {
  const y = fecha.getFullYear()
  const m = String(fecha.getMonth() + 1).padStart(2, "0")
  const d = String(fecha.getDate()).padStart(2, "0")
  return `${y}${m}${d}`
}

/**
 * parsearFechaArca: string -> Date
 *
 * Convierte una fecha en formato YYYYMMDD de ARCA a objeto Date.
 *
 * Ejemplos:
 * parsearFechaArca("20260403") // → 2026-04-03T00:00:00.000Z
 */
export function parsearFechaArca(yyyymmdd: string): Date {
  const y = parseInt(yyyymmdd.slice(0, 4))
  const m = parseInt(yyyymmdd.slice(4, 6)) - 1
  const d = parseInt(yyyymmdd.slice(6, 8))
  return new Date(y, m, d)
}

/**
 * redondearArca: MonetaryInput -> number
 *
 * Redondea a 2 decimales usando la política monetaria central.
 * ARCA requiere exactamente 2 decimales en montos.
 *
 * Ejemplos:
 * redondearArca(1234.567) === 1234.57
 * redondearArca(100) === 100
 */
export function redondearArca(n: MonetaryInput): number {
  return m(n)
}

// ─── Tipos de comprobante ────────────────────────────────────────────────────

/** ID alícuota IVA 21% en ARCA. */
export const IVA_21_ID = 5
/** ID alícuota IVA 10.5% en ARCA. */
export const IVA_105_ID = 4
/** ID alícuota IVA 0% en ARCA. */
export const IVA_0_ID = 3

/**
 * determinarTipoCbteLiquidacion: string -> number
 *
 * Dado la condición IVA del fletero receptor, devuelve el código ARCA
 * para liquidaciones: 60 = CVLP A, 61 = CVLP B.
 *
 * Ejemplos:
 * determinarTipoCbteLiquidacion("RESPONSABLE_INSCRIPTO") === 60
 * determinarTipoCbteLiquidacion("CONSUMIDOR_FINAL") === 61
 * determinarTipoCbteLiquidacion("EXENTO") === 61
 */
export function determinarTipoCbteLiquidacion(condicionIva: string): number {
  if (condicionIva === "RESPONSABLE_INSCRIPTO" || condicionIva === "MONOTRIBUTISTA") {
    return 60
  }
  return 61
}

/**
 * determinarTipoCbteFactura: (condicionIva, modalidadMiPymes?) -> number
 *
 * Dado la condición IVA del receptor y la modalidad MiPyME, devuelve el código
 * de tipo de comprobante ARCA para facturas.
 *
 * Ejemplos:
 * determinarTipoCbteFactura("RESPONSABLE_INSCRIPTO") === 1         // Factura A
 * determinarTipoCbteFactura("RESPONSABLE_INSCRIPTO", "SCA") === 201 // Factura A MiPyME
 * determinarTipoCbteFactura("CONSUMIDOR_FINAL") === 6              // Factura B
 */
export function determinarTipoCbteFactura(condicionIva: string, modalidadMiPymes?: string | null): number {
  if (modalidadMiPymes) return 201
  if (condicionIva === "RESPONSABLE_INSCRIPTO" || condicionIva === "MONOTRIBUTISTA") return 1
  return 6
}

// ─── Condición IVA receptor (RG 5616) ───────────────────────────────────────

/**
 * condicionIvaArcaId: string -> number
 *
 * Mapea la condición IVA interna de Transmagg al ID de ARCA para CondicionIVAReceptorId.
 * Lanza error si la condición no tiene mapeo conocido.
 *
 * Ejemplos:
 * condicionIvaArcaId("RESPONSABLE_INSCRIPTO") === 1
 * condicionIvaArcaId("EXENTO") === 4
 * condicionIvaArcaId("CONSUMIDOR_FINAL") === 5
 * condicionIvaArcaId("MONOTRIBUTISTA") === 6
 */
export function condicionIvaArcaId(condicionIva: string): number {
  const MAPA: Record<string, number> = {
    RESPONSABLE_INSCRIPTO: 1,
    EXENTO: 4,
    CONSUMIDOR_FINAL: 5,
    MONOTRIBUTISTA: 6,
  }
  const id = MAPA[condicionIva]
  if (id == null) {
    throw new Error(`Condición IVA "${condicionIva}" no tiene mapeo ARCA para CondicionIVAReceptorId`)
  }
  return id
}

// ─── Mappers de comprobantes ─────────────────────────────────────────────────

/** Datos mínimos de un documento para mapear a ARCA. */
export interface DatosComprobanteBase {
  tipoCbte: number
  ptoVenta: number
  nroComprobante: number
  fecha: Date
  /** CUIT del receptor (sin guiones). */
  cuitReceptor: string
  neto: MonetaryInput
  ivaMonto: MonetaryInput
  total: MonetaryInput
  /** ID alícuota IVA (default: 5 = 21%). */
  ivaAlicuotaId?: number
  /** 1=Productos, 2=Servicios, 3=Ambos. Default: 2 (Servicios). */
  concepto?: number
  /** Inicio del período de servicio. */
  fechaServDesde?: Date
  /** Fin del período de servicio. */
  fechaServHasta?: Date
  /** Fecha estimada de vencimiento de pago. */
  fechaVtoPago?: Date
  /** Comprobante asociado (para NC/ND). */
  comprobanteAsociado?: {
    tipo: number
    ptoVta: number
    nro: number
    cuit: string
    fecha: Date
  }
  /** CBU para FCE MiPyME (solo tipoCbte 201). */
  cbuMiPymes?: string | null
  /** Modalidad MiPyME: "SCA" o "ADC" (solo tipoCbte 201). */
  modalidadMiPymes?: string | null
  /** Condición IVA del receptor (valor interno de Transmagg, ej: "RESPONSABLE_INSCRIPTO") */
  condicionIvaReceptor?: string
}

/**
 * mapearComprobanteArca: DatosComprobanteBase -> FECAERequest
 *
 * Transforma los datos internos de un comprobante al formato de request
 * que espera WSFEv1.FECAESolicitar.
 *
 * @param datos — Datos del comprobante en formato interno.
 * @returns FECAERequest listo para enviar a ARCA.
 *
 * Ejemplos:
 * mapearComprobanteArca({
 *   tipoCbte: 60, ptoVenta: 1, nroComprobante: 43,
 *   fecha: new Date("2026-04-03"), cuitReceptor: "20123456789",
 *   neto: 100000, ivaMonto: 21000, total: 121000,
 *   concepto: 2, fechaServDesde: new Date("2026-03-01"), ...
 * })
 * // → { FeCabReq: { CantReg: 1, PtoVta: 1, CbteTipo: 60 }, FeDetReq: { ... } }
 */
export function mapearComprobanteArca(datos: DatosComprobanteBase): FECAERequest {
  const neto = redondearArca(datos.neto)
  const ivaMonto = redondearArca(datos.ivaMonto)
  const total = redondearArca(datos.total)
  const ivaId = datos.ivaAlicuotaId ?? IVA_21_ID
  const concepto = datos.concepto ?? 2

  const alicuotas: AlicuotaIva[] = ivaMonto > 0
    ? [{ Id: ivaId, BaseImp: neto, Importe: ivaMonto }]
    : []

  const det: FECAEDetRequest = {
    Concepto: concepto,
    DocTipo: 80, // CUIT
    DocNro: Number(datos.cuitReceptor),
    CbteDesde: datos.nroComprobante,
    CbteHasta: datos.nroComprobante,
    CbteFch: formatearFechaArca(datos.fecha),
    ImpTotal: total,
    ImpTotConc: 0,
    ImpNeto: neto,
    ImpOpEx: 0,
    ImpTrib: 0,
    ImpIVA: ivaMonto,
    MonId: "PES",
    MonCotiz: 1,
    ...(datos.condicionIvaReceptor != null
      ? { CondicionIVAReceptorId: condicionIvaArcaId(datos.condicionIvaReceptor) }
      : {}),
  }

  // Campos de servicio (concepto 2 o 3)
  if (concepto >= 2 && datos.fechaServDesde && datos.fechaServHasta) {
    det.FchServDesde = formatearFechaArca(datos.fechaServDesde)
    det.FchServHasta = formatearFechaArca(datos.fechaServHasta)
    det.FchVtoPago = datos.fechaVtoPago
      ? formatearFechaArca(datos.fechaVtoPago)
      : formatearFechaArca(new Date(datos.fecha.getTime() + 30 * 24 * 60 * 60 * 1000))
  }

  // IVA
  if (alicuotas.length > 0) {
    det.Iva = { AlicIva: alicuotas }
  }

  // Comprobante asociado (NC/ND)
  if (datos.comprobanteAsociado) {
    const asoc: ComprobanteAsociado = {
      Tipo: datos.comprobanteAsociado.tipo,
      PtoVta: datos.comprobanteAsociado.ptoVta,
      Nro: datos.comprobanteAsociado.nro,
      Cuit: datos.comprobanteAsociado.cuit,
      CbteFch: formatearFechaArca(datos.comprobanteAsociado.fecha),
    }
    det.CbtesAsoc = { CbteAsoc: [asoc] }
  }

  // Opcionales FCE MiPyME
  if (datos.tipoCbte === 201 && datos.cbuMiPymes) {
    det.Opcionales = {
      Opcional: [
        { Id: "2101", Valor: datos.cbuMiPymes },
        { Id: "27", Valor: datos.modalidadMiPymes === "ADC" ? "ADC" : "SCA" },
      ],
    }
  }

  return {
    FeCabReq: {
      CantReg: 1,
      PtoVta: datos.ptoVenta,
      CbteTipo: datos.tipoCbte,
    },
    FeDetReq: {
      FECAEDetRequest: [det],
    },
  }
}
