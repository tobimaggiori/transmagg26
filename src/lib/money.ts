/**
 * money.ts — Módulo monetario central de Transmagg
 *
 * Fuente de verdad monetaria del proyecto.
 *
 * Toda lógica de importes, IVA, totales, saldos, comisiones,
 * retenciones, percepciones y comparaciones monetarias debe pasar por este módulo.
 *
 * No introducir cálculos monetarios inline fuera de este archivo
 * o de helpers de dominio que deleguen explícitamente en él.
 *
 * ============================================================================
 * POLÍTICA MONETARIA DEL SISTEMA
 * ============================================================================
 *
 * 1. REPRESENTACIÓN
 *    Los importes monetarios se representan con Decimal (decimal.js) en todos
 *    los cálculos internos. En la frontera hacia UI/JSON se convierten a number
 *    ya redondeados. En Prisma, los campos monetarios se modelan como Decimal.
 *
 * 2. REDONDEO
 *    - Importes finales (neto, IVA, total, comisión, monto de pago): 2 decimales.
 *    - Resultados intermedios se mantienen con precisión completa de Decimal.
 *    - Modo de redondeo: ROUND_HALF_UP (0.005 → 0.01).
 *    - Toneladas (kg→ton): 3 decimales (dominio del transporte, no monetario).
 *
 * 3. CÁLCULO DE IVA
 *    IVA se calcula como: redondear2(neto × alícuota / 100).
 *    El total se calcula como: redondear2(neto + IVA).
 *    La alícuota se recibe en puntos porcentuales (21 = 21%, no 0.21).
 *
 * 4. COMISIONES
 *    comisión = redondear2(base × porcentaje / 100).
 *
 * 5. COMPARACIÓN
 *    Dos importes monetarios se consideran iguales si difieren en menos de $0.01.
 *    Esta tolerancia cubre diferencias por redondeo entre cálculos independientes.
 *
 * 6. SERIALIZACIÓN
 *    - API → Frontend: number (ya redondeado a 2 decimales).
 *    - Frontend → API: string o number, parseado con parsearImporte().
 *    - DB (Prisma Decimal) → App: convertido a number por result extension en prisma.ts.
 *
 * 7. LIMITACIÓN DE SQLITE / LIBSQL / TURSO
 *    En SQLite/libSQL/Turso, DECIMAL no implica precisión decimal exacta en disco.
 *    La precisión monetaria efectiva depende de que todos los cálculos pasen por
 *    este módulo (decimal.js) y de que los importes se redondeen correctamente
 *    según esta política.
 *
 * 8. REGLA CRÍTICA
 *    NUNCA hacer aritmética directa con number monetarios fuera de este módulo.
 *    Incluso `a + b` entre dos valores redondeados puede producir resultados
 *    inesperados por representación binaria. Siempre usar sumarImportes(),
 *    restarImportes(), aplicarPorcentaje(), calcularIva(), etc.
 *
 * ============================================================================
 */

import { Decimal } from "decimal.js"

// Configuración global de decimal.js para el módulo monetario
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP })

// ─── Tipos ────────���───────────────────────────���──────────────────────────────

/**
 * Diseño de datos:
 * MonetaryInput acepta cualquier valor que represente un importe monetario:
 * - number: valor numérico JS (puede tener imprecisión flotante)
 * - string: representación textual ("1234.56")
 * - DecimalLike: cualquier objeto con toNumber() (Prisma.Decimal, decimal.js Decimal, etc.)
 */
type DecimalLike = { toNumber(): number; toString(): string }
export type MonetaryInput = number | string | DecimalLike

// ─── Conversión interna ──────────────────────────────────────────────────────

function toDecimal(val: MonetaryInput): Decimal {
  if (val instanceof Decimal) return val
  if (typeof val === "number") return new Decimal(val)
  if (typeof val === "string") return new Decimal(val || "0")
  // DecimalLike (Prisma.Decimal u otros)
  return new Decimal(val.toString())
}

// ─── Funciones monetarias ──────────────���─────────────────────────────────────

/**
 * m: MonetaryInput -> number
 *
 * Dado [un importe monetario en cualquier formato], devuelve [el valor como number
 * redondeado a 2 decimales según la política monetaria del sistema].
 * Existe para convertir de forma segura cualquier representación monetaria
 * (Prisma.Decimal, string, number) a un number utilizable en JS.
 *
 * Ejemplos:
 * m(10.005) === 10.01
 * m("1234.56") === 1234.56
 * m(0.1 + 0.2) === 0.3
 */
export function m(val: MonetaryInput): number {
  return toDecimal(val).toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber()
}

/**
 * redondearMonetario: MonetaryInput -> number
 *
 * Dado [un importe monetario], devuelve [el importe redondeado a 2 decimales].
 * Alias explícito de m() para contextos donde se quiere dejar claro
 * que se está aplicando la política de redondeo monetario.
 *
 * Ejemplos:
 * redondearMonetario(10.005) === 10.01
 * redondearMonetario(6.004) === 6
 * redondearMonetario(10.999) === 11
 */
