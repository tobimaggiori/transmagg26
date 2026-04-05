/**
 * nota-cd-utils.ts
 *
 * Funciones utilitarias para el módulo de Notas de Crédito y Débito (NC/ND).
 * Centraliza etiquetas, clasificaciones y cálculos para evitar duplicación
 * en la UI y en los API routes.
 */

import { calcularNetoMasIva, type MonetaryInput } from "@/lib/money"
import { prisma } from "@/lib/prisma"

/**
 * labelTipoNotaCD: string -> string
 *
 * Dado el código interno de tipo de nota (NC_EMITIDA, ND_EMITIDA, NC_RECIBIDA, ND_RECIBIDA),
 * devuelve la etiqueta legible en español para mostrar en la interfaz.
 * Esta función existe para centralizar la traducción de códigos a texto
 * y evitar strings duplicados en componentes y tablas.
 *
 * Ejemplos:
 * labelTipoNotaCD("NC_EMITIDA")  === "Nota de Crédito Emitida"
 * labelTipoNotaCD("ND_EMITIDA")  === "Nota de Débito Emitida"
 * labelTipoNotaCD("NC_RECIBIDA") === "Nota de Crédito Recibida"
 * labelTipoNotaCD("ND_RECIBIDA") === "Nota de Débito Recibida"
 * labelTipoNotaCD("OTRO")        === "OTRO"
 */
export function labelTipoNotaCD(tipo: string): string {
  const mapa: Record<string, string> = {
    NC_EMITIDA: "Nota de Crédito Emitida",
    ND_EMITIDA: "Nota de Débito Emitida",
    NC_RECIBIDA: "Nota de Crédito Recibida",
    ND_RECIBIDA: "Nota de Débito Recibida",
  }
  return mapa[tipo] ?? tipo
}

/**
 * labelSubtipoNotaCD: string -> string
 *
 * Dado el código interno de subtipo de nota (ej. ANULACION_TOTAL, CHEQUE_RECHAZADO),
 * devuelve la etiqueta legible en español para mostrar en selectores y detalles.
 * Esta función existe para centralizar la traducción de subtipos a texto
 * en la UI y evitar inconsistencias entre formularios y tablas.
 *
 * Ejemplos:
 * labelSubtipoNotaCD("ANULACION_TOTAL")          === "Anulación total de factura"
 * labelSubtipoNotaCD("ANULACION_PARCIAL")        === "Anulación parcial de factura"
 * labelSubtipoNotaCD("CORRECCION_IMPORTE")       === "Corrección de importe"
 * labelSubtipoNotaCD("DIFERENCIA_TARIFA")        === "Diferencia de tarifa"
 * labelSubtipoNotaCD("COSTO_ADICIONAL")          === "Costo adicional del viaje"
 * labelSubtipoNotaCD("AJUSTE")                   === "Ajuste por inflación o contrato"
 * labelSubtipoNotaCD("PENALIDAD")                === "Penalidad al cliente"
 * labelSubtipoNotaCD("CORRECCION_ADMINISTRATIVA") === "Corrección administrativa"
 * labelSubtipoNotaCD("ANULACION_LIQUIDACION")    === "Anulación de liquidación"
 * labelSubtipoNotaCD("CHEQUE_RECHAZADO")         === "Cheque rechazado"
 * labelSubtipoNotaCD("DESCONOCIDO")              === "DESCONOCIDO"
 */
export function labelSubtipoNotaCD(subtipo: string): string {
  const mapa: Record<string, string> = {
    ANULACION_TOTAL: "Anulación total de factura",
    ANULACION_PARCIAL: "Anulación parcial de factura",
    CORRECCION_IMPORTE: "Corrección de importe",
    DIFERENCIA_TARIFA: "Diferencia de tarifa",
    COSTO_ADICIONAL: "Costo adicional del viaje",
    AJUSTE: "Ajuste por inflación o contrato",
    PENALIDAD: "Penalidad al cliente",
    CORRECCION_ADMINISTRATIVA: "Corrección administrativa",
    ANULACION_LIQUIDACION: "Anulación de liquidación",
    ANULACION_PARCIAL_LIQUIDACION: "Anulación parcial de liquidación",
    CORRECCION_IMPORTE_LIQUIDACION: "Corrección de importe de liquidación",
    AJUSTE_LIQUIDACION: "Ajuste sobre liquidación",
    CHEQUE_RECHAZADO: "Cheque rechazado",
  }
  return mapa[subtipo] ?? subtipo
}

