/**
 * generar-txt.ts — Generación de los 4 archivos TXT del LID ARCA.
 *
 * Spec base: longitudes y posiciones extraídas del sistema viejo (VB6, ya
 * usado en producción contra ARCA) y verificadas contra RG 5223 / Libro
 * IVA Digital.
 *
 *  REGINFO_CV_VENTAS_CBTE.txt        — 266 chars/línea
 *  REGINFO_CV_VENTAS_ALICUOTAS.txt   —  62 chars/línea
 *  REGINFO_CV_COMPRAS_CBTE.txt       — 325 chars/línea
 *  REGINFO_CV_COMPRAS_ALICUOTAS.txt  —  84 chars/línea
 *
 * Funciones puras: input DTO → output string. Sin Prisma, sin estado.
 *
 * Cada línea termina con \r\n (CRLF) — ARCA lo requiere en archivos LID.
 * El contenido es ASCII/Latin1; los acentos se conservan tal cual (la
 * conversión a Buffer Latin1 se hace al escribir el archivo, no acá).
 */

import type { ComprobanteIva, AlicuotaIva } from "./types"
import {
  padLeft,
  padRight,
  formatFechaYYYYMMDD,
  formatFechaDDMMYYYY,
  formatImporteEnCentavos,
  cuitConPaddingLid,
  limpiarRazonSocial,
  formatTipoCambioLid,
} from "./formatos"
import { codigoAlicuotaArca, codigoDocumentoPorCuit } from "./codigos-arca"

// ─── Constantes de longitud ──────────────────────────────────────────────────

export const LONGITUD_VENTAS_CBTE = 266
export const LONGITUD_VENTAS_ALICUOTAS = 62
export const LONGITUD_COMPRAS_CBTE = 325
export const LONGITUD_COMPRAS_ALICUOTAS = 84

const EOL = "\r\n"

// ─── Helpers de identificación ────────────────────────────────────────────────

/**
 * tripletaIdentificadora: ComprobanteIva -> string
 *
 * Devuelve la concatenación tipoCbte(3) + ptoVenta(5) + numero(20) que
 * identifica al comprobante en el TXT. Se usa en archivos de Alícuota para
 * vincular con el archivo de Comprobante.
 *
 * Ejemplos:
 * tripletaIdentificadora({ tipoComprobanteArca: 1, puntoVenta: 1, numeroDesde: 123 })
 *   === "00100001" + "00000000000000000123"
 */
function tripletaIdentificadora(tipoCbte: number, puntoVenta: number, numero: number): string {
  return padLeft(String(tipoCbte), 3) +
         padLeft(String(puntoVenta), 5) +
         padLeft(String(numero), 20)
}

// ─── ARCHIVO 1: REGINFO_CV_VENTAS_CBTE (266 chars) ───────────────────────────

/**
 * lineaVentasCbte: ComprobanteIva -> string
 *
 * Construye una línea de 266 caracteres del archivo Comprobantes Ventas.
 * Estructura (posición 1-based → longitud → campo):
 *
 *  1-8     8   Fecha YYYYMMDD
 *  9-11    3   Tipo Comprobante (zero-pad)
 *  12-16   5   Punto de Venta (zero-pad)
 *  17-36   20  Nro Comprobante Desde (zero-pad)
 *  37-56   20  Nro Comprobante Hasta (zero-pad)
 *  57-58   2   Código Documento del Receptor (80=CUIT, 96=DNI, 99=sin id)
 *  59-78   20  Nro Documento (CUIT 11 dígitos con padding cero a 20)
 *  79-108  30  Razón Social (texto, padded espacios derecha, sin acentos raros)
 *  109-123 15  Total Operación (en centavos, zero-pad)
 *  124-138 15  Importe No Gravado
 *  139-153 15  Percepciones a No Categorizados
 *  154-168 15  Operaciones Exentas
 *  169-183 15  Pagos a Cuenta (no usado)
 *  184-198 15  Percepciones IIBB
 *  199-213 15  Impuestos Municipales
 *  214-228 15  Impuestos Internos
 *  229-231 3   Código Moneda (PES)
 *  232-241 10  Tipo de Cambio (× 1.000.000, zero-pad)
 *  242     1   Cantidad de Alícuotas IVA (1..9)
 *  243     1   Código de Operación ("0" normal)
 *  244-258 15  Otros Tributos
 *  259-266 8   Fecha Vto Pago (DDMMYYYY si tipoCbte=201, sino "00000000")
 */
