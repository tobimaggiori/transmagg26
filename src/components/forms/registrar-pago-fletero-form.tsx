"use client"

/**
 * Propósito: Formulario de dos paneles para registrar pago a uno o varios LPs del mismo fletero.
 * Panel izquierdo fijo: lista de LPs a pagar, gastos a descontar, totales y botones.
 * Panel derecho con scroll interno: tabla de medios de pago + formulario inline de alta.
 */

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { UploadPDF } from "@/components/upload-pdf"
import { formatearFecha } from "@/lib/utils"
import { sumarImportes, restarImportes, maxMonetario, parsearImporte, importesIguales, formatearMoneda } from "@/lib/money"
import { hoyLocalYmd } from "@/lib/date-local"

// ─── Tipos ────────────────────────────────────────────────────────────────────

type LiqItem = {
  id: string
  nroComprobante: number | null
  ptoVenta: number | null
  total: number
  saldoPendiente: number
  grabadaEn: string
}

type CuentaBancaria = {
  id: string
  nombre: string
  bancoOEntidad: string
}

type ChequeEnCartera = {
  id: string
  nroCheque: string
  bancoEmisor: string
  monto: number
  fechaCobro: string
}

type GastoPendiente = {
  id: string
  tipo: string
  montoPagado: number
  montoDescontado: number
  estado: string
  sinFactura: boolean
  descripcion: string | null
  facturaProveedor: {
    id: string
    tipoCbte: string
    nroComprobante: string | null
    fechaCbte: string
    proveedor: { razonSocial: string }
  } | null
}

type Props = {
  liquidaciones: LiqItem[]
  fletero: { id: string; razonSocial: string; cuit: string }
  cuentasBancarias: CuentaBancaria[]
  chequesEnCartera: ChequeEnCartera[]
  saldoAFavorCC: number
  gastosPendientes?: GastoPendiente[]
  onSuccess: (nroOP: number, opId: string) => void
  onClose: () => void
}

// ─── Tipos de ítems de pago ───────────────────────────────────────────────────

type PagoItemTransferencia = {
  tipoPago: "TRANSFERENCIA"
  monto: string
  cuentaBancariaId: string
  referencia: string
  comprobanteS3Key?: string
}
type PagoItemChequePropio = {
  tipoPago: "CHEQUE_PROPIO"
  monto: string
  cuentaId: string
  nroCheque: string
  mailBeneficiario: string
  fechaEmision: string
  fechaPago: string
  clausula: string
  descripcion1: string
  descripcion2: string
  comprobanteS3Key?: string
}
type PagoItemChequeTercero = {
  tipoPago: "CHEQUE_TERCERO"
  monto: string
  chequeRecibidoId: string
  comprobanteS3Key?: string
}
type PagoItemEfectivo = {
  tipoPago: "EFECTIVO"
  monto: string
}
type PagoItemSaldoAFavor = {
  tipoPago: "SALDO_A_FAVOR"
  monto: string
}

type PagoItem =
  | PagoItemTransferencia
  | PagoItemChequePropio
  | PagoItemChequeTercero
  | PagoItemEfectivo
  | PagoItemSaldoAFavor

// ─── Helpers ─────────────────────────────────────────────────────────────────

const ars = formatearMoneda

function nroLP(ptoVenta: number | null, nro: number | null): string {
  if (ptoVenta == null || nro == null) return "s/n"
  return `${String(ptoVenta).padStart(4, "0")}-${String(nro).padStart(8, "0")}`
}

function defaultDraft(tipo: PagoItem["tipoPago"]): PagoItem {
  const today = hoyLocalYmd()
  if (tipo === "TRANSFERENCIA") return { tipoPago: "TRANSFERENCIA", monto: "", cuentaBancariaId: "", referencia: "" }
  if (tipo === "CHEQUE_PROPIO") return {
    tipoPago: "CHEQUE_PROPIO", monto: "", cuentaId: "", nroCheque: "",
    mailBeneficiario: "", fechaEmision: today, fechaPago: "", clausula: "NO_A_LA_ORDEN",
    descripcion1: "", descripcion2: "",
  }
  if (tipo === "CHEQUE_TERCERO") return { tipoPago: "CHEQUE_TERCERO", monto: "", chequeRecibidoId: "" }
  if (tipo === "EFECTIVO") return { tipoPago: "EFECTIVO", monto: "" }
  return { tipoPago: "SALDO_A_FAVOR", monto: "" }
}

