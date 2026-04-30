/**
 * pdf-gastos.ts — PDF del reporte "Detalle de Gastos por Concepto".
 * Agrupa por rubro (concepto de factura, "VIAJES CONTRATADOS" para LP).
 */

import { generarPDFReporteAgrupado } from "@/lib/pdf-tabla-agrupada"
import { sumarImportes } from "@/lib/money"

export type GastoItem = {
  rubro: string
  fecha: Date | null
  descripcion: string
  monto: number
}

function fmt(n: number): string {
  return "$ " + n.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtFecha(d: Date | null): string {
  if (!d) return "—"
  return new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(d)
}

/**
 * generarPDFGastos: GastoItem[] string -> Promise<Buffer>
 *
 * Dado todos los gastos del período (facturas de proveedor + LPs como
 * "VIAJES CONTRATADOS"), genera el PDF agrupado por rubro con subtotales.
 */
export function generarPDFGastos(items: GastoItem[], periodoLabel: string): Promise<Buffer> {
  // Agrupar por rubro
  const map = new Map<string, GastoItem[]>()
  for (const i of items) {
    if (!map.has(i.rubro)) map.set(i.rubro, [])
    map.get(i.rubro)!.push(i)
  }
  const grupos = Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([nombre, items]) => {
      const subtotal = sumarImportes(items.map(i => i.monto))
      return {
        titulo: `Rubro: ${nombre.replace(/_/g, " ")}`,
        filas: items.map(i => [fmtFecha(i.fecha), i.descripcion, fmt(i.monto)]),
        subtotal: [`Subtotal ${nombre.replace(/_/g, " ")}`, null, fmt(subtotal)],
      }
    })

  const totalGeneral = sumarImportes(items.map(i => i.monto))

  // Layout portrait, 523pt útil. Columnas: Fecha (60) · Descripción (380) · Monto (83)
  return generarPDFReporteAgrupado({
    titulo: "Detalle de Gastos por Concepto",
    subtitulo: `Período: ${periodoLabel} · ${items.length} ítem(s)`,
    orientacion: "portrait",
    columnas: [
      { label: "Fecha", width: 60 },
      { label: "Descripción", width: 380 },
      { label: "Monto", width: 83, align: "right" },
    ],
    grupos,
    totalGeneral: items.length > 0 ? {
      label: "TOTAL GENERAL",
      valores: [null, null, fmt(totalGeneral)],
    } : undefined,
    mensajeVacio: "Sin gastos para el período seleccionado.",
  })
}
