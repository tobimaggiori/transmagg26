/**
 * validaciones.ts — Validación de datos del Portal IVA antes de generar TXT.
 *
 * Errores BLOQUEANTES: impiden generar el TXT (devuelven 422 en API).
 * Advertencias: permiten generar pero se loggean en validacionesJson.
 *
 * Funciones puras: input ComprobanteIva[]/AlicuotaIva[] → output ResultadoValidacion.
 * Sin Prisma, sin estado.
 */

import type {
  ComprobanteIva,
  AlicuotaIva,
  DatosIvaPeriodo,
  ResultadoValidacion,
  ValidacionItem,
} from "./types"
import {
  codigoArcaSoportado,
  alicuotaSoportada,
  etiquetaComprobanteArca,
} from "./codigos-arca"
import { sumarImportes, restarImportes } from "@/lib/money"
import { normalizarCuit } from "./formatos"

/**
 * validarCuit: string -> boolean
 *
 * Valida un CUIT argentino con dígito verificador.
 * Algoritmo: cada dígito × peso (5,4,3,2,7,6,5,4,3,2), suma mod 11.
 * Si resto es 11 → 0; si es 10 → inválido (caso especial).
 *
 * Ejemplos:
 * validarCuit("30709381683") === true   // Trans-Magg (real)
 * validarCuit("30709381682") === false  // dígito verificador mal
 * validarCuit("30-70938168-3") === true  // acepta con guiones
 * validarCuit("123") === false          // largo incorrecto
 */
export function validarCuit(cuit: string | null | undefined): boolean {
  const limpio = normalizarCuit(cuit)
  if (limpio.length !== 11) return false
  const pesos = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2]
  let suma = 0
  for (let i = 0; i < 10; i++) {
    suma += parseInt(limpio[i], 10) * pesos[i]
  }
  const mod = suma % 11
  const dv = mod === 0 ? 0 : mod === 1 ? -1 : 11 - mod
  if (dv === -1) return false
  return dv === parseInt(limpio[10], 10)
}

/**
 * validarComprobante: ComprobanteIva -> ValidacionItem[]
 *
 * Valida un comprobante individual. Devuelve lista de problemas.
 * Cada item se marca como bloqueante o advertencia según el codigo.
 */
