"use client"

/**
 * Propósito: Componente cliente para registrar pagos a fleteros (/fleteros/pago).
 * Flujo: seleccionar fletero → seleccionar liquidaciones → definir ítems de pago → confirmar.
 */

import { useState, useEffect, useCallback } from "react"
import { SearchCombobox } from "@/components/ui/search-combobox"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { formatearMoneda, formatearFecha } from "@/lib/utils"
import { Plus, Trash2 } from "lucide-react"

// ─── Tipos ───────────────────────────────────────────────────────────────────

interface Fletero {
  id: string
  razonSocial: string
  cuit: string
}

interface Cuenta {
  id: string
  nombre: string
  tipo: string
  bancoOEntidad: string
  tieneChequera: boolean
}

interface ChequeEnCartera {
  id: string
  nroCheque: string
  bancoEmisor: string
  monto: number
  fechaCobro: string
  esElectronico: boolean
  empresa: { razonSocial: string }
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

type TipoPagoItem = "TRANSFERENCIA" | "CHEQUE_PROPIO" | "CHEQUE_TERCERO" | "EFECTIVO"

interface ItemPago {
  tipo: TipoPagoItem
  monto: string
  cuentaId: string
  nroChequePropioEmitir: string
  fechaPagoChequePropioEmitir: string
  chequeRecibidoId: string
}

interface RegistrarPagoClientProps {
  fleteros: Fletero[]
  cuentas: Cuenta[]
  chequesEnCartera: ChequeEnCartera[]
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function itemVacio(): ItemPago {
  return {
    tipo: "TRANSFERENCIA",
    monto: "",
    cuentaId: "",
    nroChequePropioEmitir: "",
    fechaPagoChequePropioEmitir: new Date().toISOString().slice(0, 10),
    chequeRecibidoId: "",
  }
}

function labelNroLiq(liq: LiquidacionPendiente): string {
  if (liq.nroComprobante == null) return "S/N"
  const pto = String(liq.ptoVenta ?? 1).padStart(4, "0")
  const nro = String(liq.nroComprobante).padStart(8, "0")
  return `${pto}-${nro}`
}

// ─── Componente principal ─────────────────────────────────────────────────────

/**
 * RegistrarPagoClient: RegistrarPagoClientProps -> JSX.Element
 *
 * Dado listados de fleteros, cuentas y cheques en cartera, renderiza el flujo de
 * registro de pago multi-liquidación multi-medio con distribución proporcional.
 */
export function RegistrarPagoClient({
  fleteros,
  cuentas,
  chequesEnCartera,
}: RegistrarPagoClientProps) {
  const [fleteroId, setFleteroId] = useState("")
  const [liquidaciones, setLiquidaciones] = useState<LiquidacionPendiente[]>([])
  const [cargandoLiqs, setCargandoLiqs] = useState(false)
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set())

  const [fechaPago, setFechaPago] = useState(new Date().toISOString().slice(0, 10))
  const [observaciones, setObservaciones] = useState("")
  const [items, setItems] = useState<ItemPago[]>([itemVacio()])

  const [modalConfirm, setModalConfirm] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState("")
  const [exito, setExito] = useState(false)

  // Cuentas segmentadas
  const cuentasBanco = cuentas.filter((c) => ["BANCO", "BILLETERA_VIRTUAL"].includes(c.tipo))
  const cuentasChequera = cuentas.filter((c) => c.tieneChequera)

  // Cargar liquidaciones al cambiar fletero
  const cargarLiquidaciones = useCallback((id: string) => {
    if (!id) { setLiquidaciones([]); return }
    setCargandoLiqs(true)
    fetch(`/api/fleteros/${id}/liquidaciones-pendientes`)
      .then((r) => r.json())
      .then((d: LiquidacionPendiente[]) => { setLiquidaciones(Array.isArray(d) ? d : []); setCargandoLiqs(false) })
      .catch(() => setCargandoLiqs(false))
  }, [])

  useEffect(() => {
    setSeleccionados(new Set())
    cargarLiquidaciones(fleteroId)
  }, [fleteroId, cargarLiquidaciones])