function lineaVentasCbte(c: ComprobanteIva): string {
  const codDoc = codigoDocumentoPorCuit(c.cuitContraparte)
  const fechaPagoStr = c.fechaPago && c.tipoComprobanteArca === 201
    ? formatFechaDDMMYYYY(c.fechaPago)
    : "00000000"

  const linea =
    formatFechaYYYYMMDD(c.fecha) +                                   // 8
    padLeft(String(c.tipoComprobanteArca), 3) +                      // 3
    padLeft(String(c.puntoVenta), 5) +                               // 5
    padLeft(String(c.numeroDesde), 20) +                             // 20
    padLeft(String(c.numeroHasta), 20) +                             // 20
    padLeft(String(codDoc), 2) +                                     // 2
    cuitConPaddingLid(c.cuitContraparte) +                           // 20
    limpiarRazonSocial(c.razonSocialContraparte, 30) +               // 30
    formatImporteEnCentavos(c.totalOperacion, 15) +                  // 15
    formatImporteEnCentavos(c.noGravado, 15) +                       // 15
    formatImporteEnCentavos(c.noCategorizados, 15) +                 // 15
    formatImporteEnCentavos(c.exento, 15) +                          // 15
    formatImporteEnCentavos(c.pagosACuenta, 15) +                    // 15
    formatImporteEnCentavos(c.percepcionIibb, 15) +                  // 15
    formatImporteEnCentavos(c.impuestosMunicipales, 15) +            // 15
    formatImporteEnCentavos(c.impuestosInternos, 15) +               // 15
    padRight(c.codigoMoneda, 3) +                                    // 3
    formatTipoCambioLid(c.tipoCambio) +                              // 10
    padLeft(String(Math.max(1, Math.min(9, c.cantidadAlicuotas))), 1) + // 1
    padRight(c.codigoOperacion, 1) +                                 // 1
    formatImporteEnCentavos(c.otrosTributos, 15) +                   // 15
    fechaPagoStr                                                     // 8

  // Defensa en profundidad: si la longitud no es exactamente 266, hay un
  // bug en formatos.ts. Lanzar con info para test fallido directo.
  if (linea.length !== LONGITUD_VENTAS_CBTE) {
    throw new Error(
      `lineaVentasCbte: longitud incorrecta (${linea.length}, esperado ${LONGITUD_VENTAS_CBTE})`,
    )
  }
  return linea
}

/**
 * generarComprobantesVentasTxt: ComprobanteIva[] -> string
 *
 * Dado un array de comprobantes de venta, devuelve el contenido del archivo
 * REGINFO_CV_VENTAS_CBTE.txt como string (sin BOM, líneas separadas por CRLF).
 * Si no hay comprobantes, devuelve cadena vacía (ARCA acepta archivo vacío).
 *
 * Ejemplos:
 * generarComprobantesVentasTxt([]) === ""
 * generarComprobantesVentasTxt([cbte1, cbte2]) === "linea1\r\nlinea2\r\n"
 */
export function generarComprobantesVentasTxt(comprobantes: ComprobanteIva[]): string {
  if (comprobantes.length === 0) return ""
  return comprobantes.map(lineaVentasCbte).join(EOL) + EOL
}

// ─── ARCHIVO 2: REGINFO_CV_VENTAS_ALICUOTAS (62 chars) ────────────────────────

/**
 * lineaVentasAlicuota: AlicuotaIva -> string
 *
 *  1-3    3  Tipo Comprobante
 *  4-8    5  Punto de Venta
 *  9-28   20 Nro Comprobante
 *  29-43  15 Neto Gravado (centavos)
 *  44-47  4  Código Alícuota IVA (0003, 0004, 0005, etc.)
 *  48-62  15 Monto IVA (centavos)
 */
