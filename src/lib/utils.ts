import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * cn: ClassValue[] -> string
 *
 * Dadas clases CSS (strings, objetos condicionales o arreglos),
 * devuelve un string con las clases fusionadas y sin duplicados de Tailwind.
 * Existe para combinar clsx (condicionales) con tailwind-merge (deduplicación),
 * evitando que clases conflictivas de Tailwind coexistan en el mismo elemento.
 *
 * Ejemplos:
 * cn("px-4", "py-2")    === "px-4 py-2"
 * cn("px-4", "px-2")    === "px-2"
 * cn("base", false)     === "base"
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * formatearMoneda: number -> string
 *
 * Dado un monto numérico, devuelve un string formateado como moneda ARS
 * con el símbolo "$", separador de miles "." y decimal ",".
 * Existe para presentar valores monetarios con el formato local argentino
 * de manera consistente en toda la interfaz.
 *
 * Ejemplos:
 * formatearMoneda(0)       === "$\u00a00,00"
 * formatearMoneda(1500)    === "$\u00a01.500,00"
 * formatearMoneda(1234.56) === "$\u00a01.234,56"
 */
export function formatearMoneda(monto: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  }).format(monto)
}

/**
 * formatearFecha: Date | string -> string
 *
 * Dada una fecha (objeto Date o string ISO), devuelve un string
 * en formato DD/MM/YYYY usando la localización argentina.
 * Existe para mostrar fechas de viajes, liquidaciones y facturas
 * de forma legible y uniforme en toda la interfaz.
 *
 * Ejemplos:
 * formatearFecha(new Date("2025-03-15T12:00:00Z")) === "15/03/2025"
 * formatearFecha("2024-12-01T12:00:00Z")           === "01/12/2024"
 * formatearFecha(new Date("2026-01-31T12:00:00Z")) === "31/01/2026"
 */
export function formatearFecha(fecha: Date | string): string {
  const d = typeof fecha === "string" ? new Date(fecha) : fecha
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d)
}

/**
 * formatearCuit: string -> string
 *
 * Dado un CUIT argentino como string de dígitos (con o sin guiones),
 * devuelve el CUIT formateado como "XX-XXXXXXXX-X".
 * Si la cadena no contiene exactamente 11 dígitos, devuelve el original.
 * Existe para presentar CUITs de fleteros, empresas y proveedores
 * con el formato oficial en el contexto fiscal argentino.
 *
 * Ejemplos:
 * formatearCuit("20123456789")  === "20-12345678-9"
 * formatearCuit("30714295698")  === "30-71429569-8"
 * formatearCuit("12345")        === "12345"
 */
export function formatearCuit(cuit: string): string {
  const limpio = cuit.replace(/\D/g, "")
  if (limpio.length !== 11) return cuit
  return `${limpio.slice(0, 2)}-${limpio.slice(2, 10)}-${limpio.slice(10)}`
}

/**
 * truncar: string number -> string
 *
 * Dado un texto y una longitud máxima (por defecto 50),
 * devuelve el texto sin cambios si cabe dentro del límite,
 * o los primeros (maxLength - 3) caracteres seguidos de "..." si lo excede.
 * Existe para recortar descripciones largas (mercadería, razón social)
 * en listados donde el espacio disponible es limitado.
 *
 * Ejemplos:
 * truncar("Hola mundo", 50)                 === "Hola mundo"
 * truncar("Texto muy largo que excede", 10) === "Texto m..."
 * truncar("exacto", 6)                      === "exacto"
 */
export function truncar(texto: string, maxLength = 50): string {
  if (texto.length <= maxLength) return texto
  return texto.slice(0, maxLength - 3) + "..."
}
