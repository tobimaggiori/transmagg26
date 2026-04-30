"use client"

import { formatearFecha, formatearMoneda } from "@/lib/utils"

type Resumen = {
  id: string
  periodo: string
  periodoDesde: string | null
  periodoHasta: string | null
  fechaVtoPago: string
  totalARS: string | number
  totalUSD: string | number | null
  pagado: boolean
  estado: string
  tarjeta: { id: string; nombre: string; banco: string } | null
}

interface Props { resumenes: Resumen[] }

export function ConciliacionTarjetasJmClient({ resumenes }: Props) {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Conciliación de Tarjetas</h1>

      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="px-3 py-2 text-left">Tarjeta</th>
              <th className="px-3 py-2 text-left">Banco</th>
              <th className="px-3 py-2 text-left">Período</th>
              <th className="px-3 py-2 text-left">Vencimiento</th>
              <th className="px-3 py-2 text-left">Estado</th>
              <th className="px-3 py-2 text-right">Total ARS</th>
              <th className="px-3 py-2 text-right">Total USD</th>
            </tr>
          </thead>
          <tbody>
            {resumenes.length === 0 ? (
              <tr><td colSpan={7} className="px-3 py-6 text-center text-muted-foreground">Sin resúmenes.</td></tr>
            ) : resumenes.map((r) => (
              <tr key={r.id} className="border-t hover:bg-muted/20">
                <td className="px-3 py-2 font-medium">{r.tarjeta?.nombre ?? "—"}</td>
                <td className="px-3 py-2 text-xs">{r.tarjeta?.banco ?? ""}</td>
                <td className="px-3 py-2">{r.periodo}</td>
                <td className="px-3 py-2 text-xs">{formatearFecha(new Date(r.fechaVtoPago))}</td>
                <td className="px-3 py-2"><span className={`text-xs px-2 py-0.5 rounded-full ${r.pagado ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}>{r.pagado ? "Pagado" : r.estado}</span></td>
                <td className="px-3 py-2 text-right">{formatearMoneda(Number(r.totalARS))}</td>
                <td className="px-3 py-2 text-right">{r.totalUSD ? `US$ ${Number(r.totalUSD).toFixed(2)}` : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
