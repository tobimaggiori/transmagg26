import { parsearImporte, multiplicarImporte, calcularIva, sumarImportes } from "@/lib/money"

export type Proveedor = { id: string; razonSocial: string; cuit: string }
export type Cuenta = { id: string; nombre: string; tipo: string; tieneChequera: boolean }
export type ChequeEnCartera = {
  id: string
  nroCheque: string
  bancoEmisor: string
  monto: number
  fechaCobro: string
  esElectronico: boolean
}

export type AlicuotaValue = "EXENTO" | "0" | "10.5" | "21" | "27"

export type ItemForm = {
  id: string
  descripcion: string
  cantidad: string
  precioUnitario: string
  alicuotaIva: AlicuotaValue
}

export type ExitoData = {
  total: number
  estadoPago: string
  pagoRegistrado?: number | null
}

export type PercepcionForm = {
  id: string
  tipo: string
  descripcion: string
  monto: string
}

export const PERCEPCION_OPTIONS = [
  { group: "PERCEPCIONES", value: "PERCEPCION_IVA", label: "Percepcion IVA" },
  { group: "PERCEPCIONES", value: "PERCEPCION_IIBB", label: "Percepcion IIBB" },
  { group: "PERCEPCIONES", value: "PERCEPCION_GANANCIAS", label: "Percepcion Ganancias" },
  { group: "PERCEPCIONES", value: "PERCEPCION_SUSS", label: "Percepcion SUSS" },
  { group: "IMPUESTOS", value: "ICL", label: "ICL (Combustibles)" },
  { group: "IMPUESTOS", value: "CO2", label: "CO2" },
  { group: "IMPUESTOS", value: "IMPUESTO_INTERNO", label: "Impuesto Interno" },
  { group: "IMPUESTOS", value: "OTRO", label: "Otro" },
] as const

export function categoriaPercepcion(tipo: string): string {
  const impuestos = new Set(["ICL", "CO2", "IMPUESTO_INTERNO", "OTRO"])
  return impuestos.has(tipo) ? "IMPUESTO_INTERNO" : "PERCEPCION"
}

export function nuevaPercepcion(): PercepcionForm {
  return {
    id: Math.random().toString(36).slice(2),
    tipo: "PERCEPCION_IVA",
    descripcion: "",
    monto: "",
  }
}

export const TIPOS_CBTE = ["A", "B", "C", "M", "X", "LIQ_PROD"] as const
export const TIPOS_CON_IVA = new Set(["A", "M", "LIQ_PROD"])
export const CONCEPTOS = [
  "ALQUILERES",
  "COMBUSTIBLE",
  "COMPRA_DE_ACTIVOS",
  "GASTOS_DE_LIBRERIA",
  "GASTOS_DE_OFICINA",
  "GASTOS_DE_REPRESENTACION",
  "HONORARIOS_PROFESIONALES",
  "INTERNET_Y_COMUNICACIONES",
  "MANTENIMIENTO",
  "NEUMATICOS",
  "PEAJES",
] as const

export const REQUIERE_CUENTA = new Set(["TRANSFERENCIA", "CHEQUE_PROPIO"])
export const REQUIERE_CHEQUE_CARTERA = new Set(["CHEQUE_FISICO_TERCERO", "CHEQUE_ELECTRONICO_TERCERO"])
export const REQUIERE_COMPROBANTE = new Set([
  "TRANSFERENCIA",
  "CHEQUE_PROPIO",
  "CHEQUE_FISICO_TERCERO",
  "CHEQUE_ELECTRONICO_TERCERO",
])

export const SELECT_CLS =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"

export function nuevoItem(): ItemForm {
  return {
    id: Math.random().toString(36).slice(2),
    descripcion: "",
    cantidad: "1",
    precioUnitario: "",
    alicuotaIva: "21",
  }
}

export function calcularItem(item: ItemForm, discriminaIVA: boolean) {
  const cantidad = parsearImporte(item.cantidad)
  const precioUnitario = parsearImporte(item.precioUnitario)
  const subtotalNeto = multiplicarImporte(cantidad, precioUnitario)
  const esExento = discriminaIVA && item.alicuotaIva === "EXENTO"
  const alicuota = discriminaIVA && !esExento ? parsearImporte(item.alicuotaIva) : 0
  const montoIva = alicuota > 0 ? calcularIva(subtotalNeto, alicuota) : 0
  return { subtotalNeto, montoIva, subtotalTotal: sumarImportes([subtotalNeto, montoIva]), esExento, alicuota }
}