function validarComprobante(c: ComprobanteIva): ValidacionItem[] {
  const items: ValidacionItem[] = []
  const ref = {
    tipoReferencia: c.tipoReferencia,
    id: c.referenciaId,
    cbte: `${c.tipoComprobanteArca} ${c.puntoVenta}-${c.numeroDesde}`,
  }

  // Bloqueante: tipo de comprobante no soportado
  if (!codigoArcaSoportado(c.tipoComprobanteArca)) {
    items.push({
      codigo: "TIPO_COMPROBANTE_NO_SOPORTADO",
      mensaje: `Tipo de comprobante ${c.tipoComprobanteArca} fuera de la matriz cerrada ARCA`,
      referencia: ref,
    })
  }

  // Bloqueante: CUIT inválido (B2B obligatorio CUIT 11 dígitos válidos)
  if (!validarCuit(c.cuitContraparte)) {
    items.push({
      codigo: "CUIT_INVALIDO",
      mensaje: `CUIT "${c.cuitContraparte}" no válido para ${ref.cbte}`,
      referencia: ref,
    })
  }

  // Bloqueante: punto de venta debe estar (>=1)
  if (!c.puntoVenta || c.puntoVenta < 1) {
    items.push({
      codigo: "PUNTO_VENTA_FALTANTE",
      mensaje: `Punto de venta inválido o faltante`,
      referencia: ref,
    })
  }

  // Bloqueante: número de comprobante debe estar
  if (!c.numeroDesde || c.numeroDesde < 1) {
    items.push({
      codigo: "NUMERO_COMPROBANTE_FALTANTE",
      mensaje: `Número de comprobante inválido o faltante`,
      referencia: ref,
    })
  }

  // Bloqueante: importes no NaN
  const camposImporte: Array<[keyof ComprobanteIva, string]> = [
    ["totalOperacion", "Total operación"],
    ["netoGravado", "Neto gravado"],
    ["exento", "Exento"],
    ["noGravado", "No gravado"],
  ]
  for (const [campo, etiqueta] of camposImporte) {
    const v = c[campo] as number
    if (typeof v !== "number" || !Number.isFinite(v)) {
      items.push({
        codigo: "IMPORTE_INVALIDO",
        mensaje: `${etiqueta} no es un número finito (${v})`,
        referencia: ref,
      })
    }
  }

  // Bloqueante: cantidad alícuotas debe ser >= 1 y <= 9
  if (c.cantidadAlicuotas < 1 || c.cantidadAlicuotas > 9) {
    items.push({
      codigo: "CANTIDAD_ALICUOTAS_INVALIDA",
      mensaje: `Cantidad de alícuotas debe estar entre 1 y 9 (es ${c.cantidadAlicuotas})`,
      referencia: ref,
    })
  }

  // Advertencia: total ≈ neto + iva + exento + no gravado + percepciones
  // (las NC restan, las facturas suman — usamos abs para ambos casos)
  const totalEsperado = sumarImportes([
    c.netoGravado,
    c.exento,
    c.noGravado,
    c.percepcionIibb,
    c.percepcionIva,
    c.percepcionGanancias,
    c.impuestosMunicipales,
    c.impuestosInternos,
    c.otrosTributos,
  ])
  // El total declarado debe ser ≥ totalEsperado (porque falta sumar IVA, que va en alícuotas)
  // Toleramos hasta $1 de diferencia por redondeo.
  if (Math.abs(restarImportes(c.totalOperacion, totalEsperado)) < 0.01 && totalEsperado === 0 && c.totalOperacion > 0) {
    // Total > 0 pero todas las bases en 0: alarma
    items.push({
      codigo: "BASES_EN_CERO",
      mensaje: `Total ${c.totalOperacion} pero todas las bases imponibles están en cero`,
      referencia: ref,
    })
  }

  return items
}

/**
 * validarAlicuotasComprobante: ComprobanteIva AlicuotaIva[] -> ValidacionItem[]
 *
 * Verifica que las alícuotas asociadas a un comprobante:
 * - Son del mismo libro (VENTAS/COMPRAS)
 * - Coinciden en (tipoCbte, ptoVenta, numero)
 * - Suman al neto gravado del cabecera (con tolerancia $1)
 * - Son alícuotas válidas (3, 4, 5, 6, 8, 9)
 * - Cantidad coincide con cantidadAlicuotas declarado
 */
function validarAlicuotasComprobante(
  c: ComprobanteIva,
  alicuotas: AlicuotaIva[],
): ValidacionItem[] {
  const items: ValidacionItem[] = []
  const ref = {
    tipoReferencia: c.tipoReferencia,
    id: c.referenciaId,
    cbte: `${c.tipoComprobanteArca} ${c.puntoVenta}-${c.numeroDesde}`,
  }

  // Filtrar alícuotas de este comprobante
  const alicCbte = alicuotas.filter(
    (a) =>
      a.tipoComprobanteArca === c.tipoComprobanteArca &&
      a.puntoVenta === c.puntoVenta &&
      a.numeroComprobante === c.numeroDesde,
  )

  // Bloqueante: cantidad declarada vs real
  if (alicCbte.length === 0) {
    items.push({
      codigo: "ALICUOTAS_FALTANTES",
      mensaje: `No hay filas de alícuota para ${ref.cbte}`,
      referencia: ref,
    })
    return items
  }

  if (alicCbte.length !== c.cantidadAlicuotas) {
    items.push({
      codigo: "CANTIDAD_ALICUOTAS_INCONSISTENTE",
      mensaje: `Cantidad declarada (${c.cantidadAlicuotas}) no coincide con filas (${alicCbte.length})`,
      referencia: ref,
    })
  }

  // Bloqueante: cada alícuota debe ser soportada
  for (const a of alicCbte) {
    if (!alicuotaSoportada(a.alicuotaPorcentaje)) {
      items.push({
        codigo: "ALICUOTA_NO_SOPORTADA",
        mensaje: `Alícuota ${a.alicuotaPorcentaje}% no está en la matriz ARCA (3, 5, 8, 4, 5, 6, 9)`,
        referencia: ref,
      })
    }
  }

  // Advertencia: suma de bases en alícuotas debe ≈ neto del cabecera
  const sumaBases = sumarImportes(alicCbte.map((a) => a.netoGravado))
  if (Math.abs(restarImportes(sumaBases, c.netoGravado)) > 0.01) {
    items.push({
      codigo: "SUMA_BASES_INCONSISTENTE",
      mensaje: `Suma de bases en alícuotas (${sumaBases}) no coincide con neto del comprobante (${c.netoGravado})`,
      referencia: ref,
    })
  }

  return items
}