export const redondearMonetario = m

/**
 * sumarImportes: MonetaryInput[] -> number
 *
 * Dado [un arreglo de importes monetarios], devuelve [su suma exacta redondeada
 * a 2 decimales según la política monetaria del sistema].
 * Existe para reemplazar reduce((acc, x) => acc + x, 0) sobre importes,
 * que acumula error flotante.
 *
 * Ejemplos:
 * sumarImportes([10, 20]) === 30
 * sumarImportes([0.1, 0.2]) === 0.3
 * sumarImportes([]) === 0
 * sumarImportes([33.33, 33.33, 33.34]) === 100
 */
export function sumarImportes(importes: MonetaryInput[]): number {
  const total = importes.reduce<Decimal>(
    (acc, val) => acc.plus(toDecimal(val)),
    new Decimal(0)
  )
  return total.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber()
}

/**
 * restarImportes: MonetaryInput MonetaryInput -> number
 *
 * Dados [dos importes monetarios a y b], devuelve [a - b redondeado a 2 decimales].
 * Existe para evitar resta directa entre numbers que puede dar resultados
 * como 100 - 33.33 = 66.66999999999999.
 *
 * Ejemplos:
 * restarImportes(100, 33.33) === 66.67
 * restarImportes(1000, 1000) === 0
 * restarImportes(0.3, 0.1) === 0.2
 */
export function restarImportes(a: MonetaryInput, b: MonetaryInput): number {
  return toDecimal(a)
    .minus(toDecimal(b))
    .toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
    .toNumber()
}

/**
 * multiplicarImporte: MonetaryInput MonetaryInput -> number
 *
 * Dado [un importe y un factor], devuelve [el producto redondeado a 2 decimales].
 * Existe para multiplicaciones monetarias seguras (ej: cantidad × precio unitario).
 *
 * Ejemplos:
 * multiplicarImporte(100, 1.21) === 121
 * multiplicarImporte(33.33, 3) === 99.99
 * multiplicarImporte(0.1, 0.2) === 0.02
 */
export function multiplicarImporte(
  importe: MonetaryInput,
  factor: MonetaryInput
): number {
  return toDecimal(importe)
    .times(toDecimal(factor))
    .toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
    .toNumber()
}

/**
 * aplicarPorcentaje: MonetaryInput number -> number
 *
 * Dado [un importe base y un porcentaje (0-100)], devuelve [base × porcentaje / 100
 * redondeado a 2 decimales].
 * Existe para calcular comisiones, retenciones, percepciones y otros porcentajes
 * sobre importes monetarios sin errores de flotantes.
 *
 * Ejemplos:
 * aplicarPorcentaje(1000, 21) === 210
 * aplicarPorcentaje(1250, 10) === 125
 * aplicarPorcentaje(333.33, 21) === 70
 * aplicarPorcentaje(100, 0.6) === 0.6
 */
export function aplicarPorcentaje(
  base: MonetaryInput,
  porcentaje: number
): number {
  return toDecimal(base)
    .times(new Decimal(porcentaje))
    .dividedBy(100)
    .toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
    .toNumber()
}

/**
 * calcularIva: MonetaryInput number -> number
 *
 * Dado [un importe neto y la alícuota de IVA en puntos porcentuales],
 * devuelve [el monto de IVA redondeado a 2 decimales].
 * Alias semántico de aplicarPorcentaje para el cálculo impositivo.
 *
 * Ejemplos:
 * calcularIva(1000, 21) === 210
 * calcularIva(1500, 21) === 315
 * calcularIva(1125, 21) === 236.25
 * calcularIva(500, 0) === 0
 * calcularIva(333.33, 21) === 70
 */
export function calcularIva(neto: MonetaryInput, ivaPct: number): number {
  return aplicarPorcentaje(neto, ivaPct)
}

/**
 * calcularNetoMasIva: MonetaryInput number -> { neto: number, iva: number, total: number }
 *
 * Dado [un importe neto y la alícuota de IVA], devuelve [el desglose neto + IVA + total,
 * cada uno redondeado a 2 decimales según la política monetaria].
 * Existe para centralizar el cálculo de IVA que se repite en facturas, liquidaciones,
 * notas de crédito/débito y proveedores.
 *
 * Ejemplos:
 * calcularNetoMasIva(1000, 21) === { neto: 1000, iva: 210, total: 1210 }
 * calcularNetoMasIva(333.33, 21) === { neto: 333.33, iva: 70, total: 403.33 }
 * calcularNetoMasIva(500, 0) === { neto: 500, iva: 0, total: 500 }
 */
export function calcularNetoMasIva(
  neto: MonetaryInput,
  ivaPct: number
): { neto: number; iva: number; total: number } {
  const netoD = toDecimal(neto)
  const ivaD = netoD
    .times(new Decimal(ivaPct))
    .dividedBy(100)
    .toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
  const totalD = netoD.plus(ivaD).toDecimalPlaces(2, Decimal.ROUND_HALF_UP)

  return {
    neto: netoD.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber(),
    iva: ivaD.toNumber(),
    total: totalD.toNumber(),
  }
}

