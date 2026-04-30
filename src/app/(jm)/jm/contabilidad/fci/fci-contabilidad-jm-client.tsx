"use client"

import { formatearFecha, formatearMoneda } from "@/lib/utils"

type FciItem = {
  id: string
  nombre: string
  moneda: string
  diasHabilesAlerta: number
  saldoActual: string | number
  saldoActualizadoEn: string | null
  cuenta: { id: string; nombre: string } | null
  ultimoSaldoInformado: {
    saldoInformado: string | number
    fechaActualizacion: string
    rendimientoPeriodo: string | number
  } | null
  cantMovimientos: number
}

interface Props { fcis: FciItem[] }

export function FciContabilidadJmClient({ fcis }: Props) {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">FCI</h1>

      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="px-3 py-2 text-left">Nombre</th>
              <th className="px-3 py-2 text-left">Cuenta</th>
              <th className="px-3 py-2 text-left">Moneda</th>
              <th className="px-3 py-2 text-right">Saldo actual</th>
              <th className="px-3 py-2 text-left">Actualizado</th>
              <th className="px-3 py-2 text-right">Último rendimiento</th>
              <th className="px-3 py-2 text-right">Movs.</th>
            </tr>
          </thead>
          <tbody>
            {fcis.length === 0 ? (
              <tr><td colSpan={7} className="px-3 py-6 text-center text-muted-foreground">Sin FCI configurados.</td></tr>
            ) : fcis.map((f) => (
              <tr key={f.id} className="border-t hover:bg-muted/20">
                <td className="px-3 py-2 font-medium">{f.nombre}</td>
                <td className="px-3 py-2 text-xs">{f.cuenta?.nombre ?? "—"}</td>
                <td className="px-3 py-2">{f.moneda}</td>
                <td className="px-3 py-2 text-right font-medium">{formatearMoneda(Number(f.saldoActual))}</td>
                <td className="px-3 py-2 text-xs">{f.saldoActualizadoEn ? formatearFecha(new Date(f.saldoActualizadoEn)) : "—"}</td>
                <td className="px-3 py-2 text-right text-xs">
                  {f.ultimoSaldoInformado ? (
                    <span className={Number(f.ultimoSaldoInformado.rendimientoPeriodo) >= 0 ? "text-green-700" : "text-red-700"}>
                      {Number(f.ultimoSaldoInformado.rendimientoPeriodo) >= 0 ? "+" : ""}{formatearMoneda(Number(f.ultimoSaldoInformado.rendimientoPeriodo))}
                    </span>
                  ) : "—"}
                </td>
                <td className="px-3 py-2 text-right">{f.cantMovimientos}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground">
        Para gestionar movimientos (suscripciones / rescates) y actualizar saldos, ir a ABM → Contabilidad → FCI.
      </p>
    </div>
  )
}
