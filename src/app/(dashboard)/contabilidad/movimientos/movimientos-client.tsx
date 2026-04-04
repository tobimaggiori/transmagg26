"use client"

import { useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { FormError } from "@/components/ui/form-error"
import { formatearMoneda, formatearFecha } from "@/lib/utils"
import { sumarImportes, parsearImporte } from "@/lib/money"
import { Download, Plus } from "lucide-react"

type Cuenta = { id: string; nombre: string }

type Movimiento = {
  id: string
  cuentaId: string
  tipo: string
  categoria: string
  monto: number
  fecha: string
  descripcion: string
  referencia: string | null
  cuenta: { id: string; nombre: string }
  cuentaDestino: { id: string; nombre: string } | null
}

const CATEGORIAS = [
  "CHEQUE_DEPOSITADO",
  "CHEQUE_EMITIDO_DEBITADO",
  "TRANSFERENCIA_RECIBIDA",
  "TRANSFERENCIA_ENVIADA",
  "TRANSFERENCIA_ENTRE_CUENTAS_PROPIAS",
  "ENVIO_A_BROKER",
  "RESCATE_DE_BROKER",
  "INTERES_CUENTA_REMUNERADA",
  "PAGO_SERVICIO",
  "MANTENIMIENTO_CUENTA",
  "PAGO_TARJETA",
  "DESCUENTO_CHEQUE_BANCO",
  "PAGO_SUELDO",
  "OTRO",
]

const LABEL_CATEGORIA: Record<string, string> = {
  CHEQUE_DEPOSITADO: "Cheque depositado",
  CHEQUE_EMITIDO_DEBITADO: "Cheque emitido debitado",
  TRANSFERENCIA_RECIBIDA: "Transferencia recibida",
  TRANSFERENCIA_ENVIADA: "Transferencia enviada",
  TRANSFERENCIA_ENTRE_CUENTAS_PROPIAS: "Transferencia entre cuentas",
  ENVIO_A_BROKER: "Envío a broker",
  RESCATE_DE_BROKER: "Rescate de broker",
  INTERES_CUENTA_REMUNERADA: "Interés cuenta remunerada",
  PAGO_SERVICIO: "Pago de servicio",
  MANTENIMIENTO_CUENTA: "Mantenimiento de cuenta",
  PAGO_TARJETA: "Pago de tarjeta",
  DESCUENTO_CHEQUE_BANCO: "Descuento cheque banco",
  PAGO_SUELDO: "Pago de sueldo",
  OTRO: "Otro",
}

type MovimientosClientProps = { cuentas: Cuenta[] }

const FORM_INICIAL = {
  cuentaId: "",
  tipo: "INGRESO" as "INGRESO" | "EGRESO",
  categoria: "TRANSFERENCIA_RECIBIDA",
  monto: "",
  fecha: new Date().toISOString().slice(0, 10),
  descripcion: "",
  referencia: "",
  cuentaDestinoId: "",
}

/**
 * MovimientosClient: MovimientosClientProps -> JSX.Element
 *
 * Dado la lista de cuentas activas, muestra filtros para buscar movimientos,
 * tabla de resultados con saldo acumulado, modal para registrar nuevos movimientos,
 * y botón de exportación a Excel.
 */
export function MovimientosClient({ cuentas }: MovimientosClientProps) {
  const [cuentaId, setCuentaId] = useState("")
  const [tipo, setTipo] = useState("")
  const [categoria, setCategoria] = useState("")
  const [desde, setDesde] = useState("")
  const [hasta, setHasta] = useState("")
  const [movimientos, setMovimientos] = useState<Movimiento[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [buscado, setBuscado] = useState(false)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [form, setForm] = useState(FORM_INICIAL)
  const [error, setError] = useState("")
  const [guardando, setGuardando] = useState(false)
  const [exportando, setExportando] = useState(false)

  const buildParams = useCallback(() => {
    const params = new URLSearchParams()
    if (cuentaId) params.set("cuentaId", cuentaId)
    if (tipo) params.set("tipo", tipo)
    if (categoria) params.set("categoria", categoria)
    if (desde) params.set("desde", desde)
    if (hasta) params.set("hasta", hasta)
    return params
  }, [cuentaId, tipo, categoria, desde, hasta])

  const buscar = useCallback(async () => {
    setLoading(true)
    try {
      const params = buildParams()
      params.set("limit", "200")
      const res = await fetch(`/api/movimientos-sin-factura?${params.toString()}`)
      if (res.ok) {
        const data = await res.json() as { movimientos: Movimiento[]; total: number }
        setMovimientos(data.movimientos)
        setTotal(data.total)
      }
    } finally {
      setLoading(false)
      setBuscado(true)
    }
  }, [buildParams])

  async function guardar() {
    setError("")
    if (!form.cuentaId || !form.monto || !form.descripcion) {
      setError("Completá cuenta, monto y descripción")
      return
    }
    setGuardando(true)
    const res = await fetch("/api/movimientos-sin-factura", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cuentaId: form.cuentaId,
        tipo: form.tipo,
        categoria: form.categoria,
        monto: parsearImporte(form.monto),
        fecha: form.fecha,
        descripcion: form.descripcion,
        referencia: form.referencia || undefined,
        cuentaDestinoId: form.categoria === "TRANSFERENCIA_ENTRE_CUENTAS_PROPIAS" && form.cuentaDestinoId ? form.cuentaDestinoId : undefined,
      }),
    })
    setGuardando(false)
    if (res.ok) {
      setModalAbierto(false)
      setForm(FORM_INICIAL)
      buscar()
    } else {
      const d = await res.json()
      setError(d.error ?? "Error al guardar")
    }
  }

  async function exportarExcel() {
    setExportando(true)
    const params = buildParams()
    const res = await fetch(`/api/contabilidad/movimientos/excel?${params.toString()}`)
    if (res.ok) {
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `movimientos.xlsx`
      a.click()
      URL.revokeObjectURL(url)
    }
    setExportando(false)
  }

  // Calcular totales para los resultados mostrados
  const totalIngresos = sumarImportes(movimientos.filter(m => m.tipo === "INGRESO").map(m => m.monto))
  const totalEgresos = sumarImportes(movimientos.filter(m => m.tipo === "EGRESO").map(m => m.monto))

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Movimientos</h2>
        <p className="text-muted-foreground">Ingresos y egresos bancarios sin factura asociada.</p>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filtros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Cuenta</Label>
              <Select value={cuentaId} onChange={(e) => setCuentaId(e.target.value)}>
                <option value="">Todas las cuentas</option>
                {cuentas.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Select value={tipo} onChange={(e) => setTipo(e.target.value)}>
                <option value="">Todos</option>
                <option value="INGRESO">Ingresos</option>
                <option value="EGRESO">Egresos</option>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Categoría</Label>
            <Select value={categoria} onChange={(e) => setCategoria(e.target.value)}>
              <option value="">Todas</option>
              {CATEGORIAS.map(c => <option key={c} value={c}>{LABEL_CATEGORIA[c] ?? c}</option>)}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Desde</Label>
              <Input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Hasta</Label>
              <Input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={buscar} disabled={loading}>
              {loading ? "Buscando..." : "Buscar"}
            </Button>
            <Button variant="outline" onClick={() => setModalAbierto(true)}>
              <Plus className="h-4 w-4 mr-1" /> Registrar movimiento
            </Button>
            {buscado && (
              <Button variant="outline" onClick={exportarExcel} disabled={exportando}>
                <Download className="h-4 w-4 mr-1" />
                {exportando ? "Exportando..." : "Excel"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Resultados */}
      {buscado && (
        movimientos.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Sin resultados</CardTitle>
              <CardDescription>No se encontraron movimientos con los filtros aplicados.</CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Resultados</CardTitle>
              <CardDescription>
                {total > movimientos.length
                  ? `Mostrando ${movimientos.length} de ${total} movimientos`
                  : `${movimientos.length} movimiento(s)`}
                {" · "}
                <span className="text-green-700">Ingresos: {formatearMoneda(totalIngresos)}</span>
                {" · "}
                <span className="text-destructive">Egresos: {formatearMoneda(totalEgresos)}</span>
                {" · "}
                Neto: {formatearMoneda(totalIngresos - totalEgresos)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-2 pr-3">Fecha</th>
                      <th className="pb-2 pr-3">Cuenta</th>
                      <th className="pb-2 pr-3">Categoría</th>
                      <th className="pb-2 pr-3">Descripción</th>
                      <th className="pb-2 pr-3">Referencia</th>
                      <th className="pb-2 pr-3 text-right text-green-700">Ingreso</th>
                      <th className="pb-2 text-right text-destructive">Egreso</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {movimientos.map((m) => (
                      <tr key={m.id} className="hover:bg-muted/50">
                        <td className="py-2 pr-3 whitespace-nowrap">{formatearFecha(m.fecha)}</td>
                        <td className="py-2 pr-3">{m.cuenta.nombre}</td>
                        <td className="py-2 pr-3">
                          <span className="text-xs bg-muted px-1.5 py-0.5 rounded">
                            {LABEL_CATEGORIA[m.categoria] ?? m.categoria}
                          </span>
                        </td>
                        <td className="py-2 pr-3">{m.descripcion}</td>
                        <td className="py-2 pr-3 text-muted-foreground text-xs">{m.referencia ?? "—"}</td>
                        <td className="py-2 pr-3 text-right text-green-700 font-medium">
                          {m.tipo === "INGRESO" ? formatearMoneda(m.monto) : "—"}
                        </td>
                        <td className="py-2 text-right text-destructive font-medium">
                          {m.tipo === "EGRESO" ? formatearMoneda(m.monto) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t font-semibold bg-muted/30">
                      <td colSpan={5} className="py-2 pr-3">Totales</td>
                      <td className="py-2 pr-3 text-right text-green-700">{formatearMoneda(totalIngresos)}</td>
                      <td className="py-2 text-right text-destructive">{formatearMoneda(totalEgresos)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>
        )
      )}

      {/* Modal alta movimiento */}
      <Dialog open={modalAbierto} onOpenChange={(open) => { if (!open) { setModalAbierto(false); setError("") } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar movimiento</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-[65vh] overflow-auto">
            <div className="space-y-1.5">
              <Label>Cuenta *</Label>
              <Select value={form.cuentaId} onChange={(e) => setForm(f => ({ ...f, cuentaId: e.target.value }))}>
                <option value="">Seleccionar cuenta...</option>
                {cuentas.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Tipo *</Label>
                <Select value={form.tipo} onChange={(e) => setForm(f => ({ ...f, tipo: e.target.value as "INGRESO" | "EGRESO" }))}>
                  <option value="INGRESO">Ingreso</option>
                  <option value="EGRESO">Egreso</option>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Categoría *</Label>
                <Select value={form.categoria} onChange={(e) => setForm(f => ({ ...f, categoria: e.target.value }))}>
                  {CATEGORIAS.map(c => <option key={c} value={c}>{LABEL_CATEGORIA[c] ?? c}</option>)}
                </Select>
              </div>
            </div>
            {form.categoria === "TRANSFERENCIA_ENTRE_CUENTAS_PROPIAS" && (
              <div className="space-y-1.5">
                <Label>Cuenta destino</Label>
                <Select value={form.cuentaDestinoId} onChange={(e) => setForm(f => ({ ...f, cuentaDestinoId: e.target.value }))}>
                  <option value="">Seleccionar...</option>
                  {cuentas.filter(c => c.id !== form.cuentaId).map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </Select>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Monto *</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.monto}
                  onChange={(e) => setForm(f => ({ ...f, monto: e.target.value }))}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Fecha *</Label>
                <Input type="date" value={form.fecha} onChange={(e) => setForm(f => ({ ...f, fecha: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Descripción *</Label>
              <Input value={form.descripcion} onChange={(e) => setForm(f => ({ ...f, descripcion: e.target.value }))} placeholder="Detalle del movimiento" />
            </div>
            <div className="space-y-1.5">
              <Label>Referencia</Label>
              <Input value={form.referencia} onChange={(e) => setForm(f => ({ ...f, referencia: e.target.value }))} placeholder="Nro. transacción, CBU, etc." />
            </div>
            {error && <FormError message={error} />}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => { setModalAbierto(false); setError("") }}>Cancelar</Button>
            <Button onClick={guardar} disabled={guardando}>{guardando ? "Guardando..." : "Guardar"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
