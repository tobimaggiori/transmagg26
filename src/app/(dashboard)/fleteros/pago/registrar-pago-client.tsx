"use client"

/**
 * Propósito: Componente cliente para la página Orden de Pago (/fleteros/pago).
 * Flujo: combobox de fletero → tabla de LPs pendientes → RegistrarPagoFleteroModal → éxito.
 */

import { useState, useCallback } from "react"
import { SearchCombobox, type SearchComboboxItem } from "@/components/ui/search-combobox"
import { formatearMoneda, formatearFecha } from "@/lib/utils"
import { RegistrarPagoFleteroModal } from "@/components/forms/registrar-pago-fletero-form"

// ─── Tipos ───────────────────────────────────────────────────────────────────

interface Fletero {
  id: string
  razonSocial: string
  cuit: string
}

interface CuentaBancaria {
  id: string
  nombre: string
  bancoOEntidad: string
}

interface ChequeEnCartera {
  id: string
  nroCheque: string
  bancoEmisor: string
  monto: number
  fechaCobro: string
}

interface LiquidacionPendiente {
  id: string
  nroComprobante: number | null
  ptoVenta: number | null
  total: number
  totalPagado: number
  saldoPendiente: number
  grabadaEn: string
  estado: string
}

interface GastoPendiente {
  id: string
  tipo: string
  montoPagado: number
  montoDescontado: number
  estado: string
  facturaProveedor: {
    id: string
    tipoCbte: string
    nroComprobante: string | null
    fechaCbte: string
    proveedor: { razonSocial: string }
  }
}

interface RegistrarPagoClientProps {
  fleteros: Fletero[]
  cuentas: CuentaBancaria[]
  chequesEnCartera: ChequeEnCartera[]
}

function nroLP(ptoVenta: number | null, nro: number | null): string {
  if (ptoVenta == null || nro == null) return "s/n"
  return `${String(ptoVenta).padStart(4, "0")}-${String(nro).padStart(8, "0")}`
}