function tipoBadge(p: PagoItem): string {
  const labels: Record<string, string> = {
    TRANSFERENCIA: "Transferencia",
    CHEQUE_PROPIO: "Cheque propio",
    CHEQUE_TERCERO: "Cheque tercero",
    EFECTIVO: "Efectivo",
    SALDO_A_FAVOR: "Saldo a favor",
  }
  return labels[p.tipoPago] ?? p.tipoPago
}

function resumenItem(p: PagoItem, cuentas: CuentaBancaria[], cheques: ChequeEnCartera[]): string {
  if (p.tipoPago === "TRANSFERENCIA") {
    const cta = cuentas.find((c) => c.id === p.cuentaBancariaId)
    return cta ? `${cta.nombre}${p.referencia ? ` · Ref: ${p.referencia}` : ""}` : "—"
  }
  if (p.tipoPago === "CHEQUE_PROPIO") {
    const vto = p.fechaPago ? formatearFecha(new Date(p.fechaPago)) : "s/vto"
    return `Nro ${p.nroCheque} — Vto ${vto}`
  }
  if (p.tipoPago === "CHEQUE_TERCERO") {
    const ch = cheques.find((c) => c.id === p.chequeRecibidoId)
    return ch ? `${ch.bancoEmisor} — Nro ${ch.nroCheque} — Vto ${ch.fechaCobro}` : "—"
  }
  return "—"
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function RegistrarPagoFleteroModal({
  liquidaciones,
  fletero,
  cuentasBancarias,
  chequesEnCartera,
  saldoAFavorCC,
  gastosPendientes = [],
  onSuccess,
  onClose,
}: Props) {
  const [pagos, setPagos] = useState<PagoItem[]>([])
  const [draft, setDraft] = useState<PagoItem | null>(null)
  const [draftError, setDraftError] = useState<string | null>(null)

  const [gastosSeleccionados, setGastosSeleccionados] = useState<Record<string, boolean>>({})
  const [gastosMontos, setGastosMontos] = useState<Record<string, string>>({})

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [mostrandoPreview, setMostrandoPreview] = useState(false)
  const [proximoNro, setProximoNro] = useState<number | null>(null)

  // ── Cálculos ────────────────────────────────────────────────────────────────
  const saldoPendienteTotal = sumarImportes(liquidaciones.map(l => l.saldoPendiente))

  const totalGastosDescontados = sumarImportes(
    gastosPendientes
      .filter(g => gastosSeleccionados[g.id])
      .map(g => parsearImporte(gastosMontos[g.id] ?? "0"))
  )

  const saldoAjustado = maxMonetario(0, restarImportes(saldoPendienteTotal, totalGastosDescontados))

  const totalMedios = sumarImportes(pagos.map(p => parsearImporte(p.monto)))
  const diferencia = restarImportes(totalMedios, saldoAjustado)

  // ── Gestión de gastos ────────────────────────────────────────────────────────
  function toggleGasto(gastoId: string, saldoGasto: number) {
    const ahora = !gastosSeleccionados[gastoId]
    setGastosSeleccionados((prev) => ({ ...prev, [gastoId]: ahora }))
    if (ahora) {
      setGastosMontos((prev) => ({ ...prev, [gastoId]: String(saldoGasto) }))
    } else {
      setGastosMontos((prev) => ({ ...prev, [gastoId]: "" }))
    }
  }

  // ── Gestión de ítems de pago ─────────────────────────────────────────────────
  function removePago(index: number) {
    setPagos((prev) => prev.filter((_, i) => i !== index))
  }

  function iniciarDraft(tipo: PagoItem["tipoPago"]) {
    setDraft(defaultDraft(tipo))
    setDraftError(null)
  }

  function updateDraft(updates: Partial<PagoItem>) {
    setDraft((prev) => prev ? ({ ...prev, ...updates } as PagoItem) : prev)
  }

  function changeDraftTipo(tipo: PagoItem["tipoPago"]) {
    setDraft(defaultDraft(tipo))
    setDraftError(null)
  }

  function confirmarDraft() {
    if (!draft) return
    const monto = parsearImporte(draft.monto)
    if (!monto || monto <= 0) { setDraftError("Ingresá un monto válido"); return }
    if (draft.tipoPago === "TRANSFERENCIA" && !draft.cuentaBancariaId) {
      setDraftError("Seleccioná una cuenta bancaria"); return
    }
    if (draft.tipoPago === "CHEQUE_PROPIO") {
      if (!draft.nroCheque.trim()) { setDraftError("El número de cheque es obligatorio"); return }
      if (!draft.cuentaId) { setDraftError("Seleccioná una cuenta (chequera)"); return }
      if (!draft.fechaPago) { setDraftError("Ingresá la fecha de pago"); return }
    }
    if (draft.tipoPago === "CHEQUE_TERCERO" && !draft.chequeRecibidoId) {
      setDraftError("Seleccioná un cheque en cartera"); return
    }
    if ((draft.tipoPago === "CHEQUE_PROPIO" || draft.tipoPago === "CHEQUE_TERCERO" || draft.tipoPago === "TRANSFERENCIA") && !draft.comprobanteS3Key) {
      setDraftError("Subí el comprobante antes de agregar"); return
    }
    if (draft.tipoPago === "SALDO_A_FAVOR" && monto > saldoAFavorCC) {
      setDraftError(`Saldo a favor disponible: ${ars(saldoAFavorCC)}`); return
    }
    setPagos((prev) => [...prev, draft])
    setDraft(null)
    setDraftError(null)
  }

  function cancelarDraft() {
    setDraft(null)
    setDraftError(null)
  }

  // ── Submit ───────────────────────────────────────────────────────────────────
  async function handleSubmit() {
    if (pagos.length === 0 && totalGastosDescontados === 0) {
      setError("Agregá al menos un medio de pago o gasto a descontar"); return
    }
    if (!importesIguales(totalMedios, saldoAjustado)) {
      setError(`El total debe cubrir exactamente el saldo (${ars(saldoAjustado)}). Diferencia: ${ars(diferencia)}`); return
    }
    setError(null)
    setLoading(true)
    try {
      const today = hoyLocalYmd()
      const gastosPayload = gastosPendientes
        .filter((g) => gastosSeleccionados[g.id])
        .map((g) => ({ gastoId: g.id, montoDescontar: parsearImporte(gastosMontos[g.id] ?? "0") }))
        .filter((g) => g.montoDescontar > 0)

      const body = {
        fleteroId: fletero.id,
        liquidacionIds: liquidaciones.map((l) => l.id),
        pagos: pagos.map((p) => {
          const monto = parsearImporte(p.monto)
          if (p.tipoPago === "TRANSFERENCIA") {
            return { tipoPago: p.tipoPago, monto, cuentaBancariaId: p.cuentaBancariaId, referencia: p.referencia || undefined, comprobanteS3Key: p.comprobanteS3Key }
          }
          if (p.tipoPago === "CHEQUE_PROPIO") {
            return {
              tipoPago: p.tipoPago,
              monto,
              comprobanteS3Key: p.comprobanteS3Key,
              chequePropio: {
                cuentaId: p.cuentaId,
                nroCheque: p.nroCheque,
                mailBeneficiario: p.mailBeneficiario || null,
                fechaEmision: p.fechaEmision,
                fechaPago: p.fechaPago,
                clausula: p.clausula || "NO_A_LA_ORDEN",
                descripcion1: p.descripcion1 || null,
                descripcion2: p.descripcion2 || null,
              },
            }
          }
          if (p.tipoPago === "CHEQUE_TERCERO") return { tipoPago: p.tipoPago, monto, chequeRecibidoId: p.chequeRecibidoId, comprobanteS3Key: p.comprobanteS3Key }
          return { tipoPago: p.tipoPago, monto }
        }),
        fecha: today,
        gastos: gastosPayload.length > 0 ? gastosPayload : undefined,
      }

      const res = await fetch("/api/ordenes-pago", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? "Error al registrar pago"); return }
      onSuccess(data.ordenPago.nro, data.ordenPago.id)
    } catch {
      setError("Error de red al registrar pago")
    } finally {
      setLoading(false)
    }
  }

  const puedeConfirmar = !loading && (pagos.length > 0 || totalGastosDescontados > 0) && !draft && Math.abs(diferencia) < 0.01

  async function abrirPreview() {
    setError(null)
    try {
      const res = await fetch("/api/ordenes-pago/proximo-nro")
      if (res.ok) {
        const data = await res.json()
        setProximoNro(data.nro)
      } else {
        setProximoNro(null)
      }
    } catch {
      setProximoNro(null)
    }
    setMostrandoPreview(true)
  }

  if (mostrandoPreview) {
    return (
      <PreviewOrdenPago
        nro={proximoNro}
        fecha={hoyLocalYmd()}
        fletero={fletero}
        liquidaciones={liquidaciones}
        pagos={pagos}
        gastosDescontados={gastosPendientes.filter((g) => gastosSeleccionados[g.id]).map((g) => ({
          razonSocial: g.sinFactura
            ? (g.descripcion ?? "Gasto sin factura")
            : g.facturaProveedor?.proveedor.razonSocial ?? "—",
          comprobante: g.sinFactura
            ? "Sin factura"
            : `${g.facturaProveedor?.tipoCbte ?? ""} ${g.facturaProveedor?.nroComprobante ?? "s/n"}`,
          monto: parsearImporte(gastosMontos[g.id] ?? "0"),
        }))}
        totalMedios={totalMedios}
        totalGastosDescontados={totalGastosDescontados}
        cuentasBancarias={cuentasBancarias}
        chequesEnCartera={chequesEnCartera}
        loading={loading}
        onVolver={() => setMostrandoPreview(false)}
        onConfirmar={handleSubmit}
      />
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 md:p-4">
      <div
        className="bg-background rounded-lg shadow-xl w-full max-w-5xl flex flex-col md:flex-row overflow-hidden"
        style={{ height: "min(92vh, 720px)" }}
      >
        {/* ── Panel izquierdo ─────────────────────────────────────────────── */}
        <div className="md:w-[340px] flex-shrink-0 border-b md:border-b-0 md:border-r flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {/* Header */}
            <div>
              <h2 className="text-base font-semibold">Registrar pago</h2>
              <p className="text-xs text-muted-foreground">{fletero.razonSocial}</p>
            </div>

            {/* Lista de LPs a pagar */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                Facturas a pagar
              </p>
              <div className="space-y-1">
                {liquidaciones.map((liq) => {
                  const esParcial = liq.saldoPendiente < liq.total
                  return (
                    <div key={liq.id} className="flex justify-between items-center text-xs py-1 border-b last:border-0">
                      <span className="font-mono text-muted-foreground">
                        LP {nroLP(liq.ptoVenta, liq.nroComprobante)}
                        {esParcial && <span className="ml-1 text-amber-600">(parcial)</span>}
                      </span>
                      <span className="font-semibold">{ars(liq.saldoPendiente)}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Resumen financiero */}
            <div className="rounded-md border p-3 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Saldo total</span>
                <span>{ars(saldoPendienteTotal)}</span>
              </div>
              {totalGastosDescontados > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Gastos a descontar</span>
                  <span className="text-orange-600">- {ars(totalGastosDescontados)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold border-t pt-1 mt-1">
                <span>A cubrir</span>
                <span>{ars(saldoAjustado)}</span>
              </div>
              {saldoAFavorCC > 0 && (
                <p className="text-xs text-green-600 pt-0.5">
                  Saldo a favor disponible: {ars(saldoAFavorCC)}
                </p>
              )}
            </div>

            {/* Gastos a descontar */}
            {gastosPendientes.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                  Gastos a descontar
                </p>
                <div className="space-y-2">
                  {gastosPendientes.map((g) => {
                    const saldoGasto = restarImportes(g.montoPagado, g.montoDescontado)
                    const checked = gastosSeleccionados[g.id] ?? false
                    return (
                      <div key={g.id} className="flex items-start gap-2 rounded border p-2 text-xs">
                        <input
                          type="checkbox"
                          className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 cursor-pointer"
                          checked={checked}
                          onChange={() => toggleGasto(g.id, saldoGasto)}
                        />
                        <div className="flex-1 min-w-0">
                          {g.sinFactura ? (
                            <p className="font-medium truncate">{g.descripcion ?? "Gasto sin factura"}</p>
                          ) : g.facturaProveedor ? (
                            <>
                              <p className="font-medium truncate">{g.facturaProveedor.proveedor.razonSocial}</p>
                              <p className="text-muted-foreground">
                                {g.facturaProveedor.tipoCbte} {g.facturaProveedor.nroComprobante ?? "s/n"} ·{" "}
                                {formatearFecha(new Date(g.facturaProveedor.fechaCbte))}
                              </p>
                            </>
                          ) : (
                            <p className="font-medium truncate">Gasto sin factura</p>
                          )}
                          <p className="text-muted-foreground">Saldo: {formatearMoneda(saldoGasto)}</p>
                        </div>
                        <Input
                          type="number"
                          min="0"
                          max={saldoGasto}
                          step="0.01"
                          disabled={!checked}
                          value={gastosMontos[g.id] ?? ""}
                          onChange={(e) => {
                            const v = Math.min(parsearImporte(e.target.value), saldoGasto)
                            setGastosMontos((prev) => ({ ...prev, [g.id]: String(v) }))
                          }}
                          className="w-24 h-6 text-xs text-right px-1"
                        />
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Error + Botones (fijos al fondo del panel izquierdo) */}
          <div className="border-t p-4 space-y-2 flex-shrink-0">
            {error && <p className="text-xs text-destructive">{error}</p>}
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose} disabled={loading} className="flex-1">
                Cancelar
              </Button>
              <Button
                onClick={abrirPreview}
                disabled={!puedeConfirmar}
                className="flex-1"
              >
                Previsualizar &rarr;
              </Button>
            </div>
          </div>
        </div>

        {/* ── Panel derecho ────────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-5 pb-2 flex-shrink-0">
            <p className="text-sm font-semibold">Medios de pago</p>
          </div>

          {/* Tabla de ítems — scroll interno */}
          <div className="flex-1 overflow-y-auto px-5">
            {pagos.length === 0 && !draft ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Sin medios de pago. Agregá uno con el botón de abajo.
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-2 py-1.5 text-left font-medium text-xs">Tipo</th>
                    <th className="px-2 py-1.5 text-left font-medium text-xs">Detalle</th>
                    <th className="px-2 py-1.5 text-right font-medium text-xs">Monto</th>
                    <th className="w-6" />
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {pagos.map((p, i) => (
                    <tr key={i} className="hover:bg-muted/20">
                      <td className="px-2 py-2 text-xs">{tipoBadge(p)}</td>
                      <td className="px-2 py-2 text-xs text-muted-foreground max-w-[200px] truncate">
                        {resumenItem(p, cuentasBancarias, chequesEnCartera)}
                        {"comprobanteS3Key" in p && p.comprobanteS3Key && (
                          <span className="ml-1.5 inline-flex items-center text-green-700 font-medium">📎 PDF</span>
                        )}
                      </td>
                      <td className="px-2 py-2 text-right font-mono text-xs">
                        {ars(parsearImporte(p.monto))}
                      </td>
                      <td className="px-1 py-2">
                        <button
                          onClick={() => removePago(i)}
                          className="h-5 w-5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex items-center justify-center text-xs"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Formulario inline de alta */}
            {draft && (
              <DraftForm
                draft={draft}
                draftError={draftError}
                cuentasBancarias={cuentasBancarias}
                chequesEnCartera={chequesEnCartera}
                saldoAFavorCC={saldoAFavorCC}
                cuit={fletero.cuit}
                onChangeTipo={changeDraftTipo}
                onUpdate={updateDraft}
                onConfirm={confirmarDraft}
                onCancel={cancelarDraft}
              />
            )}
          </div>

          {/* Agregar + totales (fijos al fondo del panel derecho) */}
          <div className="flex-shrink-0 px-5 pb-5 pt-2 space-y-2 border-t mt-2">
            {!draft && (
              <div className="flex gap-2 flex-wrap">
                <span className="text-xs text-muted-foreground self-center">Agregar:</span>
                {(["TRANSFERENCIA", "CHEQUE_PROPIO", "CHEQUE_TERCERO", "EFECTIVO", "SALDO_A_FAVOR"] as const).map((tipo) => (
                  <button
                    key={tipo}
                    onClick={() => iniciarDraft(tipo)}
                    disabled={(tipo === "CHEQUE_TERCERO" && chequesEnCartera.length === 0) || (tipo === "SALDO_A_FAVOR" && saldoAFavorCC <= 0)}
                    className="h-6 px-2 rounded border text-xs font-medium hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {tipoBadge({ tipoPago: tipo } as PagoItem)}
                  </button>
                ))}
              </div>
            )}

            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total medios de pago</span>
                <span className="font-medium">{ars(totalMedios)}</span>
              </div>
              <div className={`flex justify-between font-semibold ${Math.abs(diferencia) < 0.01 ? "text-green-600" : "text-red-600"}`}>
                <span>Diferencia</span>
                <span>{ars(diferencia)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Formulario inline de alta de ítem ───────────────────────────────────────

function DraftForm({
  draft,
  draftError,
  cuentasBancarias,
  chequesEnCartera,
  saldoAFavorCC,
  cuit,
  onChangeTipo,
  onUpdate,
  onConfirm,
  onCancel,
}: {
  draft: PagoItem
  draftError: string | null
  cuentasBancarias: CuentaBancaria[]
  chequesEnCartera: ChequeEnCartera[]
  saldoAFavorCC: number
  cuit: string
  onChangeTipo: (tipo: PagoItem["tipoPago"]) => void
  onUpdate: (updates: Partial<PagoItem>) => void
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div className="border rounded-md p-3 mt-3 bg-muted/20 space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <Select
          value={draft.tipoPago}
          onChange={(e) => onChangeTipo(e.target.value as PagoItem["tipoPago"])}
          className="h-8 text-xs"
        >
          <option value="TRANSFERENCIA">Transferencia</option>
          <option value="CHEQUE_PROPIO">Cheque propio</option>
          <option value="CHEQUE_TERCERO" disabled={chequesEnCartera.length === 0}>
            Cheque de tercero{chequesEnCartera.length === 0 ? " (sin cheques)" : ""}
          </option>
          <option value="EFECTIVO">Efectivo</option>
          <option value="SALDO_A_FAVOR" disabled={saldoAFavorCC <= 0}>
            Saldo a favor{saldoAFavorCC > 0 ? ` (${new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(saldoAFavorCC)})` : " (sin saldo)"}
          </option>
        </Select>

        <div className="flex items-center gap-1">
          <Label className="text-xs shrink-0">Monto</Label>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={draft.monto}
            onChange={(e) => onUpdate({ monto: e.target.value } as Partial<PagoItem>)}
            placeholder="0,00"
            className="w-32 h-8 text-xs"
          />
        </div>
      </div>

      {/* Campos específicos por tipo */}
      {draft.tipoPago === "TRANSFERENCIA" && (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs">Cuenta</Label>
            <Select
              value={draft.cuentaBancariaId}
              onChange={(e) => onUpdate({ cuentaBancariaId: e.target.value } as Partial<PagoItem>)}
              className="h-8 text-xs mt-0.5"
            >
              <option value="">Seleccionar...</option>
              {cuentasBancarias.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre} — {c.bancoOEntidad}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label className="text-xs">Referencia (opcional)</Label>
            <Input
              value={draft.referencia}
              onChange={(e) => onUpdate({ referencia: e.target.value } as Partial<PagoItem>)}
              className="h-8 text-xs mt-0.5"
            />
          </div>
        </div>
      )}

      {draft.tipoPago === "CHEQUE_PROPIO" && (
        <div className="space-y-2">
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label className="text-xs">Nro. de cheque <span className="text-destructive">*</span></Label>
              <Input
                value={draft.nroCheque}
                onChange={(e) => onUpdate({ nroCheque: e.target.value } as Partial<PagoItem>)}
                placeholder="obligatorio"
                className={`h-8 text-xs mt-0.5 ${!draft.nroCheque.trim() ? "border-orange-400" : ""}`}
              />
            </div>
            <div>
              <Label className="text-xs">Cuenta (chequera)</Label>
              <Select
                value={draft.cuentaId}
                onChange={(e) => onUpdate({ cuentaId: e.target.value } as Partial<PagoItem>)}
                className="h-8 text-xs mt-0.5"
              >
                <option value="">Seleccionar...</option>
                {cuentasBancarias.map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label className="text-xs">Fecha de pago</Label>
              <Input
                type="date"
                value={draft.fechaPago}
                onChange={(e) => onUpdate({ fechaPago: e.target.value } as Partial<PagoItem>)}
                className="h-8 text-xs mt-0.5"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Beneficiario:</span>
            <span className="text-xs font-medium">CUIT</span>
            <span className="text-xs font-mono">{cuit}</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label className="text-xs">Fecha emisión</Label>
              <Input
                type="date"
                value={draft.fechaEmision}
                onChange={(e) => onUpdate({ fechaEmision: e.target.value } as Partial<PagoItem>)}
                className="h-8 text-xs mt-0.5"
              />
            </div>
            <div>
              <Label className="text-xs">Cláusula</Label>
              <Select
                value={draft.clausula}
                onChange={(e) => onUpdate({ clausula: e.target.value } as Partial<PagoItem>)}
                className="h-8 text-xs mt-0.5"
              >
                <option value="NO_A_LA_ORDEN">No a la orden</option>
                <option value="AL_DIA">Al día</option>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Mail beneficiario (opcional)</Label>
              <Input
                type="email"
                value={draft.mailBeneficiario}
                onChange={(e) => onUpdate({ mailBeneficiario: e.target.value } as Partial<PagoItem>)}
                className="h-8 text-xs mt-0.5"
                placeholder="email@ejemplo.com"
              />
            </div>
          </div>
          <div>
            <Label className="text-xs">Descripción (opcional)</Label>
            <Input
              value={draft.descripcion1}
              onChange={(e) => onUpdate({ descripcion1: e.target.value } as Partial<PagoItem>)}
              className="h-8 text-xs mt-0.5"
            />
          </div>
        </div>
      )}

      {draft.tipoPago === "CHEQUE_TERCERO" && (
        <div>
          <Label className="text-xs">Cheque en cartera</Label>
          <Select
            value={draft.chequeRecibidoId}
            onChange={(e) => {
              const ch = chequesEnCartera.find((c) => c.id === e.target.value)
              onUpdate({ chequeRecibidoId: e.target.value, monto: ch ? String(ch.monto) : draft.monto } as Partial<PagoItem>)
            }}
            className="h-8 text-xs mt-0.5"
          >
            <option value="">Seleccionar cheque...</option>
            {chequesEnCartera.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nroCheque} — {c.bancoEmisor} — {new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(c.monto)} — vence {c.fechaCobro}
              </option>
            ))}
          </Select>
        </div>
      )}

      {/* Comprobante obligatorio para CHEQUE_PROPIO, CHEQUE_TERCERO, TRANSFERENCIA */}
      {(draft.tipoPago === "CHEQUE_PROPIO" || draft.tipoPago === "CHEQUE_TERCERO" || draft.tipoPago === "TRANSFERENCIA") && (
        <div>
          <Label className="text-xs mb-1 block">
            {draft.tipoPago === "CHEQUE_PROPIO" && "Comprobante de emisión"}
            {draft.tipoPago === "CHEQUE_TERCERO" && "Comprobante de endoso"}
            {draft.tipoPago === "TRANSFERENCIA" && "Comprobante de transferencia"}
            {" "}<span className="text-destructive">*</span>
          </Label>
          <UploadPDF
            prefijo="comprobantes-pago-fletero"
            required
            label={
              draft.tipoPago === "CHEQUE_PROPIO" ? "Comprobante de emisión" :
              draft.tipoPago === "CHEQUE_TERCERO" ? "Comprobante de endoso" :
              "Comprobante de transferencia"
            }
            s3Key={"comprobanteS3Key" in draft ? draft.comprobanteS3Key : undefined}
            onUpload={(key) => onUpdate({ comprobanteS3Key: key } as Partial<PagoItem>)}
          />
        </div>
      )}

      {draftError && (
        <p className="text-xs text-destructive">{draftError}</p>
      )}

      <div className="flex gap-2 justify-end pt-1">
        <button
          onClick={onCancel}
          className="h-7 px-3 rounded border text-xs font-medium hover:bg-accent"
        >
          Cancelar
        </button>
        <button
          onClick={onConfirm}
          className="h-7 px-3 rounded bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90"
        >
          Agregar ✓
        </button>
      </div>
    </div>
  )
}

// ─── Preview de Orden de Pago ─────────────────────────────────────────────────

type GastoDescontadoPreview = {
  razonSocial: string
  comprobante: string
  monto: number
}

function PreviewOrdenPago({
  nro,
  fecha,
  fletero,
  liquidaciones,
  pagos,
  gastosDescontados,
  totalMedios,
  totalGastosDescontados,
  cuentasBancarias,
  chequesEnCartera,
  loading,
  onVolver,
  onConfirmar,
}: {
  nro: number | null
  fecha: string
  fletero: { id: string; razonSocial: string; cuit: string }
  liquidaciones: LiqItem[]
  pagos: PagoItem[]
  gastosDescontados: GastoDescontadoPreview[]
  totalMedios: number
  totalGastosDescontados: number
  cuentasBancarias: CuentaBancaria[]
  chequesEnCartera: ChequeEnCartera[]
  loading: boolean
  onVolver: () => void
  onConfirmar: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 md:p-4">
      <div
        className="bg-background rounded-lg shadow-xl w-full max-w-2xl flex flex-col overflow-hidden"
        style={{ height: "min(92vh, 680px)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0">
          <div>
            <h2 className="text-base font-semibold">
              Preview — Orden de Pago{nro != null ? ` Nro ${nro.toLocaleString("es-AR")}` : ""}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {fletero.razonSocial} · {new Date(fecha + "T00:00:00").toLocaleDateString("es-AR")}
              {liquidaciones.length === 1
                ? ` · LP ${nroLP(liquidaciones[0].ptoVenta, liquidaciones[0].nroComprobante)}`
                : ` · ${liquidaciones.length} LPs`}
            </p>
          </div>
          <button onClick={onVolver} className="text-muted-foreground hover:text-foreground text-xl leading-none">
            &times;
          </button>
        </div>

        {/* Documento — scroll interno */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* Datos del fletero */}
          <div className="rounded border p-3 text-sm space-y-0.5">
            <p className="font-semibold">{fletero.razonSocial}</p>
            <p className="text-xs text-muted-foreground">CUIT: {fletero.cuit}</p>
          </div>

          {/* Facturas aplicadas */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
              Facturas Aplicadas
            </p>
            <div className="rounded border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-3 py-1.5 text-left text-xs font-medium">LP</th>
                    <th className="px-3 py-1.5 text-right text-xs font-medium">Saldo a pagar</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {liquidaciones.map((liq) => (
                    <tr key={liq.id}>
                      <td className="px-3 py-2 text-xs font-mono">
                        LP {nroLP(liq.ptoVenta, liq.nroComprobante)}
                        {liq.saldoPendiente < liq.total && (
                          <span className="ml-1 text-amber-600 font-sans">(parcial)</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right text-xs font-mono">
                        {ars(liq.saldoPendiente)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Medios de pago */}
          {pagos.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
                Medios de pago
              </p>
              <div className="rounded border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-3 py-1.5 text-left text-xs font-medium">Tipo</th>
                      <th className="px-3 py-1.5 text-left text-xs font-medium">Detalle</th>
                      <th className="px-3 py-1.5 text-right text-xs font-medium">Monto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {pagos.map((p, i) => (
                      <tr key={i}>
                        <td className="px-3 py-2 text-xs">{tipoBadge(p)}</td>
                        <td className="px-3 py-2 text-xs text-muted-foreground">
                          {resumenItem(p, cuentasBancarias, chequesEnCartera)}
                        </td>
                        <td className="px-3 py-2 text-right text-xs font-mono">
                          {ars(parsearImporte(p.monto))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Gastos descontados */}
          {gastosDescontados.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
                Gastos descontados
              </p>
              <div className="rounded border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-3 py-1.5 text-left text-xs font-medium">Proveedor</th>
                      <th className="px-3 py-1.5 text-left text-xs font-medium">Comprobante</th>
                      <th className="px-3 py-1.5 text-right text-xs font-medium">Monto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {gastosDescontados.map((g, i) => (
                      <tr key={i}>
                        <td className="px-3 py-2 text-xs">{g.razonSocial}</td>
                        <td className="px-3 py-2 text-xs text-muted-foreground">{g.comprobante}</td>
                        <td className="px-3 py-2 text-right text-xs font-mono text-orange-600">
                          - {ars(g.monto)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Totales */}
          <div className="rounded border p-3 space-y-1 text-sm">
            {pagos.length > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total medios de pago</span>
                <span className="font-mono">{ars(totalMedios)}</span>
              </div>
            )}
            {gastosDescontados.length > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total gastos descontados</span>
                <span className="font-mono text-orange-600">{ars(totalGastosDescontados)}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold border-t pt-1 mt-1">
              <span>Total Orden de Pago</span>
              <span className="font-mono">{ars(totalMedios + totalGastosDescontados)}</span>
            </div>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Revisá los datos antes de confirmar. Una vez confirmado no se puede deshacer sin anulación.
          </p>
        </div>

        {/* Botones */}
        <div className="border-t px-6 py-4 flex gap-3 flex-shrink-0">
          <button
            onClick={onVolver}
            disabled={loading}
            className="flex-1 h-9 rounded-md border text-sm font-medium hover:bg-accent disabled:opacity-50"
          >
            &larr; Volver
          </button>
          <button
            onClick={onConfirmar}
            disabled={loading}
            className="flex-1 h-9 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? "Registrando..." : "Confirmar y guardar ✓"}
          </button>
        </div>
      </div>
    </div>
  )
}
