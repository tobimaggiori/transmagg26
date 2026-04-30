/**
 * pdf-iibb.ts — PDF del reporte "Listado de Viajes por Provincia" (IIBB).
 * Agrupa por provincia, muestra fecha, empresa, mercadería, procedencia y
 * subtotal por viaje.
 */

import { generarPDFReporteAgrupado } from "@/lib/pdf-tabla-agrupada"
import { sumarImportes } from "@/lib/money"

export type ViajeIibbItem = {
  provincia: string
  fecha: Date | null
  empresa: string
  mercaderia: string
  procedencia: string
  subtotal: number
}

function fmt(n: number): string {
  return "$ " + n.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtFecha(d: Date | null): string {
  if (!d) return "—"
  return new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(d)
}

/**
 * generarPDFIibb: ViajeIibbItem[] string -> Promise<Buffer>
 *
 * Agrupa por provincia, ordena alfabéticamente, calcula subtotales y
 * total general. Landscape para que entren las columnas de mercadería /
 * procedencia sin truncar.
 */
export function generarPDFIibb(items: ViajeIibbItem[], periodoLabel: string): Promise<Buffer> {
  const map = new Map<string, ViajeIibbItem[]>()
  for (const i of items) {
    if (!map.has(i.provincia)) map.set(i.provincia, [])
    map.get(i.provincia)!.push(i)
  }
  const grupos = Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([nombre, viajes]) => {
      const subtotal = sumarImportes(viajes.map(v => v.subtotal))
      return {
        titulo: `Provincia: ${nombre}`,
        filas: viajes.map(v => [
          fmtFecha(v.fecha),
          v.empresa,
          v.mercaderia,
          v.procedencia,
          fmt(v.subtotal),
        ]),
        subtotal: [`Total ${nombre}`, null, null, null, fmt(subtotal)],
      }
    })

  const totalGeneral = sumarImportes(items.map(i => i.subtotal))

  // Landscape, 770pt útil. Columnas: Fecha (70) · Empresa (210) · Mercadería (200) · Procedencia (160) · Subtotal (130)
  return generarPDFReporteAgrupado({
    titulo: "IIBB — Listado de Viajes por Provincia",
    subtitulo: `Período: ${periodoLabel} · ${items.length} viaje(s)`,
    orientacion: "landscape",
    columnas: [
      { label: "Fecha", width: 70 },
      { label: "Empresa", width: 210 },
      { label: "Mercadería", width: 200 },
      { label: "Procedencia", width: 160 },
      { label: "Subtotal", width: 130, align: "right" },
    ],
    grupos,
    totalGeneral: items.length > 0 ? {
      label: "TOTAL GENERAL",
      valores: [null, null, null, null, fmt(totalGeneral)],
    } : undefined,
    mensajeVacio: "Sin asientos de IIBB para el período seleccionado.",
  })
}
