"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { FormError } from "@/components/ui/form-error"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { formatearMoneda } from "@/lib/utils"
import { Plus, RefreshCw } from "lucide-react"

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
}

interface FciItem {
  id: string
  nombre: string
  cuentaId: string
  moneda: string
  activo: boolean
  diasHabilesAlerta: number
  saldoActual: number
  saldoActualizadoEn: string | null
}

// --- Componente principal ---

export function BrokersClient() {
  const [brokers, setBrokers] = useState<Cuenta[]>([])
  const [fcis, setFcis] = useState<Record<string, FciItem[]>>({})
  const [loading, setLoading] = useState(true)

  // Modal nuevo broker
  const [modalBroker, setModalBroker] = useState(false)
  const [formBroker, setFormBroker] = useState({ nombre: "" })
  const [guardandoBroker, setGuardandoBroker] = useState(false)
  const [errorBroker, setErrorBroker] = useState("")

  // Modal nuevo FCI
  const [modalFci, setModalFci] = useState(false)
  const [brokerParaFci, setBrokerParaFci] = useState<Cuenta | null>(null)
  const [formFci, setFormFci] = useState({ nombre: "", moneda: "PESOS", saldoInicial: "" })
  const [guardandoFci, setGuardandoFci] = useState(false)
  const [errorFci, setErrorFci] = useState("")

  // Modal actualizar saldo
  const [modalSaldo, setModalSaldo] = useState(false)
  const [fciParaSaldo, setFciParaSaldo] = useState<FciItem | null>(null)
  const [formSaldo, setFormSaldo] = useState({ saldoNuevo: "", fechaConsulta: new Date().toISOString().slice(0, 10) })
  const [guardandoSaldo, setGuardandoSaldo] = useState(false)
  const [errorSaldo, setErrorSaldo] = useState("")

  const cargarDatos = useCallback(async () => {
    setLoading(true)
    try {
      const [cuentasRes, fciRes] = await Promise.all([
        fetch("/api/cuentas"),
        fetch("/api/fci"),
      ])
      const cuentasData: Cuenta[] = await cuentasRes.json()
      const fciData: FciItem[] = await fciRes.json()

      const brokersCargados = cuentasData.filter((c) => c.tipo === "BROKER")
      setBrokers(brokersCargados)

      const fciPorBroker: Record<string, FciItem[]> = {}
      for (const broker of brokersCargados) {
        fciPorBroker[broker.id] = fciData.filter((f) => f.cuentaId === broker.id)
      }
      setFcis(fciPorBroker)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { cargarDatos() }, [cargarDatos])

  const totalSaldoBrokers = brokers.reduce((sum, b) => {
    const saldoFcis = (fcis[b.id] ?? []).reduce((s, f) => s + f.saldoActual, 0)
    return sum + b.saldoDisponible + saldoFcis
  }, 0)

  async function guardarBroker() {
    setErrorBroker("")
    if (!formBroker.nombre.trim()) { setErrorBroker("El nombre es obligatorio"); return }
    setGuardandoBroker(true)
    try {
      const res = await fetch("/api/cuentas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: formBroker.nombre.trim(),
          tipo: "BROKER",
          bancoOEntidad: formBroker.nombre.trim(),
          moneda: "PESOS",
          saldoInicial: 0,
          activa: true,
        }),
      })
      if (!res.ok) {
        const d = await res.json()
        setErrorBroker(d.error ?? "Error al crear el broker")
        return
      }
      setModalBroker(false)
      setFormBroker({ nombre: "" })
      cargarDatos()
    } finally {
      setGuardandoBroker(false)
    }
  }

  function abrirModalFci(broker: Cuenta) {
    setBrokerParaFci(broker)
    setFormFci({ nombre: "", moneda: "PESOS", saldoInicial: "" })
    setErrorFci("")
    setModalFci(true)
  }

  async function guardarFci() {
    setErrorFci("")
    if (!brokerParaFci) return
    if (!formFci.nombre.trim()) { setErrorFci("El nombre es obligatorio"); return }
    setGuardandoFci(true)
    try {
      const fciRes = await fetch("/api/fci", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: formFci.nombre.trim(),
          cuentaId: brokerParaFci.id,
          moneda: formFci.moneda,
          activo: true,
          diasHabilesAlerta: 1,
        }),
      })
      if (!fciRes.ok) {
        const d = await fciRes.json()
        setErrorFci(d.error ?? "Error al crear el FCI")
        return
      }
      const fciCreado: FciItem = await fciRes.json()
      const saldoInicial = parseFloat(formFci.saldoInicial)
      if (!isNaN(saldoInicial) && saldoInicial > 0) {
        await fetch(`/api/fci/${fciCreado.id}/actualizar-saldo`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            saldoNuevo: saldoInicial,
            fechaConsulta: new Date().toISOString().slice(0, 10),
          }),
        })
      }
      setModalFci(false)
      cargarDatos()
    } finally {
      setGuardandoFci(false)
    }
  }

  function abrirModalSaldo(fci: FciItem) {
    setFciParaSaldo(fci)
    setFormSaldo({ saldoNuevo: "", fechaConsulta: new Date().toISOString().slice(0, 10) })
    setErrorSaldo("")
    setModalSaldo(true)
  }

  async function actualizarSaldo() {
    setErrorSaldo("")
    if (!fciParaSaldo) return
    const saldo = parseFloat(formSaldo.saldoNuevo)
    if (isNaN(saldo)) { setErrorSaldo("El saldo debe ser un número"); return }
    if (!formSaldo.fechaConsulta) { setErrorSaldo("La fecha es obligatoria"); return }
    setGuardandoSaldo(true)
    try {
      const res = await fetch(`/api/fci/${fciParaSaldo.id}/actualizar-saldo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ saldoNuevo: saldo, fechaConsulta: formSaldo.fechaConsulta }),
      })
      if (!res.ok) {
        const d = await res.json()
        setErrorSaldo(d.error ?? "Error al actualizar saldo")
        return
      }
      setModalSaldo(false)
      cargarDatos()
    } finally {
      setGuardandoSaldo(false)
    }
  }

  return (
    <div className="flex flex-col gap-0">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b">
        <h2 className="text-xl font-semibold">Cuentas Broker</h2>
        <Button onClick={() => { setFormBroker({ nombre: "" }); setErrorBroker(""); setModalBroker(true) }}>
          <Plus className="h-4 w-4 mr-1" />
          Agregar broker
        </Button>
      </div>

      <div className="p-6 space-y-4">
        {loading ? (
          <p className="text-sm text-muted-foreground">Cargando...</p>
        ) : brokers.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin brokers registrados.</p>
        ) : (
          <>
            {brokers.map((broker) => {
              const fcisBroker = fcis[broker.id] ?? []
              const saldoTotalBroker = broker.saldoDisponible + fcisBroker.reduce((s, f) => s + f.saldoActual, 0)
              return (
                <div key={broker.id} className="border rounded overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 bg-muted/20 border-b">
                    <div>
                      <h3 className="font-semibold">{broker.nombre}</h3>
                      <p className="text-sm text-muted-foreground">
                        Disponible en cuenta: {formatearMoneda(broker.saldoDisponible)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Total en broker</p>
                        <p className="font-bold">{formatearMoneda(saldoTotalBroker)}</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => abrirModalFci(broker)}>
                        <Plus className="h-3 w-3 mr-1" />
                        FCI
                      </Button>
                    </div>
                  </div>

                  {fcisBroker.length === 0 ? (
                    <p className="px-4 py-3 text-sm text-muted-foreground">Sin FCI registrados.</p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left text-muted-foreground bg-muted/10">
                          <th className="px-4 py-2 font-medium">FCI</th>
                          <th className="px-4 py-2 font-medium">Moneda</th>
                          <th className="px-4 py-2 font-medium text-right">Saldo actual</th>
                          <th className="px-4 py-2 font-medium">Actualizado</th>
                          <th className="px-4 py-2"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {fcisBroker.map((fci) => (
                          <tr key={fci.id} className="border-b last:border-0 hover:bg-muted/20">
                            <td className="px-4 py-2 font-medium">{fci.nombre}</td>
                            <td className="px-4 py-2 text-muted-foreground">
                              {fci.moneda === "PESOS" ? "ARS" : fci.moneda === "DOLARES" ? "USD" : fci.moneda}
                            </td>
                            <td className="px-4 py-2 text-right font-mono">{formatearMoneda(fci.saldoActual)}</td>
                            <td className="px-4 py-2 text-xs text-muted-foreground">
                              {fci.saldoActualizadoEn ? fci.saldoActualizadoEn.slice(0, 10) : "—"}
                            </td>
                            <td className="px-4 py-2 text-right">
                              <Button variant="outline" size="sm" onClick={() => abrirModalSaldo(fci)}>
                                <RefreshCw className="h-3 w-3 mr-1" />
                                Actualizar saldo
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )
            })}

            {/* Fila total */}
            <div className="flex items-center justify-between border rounded px-4 py-3 bg-muted/10">
              <span className="font-semibold">Total en brokers</span>
              <span className="text-lg font-bold">{formatearMoneda(totalSaldoBrokers)}</span>
            </div>
          </>
        )}
      </div>

      {/* Modal nuevo broker */}
      <Dialog open={modalBroker} onOpenChange={setModalBroker}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar broker</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Nombre</Label>
              <Input
                value={formBroker.nombre}
                onChange={(e) => setFormBroker({ nombre: e.target.value })}
                placeholder="Ej: Balanz Capital"
              />
            </div>
            {errorBroker && <FormError message={errorBroker} />}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setModalBroker(false)}>Cancelar</Button>
            <Button onClick={guardarBroker} disabled={guardandoBroker}>
              {guardandoBroker ? "Guardando..." : "Crear"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal nuevo FCI */}
      <Dialog open={modalFci} onOpenChange={setModalFci}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar FCI — {brokerParaFci?.nombre}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Nombre del FCI</Label>
              <Input
                value={formFci.nombre}
                onChange={(e) => setFormFci((f) => ({ ...f, nombre: e.target.value }))}
                placeholder="Ej: Fondo Renta Variable"
              />
            </div>
            <div>
              <Label>Moneda</Label>
              <Select value={formFci.moneda} onChange={(e) => setFormFci((f) => ({ ...f, moneda: e.target.value }))}>
                <option value="PESOS">ARS (Pesos)</option>
                <option value="DOLARES">USD (Dólares)</option>
              </Select>
            </div>
            <div>
              <Label>Saldo inicial</Label>
              <Input
                type="number"
                min="0"
                value={formFci.saldoInicial}
                onChange={(e) => setFormFci((f) => ({ ...f, saldoInicial: e.target.value }))}
                placeholder="0"
              />
            </div>
            {errorFci && <FormError message={errorFci} />}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setModalFci(false)}>Cancelar</Button>
            <Button onClick={guardarFci} disabled={guardandoFci}>
              {guardandoFci ? "Guardando..." : "Crear"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal actualizar saldo FCI */}
      <Dialog open={modalSaldo} onOpenChange={setModalSaldo}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Actualizar saldo — {fciParaSaldo?.nombre}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="rounded bg-muted/20 px-3 py-2 text-sm">
              <span className="text-muted-foreground">Saldo en sistema: </span>
              <span className="font-semibold">{fciParaSaldo ? formatearMoneda(fciParaSaldo.saldoActual) : "—"}</span>
            </div>
            <div>
              <Label>Nuevo saldo</Label>
              <Input
                type="number"
                min="0"
                value={formSaldo.saldoNuevo}
                onChange={(e) => setFormSaldo((f) => ({ ...f, saldoNuevo: e.target.value }))}
                placeholder="0"
              />
            </div>
            <div>
              <Label>Fecha de consulta</Label>
              <Input
                type="date"
                value={formSaldo.fechaConsulta}
                onChange={(e) => setFormSaldo((f) => ({ ...f, fechaConsulta: e.target.value }))}
              />
            </div>
            {errorSaldo && <FormError message={errorSaldo} />}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setModalSaldo(false)}>Cancelar</Button>
            <Button onClick={actualizarSaldo} disabled={guardandoSaldo}>
              {guardandoSaldo ? "Actualizando..." : "Actualizar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
