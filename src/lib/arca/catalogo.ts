/**
 * catalogo.ts — Fuente única de verdad del catálogo fiscal ARCA de Transmagg.
 *
 * Rige: arca-matriz-comprobantes.md
 *
 * Todo código que necesite saber qué comprobantes existen, cuáles son válidos,
 * qué notas son compatibles con qué origen, o qué es emitible en esta etapa,
 * DEBE consultar este módulo. No duplicar esta lógica.
 */

// ─── Tipos ──────────────────────────────────────────────────────────────────

export type Circuito = "empresa" | "fletero"
export type RolComprobante = "base" | "nota_debito" | "nota_credito"
export type CondicionFiscal = "RESPONSABLE_INSCRIPTO" | "MONOTRIBUTISTA" | "CONSUMIDOR_FINAL" | "EXENTO"

export type ComprobanteArca = {
  /** Código ARCA oficial (1, 2, 3, 6, 7, 8, 60, 61, 65, 201, 202, 203) */
  codigo: number
  /** Nombre visible en UI */
  nombre: string
  /** Circuito al que pertenece */
  circuito: Circuito
  /** Rol del comprobante */
  rol: RolComprobante
  /** Si está operativo en esta etapa */
  operativo: boolean
  /** Códigos de comprobante origen compatibles (solo para notas) */
  origenCompatible: number[]
  /** Condiciones fiscales del receptor que permiten este comprobante */
  condicionesFiscales: CondicionFiscal[]
  /** Si puede aparecer en UI */
  visibleEnUI: boolean
  /** Módulo desde donde se emite */
  modulo: string
}

// ─── Catálogo cerrado ───────────────────────────────────────────────────────

export const CATALOGO_ARCA: readonly ComprobanteArca[] = [
  // ── Empresa: facturas base ──
  {
    codigo: 1,
    nombre: "Factura A",
    circuito: "empresa",
    rol: "base",
    operativo: true,
    origenCompatible: [],
    condicionesFiscales: ["RESPONSABLE_INSCRIPTO"],
    visibleEnUI: true,
    modulo: "empresas/facturar",
  },
  {
    codigo: 6,
    nombre: "Factura B",
    circuito: "empresa",
    rol: "base",
    operativo: true,
    origenCompatible: [],
    condicionesFiscales: ["MONOTRIBUTISTA", "CONSUMIDOR_FINAL"],
    visibleEnUI: true,
    modulo: "empresas/facturar",
  },
  {
    codigo: 201,
    nombre: "Factura de Crédito Electrónica MiPyMEs A",
    circuito: "empresa",
    rol: "base",
    operativo: true,
    origenCompatible: [],
    condicionesFiscales: ["RESPONSABLE_INSCRIPTO"],
    visibleEnUI: true,
    modulo: "empresas/facturar",
  },

  // ── Empresa: notas de débito ──
  {
    codigo: 2,
    nombre: "Nota de Débito A",
    circuito: "empresa",
    rol: "nota_debito",
    operativo: true,
    origenCompatible: [1],
    condicionesFiscales: ["RESPONSABLE_INSCRIPTO"],
    visibleEnUI: true,
    modulo: "empresas/facturas/consultar",
  },
  {
    codigo: 7,
    nombre: "Nota de Débito B",
    circuito: "empresa",
    rol: "nota_debito",
    operativo: true,
    origenCompatible: [6],
    condicionesFiscales: ["MONOTRIBUTISTA", "CONSUMIDOR_FINAL"],
    visibleEnUI: true,
    modulo: "empresas/facturas/consultar",
  },
  {
    codigo: 202,
    nombre: "Nota de Débito FCE MiPyMEs A",
    circuito: "empresa",
    rol: "nota_debito",
    operativo: true,
    origenCompatible: [201],
    condicionesFiscales: ["RESPONSABLE_INSCRIPTO"],
    visibleEnUI: true,
    modulo: "empresas/facturas/consultar",
  },

  // ── Empresa: notas de crédito ──
  {
    codigo: 3,
    nombre: "Nota de Crédito A",
    circuito: "empresa",
    rol: "nota_credito",
    operativo: true,
    origenCompatible: [1],
    condicionesFiscales: ["RESPONSABLE_INSCRIPTO"],
    visibleEnUI: true,
    modulo: "empresas/facturas/consultar",
  },
  {
    codigo: 8,
    nombre: "Nota de Crédito B",
    circuito: "empresa",
    rol: "nota_credito",
    operativo: true,
    origenCompatible: [6],
    condicionesFiscales: ["MONOTRIBUTISTA", "CONSUMIDOR_FINAL"],
    visibleEnUI: true,
    modulo: "empresas/facturas/consultar",
  },
  {
    codigo: 203,
    nombre: "Nota de Crédito FCE MiPyMEs A",
    circuito: "empresa",
    rol: "nota_credito",
    operativo: true,
    origenCompatible: [201],
    condicionesFiscales: ["RESPONSABLE_INSCRIPTO"],
    visibleEnUI: true,
    modulo: "empresas/facturas/consultar",
  },

  // ── Fletero: LP base ──
  {
    codigo: 60,
    nombre: "Cuenta de Venta y Líquido Producto A",
    circuito: "fletero",
    rol: "base",
    operativo: true,
    origenCompatible: [],
    condicionesFiscales: ["RESPONSABLE_INSCRIPTO", "MONOTRIBUTISTA"],
    visibleEnUI: true,
    modulo: "fleteros/liquidar",
  },
  {
    codigo: 61,
    nombre: "Cuenta de Venta y Líquido Producto B",
    circuito: "fletero",
    rol: "base",
    operativo: true,
    origenCompatible: [],
    condicionesFiscales: ["CONSUMIDOR_FINAL", "EXENTO"],
    visibleEnUI: true,
    modulo: "fleteros/liquidar",
  },

  // ── Fletero: nota contemplada pero NO operativa ──
  {
    codigo: 65,
    nombre: "Nota de Crédito a CVLP A",
    circuito: "fletero",
    rol: "nota_credito",
    operativo: false,
    origenCompatible: [60],
    condicionesFiscales: ["RESPONSABLE_INSCRIPTO", "MONOTRIBUTISTA"],
    visibleEnUI: false,
    modulo: "fleteros/liquidaciones",
  },
] as const