  // Toggle selección de liquidación
  function toggleLiq(id: string) {
    setSeleccionados((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleTodos() {
    if (seleccionados.size === liquidaciones.length) {
      setSeleccionados(new Set())
    } else {
      setSeleccionados(new Set(liquidaciones.map((l) => l.id)))
    }
  }

  // Liquidaciones seleccionadas y su saldo total
  const liqSeleccionadas = liquidaciones.filter((l) => seleccionados.has(l.id))
  const saldoTotal = liqSeleccionadas.reduce((sum, l) => sum + l.saldoPendiente, 0)
  const totalItems = items.reduce((sum, i) => sum + (parseFloat(i.monto) || 0), 0)
  const diferencia = totalItems - saldoTotal

  // Items
  function agregarItem() { setItems((prev) => [...prev, itemVacio()]) }
  function eliminarItem(idx: number) { setItems((prev) => prev.filter((_, i) => i !== idx)) }
  function actualizarItem(idx: number, campo: keyof ItemPago, valor: string) {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== idx) return item
        const next = { ...item, [campo]: valor }
        // Al cambiar tipo, resetear campos específicos
        if (campo === "tipo") {
          next.cuentaId = ""
          next.chequeRecibidoId = ""
          // Autocompletar monto con monto del cheque al seleccionar CHEQUE_TERCERO
        }
        return next
      })
    )
  }

