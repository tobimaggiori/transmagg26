/**
 * resumen.ts — Calcula el resumen JSON que va a la UI y al ZIP.
 *
 * Función pura: input DatosIvaPeriodo + EmisorInfo → output ResumenExportacion.
 */

import type { DatosIvaPeriodo, EmisorInfo } from "./types"
import type { ResumenExportacion } from "./generar-zip"
import { sumarImportes, restarImportes } from "@/lib/money"

/**
 * calcularResumen: input -> ResumenExportacion
 *
 * Suma totales de ventas/compras y calcula posición IVA del período.
 * Si posicionIva > 0 → saldo a pagar; si < 0 → saldo a favor.
 */
export function calcularResumen(opciones: {
  datos: DatosIvaPeriodo
  cantAjustesAplicados: number
  emisor: EmisorInfo
}): ResumenExportacion {
  const { datos, cantAjustesAplicados, emisor } = opciones

  const totalNetoVentas = sumarImportes(datos.ventas.alicuotas.map((a) => a.netoGravado))
  const totalIvaVentas = sumarImportes(datos.ventas.alicuotas.map((a) => a.montoIva))
  const totalNetoCompras = sumarImportes(datos.compras.alicuotas.map((a) => a.netoGravado))
  const totalIvaCompras = sumarImportes(datos.compras.alicuotas.map((a) => a.montoIva))
  const posicionIva = restarImportes(totalIvaVentas, totalIvaCompras)

  return {
    mesAnio: datos.mesAnio,
    generadoEn: new Date().toISOString(),
    cantVentas: datos.ventas.comprobantes.length,
    cantCompras: datos.compras.comprobantes.length,
    cantAjustesAplicados,
    totalNetoVentas,
    totalIvaVentas,
    totalNetoCompras,
    totalIvaCompras,
    posicionIva,
    emisor: { cuit: emisor.cuit, razonSocial: emisor.razonSocial },
  }
}