/**
 * importesIguales: MonetaryInput MonetaryInput number? -> boolean
 *
 * Dados [dos importes monetarios y una tolerancia opcional en centavos (default: 0.01)],
 * devuelve [true si la diferencia absoluta es menor o igual a la tolerancia].
 * Existe para comparar importes que pueden diferir por redondeos independientes,
 * evitando comparaciones directas con === entre flotantes.
 *
 * Ejemplos:
 * importesIguales(100, 100) === true
 * importesIguales(100, 100.005) === true
 * importesIguales(100, 100.02) === false
 * importesIguales(0.1 + 0.2, 0.3) === true
 */
export function importesIguales(
  a: MonetaryInput,
  b: MonetaryInput,
  tolerancia: number = 0.01
): boolean {
  const diff = toDecimal(a).minus(toDecimal(b)).abs()
  return diff.lte(new Decimal(tolerancia))
}

/**
 * parsearImporte: string | number -> number
 *
 * Dado [un valor de input de formulario (string o number)],
 * devuelve [el importe parseado y redondeado a 2 decimales, o 0 si no es válido].
 * Existe para reemplazar parseFloat(x) || 0 en formularios y API routes,
 * garantizando que el resultado siempre es un number válido redondeado.
 *
 * Ejemplos:
 * parsearImporte("1234.56") === 1234.56
 * parsearImporte("") === 0
 * parsearImporte("abc") === 0
 * parsearImporte(10.005) === 10.01
 * parsearImporte("  100.50  ") === 100.5
 */
export function parsearImporte(val: string | number): number {
  if (typeof val === "number") {
    if (!Number.isFinite(val)) return 0
    return m(val)
  }
  const limpio = val.trim()
  if (limpio === "") return 0
  try {
    return new Decimal(limpio)
      .toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
      .toNumber()
  } catch {
    return 0
  }
}

/**
 * esMayorQueCero: MonetaryInput -> boolean
 *
 * Dado [un importe monetario], devuelve [true si es estrictamente mayor que 0].
 * Existe para validaciones de monto positivo en formularios y API routes.
 *
 * Ejemplos:
 * esMayorQueCero(100) === true
 * esMayorQueCero(0) === false
 * esMayorQueCero(-5) === false
 * esMayorQueCero(0.01) === true
 */
export function esMayorQueCero(val: MonetaryInput): boolean {
  return toDecimal(val).gt(0)
}

/**
 * maxMonetario: MonetaryInput MonetaryInput -> number
 *
 * Dados [dos importes], devuelve [el mayor de los dos, redondeado a 2 decimales].
 *
 * Ejemplos:
 * maxMonetario(100, 200) === 200
 * maxMonetario(-5, 0) === 0
 */
export function maxMonetario(a: MonetaryInput, b: MonetaryInput): number {
  const da = toDecimal(a)
  const db = toDecimal(b)
  return Decimal.max(da, db).toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber()
}

/**
 * absMonetario: MonetaryInput -> number
 *
 * Dado [un importe monetario], devuelve [su valor absoluto redondeado a 2 decimales].
 *
 * Ejemplos:
 * absMonetario(-100) === 100
 * absMonetario(50.5) === 50.5
 * absMonetario(0) === 0
 */
export function absMonetario(val: MonetaryInput): number {
  return toDecimal(val).abs().toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber()
}

/**
 * dividirImporte: MonetaryInput MonetaryInput -> number
 *
 * Dado [un importe y un divisor], devuelve [el cociente redondeado a 2 decimales].
 * Existe para divisiones monetarias seguras (ej: total / cuotas).
 *
 * Ejemplos:
 * dividirImporte(100, 3) === 33.33
 * dividirImporte(1000, 4) === 250
 * dividirImporte(10, 3) === 3.33
 */
export function dividirImporte(
  importe: MonetaryInput,
  divisor: MonetaryInput
): number {
  const d = toDecimal(divisor)
  if (d.isZero()) return 0
  return toDecimal(importe)
    .dividedBy(d)
    .toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
    .toNumber()
}

// ─── Formateo (reexportado para unificar) ────────────���───────────────────────

/**
 * formatearMoneda: MonetaryInput -> String
 *
 * Dado [un importe monetario en cualquier formato], devuelve [un string
 * formateado como moneda ARS con el formato argentino ($, separador de miles ".",
 * decimal ",", 2 decimales mínimos)].
 * Existe para presentar valores monetarios de forma uniforme en toda la UI.
 *
 * Ejemplos:
 * formatearMoneda(0) === "$ 0,00"  (con non-breaking space)
 * formatearMoneda(1500) === "$ 1.500,00"
 * formatearMoneda(1234.56) === "$ 1.234,56"
 */
export function formatearMoneda(monto: MonetaryInput): string {
  const n = typeof monto === "number" ? monto : m(monto)
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  }).format(n)
}
