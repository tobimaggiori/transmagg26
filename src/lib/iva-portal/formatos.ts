/**
 * formatos.ts — Helpers de formato para los TXT del LID ARCA.
 *
 * Las longitudes de los archivos del LID son fijas. Cualquier desviación
 * (ej: razón social truncada de manera incorrecta, importe con coma decimal,
 * fecha en formato distinto) hace que ARCA rechace el archivo.
 *
 * Funciones puras, sin Prisma.
 */

import { m as redondearMonetario } from "@/lib/money"

/**
 * padLeft: string number string -> string
 *
 * Dado [una cadena, un ancho objetivo y el carácter de padding (default "0")],
 * devuelve la cadena con padding a la izquierda hasta alcanzar el ancho.
 *
 * Si la cadena ya supera el ancho, se trunca por la izquierda (se pierden
 * los dígitos más significativos). Esto es para campos numéricos de longitud
 * fija — si truncamos por izquierda perdemos los más altos, lo cual es lo
 * menos malo en archivos fiscales (al menos no se reformatea silencioso).
 *
 * Ejemplos:
 * padLeft("123", 5)        === "00123"
 * padLeft("123", 5, " ")   === "  123"
 * padLeft("12345", 3)      === "345"      // trunca por izquierda
 * padLeft("", 4)           === "0000"
 */
export function padLeft(value: string, width: number, char = "0"): string {
  if (value.length === width) return value
  if (value.length > width) return value.slice(value.length - width)
  return char.repeat(width - value.length) + value
}

/**
 * padRight: string number string -> string
 *
 * Dado [una cadena, un ancho objetivo y el carácter de padding (default " ")],
 * devuelve la cadena con padding a la derecha. Si la cadena ya supera el
 * ancho, se trunca por la derecha (se pierden los caracteres finales —
 * estándar para campos textuales).
 *
 * Ejemplos:
 * padRight("ACME", 10)         === "ACME      "
 * padRight("ACME SA SRL", 5)   === "ACME "    // trunca por derecha
 * padRight("", 3)              === "   "
 */
export function padRight(value: string, width: number, char = " "): string {
  if (value.length === width) return value
  if (value.length > width) return value.slice(0, width)
  return value + char.repeat(width - value.length)
}

/**
 * formatFechaYYYYMMDD: Date -> string
 *
 * Dado una fecha, devuelve el formato YYYYMMDD requerido por ARCA.
 * Usa la fecha local (no UTC) — ARCA opera en horario AR.
 *
 * Ejemplos:
 * formatFechaYYYYMMDD(new Date("2026-04-15T12:00:00"))  === "20260415"
 * formatFechaYYYYMMDD(new Date(2026, 0, 1))             === "20260101"
 */
export function formatFechaYYYYMMDD(fecha: Date): string {
  const y = fecha.getFullYear()
  const m = fecha.getMonth() + 1
  const d = fecha.getDate()
  return `${padLeft(String(y), 4)}${padLeft(String(m), 2)}${padLeft(String(d), 2)}`
}

/**
 * formatFechaDDMMYYYY: Date -> string
 *
 * Variante para campos como FechaDePago (en spec viejo era DDMMYYYY).
 * Solo usar donde la spec lo pida explícitamente.
 *
 * Ejemplos:
 * formatFechaDDMMYYYY(new Date("2026-04-15T12:00:00"))  === "15042026"
 */
export function formatFechaDDMMYYYY(fecha: Date): string {
  const y = fecha.getFullYear()
  const m = fecha.getMonth() + 1
  const d = fecha.getDate()
  return `${padLeft(String(d), 2)}${padLeft(String(m), 2)}${padLeft(String(y), 4)}`
}

/**
 * formatImporteEnCentavos: number number -> string
 *
 * Dado [un importe en pesos y el ancho del campo], devuelve el importe
 * convertido a centavos, con padding cero a la izquierda al ancho indicado.
 *
 * Conversión a centavos: monto × 100, redondeado al entero más cercano
 * (ROUND_HALF_UP via money.m). Esto evita errores de coma flotante (ej:
 * 1234.56 * 100 → 123456.00000000001 en JS, que sin redondeo daría 123455).
 *
 * Importes negativos (NC) se permiten y el signo se incluye en el ancho.
 * Importes en cero generan un string de ceros del ancho indicado.
 *
 * Ejemplos:
 * formatImporteEnCentavos(1234.56, 15)  === "000000000123456"
 * formatImporteEnCentavos(0, 15)        === "000000000000000"
 * formatImporteEnCentavos(2100, 15)     === "000000000210000"
 * formatImporteEnCentavos(0.01, 10)     === "0000000001"
 * formatImporteEnCentavos(-50.5, 15)    === "-00000000005050"  // signo cuenta en ancho
 */