  // Al seleccionar cheque de tercero, autocompletar monto
  function alSeleccionarChequeTercero(idx: number, chequeId: string) {
    const cheque = chequesEnCartera.find((c) => c.id === chequeId)
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== idx) return item
        return { ...item, chequeRecibidoId: chequeId, monto: cheque ? String(cheque.monto) : item.monto }
      })
    )
  }

  // Validación básica del formulario
  const puedeSometer =
    fleteroId &&
    liqSeleccionadas.length > 0 &&
    items.length > 0 &&
    totalItems > 0 &&
    items.every((i) => {
      const monto = parseFloat(i.monto)
      if (!monto || monto <= 0) return false
      if (i.tipo === "TRANSFERENCIA") return !!i.cuentaId
      if (i.tipo === "CHEQUE_PROPIO") return !!i.cuentaId && !!i.fechaPagoChequePropioEmitir
      if (i.tipo === "CHEQUE_TERCERO") return !!i.chequeRecibidoId
      return true // EFECTIVO
    })

  async function registrar() {
    setError("")
    setGuardando(true)
    try {
      const body = {
        fechaPago,
        observaciones: observaciones || undefined,
        liquidacionIds: Array.from(seleccionados),
        items: items.map((i) => {
          const base = { tipo: i.tipo, monto: parseFloat(i.monto) }
          if (i.tipo === "TRANSFERENCIA") return { ...base, cuentaId: i.cuentaId }
          if (i.tipo === "CHEQUE_PROPIO") return {
            ...base,
            cuentaId: i.cuentaId,
            nroChequePropioEmitir: i.nroChequePropioEmitir || undefined,
            fechaPagoChequePropioEmitir: i.fechaPagoChequePropioEmitir,
          }
          if (i.tipo === "CHEQUE_TERCERO") return { ...base, chequeRecibidoId: i.chequeRecibidoId }
          return base // EFECTIVO
        }),
      }
      const res = await fetch(`/api/fleteros/${fleteroId}/pago`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Error al registrar el pago")
      } else {
        setExito(true)
        setModalConfirm(false)
        // Recargar liquidaciones para reflejar los nuevos estados
        cargarLiquidaciones(fleteroId)
        setSeleccionados(new Set())
        setItems([itemVacio()])
        setFechaPago(new Date().toISOString().slice(0, 10))
        setObservaciones("")
      }
    } catch {
      setError("Error de red al registrar el pago")
    } finally {
      setGuardando(false)
    }
  }

  const fleterosItems = fleteros.map((f) => ({
    id: f.id,
    label: f.razonSocial,
    sublabel: f.cuit,
  }))

  return (
    <div className="space-y-6">
      {/* Título */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Registrar Pago</h2>
        <p className="text-muted-foreground">Pago a fletero — multi-liquidación y multi-medio</p>
      </div>

      {exito && (
        <div className="border border-green-200 bg-green-50 rounded-lg px-4 py-3 text-sm text-green-800">
          Pago registrado correctamente.{" "}
          <button
            className="underline font-medium"
            onClick={() => { setExito(false) }}
          >
            Registrar otro
          </button>
        </div>
      )}

      {/* Sección 1: Selector de fletero */}
      <div className="border rounded-lg p-4 space-y-3">
        <h3 className="font-semibold text-sm">1. Seleccionar fletero</h3>
        <div className="max-w-sm">
          <SearchCombobox
            items={fleterosItems}
            value={fleteroId}
            onChange={(id) => { setFleteroId(id); setExito(false); setError("") }}
            placeholder="Buscar por nombre o CUIT..."
          />
        </div>
      </div>

      {/* Sección 2: Liquidaciones pendientes */}
      {fleteroId && (
        <div className="border rounded-lg p-4 space-y-3">
          <h3 className="font-semibold text-sm">2. Seleccionar liquidaciones a pagar</h3>
          {cargandoLiqs ? (
            <p className="text-muted-foreground text-sm">Cargando liquidaciones...</p>
          ) : liquidaciones.length === 0 ? (
            <p className="text-muted-foreground text-sm border rounded p-4 text-center">
              Sin liquidaciones pendientes de pago para este fletero.
            </p>
          ) : (
            <div className="border rounded overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-3 py-2 w-8">
                      <input
                        type="checkbox"
                        checked={seleccionados.size === liquidaciones.length}
                        onChange={toggleTodos}
                        className="h-4 w-4"
                      />
                    </th>
                    <th className="text-left px-3 py-2">Fecha emisión</th>
                    <th className="text-left px-3 py-2">Nro. comprobante</th>
                    <th className="text-right px-3 py-2">Total</th>
                    <th className="text-right px-3 py-2">Pagado</th>
                    <th className="text-right px-3 py-2">Saldo pendiente</th>
                    <th className="text-left px-3 py-2">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {liquidaciones.map((liq) => (
                    <tr
                      key={liq.id}
                      className={`border-t cursor-pointer hover:bg-muted/20 ${seleccionados.has(liq.id) ? "bg-primary/5" : ""}`}
                      onClick={() => toggleLiq(liq.id)}
                    >
                      <td className="px-3 py-2">
                        <input
                          type="checkbox"
                          checked={seleccionados.has(liq.id)}
                          onChange={() => toggleLiq(liq.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="h-4 w-4"
                        />
                      </td>
                      <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">
                        {formatearFecha(liq.grabadaEn)}
                      </td>
                      <td className="px-3 py-2 font-mono text-xs">{labelNroLiq(liq)}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{formatearMoneda(liq.total)}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">
                        {liq.totalPagado > 0 ? formatearMoneda(liq.totalPagado) : "—"}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums font-medium">{formatearMoneda(liq.saldoPendiente)}</td>
                      <td className="px-3 py-2">
                        <span className={`text-xs px-1.5 py-0.5 rounded ${liq.estado === "PARCIALMENTE_PAGADA" ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700"}`}>
                          {liq.estado === "PARCIALMENTE_PAGADA" ? "Parcial" : "Emitida"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                {liqSeleccionadas.length > 0 && (
                  <tfoot>
                    <tr className="bg-muted border-t-2 font-semibold">
                      <td colSpan={5} className="px-3 py-2 text-right text-xs text-muted-foreground uppercase tracking-wide">
                        {liqSeleccionadas.length} liquidación(es) seleccionada(s) — Saldo total
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">{formatearMoneda(saldoTotal)}</td>
                      <td />
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          )}
        </div>
      )}

      {/* Sección 3: Ítems de pago */}
      {liqSeleccionadas.length > 0 && (
        <div className="border rounded-lg p-4 space-y-4">
          <h3 className="font-semibold text-sm">3. Detalles del pago</h3>

          {/* Fecha y observaciones */}
          <div className="grid grid-cols-2 gap-4 max-w-xl">
            <div>
              <Label>Fecha de pago</Label>
              <Input
                type="date"
                value={fechaPago}
                onChange={(e) => setFechaPago(e.target.value)}
              />
            </div>
            <div>
              <Label>Observaciones (opcional)</Label>
              <Input
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Ej: pago parcial acuerdo..."
              />
            </div>
          </div>

          {/* Lista de ítems */}
          <div className="space-y-3">
            {items.map((item, idx) => (
              <ItemPagoForm
                key={idx}
                idx={idx}
                item={item}
                cuentasBanco={cuentasBanco}
                cuentasChequera={cuentasChequera}
                chequesEnCartera={chequesEnCartera}
                onChange={actualizarItem}
                onChangeCheque={alSeleccionarChequeTercero}
                onEliminar={eliminarItem}
                mostrarEliminar={items.length > 1}
              />
            ))}
          </div>

          <Button size="sm" variant="outline" onClick={agregarItem}>
            <Plus className="h-4 w-4 mr-1" /> Agregar ítem
          </Button>

          {/* Resumen */}
          <div className="border rounded-lg p-3 space-y-1 bg-muted/20">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Saldo de liquidaciones seleccionadas:</span>
              <span className="font-medium">{formatearMoneda(saldoTotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total de ítems de pago:</span>
              <span className="font-semibold">{formatearMoneda(totalItems)}</span>
            </div>
            {Math.abs(diferencia) > 0.01 && (
              <div className="flex justify-between text-sm text-amber-700 bg-amber-50 rounded px-2 py-1 mt-1">
                <span>
                  {diferencia > 0
                    ? "⚠ El pago excede el saldo — se genera saldo a favor"
                    : "⚠ Pago parcial — las liquidaciones quedarán PARCIALMENTE_PAGADA"}
                </span>
                <span className="font-medium">{diferencia > 0 ? "+" : ""}{formatearMoneda(diferencia)}</span>
              </div>
            )}
            {Math.abs(diferencia) <= 0.01 && totalItems > 0 && (
              <div className="flex justify-between text-sm text-green-700 bg-green-50 rounded px-2 py-1 mt-1">
                <span>✓ El pago cubre exactamente el saldo</span>
              </div>
            )}
          </div>

          {error && (
            <div className="border border-destructive/30 bg-destructive/10 rounded px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="flex justify-end">
            <Button
              onClick={() => { setError(""); setModalConfirm(true) }}
              disabled={!puedeSometer}
            >
              Registrar Pago
            </Button>
          </div>
        </div>
      )}

      {/* Modal de confirmación */}
      <Dialog open={modalConfirm} onOpenChange={setModalConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar pago</DialogTitle>
            <DialogDescription>
              Se registrará un pago a{" "}
              <strong>{fleteros.find((f) => f.id === fleteroId)?.razonSocial}</strong>{" "}
              por{" "}
              <strong>{formatearMoneda(totalItems)}</strong>{" "}
              contra {liqSeleccionadas.length} liquidación(es).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            <div className="border rounded p-3 space-y-1 bg-muted/20">
              {liqSeleccionadas.map((liq) => (
                <div key={liq.id} className="flex justify-between">
                  <span className="font-mono text-xs">{labelNroLiq(liq)}</span>
                  <span>{formatearMoneda(liq.saldoPendiente)}</span>
                </div>
              ))}
              <div className="border-t pt-1 flex justify-between font-semibold">
                <span>Total a pagar</span>
                <span>{formatearMoneda(totalItems)}</span>
              </div>
            </div>
            {Math.abs(diferencia) > 0.01 && (
              <p className="text-amber-700 text-xs">
                {diferencia > 0
                  ? `Excedente de ${formatearMoneda(diferencia)} se genera saldo a favor del fletero.`
                  : `Pago parcial — faltan ${formatearMoneda(-diferencia)} para cubrir el saldo completo.`}
              </p>
            )}
            {error && (
              <p className="text-destructive text-xs">{error}</p>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setModalConfirm(false)}>
              Cancelar
            </Button>
            <Button onClick={registrar} disabled={guardando}>
              {guardando ? "Registrando..." : "Confirmar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── Sub-componente: formulario de un ítem de pago ───────────────────────────

interface ItemPagoFormProps {
  idx: number
  item: ItemPago
  cuentasBanco: Cuenta[]
  cuentasChequera: Cuenta[]
  chequesEnCartera: ChequeEnCartera[]
  onChange: (idx: number, campo: keyof ItemPago, valor: string) => void
  onChangeCheque: (idx: number, chequeId: string) => void
  onEliminar: (idx: number) => void
  mostrarEliminar: boolean
}

function ItemPagoForm({
  idx,
  item,
  cuentasBanco,
  cuentasChequera,
  chequesEnCartera,
  onChange,
  onChangeCheque,
  onEliminar,
  mostrarEliminar,
}: ItemPagoFormProps) {
  return (
    <div className="border rounded-lg p-3 space-y-3 bg-background">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Ítem {idx + 1}
        </span>
        {mostrarEliminar && (
          <button
            type="button"
            onClick={() => onEliminar(idx)}
            className="text-destructive hover:text-destructive/80"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Tipo de pago</Label>
          <Select
            value={item.tipo}
            onChange={(e) => onChange(idx, "tipo", e.target.value)}
          >
            <option value="TRANSFERENCIA">Transferencia</option>
            <option value="CHEQUE_PROPIO">Cheque propio (ECheq)</option>
            <option value="CHEQUE_TERCERO">Cheque de tercero</option>
            <option value="EFECTIVO">Efectivo</option>
          </Select>
        </div>
        <div>
          <Label>Monto</Label>
          <Input
            type="number"
            value={item.monto}
            onChange={(e) => onChange(idx, "monto", e.target.value)}
            placeholder="0"
            min="0"
          />
        </div>
      </div>

      {/* Campos adicionales según tipo */}
      {item.tipo === "TRANSFERENCIA" && (
        <div>
          <Label>Cuenta origen</Label>
          <Select
            value={item.cuentaId}
            onChange={(e) => onChange(idx, "cuentaId", e.target.value)}
          >
            <option value="">Seleccionar cuenta...</option>
            {cuentasBanco.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre} — {c.bancoOEntidad}
              </option>
            ))}
          </Select>
        </div>
      )}

      {item.tipo === "CHEQUE_PROPIO" && (
        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label>Cuenta/chequera</Label>
            <Select
              value={item.cuentaId}
              onChange={(e) => onChange(idx, "cuentaId", e.target.value)}
            >
              <option value="">Seleccionar...</option>
              {cuentasChequera.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Nro. cheque (opcional)</Label>
            <Input
              value={item.nroChequePropioEmitir}
              onChange={(e) => onChange(idx, "nroChequePropioEmitir", e.target.value)}
              placeholder="ECheq asigna automático"
            />
          </div>
          <div>
            <Label>Fecha de pago del cheque</Label>
            <Input
              type="date"
              value={item.fechaPagoChequePropioEmitir}
              onChange={(e) => onChange(idx, "fechaPagoChequePropioEmitir", e.target.value)}
            />
          </div>
        </div>
      )}

      {item.tipo === "CHEQUE_TERCERO" && (
        <div>
          <Label>Cheque a endosar</Label>
          <Select
            value={item.chequeRecibidoId}
            onChange={(e) => onChangeCheque(idx, e.target.value)}
          >
            <option value="">Seleccionar cheque en cartera...</option>
            {chequesEnCartera.map((c) => (
              <option key={c.id} value={c.id}>
                {c.empresa.razonSocial} — {c.bancoEmisor} #{c.nroCheque} — {formatearMoneda(c.monto)} — vence {formatearFecha(c.fechaCobro)}{c.esElectronico ? " [ECheq]" : " [Físico]"}
              </option>
            ))}
          </Select>
          {item.chequeRecibidoId && (
            <p className="text-xs text-muted-foreground mt-1">
              Monto autocargado: {formatearMoneda(parseFloat(item.monto) || 0)}
            </p>
          )}
        </div>
      )}

      {item.tipo === "EFECTIVO" && (
        <p className="text-xs text-muted-foreground">
          Solo requiere el monto. No genera movimiento bancario.
        </p>
      )}
    </div>
  )
}
