/**
 * pdf-lp-vs-facturas.ts — Reporte "Compara Viajes Líquido Producto vs
 * Facturas". Agrupa por provincia, muestra para cada viaje el remito,
 * número y neto de la LP vs el de la factura, y la diferencia.
 *
 * Útil para auditar viajes que se liquidaron al fletero pero cuyo neto
 * facturado a la empresa no cuadra.
 */

import { generarPDFReporteAgrupado } from "@/lib/pdf-tabla-agrupada"
import { sumarImportes } from "@/lib/money"

export type ConciliacionItem = {
  provincia: string
  remito: string
  nroLP: string
  netoLP: number
  nroFact: string
  netoFact: number
  diferencia: number
  empresa: string
}

function fmt(n: number): string {
  return "$ " + n.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

/**
 * generarPDFLpVsFacturas: ConciliacionItem[] string -> Promise<Buffer>
 *
 * Landscape — son 7 columnas de datos numéricos y de identificación, no
 * entra cómodo en portrait.
 */
export function generarPDFLpVsFacturas(items: ConciliacionItem[], periodoLabel: string): Promise<Buffer> {
  const map = new Map<string, ConciliacionItem[]>()
  for (const i of items) {
    if (!map.has(i.provincia)) map.set(i.provincia, [])
    map.get(i.provincia)!.push(i)
  }

  let totalLP = 0
  let totalFact = 0
  let totalDif = 0

  const grupos = Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([nombre, rows]) => {
      const subLP = sumarImportes(rows.map(r => r.netoLP))
      const subFact = sumarImportes(rows.map(r => r.netoFact))
      const subDif = sumarImportes(rows.map(r => r.diferencia))
      totalLP += subLP
      totalFact += subFact
      totalDif += subDif
      return {
        titulo: `Provincia: ${nombre}`,
        filas: rows.map(r => [
          r.remito,
          r.nroLP,
          fmt(r.netoLP),
          r.nroFact,
          fmt(r.netoFact),
          fmt(r.diferencia),
          r.empresa,
        ]),
        subtotal: [`Total ${nombre}`, null, fmt(subLP), null, fmt(subFact), fmt(subDif), null],
      }
    })

  // Landscape, 770pt útil. Columnas: Remito (90) · Nro LP (75) · Neto LP (105) ·
  // Nro Fact (75) · Neto Fact (105) · Diferencia (105) · Empresa (215)
  return generarPDFReporteAgrupado({
    titulo: "Compara Viajes Líquido Producto vs Facturas",
    subtitulo: `Período: ${periodoLabel} · ${items.length} viaje(s)`,
    orientacion: "landscape",
    columnas: [
      { label: "Remito", width: 90 },
      { label: "Nro LP", width: 75, align: "right" },
      { label: "Neto LP", width: 105, align: "right" },
      { label: "Nro Fact", width: 75, align: "right" },
      { label: "Neto Fact", width: 105, align: "right" },
      { label: "Diferencia", width: 105, align: "right" },
      { label: "Empresa", width: 215 },
    ],
    grupos,
    totalGeneral: items.length > 0 ? {
      label: "TOTAL GENERAL",
      valores: [null, null, fmt(totalLP), null, fmt(totalFact), fmt(totalDif), null],
    } : undefined,
    mensajeVacio: "Sin datos para el período seleccionado.",
  })
}