// ─── Conjuntos derivados ────────────────────────────────────────────────────

/** Todos los códigos del catálogo */
export const CODIGOS_CATALOGO = new Set(CATALOGO_ARCA.map((c) => c.codigo))

/** Solo los códigos operativos en esta etapa */
export const CODIGOS_OPERATIVOS = new Set(
  CATALOGO_ARCA.filter((c) => c.operativo).map((c) => c.codigo)
)

/** Códigos de facturas base empresa (para emisión) */
export const CODIGOS_FACTURA_BASE = new Set(
  CATALOGO_ARCA.filter((c) => c.circuito === "empresa" && c.rol === "base" && c.operativo)
    .map((c) => c.codigo)
)

/** Códigos de LP base fletero (para emisión) */
export const CODIGOS_LP_BASE = new Set(
  CATALOGO_ARCA.filter((c) => c.circuito === "fletero" && c.rol === "base" && c.operativo)
    .map((c) => c.codigo)
)

// ─── Funciones de consulta ──────────────────────────────────────────────────

/** Busca un comprobante por código. Undefined si no existe en el catálogo. */
export function buscarComprobante(codigo: number): ComprobanteArca | undefined {
  return CATALOGO_ARCA.find((c) => c.codigo === codigo)
}

/** Devuelve true si el código pertenece al catálogo cerrado. */
export function esCodValido(codigo: number): boolean {
  return CODIGOS_CATALOGO.has(codigo)
}

/** Devuelve true si el código es operativo en esta etapa. */
export function esCodOperativo(codigo: number): boolean {
  return CODIGOS_OPERATIVOS.has(codigo)
}

