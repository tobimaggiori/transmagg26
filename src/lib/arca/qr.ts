/**
 * Propósito: Generación del QR fiscal según RG 4291 (AFIP).
 * El QR de ARCA es un JSON codificado en base64, embebido en una URL específica.
 * Se incluye en el PDF del comprobante autorizado.
 */

import type { QRFiscalData } from "./types"
import { m, type MonetaryInput } from "@/lib/money"

/** URL base del QR de AFIP. */
const QR_BASE_URL = "https://www.afip.gob.ar/fe/qr/"

/**
 * generarQRFiscal: (params) -> string
 *
 * Genera el string qrData (JSON base64) para un comprobante autorizado.
 * Este valor se guarda en el campo qrData del modelo y se usa para generar
 * la imagen QR en el PDF.
 *
 * @param cuitEmisor — CUIT del emisor (sin guiones, 11 dígitos).
 * @param ptoVenta — Punto de venta.
 * @param tipoCbte — Tipo de comprobante ARCA.
 * @param nroComprobante — Número del comprobante.
 * @param total — Importe total.
 * @param cuitReceptor — CUIT del receptor (sin guiones).
 * @param cae — CAE de 14 dígitos.
 * @param fechaEmision — Fecha de emisión del comprobante.
 * @returns JSON base64 del QR según RG 4291.
 *
 * Ejemplos:
 * generarQRFiscal({
 *   cuitEmisor: "30709381683", ptoVenta: 1, tipoCbte: 60,
 *   nroComprobante: 43, total: 121000, cuitReceptor: "20123456789",
 *   cae: "74123456789012", fechaEmision: new Date("2026-04-03")
 * })
 * // → "eyJ2ZXIiOjEsImZlY2hhIjoiMjAyNi0wNC0wMyIsImN1aXQiOjMwNzA5..." (base64)
 */
export function generarQRFiscal(params: {
  cuitEmisor: string
  ptoVenta: number
  tipoCbte: number
  nroComprobante: number
  total: MonetaryInput
  cuitReceptor: string
  cae: string
  fechaEmision: Date
}): string {
  const data: QRFiscalData = {
    ver: 1,
    fecha: formatearFechaQR(params.fechaEmision),
    cuit: Number(params.cuitEmisor),
    ptoVta: params.ptoVenta,
    tipoCmp: params.tipoCbte,
    nroCmp: params.nroComprobante,
    importe: m(params.total),
    moneda: "PES",
    ctz: 1,
    tipoDocRec: 80, // CUIT
    nroDocRec: Number(params.cuitReceptor),
    tipoCodAut: "E", // Electrónico
    codAut: Number(params.cae),
  }

  const jsonStr = JSON.stringify(data)
  return Buffer.from(jsonStr).toString("base64")
}

/**
 * obtenerUrlQRFiscal: string -> string
 *
 * Dado el qrData (base64), devuelve la URL completa del QR de AFIP
 * que se usa para generar la imagen QR en el PDF.
 *
 * Ejemplos:
 * obtenerUrlQRFiscal("eyJ2ZXIiOjEsIm...") === "https://www.afip.gob.ar/fe/qr/?p=eyJ2ZXIiOjEsIm..."
 */
export function obtenerUrlQRFiscal(qrData: string): string {
  return `${QR_BASE_URL}?p=${qrData}`
}

/**
 * formatearFechaQR: Date -> string
 *
 * Formatea una fecha como YYYY-MM-DD para el campo `fecha` del QR.
 *
 * Ejemplos:
 * formatearFechaQR(new Date("2026-04-03")) === "2026-04-03"
 */
function formatearFechaQR(fecha: Date): string {
  const y = fecha.getFullYear()
  const m = String(fecha.getMonth() + 1).padStart(2, "0")
  const d = String(fecha.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}
