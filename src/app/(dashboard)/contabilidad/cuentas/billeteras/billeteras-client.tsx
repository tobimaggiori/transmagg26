"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { FormError } from "@/components/ui/form-error"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { formatearMoneda } from "@/lib/utils"
import { Plus } from "lucide-react"

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
  cbu: string | null
  alias: string | null
}

// --- Componente principal ---

export function BilleterasClient() {
  const [billeteras, setBilleteras] = useState<Cuenta[]>([])
  const [loading, setLoading] = useState(true)

  // Modal nueva billetera
  const [modalBilletera, setModalBilletera] = useState(false)
  const [form, setForm] = useState({ nombre: "", moneda: "PESOS", cbu: "", alias: "", saldoInicial: "" })
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState("")

  const cargarBilleteras = useCallback(() => {
    setLoading(true)
    fetch("/api/cuentas")
      .then((r) => r.json())
      .then((d: Cuenta[]) => {
        setBilleteras(d.filter((c) => c.tipo === "BILLETERA_VIRTUAL"))
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => { cargarBilleteras() }, [cargarBilleteras])

  async function guardarBilletera() {
    setError("")
    if (!form.nombre.trim()) { setError("El nombre es obligatorio"); return }
    setGuardando(true)
    try {
      const saldoInicial = parseFloat(form.saldoInicial) || 0
      const res = await fetch("/api/cuentas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: form.nombre.trim(),
          tipo: "BILLETERA_VIRTUAL",
          bancoOEntidad: form.nombre.trim(),
          moneda: form.moneda,
          saldoInicial,
          activa: true,
          cbu: form.cbu.trim() || null,
          alias: form.alias.trim() || null,
        }),
      })
      if (!res.ok) {
        const d = await res.json()
        setError(d.error ?? "Error al crear la billetera")
        return
      }
      setModalBilletera(false)
      setForm({ nombre: "", moneda: "PESOS", cbu: "", alias: "", saldoInicial: "" })
      cargarBilleteras()
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="flex flex-col gap-0">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b">
        <h2 className="text-xl font-semibold">Billeteras Virtuales</h2>
        <Button onClick={() => { setForm({ nombre: "", moneda: "PESOS", cbu: "", alias: "", saldoInicial: "" }); setError(""); setModalBilletera(true) }}>
          <Plus className="h-4 w-4 mr-1" />
          Agregar billetera
        </Button>
      </div>

      <div className="p-6">
        {loading ? (
          <p className="text-sm text-muted-foreground">Cargando...</p>
        ) : billeteras.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin billeteras registradas.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {billeteras.map((b) => (
              <div key={b.id} className="border rounded p-4 space-y-2 hover:bg-muted/10 transition-colors">
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold">{b.nombre}</h3>
                  <span className="text-xs border rounded px-2 py-0.5 text-muted-foreground">
                    {b.moneda === "PESOS" ? "ARS" : b.moneda === "DOLARES" ? "USD" : b.moneda}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Saldo disponible</p>
                  <p className={`text-lg font-bold ${b.saldoDisponible < 0 ? "text-destructive" : ""}`}>
                    {formatearMoneda(b.saldoDisponible)}
                  </p>
                </div>
                {(b.cbu || b.alias) && (
                  <div className="text-xs text-muted-foreground space-y-0.5 border-t pt-2">
                    {b.cbu && <p>CVU/CBU: {b.cbu}</p>}
                    {b.alias && <p>Alias: {b.alias}</p>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal nueva billetera */}
      <Dialog open={modalBilletera} onOpenChange={setModalBilletera}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar billetera virtual</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Nombre</Label>
              <Input
                value={form.nombre}
                onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                placeholder="Ej: Mercado Pago"
              />
            </div>
            <div>
              <Label>Moneda</Label>
              <Select value={form.moneda} onChange={(e) => setForm((f) => ({ ...f, moneda: e.target.value }))}>
                <option value="PESOS">ARS (Pesos)</option>
                <option value="DOLARES">USD (Dólares)</option>
              </Select>
            </div>
            <div>
              <Label>CVU/CBU</Label>
              <Input
                value={form.cbu}
                onChange={(e) => setForm((f) => ({ ...f, cbu: e.target.value }))}
                placeholder="Opcional"
              />
            </div>
            <div>
              <Label>Alias</Label>
              <Input
                value={form.alias}
                onChange={(e) => setForm((f) => ({ ...f, alias: e.target.value }))}
                placeholder="Opcional"
              />
            </div>
            <div>
              <Label>Saldo inicial</Label>
              <Input
                type="number"
                min="0"
                value={form.saldoInicial}
                onChange={(e) => setForm((f) => ({ ...f, saldoInicial: e.target.value }))}
                placeholder="0"
              />
            </div>
            {error && <FormError message={error} />}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setModalBilletera(false)}>Cancelar</Button>
            <Button onClick={guardarBilletera} disabled={guardando}>
              {guardando ? "Guardando..." : "Crear"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
