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
function etiquetaCbte(c: ComprobanteIva): string {
  // Formato amigable: "Factura A 0015-00011666"
  const tipo = (c.tipoComprobanteArca === 1) ? "Factura A"
    : (c.tipoComprobanteArca === 6) ? "Factura B"
    : (c.tipoComprobanteArca === 2) ? "Nota de Débito A"
    : (c.tipoComprobanteArca === 3) ? "Nota de Crédito A"
    : (c.tipoComprobanteArca === 7) ? "Nota de Débito B"
    : (c.tipoComprobanteArca === 8) ? "Nota de Crédito B"
    : (c.tipoComprobanteArca === 60) ? "CVLP A"
    : (c.tipoComprobanteArca === 61) ? "CVLP B"
    : (c.tipoComprobanteArca === 201) ? "Factura MiPyMEs A"
    : (c.tipoComprobanteArca === 202) ? "ND MiPyMEs A"
    : (c.tipoComprobanteArca === 203) ? "NC MiPyMEs A"
    : `Tipo ${c.tipoComprobanteArca}`
  const ptoStr = String(c.puntoVenta).padStart(4, "0")
  const numStr = String(c.numeroDesde).padStart(8, "0")
  return `${tipo} ${ptoStr}-${numStr}`
}

function validarComprobante(c: ComprobanteIva): ValidacionItem[] {
  const items: ValidacionItem[] = []
  const cbteLabel = etiquetaCbte(c)
  const ref = {
    tipoReferencia: c.tipoReferencia,
    id: c.referenciaId,
    cbte: cbteLabel,
  }

  // Bloqueante: tipo de comprobante no soportado
  if (!codigoArcaSoportado(c.tipoComprobanteArca)) {
    items.push({
      codigo: "TIPO_COMPROBANTE_NO_SOPORTADO",
      mensaje: `El comprobante de ${c.razonSocialContraparte || "—"} tiene un tipo no reconocido por ARCA. Solo se aceptan: Factura A/B/MiPyMEs, Notas de Crédito/Débito A/B/MiPyMEs y CVLP A/B. Revisar la carga del comprobante.`,
      referencia: ref,
    })
  }

  // Bloqueante: CUIT inválido (B2B obligatorio CUIT 11 dígitos válidos)
  if (!validarCuit(c.cuitContraparte)) {
    items.push({
      codigo: "CUIT_INVALIDO",
      mensaje: `${cbteLabel} — CUIT "${c.cuitContraparte || "(vacío)"}" del cliente/proveedor "${c.razonSocialContraparte || "—"}" no es válido (debe tener 11 dígitos y dígito verificador correcto). Corregir en la ficha del cliente/proveedor.`,
      referencia: ref,
    })
  }

  // Bloqueante: punto de venta debe estar (>=1)
  if (!c.puntoVenta || c.puntoVenta < 1) {
    items.push({
      codigo: "PUNTO_VENTA_FALTANTE",
      mensaje: `${cbteLabel} — Falta el punto de venta. Es obligatorio para presentar a ARCA.`,
      referencia: ref,
    })
  }

  // Bloqueante: número de comprobante debe estar
  if (!c.numeroDesde || c.numeroDesde < 1) {
    items.push({
      codigo: "NUMERO_COMPROBANTE_FALTANTE",
      mensaje: `${cbteLabel} — Falta el número de comprobante. Es obligatorio para presentar a ARCA.`,
      referencia: ref,
    })
  }

  // Bloqueante: importes no NaN
  const camposImporte: Array<[keyof ComprobanteIva, string]> = [
    ["totalOperacion", "Total"],
    ["netoGravado", "Neto gravado"],
    ["exento", "Exento"],
    ["noGravado", "No gravado"],
  ]
  for (const [campo, etiqueta] of camposImporte) {
    const v = c[campo] as number
    if (typeof v !== "number" || !Number.isFinite(v)) {
      items.push({
        codigo: "IMPORTE_INVALIDO",
        mensaje: `${cbteLabel} — El importe "${etiqueta}" tiene un valor inválido. Revisar la carga del comprobante.`,
        referencia: ref,
      })
    }
  }

  // Bloqueante: cantidad alícuotas debe ser >= 1 y <= 9
  if (c.cantidadAlicuotas < 1 || c.cantidadAlicuotas > 9) {
    items.push({
      codigo: "CANTIDAD_ALICUOTAS_INVALIDA",
      mensaje: `${cbteLabel} — Tiene ${c.cantidadAlicuotas} alícuotas declaradas. ARCA solo acepta entre 1 y 9 por comprobante.`,
      referencia: ref,
    })
  }

  // Advertencia: total > 0 pero bases imponibles en 0
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
  if (Math.abs(restarImportes(c.totalOperacion, totalEsperado)) < 0.01 && totalEsperado === 0 && c.totalOperacion > 0) {
    items.push({
      codigo: "BASES_EN_CERO",
      mensaje: `${cbteLabel} — Total $${c.totalOperacion.toFixed(2)} pero el comprobante no tiene bases imponibles (gravado, exento, no gravado, percepciones). Revisar la carga.`,
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
  const cbteLabel = etiquetaCbte(c)
  const ref = {
    tipoReferencia: c.tipoReferencia,
    id: c.referenciaId,
    cbte: cbteLabel,
  }

  const alicCbte = alicuotas.filter(
    (a) =>
      a.tipoComprobanteArca === c.tipoComprobanteArca &&
      a.puntoVenta === c.puntoVenta &&
      a.numeroComprobante === c.numeroDesde,
  )

  if (alicCbte.length === 0) {
    items.push({
      codigo: "ALICUOTAS_FALTANTES",
      mensaje: `${cbteLabel} — No tiene filas de IVA cargadas. Probablemente fue ingresado sin desglose por alícuota.`,
      referencia: ref,
    })
    return items
  }

  if (alicCbte.length !== c.cantidadAlicuotas) {
    items.push({
      codigo: "CANTIDAD_ALICUOTAS_INCONSISTENTE",
      mensaje: `${cbteLabel} — Tiene ${alicCbte.length} alícuotas de IVA cargadas pero declaradas ${c.cantidadAlicuotas}. Si hay otro comprobante con el mismo número, las alícuotas se están mezclando.`,
      referencia: ref,
    })
  }

  for (const a of alicCbte) {
    if (!alicuotaSoportada(a.alicuotaPorcentaje)) {
      items.push({
        codigo: "ALICUOTA_NO_SOPORTADA",
        mensaje: `${cbteLabel} — La alícuota de IVA ${a.alicuotaPorcentaje}% no es válida para ARCA. Solo se aceptan 0%, 2.5%, 5%, 10.5%, 21% y 27%.`,
        referencia: ref,
      })
    }
  }

  const sumaBases = sumarImportes(alicCbte.map((a) => a.netoGravado))
  const diferencia = restarImportes(sumaBases, c.netoGravado)
  if (Math.abs(diferencia) > 0.01) {
    items.push({
      codigo: "SUMA_BASES_INCONSISTENTE",
      mensaje: `${cbteLabel} — La suma de bases imponibles por alícuota ($${sumaBases.toFixed(2)}) no coincide con el neto gravado del comprobante ($${c.netoGravado.toFixed(2)}). Diferencia: $${Math.abs(diferencia).toFixed(2)}.`,
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

  // PASO 1: detectar duplicados (mismo tipoCbte, ptoVenta, número).
  // Cuando hay duplicado, los errores derivados (CANTIDAD_ALICUOTAS_INCONSISTENTE,
  // SUMA_BASES_INCONSISTENTE) son falsos positivos — los suprimimos para no
  // confundir al contador.
  const ventasKeysDup = new Set<string>()
  const comprasKeysDup = new Set<string>()
  for (const c of datos.ventas.comprobantes) {
    const key = `${c.tipoComprobanteArca}-${c.puntoVenta}-${c.numeroDesde}`
    ventasKeysDup.add(key)
  }
  for (const c of datos.compras.comprobantes) {
    const key = `${c.tipoComprobanteArca}-${c.puntoVenta}-${c.numeroDesde}`
    comprasKeysDup.add(key)
  }

  // Map de duplicados a la lista de comprobantes que comparten la terna
  const ventasDuplicados = new Map<string, ComprobanteIva[]>()
  const comprasDuplicados = new Map<string, ComprobanteIva[]>()
  for (const c of datos.ventas.comprobantes) {
    const key = `${c.tipoComprobanteArca}-${c.puntoVenta}-${c.numeroDesde}`
    if (!ventasDuplicados.has(key)) ventasDuplicados.set(key, [])
    ventasDuplicados.get(key)!.push(c)
  }
  for (const c of datos.compras.comprobantes) {
    const key = `${c.tipoComprobanteArca}-${c.puntoVenta}-${c.numeroDesde}`
    if (!comprasDuplicados.has(key)) comprasDuplicados.set(key, [])
    comprasDuplicados.get(key)!.push(c)
  }

  const ternasConDup = new Set<string>()
  for (const [key, lista] of Array.from(ventasDuplicados)) if (lista.length > 1) ternasConDup.add("V:" + key)
  for (const [key, lista] of Array.from(comprasDuplicados)) if (lista.length > 1) ternasConDup.add("C:" + key)

  function ternaDe(c: ComprobanteIva, libro: "V" | "C"): string {
    return `${libro}:${c.tipoComprobanteArca}-${c.puntoVenta}-${c.numeroDesde}`
  }

  // PASO 2: emitir DUPLICADO con detalle (montos y fechas de cada uno)
  for (const [, lista] of Array.from(ventasDuplicados)) {
    if (lista.length > 1) emitirDuplicado(lista, "Ventas")
  }
  for (const [, lista] of Array.from(comprasDuplicados)) {
    if (lista.length > 1) emitirDuplicado(lista, "Compras")
  }

  function emitirDuplicado(lista: ComprobanteIva[], libro: string) {
    const detalle = lista.map((c, i) => {
      const fecha = c.fecha.toISOString().slice(0, 10)
      return `(${i + 1}) ${c.razonSocialContraparte || "—"} · fecha ${fecha} · neto $${c.netoGravado.toFixed(2)} · total $${c.totalOperacion.toFixed(2)}`
    }).join("  •  ")
    const cbteFmt = etiquetaCbte(lista[0])
    agregar({
      codigo: "COMPROBANTE_DUPLICADO",
      mensaje: `Hay ${lista.length} comprobantes en ${libro} con el mismo número fiscal: ${cbteFmt}. ARCA no permite duplicados; uno de los dos está mal cargado. Detalle: ${detalle}. Acción: revisar y eliminar/anular el comprobante incorrecto.`,
      referencia: { tipoReferencia: lista[0].tipoReferencia, id: lista[0].referenciaId, cbte: cbteFmt },
    })
  }

  // PASO 3: validar comprobantes/alícuotas, suprimiendo síntomas en duplicados
  const SUPRIMIBLES = new Set([
    "CANTIDAD_ALICUOTAS_INCONSISTENTE",
    "SUMA_BASES_INCONSISTENTE",
    "ALICUOTAS_FALTANTES",
  ])

  function emitirValidacionesCbte(c: ComprobanteIva, libro: "V" | "C", alicuotas: AlicuotaIva[]) {
    const enDup = ternasConDup.has(ternaDe(c, libro))
    for (const item of validarComprobante(c)) agregar(item)
    for (const item of validarAlicuotasComprobante(c, alicuotas)) {
      if (enDup && SUPRIMIBLES.has(item.codigo)) continue // suprimir síntoma
      agregar(item)
    }
  }

  for (const c of datos.ventas.comprobantes) {
    emitirValidacionesCbte(c, "V", datos.ventas.alicuotas)
  }
  for (const c of datos.compras.comprobantes) {
    emitirValidacionesCbte(c, "C", datos.compras.alicuotas)
  }

  return { errores, advertencias }
}
