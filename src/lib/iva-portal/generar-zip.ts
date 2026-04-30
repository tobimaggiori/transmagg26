/**
 * generar-zip.ts — Empaqueta los 4 TXT + resumen.json + validaciones.json
 * en un único ZIP listo para descargar/subir a R2.
 *
 * Función pura: input strings + JSON → output Buffer.
 */

import JSZip from "jszip"
import type { ResultadoValidacion } from "./types"

export interface ContenidosExportacion {
  mesAnio: string
  comprobantesVentasTxt: string
  alicuotasVentasTxt: string
  comprobantesComprasTxt: string
  alicuotasComprasTxt: string
  resumen: ResumenExportacion
  validaciones: ResultadoValidacion
}

export interface ResumenExportacion {
  mesAnio: string
  generadoEn: string
  cantVentas: number
  cantCompras: number
  cantAjustesAplicados: number
  totalNetoVentas: number
  totalIvaVentas: number
  totalNetoCompras: number
  totalIvaCompras: number
  posicionIva: number
  emisor: { cuit: string; razonSocial: string }
}

/**
 * mesAnioCompacto: "2026-04" -> "202604"
 */
function mesAnioCompacto(mesAnio: string): string {
  return mesAnio.replace("-", "")
}

/**
 * generarZipExportacionIva: ContenidosExportacion -> Promise<Buffer>
 *
 * Construye un ZIP en memoria con:
 *  - REGINFO_CV_VENTAS_CBTE_<YYYYMM>.txt
 *  - REGINFO_CV_VENTAS_ALICUOTAS_<YYYYMM>.txt
 *  - REGINFO_CV_COMPRAS_CBTE_<YYYYMM>.txt
 *  - REGINFO_CV_COMPRAS_ALICUOTAS_<YYYYMM>.txt
 *  - resumen.json
 *  - validaciones.json
 *
 * Los TXT se empaquetan tal cual (string UTF-8). Si el cliente desktop
 * los abre, ARCA acepta ASCII puro, así que los TXT no llevan caracteres
 * fuera de [0x20-0x7F] excepto ñ/acentos en razón social que son válidos
 * en latin1.
 *
 * Para compatibilidad estricta con ARCA, al escribir a disco/ZIP usamos
 * encoding latin1 — explícito. JSZip por default toma string como UTF-8;
 * pasamos `Buffer.from(str, 'latin1')` para forzar el encoding.
 */
export async function generarZipExportacionIva(
  contenidos: ContenidosExportacion,
): Promise<Buffer> {
  const zip = new JSZip()
  const sufijo = mesAnioCompacto(contenidos.mesAnio)

  // TXT en latin1 (ARCA lo requiere)
  zip.file(
    `REGINFO_CV_VENTAS_CBTE_${sufijo}.txt`,
    Buffer.from(contenidos.comprobantesVentasTxt, "latin1"),
  )
  zip.file(
    `REGINFO_CV_VENTAS_ALICUOTAS_${sufijo}.txt`,
    Buffer.from(contenidos.alicuotasVentasTxt, "latin1"),
  )
  zip.file(
    `REGINFO_CV_COMPRAS_CBTE_${sufijo}.txt`,
    Buffer.from(contenidos.comprobantesComprasTxt, "latin1"),
  )
  zip.file(
    `REGINFO_CV_COMPRAS_ALICUOTAS_${sufijo}.txt`,
    Buffer.from(contenidos.alicuotasComprasTxt, "latin1"),
  )

  // JSON en UTF-8 (estos no los lee ARCA, son para auditoría interna)
  zip.file("resumen.json", JSON.stringify(contenidos.resumen, null, 2))
  zip.file("validaciones.json", JSON.stringify(contenidos.validaciones, null, 2))

  return zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" })
}

/**
 * nombreArchivo*: helpers para nombres de archivo individuales (S3 keys).
 */
export function nombreComprobantesVentas(mesAnio: string): string {
  return `REGINFO_CV_VENTAS_CBTE_${mesAnioCompacto(mesAnio)}.txt`
}
export function nombreAlicuotasVentas(mesAnio: string): string {
  return `REGINFO_CV_VENTAS_ALICUOTAS_${mesAnioCompacto(mesAnio)}.txt`
}
export function nombreComprobantesCompras(mesAnio: string): string {
  return `REGINFO_CV_COMPRAS_CBTE_${mesAnioCompacto(mesAnio)}.txt`
}
export function nombreAlicuotasCompras(mesAnio: string): string {
  return `REGINFO_CV_COMPRAS_ALICUOTAS_${mesAnioCompacto(mesAnio)}.txt`
}
export function nombreZip(mesAnio: string): string {
  return `LIBRO_IVA_DIGITAL_${mesAnioCompacto(mesAnio)}.zip`
}