const estadoLabel: Record<string, string> = {
  EMITIDA: "Emitida",
  PARCIALMENTE_PAGADA: "Parcial",
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function RegistrarPagoClient({ fleteros, cuentas, chequesEnCartera }: RegistrarPagoClientProps) {
  const [fleteroId, setFleteroId] = useState("")
  const [liquidaciones, setLiquidaciones] = useState<LiquidacionPendiente[]>([])
  const [gastosPendientes, setGastosPendientes] = useState<GastoPendiente[]>([])
  const [saldoAFavorCC, setSaldoAFavorCC] = useState(0)
  const [loadingFletero, setLoadingFletero] = useState(false)

  const [pagandoLP, setPagandoLP] = useState<LiquidacionPendiente | null>(null)
  const [loadingPago, setLoadingPago] = useState(false)

  const [ultimaOP, setUltimaOP] = useState<{ nro: number } | null>(null)

  const fletero = fleteros.find((f) => f.id === fleteroId) ?? null

  const onSelectFletero = useCallback(async (id: string) => {
    setFleteroId(id)
    setLiquidaciones([])
    setGastosPendientes([])
    setSaldoAFavorCC(0)
    setUltimaOP(null)
    if (!id) return

    setLoadingFletero(true)
    try {
      const [liqs, saldo, gastos] = await Promise.all([
        fetch(`/api/fleteros/${id}/liquidaciones-pendientes`).then((r) => r.ok ? r.json() : []),
        fetch(`/api/fleteros/${id}/saldo-cc`).then((r) => r.ok ? r.json() : { saldoAFavor: 0 }),
        fetch(`/api/liquidaciones?fleteroId=${id}`).then((r) => r.ok ? r.json() : { gastosPendientes: [] }),
      ])
      setLiquidaciones(liqs)
      setSaldoAFavorCC(saldo.saldoAFavor ?? 0)
      setGastosPendientes((gastos as { gastosPendientes?: GastoPendiente[] }).gastosPendientes ?? [])
    } finally {
      setLoadingFletero(false)
    }
  }, [])

  async function abrirPago(liq: LiquidacionPendiente) {
    setLoadingPago(true)
    try {
      // Refrescar saldo CC al momento de abrir el modal
      const res = await fetch(`/api/fleteros/${fleteroId}/saldo-cc`)
      if (res.ok) setSaldoAFavorCC((await res.json()).saldoAFavor ?? 0)
    } finally {
      setLoadingPago(false)
    }
    setPagandoLP(liq)
  }

  function onSuccess() {
    setPagandoLP(null)
    // Recargar lista de LPs pendientes
    onSelectFletero(fleteroId)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Orden de Pago</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Seleccioná un fletero para ver sus liquidaciones pendientes de pago.
        </p>
      </div>

      {/* Selector de fletero */}
      <div className="max-w-sm">
        <label className="text-sm font-medium mb-1.5 block">Fletero</label>
        <SearchCombobox
          items={fleteros.map((f): SearchComboboxItem => ({ id: f.id, label: f.razonSocial }))}
          value={fleteroId}
          onChange={onSelectFletero}
          placeholder="Buscar fletero..."
        />
      </div>

      {/* Éxito */}
      {ultimaOP && (
        <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          Orden de Pago Nro {ultimaOP.nro.toLocaleString("es-AR")} generada exitosamente.
        </div>
      )}

      {/* Tabla de LPs pendientes */}
      {fleteroId && (
        <div className="space-y-3">
          <h2 className="text-base font-semibold">
            LPs pendientes de pago
            {fletero && <span className="text-muted-foreground font-normal ml-1">— {fletero.razonSocial}</span>}
          </h2>

          {loadingFletero ? (
            <p className="text-sm text-muted-foreground">Cargando...</p>
          ) : liquidaciones.length === 0 ? (
            <div className="rounded-lg border p-6 text-center text-sm text-muted-foreground">
              No hay liquidaciones pendientes de pago para este fletero.
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-2.5 text-left font-medium">Nro LP</th>
                    <th className="px-4 py-2.5 text-left font-medium">Fecha</th>
                    <th className="px-4 py-2.5 text-right font-medium">Total</th>
                    <th className="px-4 py-2.5 text-right font-medium">Saldo pend.</th>
                    <th className="px-4 py-2.5 text-left font-medium">Estado</th>
                    <th className="px-4 py-2.5" />
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {liquidaciones.map((liq) => (
                    <tr key={liq.id} className="hover:bg-muted/20">
                      <td className="px-4 py-3 font-mono text-xs">{nroLP(liq.ptoVenta, liq.nroComprobante)}</td>
                      <td className="px-4 py-3">{formatearFecha(new Date(liq.grabadaEn))}</td>
                      <td className="px-4 py-3 text-right">{formatearMoneda(liq.total)}</td>
                      <td className="px-4 py-3 text-right font-semibold">{formatearMoneda(liq.saldoPendiente)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          liq.estado === "EMITIDA" ? "bg-blue-100 text-blue-800" : "bg-amber-100 text-amber-800"
                        }`}>
                          {estadoLabel[liq.estado] ?? liq.estado}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => abrirPago(liq)}
                          disabled={loadingPago}
                          className="h-7 px-3 rounded-md border text-xs font-medium hover:bg-accent disabled:opacity-50"
                        >
                          Registrar pago &rarr;
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal de pago */}
      {pagandoLP && fletero && (
        <RegistrarPagoFleteroModal
          liquidacion={{
            id: pagandoLP.id,
            nroComprobante: pagandoLP.nroComprobante,
            ptoVenta: pagandoLP.ptoVenta,
            total: pagandoLP.total,
            pagosExistentes: pagandoLP.totalPagado,
            fletero: { id: fletero.id, razonSocial: fletero.razonSocial, cuit: fletero.cuit },
          }}
          cuentasBancarias={cuentas}
          chequesEnCartera={chequesEnCartera}
          saldoAFavorCC={saldoAFavorCC}
          gastosPendientes={gastosPendientes.filter((g) => g.estado !== "DESCONTADO_TOTAL")}
          onSuccess={onSuccess}
          onClose={() => setPagandoLP(null)}
        />
      )}
    </div>
  )
}