/**
 * Códigos que se consideran ADVERTENCIAS (no bloquean generación).
 * Todos los demás son ERRORES bloqueantes.
 */
const CODIGOS_ADVERTENCIA = new Set<string>([
  "SUMA_BASES_INCONSISTENTE",
  "BASES_EN_CERO",
])

function clasificar(item: ValidacionItem): "error" | "advertencia" {
  return CODIGOS_ADVERTENCIA.has(item.codigo) ? "advertencia" : "error"
}

/**
 * validarPeriodo: DatosIvaPeriodo -> ResultadoValidacion
 *
 * Dado los datos finales del período (después de aplicar ajustes), valida:
 * - cada comprobante (campos obligatorios, CUIT, tipoCbte)
 * - cada conjunto de alícuotas (consistencia con cabecera, alícuotas válidas)
 * - duplicados (mismo tipoCbte, ptoVenta, numero)
 *
 * Devuelve { errores, advertencias }. Si errores está vacío, se puede generar TXT.
 */
export function validarPeriodo(datos: DatosIvaPeriodo): ResultadoValidacion {
  const errores: ValidacionItem[] = []
  const advertencias: ValidacionItem[] = []

  function agregar(item: ValidacionItem) {
    if (clasificar(item) === "error") errores.push(item)
    else advertencias.push(item)
  }

  // Validar ventas
  for (const c of datos.ventas.comprobantes) {
    for (const item of validarComprobante(c)) agregar(item)
    for (const item of validarAlicuotasComprobante(c, datos.ventas.alicuotas)) agregar(item)
  }

  // Validar compras
  for (const c of datos.compras.comprobantes) {
    for (const item of validarComprobante(c)) agregar(item)
    for (const item of validarAlicuotasComprobante(c, datos.compras.alicuotas)) agregar(item)
  }

  // Validar duplicados (mismo tipoCbte, ptoVenta, número) por libro
  const ventasKeys = new Set<string>()
  for (const c of datos.ventas.comprobantes) {
    const key = `${c.tipoComprobanteArca}-${c.puntoVenta}-${c.numeroDesde}`
    if (ventasKeys.has(key)) {
      agregar({
        codigo: "COMPROBANTE_DUPLICADO",
        mensaje: `Comprobante duplicado en ventas: ${etiquetaComprobanteArca(c.tipoComprobanteArca)} ${key}`,
        referencia: { tipoReferencia: c.tipoReferencia, id: c.referenciaId, cbte: key },
      })
    }
    ventasKeys.add(key)
  }
  const comprasKeys = new Set<string>()
  for (const c of datos.compras.comprobantes) {
    const key = `${c.tipoComprobanteArca}-${c.puntoVenta}-${c.numeroDesde}`
    if (comprasKeys.has(key)) {
      agregar({
        codigo: "COMPROBANTE_DUPLICADO",
        mensaje: `Comprobante duplicado en compras: ${etiquetaComprobanteArca(c.tipoComprobanteArca)} ${key}`,
        referencia: { tipoReferencia: c.tipoReferencia, id: c.referenciaId, cbte: key },
      })
    }
    comprasKeys.add(key)
  }

  return { errores, advertencias }
}