export function formatImporteEnCentavos(importe: number, ancho: number): string {
  // Redondear con money.m para neutralizar imprecisión de coma flotante
  // antes de convertir a centavos.
  const redondeado = redondearMonetario(importe ?? 0)
  const centavos = Math.round(redondeado * 100)
  if (centavos < 0) {
    // Negativos: signo va en el primer carácter, padding en el resto
    const sinSigno = String(Math.abs(centavos))
    return "-" + padLeft(sinSigno, ancho - 1)
  }
  return padLeft(String(centavos), ancho)
}

/**
 * normalizarCuit: string -> string
 *
 * Dado un CUIT con formato libre (con guiones, espacios, etc.), devuelve
 * solo los dígitos. Si está vacío o inválido devuelve cadena vacía.
 *
 * No valida el dígito verificador — eso es responsabilidad de validaciones.ts.
 *
 * Ejemplos:
 * normalizarCuit("30-70938168-3")     === "30709381683"
 * normalizarCuit("30 70938168 3")     === "30709381683"
 * normalizarCuit("30709381683")       === "30709381683"
 * normalizarCuit("")                  === ""
 * normalizarCuit(null as never)       === ""
 */
export function normalizarCuit(cuit: string | null | undefined): string {
  if (!cuit) return ""
  return cuit.replace(/\D/g, "")
}

/**
 * cuitConPaddingLid: string number -> string
 *
 * CUIT formateado para LID: 11 dígitos, con padding cero a 20 caracteres
 * total (formato del sistema viejo y RG 5223).
 *
 * Si el CUIT tiene 11 dígitos exactos: padding de 9 ceros adelante.
 * Si tiene menos: se rellena con ceros izquierda hasta 20.
 * Si tiene más: se trunca por izquierda (caso raro de input sucio).
 *
 * Ejemplos:
 * cuitConPaddingLid("30709381683")   === "00000000030709381683"
 * cuitConPaddingLid("")              === "00000000000000000000"
 * cuitConPaddingLid("123")           === "00000000000000000123"
 */
export function cuitConPaddingLid(cuit: string): string {
  return padLeft(normalizarCuit(cuit), 20)
}

/**
 * limpiarRazonSocial: string number -> string
 *
 * Limpia caracteres no permitidos en la razón social del TXT y trunca/pad
 * al ancho indicado.
 *
 * ARCA acepta latin1; evita acentos no estándar, comillas, etc. Reemplaza:
 *  - tab/CR/LF por espacio
 *  - múltiples espacios por uno solo
 *  - caracteres no imprimibles por nada
 *
 * Pad con espacios a la derecha al ancho indicado.
 *
 * Ejemplos:
 * limpiarRazonSocial("ACME SA", 10)             === "ACME SA   "
 * limpiarRazonSocial("ACME\tSA\nSRL", 10)       === "ACME SA SR"
 * limpiarRazonSocial("EMPRESA ÁCME ÑOÑA", 30)   === "EMPRESA ÁCME ÑOÑA             "
 */
export function limpiarRazonSocial(razon: string, ancho: number): string {
  if (!razon) return padRight("", ancho)
  const limpio = razon
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/[\x00-\x1F\x7F]/g, "")
    .trim()
  return padRight(limpio, ancho)
}

/**
 * formatTipoCambioLid: number -> string
 *
 * Tipo de cambio multiplicado × 1.000.000, padding 10 caracteres.
 * En PES siempre es 1.0 → "0001000000".
 *
 * Ejemplos:
 * formatTipoCambioLid(1)       === "0001000000"
 * formatTipoCambioLid(1.05)    === "0001050000"
 * formatTipoCambioLid(900.5)   === "0900500000"
 */
export function formatTipoCambioLid(valor: number): string {
  const multiplicado = Math.round((valor ?? 1) * 1_000_000)
  return padLeft(String(multiplicado), 10)
}