/**
 * Dada una factura origen, devuelve los códigos de notas NC/ND compatibles.
 * Ej: origenTipoCbte=1 → [2, 3]
 *     origenTipoCbte=6 → [7, 8]
 *     origenTipoCbte=201 → [202, 203]
 */
export function notasCompatibles(origenTipoCbte: number): number[] {
  return CATALOGO_ARCA
    .filter((c) => c.operativo && c.origenCompatible.includes(origenTipoCbte))
    .map((c) => c.codigo)
}

/**
 * Devuelve los códigos de factura base válidos para una condición fiscal,
 * ya filtrados por operatividad.
 */
export function facturasParaCondicionFiscal(condicionFiscal: string): number[] {
  return CATALOGO_ARCA
    .filter((c) =>
      c.circuito === "empresa" &&
      c.rol === "base" &&
      c.operativo &&
      c.condicionesFiscales.includes(condicionFiscal as CondicionFiscal)
    )
    .map((c) => c.codigo)
}

/**
 * Valida que un código esté habilitado en la configuración ARCA.
 * Devuelve null si es válido, o string de error si no.
 *
 * Chequea 3 condiciones:
 * 1. Pertenece al catálogo cerrado
 * 2. Está operativo en esta etapa
 * 3. Está en la lista de comprobantesHabilitados de la config
 */
export function validarComprobanteHabilitado(
  codigo: number,
  comprobantesHabilitados: number[]
): string | null {
  if (!esCodValido(codigo)) {
    return `Código ${codigo} no pertenece al catálogo ARCA de Transmagg`
  }
  if (!esCodOperativo(codigo)) {
    return `Código ${codigo} no está operativo en esta etapa`
  }
  if (!comprobantesHabilitados.includes(codigo)) {
    return `Código ${codigo} no está habilitado en la configuración ARCA`
  }
  return null
}

/**
 * Devuelve el tipoCbte correcto para una liquidación según la condición fiscal del fletero.
 * Reemplaza el legacy determinarTipoCbteLiquidacion que usaba 186/187.
 */
export function tipoCbteLiquidacion(condicionFiscal: string): number {
  if (condicionFiscal === "RESPONSABLE_INSCRIPTO" || condicionFiscal === "MONOTRIBUTISTA") {
    return 60
  }
  return 61
}

/**
 * Devuelve el tipoCbte correcto para una factura según la condición fiscal y MiPyME.
 */
export function tipoCbteFactura(condicionFiscal: string, modalidadMiPymes?: string | null): number {
  if (modalidadMiPymes) return 201
  if (condicionFiscal === "RESPONSABLE_INSCRIPTO") return 1
  return 6
}

/**
 * Valida que un código de nota sea compatible con el comprobante origen.
 * Devuelve null si es válido, o un string de error si no.
 */
export function validarNotaContraOrigen(
  tipoCbteNota: number,
  tipoCbteOrigen: number
): string | null {
  const nota = buscarComprobante(tipoCbteNota)
  if (!nota) return `Código ${tipoCbteNota} no pertenece al catálogo ARCA`
  if (!nota.operativo) return `Código ${tipoCbteNota} no está operativo en esta etapa`
  if (nota.rol === "base") return `Código ${tipoCbteNota} no es una nota`
  if (!nota.origenCompatible.includes(tipoCbteOrigen)) {
    return `Nota ${tipoCbteNota} no es compatible con comprobante origen ${tipoCbteOrigen}`
  }
  return null
}

/**
 * Clave para buscar punto de venta en la configuración ARCA.
 * Mapea cada código a su clave semántica en puntosVenta JSON.
 */
export function claveConfigPtoVenta(tipoCbte: number): string {
  switch (tipoCbte) {
    case 1: case 201: return "FACTURA_A"
    case 6: return "FACTURA_B"
    case 2: case 3: return "NOTA_CREDITO_A"
    case 7: case 8: return "NOTA_CREDITO_B"
    case 60: return "LP_A"
    case 61: return "LP_B"
    case 65: return "LP_NC_A"
    case 202: case 203: return "FACTURA_A"
    default: return "FACTURA_A"
  }
}