function lineaVentasAlicuota(a: AlicuotaIva): string {
  const codAlic = codigoAlicuotaArca(a.alicuotaPorcentaje)
  if (codAlic === null) {
    throw new Error(
      `lineaVentasAlicuota: alícuota ${a.alicuotaPorcentaje} no soportada por ARCA`,
    )
  }

  const linea =
    padLeft(String(a.tipoComprobanteArca), 3) +     // 3
    padLeft(String(a.puntoVenta), 5) +              // 5
    padLeft(String(a.numeroComprobante), 20) +      // 20
    formatImporteEnCentavos(a.netoGravado, 15) +    // 15
    padLeft(String(codAlic), 4) +                   // 4
    formatImporteEnCentavos(a.montoIva, 15)         // 15

  if (linea.length !== LONGITUD_VENTAS_ALICUOTAS) {
    throw new Error(
      `lineaVentasAlicuota: longitud incorrecta (${linea.length}, esperado ${LONGITUD_VENTAS_ALICUOTAS})`,
    )
  }
  return linea
}

/**
 * generarAlicuotasVentasTxt: AlicuotaIva[] -> string
 */
export function generarAlicuotasVentasTxt(alicuotas: AlicuotaIva[]): string {
  if (alicuotas.length === 0) return ""
  return alicuotas.map(lineaVentasAlicuota).join(EOL) + EOL
}

// ─── ARCHIVO 3: REGINFO_CV_COMPRAS_CBTE (325 chars) ───────────────────────────

/**
 * lineaComprasCbte: ComprobanteIva -> string
 *
 * Mismo esqueleto que ventas pero con campos adicionales del lado COMPRAS:
 *
 *  1-8     8   Fecha YYYYMMDD
 *  9-11    3   Tipo Comprobante
 *  12-16   5   Punto de Venta
 *  17-36   20  Nro Comprobante Desde
 *  37-52   16  Nro Despacho de Importación (vacío para ops nacionales)
 *  53-54   2   Código Documento del Vendedor (80=CUIT)
 *  55-74   20  CUIT Vendedor (con padding cero a 20)
 *  75-104  30  Razón Social Vendedor
 *  105-119 15  Total Operación (centavos)
 *  120-134 15  Importe No Gravado
 *  135-149 15  Operaciones Exentas
 *  150-164 15  Percepciones IVA RG3337
 *  165-179 15  Percepciones Otros Impuestos Nacionales
 *  180-194 15  Percepciones IIBB
 *  195-209 15  Percepciones Municipales
 *  210-224 15  Impuestos Internos
 *  225-227 3   Código Moneda
 *  228-237 10  Tipo de Cambio
 *  238     1   Cantidad de Alícuotas
 *  239     1   Código de Operación
 *  240-254 15  Crédito Fiscal Computable
 *  255-269 15  Otros Tributos
 *  270-280 11  CUIT Emisor / Comisionista (vacío "00000000000")
 *  281-310 30  Denominación del Emisor (vacío)
 *  311-325 15  IVA Comisión (vacío)
 *
 * Nota: este formato puede tener variaciones según versión de RG; los campos
 * "vacíos" se rellenan con ceros/espacios. Si ARCA rechaza, ajustar acá.
 */
