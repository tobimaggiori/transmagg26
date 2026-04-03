"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { formatearMoneda } from "@/lib/utils"
import { ChevronRight } from "lucide-react"

// --- Tipos ---

interface Cuenta {
  id: string
  nombre: string
  tipo: string
  bancoOEntidad: string
  moneda: string
  activa: boolean
  saldoContable: number
  saldoDisponible: number
  cuentaPadreId: string | null
  nroCuenta: string | null
  cbu: string | null
  alias: string | null
}

interface Movimiento {
  id: string
  tipo: string
  categoria: string
  monto: number
  fecha: string
  descripcion: string
  referencia: string | null
  saldoDespues: number | null
  operador: { nombre: string; apellido: string }
}

// --- Componente de movimientos inline ---

function PanelMovimientos({ cuenta }: { cuenta: Cuenta }) {
  const [movimientos, setMovimientos] = useState<Movimiento[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const limit = 50

  const cargar = useCallback((p = 1) => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(p), limit: String(limit) })
    fetch(`/api/cuentas/${cuenta.id}/movimientos?${params}`)
      .then((r) => r.json())
      .then((d) => {
        setMovimientos(Array.isArray(d.movimientos) ? d.movimientos : [])
        setTotal(d.total ?? 0)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [cuenta.id])

  useEffect(() => { setPage(1); cargar(1) }, [cargar])

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="flex flex-col h-full">
      <div className="border-b px-4 py-3 bg-muted/20">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">{cuenta.nombre}</h3>
            <p className="text-sm text-muted-foreground">
              {cuenta.moneda === "PESOS" ? "ARS" : cuenta.moneda === "DOLARES" ? "USD" : cuenta.moneda}
              {cuenta.nroCuenta ? ` · ${cuenta.nroCuenta}` : ""}
              {cuenta.cbu ? ` · CBU: ${cuenta.cbu}` : ""}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Saldo disponible</p>
            <p className={`text-xl font-bold ${cuenta.saldoDisponible < 0 ? "text-destructive" : ""}`}>
              {formatearMoneda(cuenta.saldoDisponible)}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {loading ? (
          <p className="text-sm text-muted-foreground">Cargando movimientos...</p>
        ) : movimientos.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin movimientos registrados.</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 pr-3 font-medium">Fecha</th>
                    <th className="pb-2 pr-3 font-medium">Categoría</th>
                    <th className="pb-2 pr-3 font-medium">Descripción</th>
                    <th className="pb-2 pr-3 font-medium text-right">Monto</th>
                    <th className="pb-2 font-medium">Operador</th>
                  </tr>
                </thead>
                <tbody>
                  {movimientos.map((m) => (
                    <tr key={m.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="py-2 pr-3 whitespace-nowrap">{m.fecha.slice(0, 10)}</td>
                      <td className="py-2 pr-3 text-xs text-muted-foreground">{m.categoria}</td>
                      <td className="py-2 pr-3">{m.descripcion}</td>
                      <td className={`py-2 pr-3 text-right font-mono ${m.tipo === "INGRESO" ? "text-emerald-600" : "text-destructive"}`}>
                        {m.tipo === "INGRESO" ? "+" : "-"}{formatearMoneda(m.monto)}
                      </td>
                      <td className="py-2 text-xs text-muted-foreground">
                        {m.operador.nombre} {m.operador.apellido}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 text-sm">
                <Button variant="outline" size="sm" onClick={() => { const p = page - 1; setPage(p); cargar(p) }} disabled={page === 1}>Anterior</Button>
                <span className="text-muted-foreground">Pág. {page} / {totalPages}</span>
                <Button variant="outline" size="sm" onClick={() => { const p = page + 1; setPage(p); cargar(p) }} disabled={page === totalPages}>Siguiente</Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// --- Componente principal ---

export function BancosClient() {
  const [cuentas, setCuentas] = useState<Cuenta[]>([])
  const [loading, setLoading] = useState(true)
  const [cuentaSeleccionada, setCuentaSeleccionada] = useState<Cuenta | null>(null)

  const cargarCuentas = useCallback(() => {
    setLoading(true)
    fetch("/api/cuentas")
      .then((r) => r.json())
      .then((d: Cuenta[]) => {
        const bancos = d.filter((c) => c.tipo === "BANCO")
        setCuentas(bancos)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => { cargarCuentas() }, [cargarCuentas])

  const bancosPadre = cuentas.filter((c) => !c.cuentaPadreId)
  const subCuentas = cuentas.filter((c) => c.cuentaPadreId)

  function getSubCuentas(bancoId: string) {
    return subCuentas.filter((s) => s.cuentaPadreId === bancoId)
  }

  return (
    <div className="flex flex-col h-full gap-0">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b">
        <h2 className="text-xl font-semibold">Cuentas Bancarias</h2>
      </div>

      {/* Contenido dos paneles */}
      <div className="flex flex-1 overflow-hidden">
        {/* Panel izquierdo — árbol de bancos */}
        <div className="w-72 border-r flex flex-col overflow-hidden">
          <div className="flex-1 overflow-auto p-3 space-y-3">
            {loading ? (
              <p className="text-sm text-muted-foreground p-2">Cargando...</p>
            ) : bancosPadre.length === 0 ? (
              <p className="text-sm text-muted-foreground p-2">Sin bancos registrados.</p>
            ) : (
              bancosPadre.map((banco) => {
                const subs = getSubCuentas(banco.id)
                return (
                  <div key={banco.id} className="border rounded overflow-hidden">
                    <div className="flex items-center justify-between px-3 py-2 bg-muted/30">
                      <span className="font-medium text-sm">{banco.nombre}</span>
                    </div>
                    {subs.length === 0 ? (
                      <p className="px-3 py-2 text-xs text-muted-foreground">Sin sub-cuentas</p>
                    ) : (
                      <ul className="divide-y">
                        {subs.map((sub) => (
                          <li
                            key={sub.id}
                            onClick={() => setCuentaSeleccionada(sub)}
                            className={`px-3 py-2 cursor-pointer flex items-center justify-between hover:bg-muted/40 transition-colors ${
                              cuentaSeleccionada?.id === sub.id ? "bg-primary/10" : ""
                            }`}
                          >
                            <div className="min-w-0">
                              <p className="text-xs font-medium truncate">
                                {sub.moneda === "PESOS" ? "ARS" : "USD"}
                                {sub.nroCuenta ? ` · ${sub.nroCuenta}` : ""}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatearMoneda(sub.saldoDisponible)}
                              </p>
                            </div>
                            <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Panel derecho — movimientos */}
        <div className="flex-1 overflow-hidden">
          {!cuentaSeleccionada ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <p>Seleccioná una sub-cuenta para ver sus movimientos.</p>
            </div>
          ) : (
            <PanelMovimientos cuenta={cuentaSeleccionada} />
          )}
        </div>
      </div>

    </div>
  )
}