/**
 * esEmitida: string -> boolean
 *
 * Dado el tipo de nota, devuelve true si la nota es emitida por Transmagg
 * (NC_EMITIDA o ND_EMITIDA), false si es recibida (NC_RECIBIDA o ND_RECIBIDA).
 * Esta función existe para distinguir si se deben mostrar campos ARCA
 * y numeración propia, que solo aplican a notas emitidas.
 *
 * Ejemplos:
 * esEmitida("NC_EMITIDA")  === true
 * esEmitida("ND_EMITIDA")  === true
 * esEmitida("NC_RECIBIDA") === false
 * esEmitida("ND_RECIBIDA") === false
 */
export function esEmitida(tipo: string): boolean {
  return tipo === "NC_EMITIDA" || tipo === "ND_EMITIDA"
}

/**
 * tipoCbteArcaParaNotaCD: string string -> number
 *
 * Dado el tipo de nota (NC_EMITIDA o ND_EMITIDA) y la condición IVA del receptor,
 * devuelve el código de tipo de comprobante ARCA correspondiente según la normativa AFIP:
 *   2 = ND "A" (receptor RI o Monotributista)
 *   3 = NC "A" (receptor RI o Monotributista)
 *   7 = ND "B" (receptor Exento o Consumidor Final)
 *   8 = NC "B" (receptor Exento o Consumidor Final)
 *   0 = no aplica (nota recibida, sin código ARCA propio)
 * Esta función existe para calcular automáticamente el tipoCbte al emitir
 * una NC/ND por ARCA sin necesidad de que el operador lo seleccione manualmente.
 *
 * Ejemplos:
 * tipoCbteArcaParaNotaCD("NC_EMITIDA", "RESPONSABLE_INSCRIPTO") === 3
 * tipoCbteArcaParaNotaCD("NC_EMITIDA", "CONSUMIDOR_FINAL")      === 8
 * tipoCbteArcaParaNotaCD("ND_EMITIDA", "RESPONSABLE_INSCRIPTO") === 2
 * tipoCbteArcaParaNotaCD("ND_EMITIDA", "EXENTO")                === 7
 * tipoCbteArcaParaNotaCD("NC_RECIBIDA", "RESPONSABLE_INSCRIPTO") === 0
 */
export function tipoCbteArcaParaNotaCD(tipo: string, condicionIva: string): number {
  const esClaseA = condicionIva === "RESPONSABLE_INSCRIPTO" || condicionIva === "MONOTRIBUTISTA"
  if (tipo === "NC_EMITIDA") return esClaseA ? 3 : 8
  if (tipo === "ND_EMITIDA") return esClaseA ? 2 : 7
  return 0
}

/**
 * calcularProximoNroComprobanteNotaCD: string -> Promise<number>
 *
 * Dado el tipo de nota (NC_EMITIDA, ND_EMITIDA, etc.), devuelve el próximo
 * número de comprobante disponible (máximo existente + 1, o 1 si no hay ninguno).
 * Existe para asignar numeración correlativa antes de enviar a ARCA.
 *
 * Ejemplos:
 * calcularProximoNroComprobanteNotaCD("NC_EMITIDA") === Promise<1>  // sin notas previas
 * calcularProximoNroComprobanteNotaCD("ND_EMITIDA") === Promise<6>  // última nro = 5
 */
export async function calcularProximoNroComprobanteNotaCD(tipo: string): Promise<number> {
  const ultima = await prisma.notaCreditoDebito.findFirst({
    where: { tipo },
    orderBy: { nroComprobante: "desc" },
    select: { nroComprobante: true },
  })
  return (ultima?.nroComprobante ?? 0) + 1
}

/**
 * calcularTotalesNotaCD: MonetaryInput number -> { montoNeto: number, montoIva: number, montoTotal: number }
 *
 * Dado el monto neto y el porcentaje de IVA (0-100), calcula y devuelve
 * el monto de IVA (redondeado a centavos) y el total (neto + IVA).
 * Esta función existe para aplicar el cálculo de IVA de forma consistente
 * tanto en el servidor (POST) como en el cliente (preview del formulario).
 * Usa el módulo monetario central para garantizar precisión y redondeo uniforme.
 *
 * Ejemplos:
 * calcularTotalesNotaCD(1000, 21) === { montoNeto: 1000, montoIva: 210, montoTotal: 1210 }
 * calcularTotalesNotaCD(500, 0)   === { montoNeto: 500, montoIva: 0, montoTotal: 500 }
 * calcularTotalesNotaCD(333.33, 21) === { montoNeto: 333.33, montoIva: 70, montoTotal: 403.33 }
 */
export function calcularTotalesNotaCD(
  montoNeto: MonetaryInput,
  ivaPct: number
): { montoNeto: number; montoIva: number; montoTotal: number } {
  const result = calcularNetoMasIva(montoNeto, ivaPct)
  return { montoNeto: result.neto, montoIva: result.iva, montoTotal: result.total }
}