function lineaComprasCbte(c: ComprobanteIva): string {
  const codDoc = codigoDocumentoPorCuit(c.cuitContraparte)

  const linea =
    formatFechaYYYYMMDD(c.fecha) +                                   // 8
    padLeft(String(c.tipoComprobanteArca), 3) +                      // 3
    padLeft(String(c.puntoVenta), 5) +                               // 5
    padLeft(String(c.numeroDesde), 20) +                             // 20
    padRight("", 16) +                                               // 16 — Despacho importación vacío
    padLeft(String(codDoc), 2) +                                     // 2
    cuitConPaddingLid(c.cuitContraparte) +                           // 20
    limpiarRazonSocial(c.razonSocialContraparte, 30) +               // 30
    formatImporteEnCentavos(c.totalOperacion, 15) +                  // 15
    formatImporteEnCentavos(c.noGravado, 15) +                       // 15
    formatImporteEnCentavos(c.exento, 15) +                          // 15
    formatImporteEnCentavos(c.percepcionIva, 15) +                   // 15 — perc IVA
    formatImporteEnCentavos(0, 15) +                                 // 15 — otros nac (no usado)
    formatImporteEnCentavos(c.percepcionIibb, 15) +                  // 15 — perc IIBB
    formatImporteEnCentavos(c.impuestosMunicipales, 15) +            // 15 — perc municipales
    formatImporteEnCentavos(c.impuestosInternos, 15) +               // 15
    padRight(c.codigoMoneda, 3) +                                    // 3
    formatTipoCambioLid(c.tipoCambio) +                              // 10
    padLeft(String(Math.max(1, Math.min(9, c.cantidadAlicuotas))), 1) + // 1
    padRight(c.codigoOperacion, 1) +                                 // 1
    formatImporteEnCentavos(0, 15) +                                 // 15 — crédito fiscal computable (= IVA por defecto)
    formatImporteEnCentavos(c.otrosTributos, 15) +                   // 15
    padLeft("", 11) +                                                // 11 — CUIT emisor (vacío)
    padRight("", 30) +                                               // 30 — denominación emisor
    formatImporteEnCentavos(0, 15)                                   // 15 — IVA comisión

  if (linea.length !== LONGITUD_COMPRAS_CBTE) {
    throw new Error(
      `lineaComprasCbte: longitud incorrecta (${linea.length}, esperado ${LONGITUD_COMPRAS_CBTE})`,
    )
  }
  return linea
}

/**
 * generarComprobantesComprasTxt: ComprobanteIva[] -> string
 */
export function generarComprobantesComprasTxt(comprobantes: ComprobanteIva[]): string {
  if (comprobantes.length === 0) return ""
  return comprobantes.map(lineaComprasCbte).join(EOL) + EOL
}

// ─── ARCHIVO 4: REGINFO_CV_COMPRAS_ALICUOTAS (84 chars) ──────────────────────

/**
 * lineaComprasAlicuota: AlicuotaIva -> string
 *
 *  1-3    3   Tipo Comprobante
 *  4-8    5   Punto de Venta
 *  9-28   20  Nro Comprobante
 *  29-30  2   Código Documento del Vendedor (80=CUIT)
 *  31-50  20  CUIT Vendedor con padding
 *  51-65  15  Neto Gravado (centavos)
 *  66-69  4   Código Alícuota
 *  70-84  15  Monto IVA (centavos)
 */
function lineaComprasAlicuota(a: AlicuotaIva): string {
  const codAlic = codigoAlicuotaArca(a.alicuotaPorcentaje)
  if (codAlic === null) {
    throw new Error(
      `lineaComprasAlicuota: alícuota ${a.alicuotaPorcentaje} no soportada por ARCA`,
    )
  }
  if (!a.cuitProveedor) {
    throw new Error(
      `lineaComprasAlicuota: cuitProveedor es obligatorio en archivo de compras`,
    )
  }
  const codDoc = codigoDocumentoPorCuit(a.cuitProveedor)

  const linea =
    padLeft(String(a.tipoComprobanteArca), 3) +     // 3
    padLeft(String(a.puntoVenta), 5) +              // 5
    padLeft(String(a.numeroComprobante), 20) +      // 20
    padLeft(String(codDoc), 2) +                    // 2
    cuitConPaddingLid(a.cuitProveedor) +            // 20
    formatImporteEnCentavos(a.netoGravado, 15) +    // 15
    padLeft(String(codAlic), 4) +                   // 4
    formatImporteEnCentavos(a.montoIva, 15)         // 15

  if (linea.length !== LONGITUD_COMPRAS_ALICUOTAS) {
    throw new Error(
      `lineaComprasAlicuota: longitud incorrecta (${linea.length}, esperado ${LONGITUD_COMPRAS_ALICUOTAS})`,
    )
  }
  return linea
}

/**
 * generarAlicuotasComprasTxt: AlicuotaIva[] -> string
 */
export function generarAlicuotasComprasTxt(alicuotas: AlicuotaIva[]): string {
  if (alicuotas.length === 0) return ""
  return alicuotas.map(lineaComprasAlicuota).join(EOL) + EOL
}

// ─── Tripleta exportada (útil para testing y debugging) ──────────────────────
export { tripletaIdentificadora }
