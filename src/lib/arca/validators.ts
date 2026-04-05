/**
 * Propósito: Validaciones previas a enviar un comprobante a ARCA.
 * Detecta errores de datos antes de gastar una llamada al web service.
 * Devuelve un array de errores legibles para frontend y logs.
 */

import type { DatosComprobanteBase } from "./mappers"
import type { ArcaConfig } from "./types"
import { m, sumarImportes, importesIguales } from "@/lib/money"

/** Tipos de comprobante que requieren comprobante asociado (NC/ND). */
const TIPOS_CON_ASOCIADO = new Set([2, 3, 7, 8, 202, 203])

/** Tipos de comprobante soportados — catálogo cerrado ARCA de Transmagg. */
const TIPOS_SOPORTADOS = new Set([1, 2, 3, 6, 7, 8, 60, 61, 201, 202, 203])

/**
 * validarPreAutorizacion: (config, datos) -> string[]
 *
 * Valida la configuración ARCA y los datos del comprobante antes de enviarlo.
 * Devuelve un array vacío si todo es válido, o un array de strings con los
 * errores encontrados.
 *
 * @param config — Configuración ARCA cargada.
 * @param datos — Datos del comprobante mapeados.
 * @returns Array de errores (vacío si es válido).
 *
 * Ejemplos:
 * validarPreAutorizacion(config, datos) === []  // OK
 * validarPreAutorizacion(config, datos) === ["El CUIT del receptor es inválido", "El total no coincide"]
 */
export function validarPreAutorizacion(
  config: ArcaConfig,
  datos: DatosComprobanteBase
): string[] {
  const errores: string[] = []

  // Config ARCA
  if (!config.activa) errores.push("ARCA no está activa")
  if (!config.cuit || config.cuit.length !== 11) errores.push("CUIT del emisor inválido")

  // Punto de venta
  if (!datos.ptoVenta || datos.ptoVenta < 1) {
    errores.push("Punto de venta inválido")
  }

  // Tipo de comprobante
  if (!TIPOS_SOPORTADOS.has(datos.tipoCbte)) {
    errores.push(`Tipo de comprobante ${datos.tipoCbte} no soportado`)
  }

  // CUIT receptor
  const cuit = datos.cuitReceptor?.replace(/\D/g, "")
  if (!cuit || cuit.length !== 11) {
    errores.push("El CUIT del receptor es inválido (debe tener 11 dígitos)")
  }

  // Montos
  const neto = m(datos.neto)
  const ivaMonto = m(datos.ivaMonto)
  const total = m(datos.total)
  if (neto <= 0) errores.push("El neto debe ser mayor a 0")
  if (total <= 0) errores.push("El total debe ser mayor a 0")

  // Integridad monetaria: total ≈ neto + ivaMonto (tolerancia 1 centavo)
  const totalEsperado = sumarImportes([neto, ivaMonto])
  if (!importesIguales(total, totalEsperado)) {
    errores.push(
      `El total (${total}) no coincide con neto (${neto}) + IVA (${ivaMonto}) = ${totalEsperado}`
    )
  }

  // Comprobante asociado obligatorio para NC/ND
  if (TIPOS_CON_ASOCIADO.has(datos.tipoCbte) && !datos.comprobanteAsociado) {
    errores.push("Las notas de crédito/débito requieren comprobante asociado")
  }

  // Validar datos del comprobante asociado si existe
  if (datos.comprobanteAsociado) {
    const asoc = datos.comprobanteAsociado
    if (!asoc.tipo || asoc.tipo < 1) errores.push("Tipo de comprobante asociado inválido")
    if (!asoc.ptoVta || asoc.ptoVta < 1) errores.push("Punto de venta del comprobante asociado inválido")
    if (!asoc.nro || asoc.nro < 1) errores.push("Número del comprobante asociado inválido")
    const cuitAsoc = asoc.cuit?.replace(/\D/g, "")
    if (!cuitAsoc || cuitAsoc.length !== 11) errores.push("CUIT del comprobante asociado inválido")
  }

  // FCE MiPyME requiere CBU
  if (datos.tipoCbte === 201 && !datos.cbuMiPymes) {
    errores.push("Las facturas MiPyME (tipo 201) requieren CBU de acreditación")
  }

  // Fechas de servicio (requeridas para concepto 2 y 3)
  const concepto = datos.concepto ?? 2
  if (concepto >= 2) {
    if (!datos.fechaServDesde) errores.push("Falta fecha de inicio de servicio")
    if (!datos.fechaServHasta) errores.push("Falta fecha de fin de servicio")
    if (
      datos.fechaServDesde &&
      datos.fechaServHasta &&
      datos.fechaServDesde > datos.fechaServHasta
    ) {
      errores.push("La fecha de inicio de servicio no puede ser posterior a la de fin")
    }
  }

  // Número de comprobante
  if (!datos.nroComprobante || datos.nroComprobante < 1) {
    errores.push("Número de comprobante inválido")
  }

  return errores
}

/**
 * validarDocumentoNoAutorizado: (arcaEstado) -> string | null
 *
 * Verifica que el documento no haya sido ya autorizado o esté en proceso.
 * Devuelve null si está en estado autorizable, o un mensaje de error.
 *
 * Ejemplos:
 * validarDocumentoNoAutorizado("PENDIENTE") === null
 * validarDocumentoNoAutorizado("AUTORIZADA") === "El documento ya fue autorizado en ARCA"
 * validarDocumentoNoAutorizado("EN_PROCESO") === "El documento está siendo procesado"
 */
export function validarDocumentoNoAutorizado(arcaEstado: string | null): string | null {
  if (arcaEstado === "AUTORIZADA") return "El documento ya fue autorizado en ARCA"
  if (arcaEstado === "EN_PROCESO") return "El documento está siendo procesado. Esperá e intentá de nuevo."
  return null
}
