// ─── Roles ────────────────────────────────────────────────────────────────────

import {
  EstadoFacturaDocumento,
  EstadoFacturaViaje,
  EstadoLiquidacionDocumento,
  EstadoLiquidacionViaje,
} from "@/lib/viaje-workflow"

export const Roles = {
  ADMIN_TRANSMAGG: "ADMIN_TRANSMAGG",
  OPERADOR_TRANSMAGG: "OPERADOR_TRANSMAGG",
  FLETERO: "FLETERO",
  CHOFER: "CHOFER",
  ADMIN_EMPRESA: "ADMIN_EMPRESA",
  OPERADOR_EMPRESA: "OPERADOR_EMPRESA",
} as const

export type Rol = keyof typeof Roles

export const ROLES_TRANSMAGG: Rol[] = ["ADMIN_TRANSMAGG", "OPERADOR_TRANSMAGG"]
export const ROLES_EXTERNOS: Rol[] = ["FLETERO", "CHOFER", "ADMIN_EMPRESA", "OPERADOR_EMPRESA"]

// ─── Enums de negocio ─────────────────────────────────────────────────────────

export { EstadoLiquidacionDocumento as EstadoLiquidacion }
export { EstadoFacturaDocumento as EstadoFactura }
export { EstadoLiquidacionViaje, EstadoFacturaViaje }

export const EstadoArca = {
  PENDIENTE: "PENDIENTE",
  ACEPTADA: "ACEPTADA",
  RECHAZADA: "RECHAZADA",
} as const

export const TipoPagoFletero = {
  CHEQUE: "CHEQUE",
  EFECTIVO: "EFECTIVO",
  TRANSFERENCIA: "TRANSFERENCIA",
  ADELANTO: "ADELANTO",
} as const

export const TipoPagoEmpresa = {
  CHEQUE: "CHEQUE",
  EFECTIVO: "EFECTIVO",
  TRANSFERENCIA: "TRANSFERENCIA",
} as const

export const TipoIva = {
  VENTA: "VENTA",
  COMPRA: "COMPRA",
} as const

export const CondicionIva = {
  RESPONSABLE_INSCRIPTO: "Responsable Inscripto",
  MONOTRIBUTISTA: "Monotributista",
  EXENTO: "Exento",
  CONSUMIDOR_FINAL: "Consumidor Final",
} as const

export const TipoCbte = {
  A: "A",
  B: "B",
  C: "C",
  M: "M",
  X: "X",
} as const

export const EstadoViaje = {
  PENDIENTE_LIQUIDAR: "PENDIENTE_LIQUIDAR",
  LIQUIDADO: "LIQUIDADO",
  PENDIENTE_FACTURAR: "PENDIENTE_FACTURAR",
  FACTURADO: "FACTURADO",
} as const

export type EstadoViajeType = keyof typeof EstadoViaje
