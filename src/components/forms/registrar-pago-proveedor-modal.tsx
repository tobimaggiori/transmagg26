"use client"

/**
 * Modal de dos paneles para registrar el pago de varias facturas a un proveedor.
 * Panel izquierdo: facturas seleccionadas, totales y botones.
 * Panel derecho: tabla de medios de pago + formulario inline de alta.
 *
 * No genera orden de pago ni PDF — solo persiste los PagoProveedor y los
 * instrumentos financieros asociados (cheques, movimientos de cuenta).
 */

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { UploadPDF } from "@/components/upload-pdf"
import { formatearFecha } from "@/lib/utils"
import { sumarImportes, restarImportes, parsearImporte, importesIguales, formatearMoneda } from "@/lib/money"
import { hoyLocalYmd } from "@/lib/date-local"

type FacturaItem = {
  id: string
  tipoCbte: string
  nroComprobante: string
  fechaCbte: string
  total: number
  totalPagado: number
  saldoPendiente: number
}

type Cuenta = { id: string; nombre: string; tipo?: string }
type ChequeEnCartera = {
  id: string
  nroCheque: string
  bancoEmisor: string
  monto: number
  fechaCobro: string
  esElectronico: boolean
  empresa: { razonSocial: string } | null
}

type Props = {
  facturas: FacturaItem[]
  proveedor: { id: string; razonSocial: string; cuit: string }
  cuentas: Cuenta[]
  cuentasChequera: Cuenta[]
  chequesEnCartera: ChequeEnCartera[]
  onSuccess: () => void
  onClose: () => void
}

type TipoMedio =
  | "TRANSFERENCIA"
  | "CHEQUE_PROPIO"
  | "CHEQUE_FISICO_TERCERO"
  | "CHEQUE_ELECTRONICO_TERCERO"
  | "TARJETA"
  | "EFECTIVO"

type DraftTransferencia = {
  tipo: "TRANSFERENCIA"
  monto: string
  cuentaId: string
  comprobantePdfS3Key: string
}
type DraftChequePropio = {
  tipo: "CHEQUE_PROPIO"
  monto: string
  cuentaId: string
  nroCheque: string
  fechaEmision: string
  fechaPago: string
  comprobantePdfS3Key: string
}
type DraftChequeTercero = {
  tipo: "CHEQUE_FISICO_TERCERO" | "CHEQUE_ELECTRONICO_TERCERO"
  monto: string
  chequeRecibidoId: string
  comprobantePdfS3Key: string
}
type DraftTarjeta = { tipo: "TARJETA"; monto: string; comprobantePdfS3Key: string }
type DraftEfectivo = { tipo: "EFECTIVO"; monto: string; comprobantePdfS3Key: string }

type Draft = DraftTransferencia | DraftChequePropio | DraftChequeTercero | DraftTarjeta | DraftEfectivo

const ars = formatearMoneda

function defaultDraft(tipo: TipoMedio): Draft {
  const today = hoyLocalYmd()
  if (tipo === "TRANSFERENCIA") return { tipo, monto: "", cuentaId: "", comprobantePdfS3Key: "" }
  if (tipo === "CHEQUE_PROPIO") return {
    tipo, monto: "", cuentaId: "", nroCheque: "",
    fechaEmision: today, fechaPago: "",
    comprobantePdfS3Key: "",
  }
  if (tipo === "CHEQUE_FISICO_TERCERO" || tipo === "CHEQUE_ELECTRONICO_TERCERO") {
    return { tipo, monto: "", chequeRecibidoId: "", comprobantePdfS3Key: "" }
  }
  if (tipo === "TARJETA") return { tipo, monto: "", comprobantePdfS3Key: "" }
  return { tipo: "EFECTIVO", monto: "", comprobantePdfS3Key: "" }
}

function tipoBadge(t: TipoMedio): string {
  return {
    TRANSFERENCIA: "Transferencia",
    CHEQUE_PROPIO: "Cheque propio",
    CHEQUE_FISICO_TERCERO: "Cheque físico",
    CHEQUE_ELECTRONICO_TERCERO: "ECheq tercero",
    TARJETA: "Tarjeta",
    EFECTIVO: "Efectivo",
  }[t]
}

function detalleMedio(m: Draft, cuentas: Cuenta[], cuentasChequera: Cuenta[], cheques: ChequeEnCartera[]): string {
  if (m.tipo === "TRANSFERENCIA") {
    const c = cuentas.find((x) => x.id === m.cuentaId)
    return c ? c.nombre : "—"
  }
  if (m.tipo === "CHEQUE_PROPIO") {
    const c = cuentasChequera.find((x) => x.id === m.cuentaId)
    const vto = m.fechaPago ? formatearFecha(new Date(m.fechaPago + "T12:00:00")) : "s/vto"
    return `${c?.nombre ?? "—"} · Nº ${m.nroCheque || "—"} · Vto ${vto}`
  }
  if (m.tipo === "CHEQUE_FISICO_TERCERO" || m.tipo === "CHEQUE_ELECTRONICO_TERCERO") {
    const ch = cheques.find((c) => c.id === m.chequeRecibidoId)
    return ch ? `${ch.bancoEmisor} · Nº ${ch.nroCheque}` : "—"
  }
  return "—"
}

export function RegistrarPagoProveedorModal({
  facturas,
  proveedor,
  cuentas,
  cuentasChequera,
  chequesEnCartera,
  onSuccess,
  onClose,
}: Props) {
  const [medios, setMedios] = useState<Draft[]>([])
  const [draft, setDraft] = useState<Draft | null>(null)
  const [draftError, setDraftError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fechaPago, setFechaPago] = useState(hoyLocalYmd())

  const saldoTotal = sumarImportes(facturas.map((f) => f.saldoPendiente))
  const totalMedios = sumarImportes(medios.map((m) => parsearImporte(m.monto)))
  const diferencia = restarImportes(totalMedios, saldoTotal)

  function iniciarDraft(tipo: TipoMedio) {
    setDraft(defaultDraft(tipo))
    setDraftError(null)
  }

  function changeDraftTipo(tipo: TipoMedio) {
    setDraft(defaultDraft(tipo))
    setDraftError(null)
  }

  function updateDraft(updates: Partial<Draft>) {
    setDraft((prev) => prev ? ({ ...prev, ...updates } as Draft) : prev)
  }

  function confirmarDraft() {
    if (!draft) return
    const monto = parsearImporte(draft.monto)
    if (!monto || monto <= 0) { setDraftError("Ingresá un monto válido"); return }
    if (draft.tipo === "TRANSFERENCIA" && !draft.cuentaId) {
      setDraftError("Seleccioná la cuenta de origen"); return
    }
    if (draft.tipo === "CHEQUE_PROPIO") {
      if (!draft.cuentaId) { setDraftError("Seleccioná la chequera"); return }
      if (!draft.nroCheque.trim()) { setDraftError("El número de cheque es obligatorio"); return }
      if (!draft.fechaPago) { setDraftError("Ingresá la fecha de pago del cheque"); return }
    }
    if ((draft.tipo === "CHEQUE_FISICO_TERCERO" || draft.tipo === "CHEQUE_ELECTRONICO_TERCERO") && !draft.chequeRecibidoId) {
      setDraftError("Seleccioná el cheque a endosar"); return
    }
    const requiereComprobante = ["TRANSFERENCIA", "CHEQUE_PROPIO", "CHEQUE_FISICO_TERCERO", "CHEQUE_ELECTRONICO_TERCERO"].includes(draft.tipo)
    if (requiereComprobante && !draft.comprobantePdfS3Key) {
      setDraftError("Subí el comprobante PDF antes de agregar"); return
    }
    setMedios((prev) => [...prev, draft])
    setDraft(null)
    setDraftError(null)
  }

  function cancelarDraft() {
    setDraft(null)
    setDraftError(null)
  }

  function removerMedio(i: number) {
    setMedios((prev) => prev.filter((_, idx) => idx !== i))
  }

  async function handleSubmit() {
    setError(null)
    if (medios.length === 0) { setError("Agregá al menos un medio de pago"); return }
    if (!importesIguales(totalMedios, saldoTotal)) {
      setError(`El total debe igualar al saldo (${ars(saldoTotal)}). Diferencia: ${ars(diferencia)}`)
      return
    }
    setLoading(true)
    try {
      const body = {
        proveedorId: proveedor.id,
        facturaIds: facturas.map((f) => f.id),
        fecha: new Date(fechaPago + "T12:00:00Z").toISOString(),
        medios: medios.map((m) => {
          const monto = parsearImporte(m.monto)
          if (m.tipo === "TRANSFERENCIA") {
            return { tipo: m.tipo, monto, cuentaId: m.cuentaId, comprobantePdfS3Key: m.comprobantePdfS3Key || null }
          }
          if (m.tipo === "CHEQUE_PROPIO") {
            return {
              tipo: m.tipo,
              monto,
              comprobantePdfS3Key: m.comprobantePdfS3Key || null,
              chequePropio: {
                cuentaId: m.cuentaId,
                nroCheque: m.nroCheque,
                tipoDocBeneficiario: "CUIT",
                nroDocBeneficiario: proveedor.cuit.replace(/\D/g, ""),
                mailBeneficiario: null,
                fechaEmision: m.fechaEmision,
                fechaPago: m.fechaPago,
                clausula: "NO_A_LA_ORDEN",
                descripcion1: null,
                descripcion2: null,
              },
            }
          }
          if (m.tipo === "CHEQUE_FISICO_TERCERO" || m.tipo === "CHEQUE_ELECTRONICO_TERCERO") {
            return { tipo: m.tipo, monto, chequeRecibidoId: m.chequeRecibidoId, comprobantePdfS3Key: m.comprobantePdfS3Key || null }
          }
          return { tipo: m.tipo, monto, comprobantePdfS3Key: m.comprobantePdfS3Key || null }
        }),
      }
      const res = await fetch("/api/proveedores/pagos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? "Error al registrar el pago"); return }
      onSuccess()
    } catch {
      setError("Error de red al registrar el pago")
    } finally {
      setLoading(false)
    }
  }

  const puedeRegistrar = !loading && medios.length > 0 && !draft && Math.abs(diferencia) < 0.01

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 md:p-4">
      <div
        className="bg-background rounded-lg shadow-xl w-full max-w-5xl flex flex-col md:flex-row overflow-hidden"
        style={{ height: "min(92vh, 720px)" }}
      >
        {/* Panel izquierdo */}
        <div className="md:w-[340px] flex-shrink-0 border-b md:border-b-0 md:border-r flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            <div>
              <h2 className="text-base font-semibold">Registrar pago</h2>
              <p className="text-xs text-muted-foreground">{proveedor.razonSocial}</p>
            </div>

            <div>
              <Label className="text-xs">Fecha de pago</Label>
              <Input
                type="date"
                value={fechaPago}
                onChange={(e) => setFechaPago(e.target.value)}
                className="h-8 text-xs mt-0.5"
              />
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                Facturas a pagar ({facturas.length})
              </p>
              <div className="space-y-1">
                {facturas.map((f) => {
                  const parcial = f.totalPagado > 0
                  return (
                    <div key={f.id} className="flex justify-between items-center text-xs py-1 border-b last:border-0 gap-2">
                      <span className="font-mono text-muted-foreground truncate">
                        {f.tipoCbte} {f.nroComprobante}
                        {parcial && <span className="ml-1 text-amber-600">(parcial)</span>}
                      </span>
                      <span className="font-semibold whitespace-nowrap">{ars(f.saldoPendiente)}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="rounded-md border p-3 space-y-1 text-sm">
              <div className="flex justify-between font-semibold">
                <span>Saldo a cubrir</span>
                <span>{ars(saldoTotal)}</span>
              </div>
            </div>
          </div>

          <div className="border-t p-4 space-y-2 flex-shrink-0">
            {error && <p className="text-xs text-destructive">{error}</p>}
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose} disabled={loading} className="flex-1">
                Cancelar
              </Button>
              <Button onClick={handleSubmit} disabled={!puedeRegistrar} className="flex-1">
                {loading ? "Registrando..." : "Registrar pago"}
              </Button>
            </div>
          </div>
        </div>

        {/* Panel derecho */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-5 pb-2 flex-shrink-0">
            <p className="text-sm font-semibold">Medios de pago</p>
          </div>

          <div className="flex-1 overflow-y-auto px-5">
            {medios.length === 0 && !draft ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Sin medios de pago.
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
                  {medios.map((m, i) => (
                    <tr key={i} className="hover:bg-muted/20">
                      <td className="px-2 py-1.5 text-xs font-medium">{tipoBadge(m.tipo)}</td>
                      <td className="px-2 py-1.5 text-xs text-muted-foreground truncate max-w-[260px]">
                        {detalleMedio(m, cuentas, cuentasChequera, chequesEnCartera)}
                      </td>
                      <td className="px-2 py-1.5 text-xs text-right font-mono">{ars(parsearImporte(m.monto))}</td>
                      <td className="px-1 py-1.5 text-xs text-center">
                        <button
                          type="button"
                          onClick={() => removerMedio(i)}
                          className="text-destructive hover:opacity-70"
                          aria-label="Eliminar"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {draft && (
              <DraftForm
                draft={draft}
                draftError={draftError}
                cuentas={cuentas}
                cuentasChequera={cuentasChequera}
                chequesEnCartera={chequesEnCartera}
                onChangeTipo={changeDraftTipo}
                onUpdate={updateDraft}
                onConfirm={confirmarDraft}
                onCancel={cancelarDraft}
              />
            )}
          </div>

          <div className="flex-shrink-0 px-5 pb-5 pt-2 space-y-2 border-t mt-2">
            {!draft && (
              <div className="flex gap-2 flex-wrap">
                <span className="text-xs text-muted-foreground self-center">Agregar:</span>
                {(["TRANSFERENCIA", "CHEQUE_PROPIO", "CHEQUE_FISICO_TERCERO", "CHEQUE_ELECTRONICO_TERCERO", "TARJETA", "EFECTIVO"] as const).map((tipo) => {
                  const sinFisicos = tipo === "CHEQUE_FISICO_TERCERO" && chequesEnCartera.every((c) => c.esElectronico)
                  const sinElectronicos = tipo === "CHEQUE_ELECTRONICO_TERCERO" && chequesEnCartera.every((c) => !c.esElectronico)
                  const disabled = sinFisicos || sinElectronicos
                  return (
                    <button
                      key={tipo}
                      onClick={() => iniciarDraft(tipo)}
                      disabled={disabled}
                      className="h-6 px-2 rounded border text-xs font-medium hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {tipoBadge(tipo)}
                    </button>
                  )
                })}
              </div>
            )}

            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total medios</span>
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

function DraftForm({
  draft,
  draftError,
  cuentas,
  cuentasChequera,
  chequesEnCartera,
  onChangeTipo,
  onUpdate,
  onConfirm,
  onCancel,
}: {
  draft: Draft
  draftError: string | null
  cuentas: Cuenta[]
  cuentasChequera: Cuenta[]
  chequesEnCartera: ChequeEnCartera[]
  onChangeTipo: (tipo: TipoMedio) => void
  onUpdate: (updates: Partial<Draft>) => void
  onConfirm: () => void
  onCancel: () => void
}) {
  const requiereComprobante = ["TRANSFERENCIA", "CHEQUE_PROPIO", "CHEQUE_FISICO_TERCERO", "CHEQUE_ELECTRONICO_TERCERO"].includes(draft.tipo)
  const chequesFiltrados = chequesEnCartera.filter((c) => {
    if (draft.tipo === "CHEQUE_FISICO_TERCERO") return !c.esElectronico
    if (draft.tipo === "CHEQUE_ELECTRONICO_TERCERO") return c.esElectronico
    return false
  })

  return (
    <div className="border rounded-md p-3 mt-3 bg-muted/20 space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <Select
          value={draft.tipo}
          onChange={(e) => onChangeTipo(e.target.value as TipoMedio)}
          className="h-8 text-xs"
        >
          <option value="TRANSFERENCIA">Transferencia</option>
          <option value="CHEQUE_PROPIO">Cheque propio</option>
          <option value="CHEQUE_FISICO_TERCERO">Cheque físico tercero</option>
          <option value="CHEQUE_ELECTRONICO_TERCERO">ECheq tercero</option>
          <option value="TARJETA">Tarjeta</option>
          <option value="EFECTIVO">Efectivo</option>
        </Select>

        {draft.tipo !== "CHEQUE_FISICO_TERCERO" && draft.tipo !== "CHEQUE_ELECTRONICO_TERCERO" && (
          <div className="flex items-center gap-1">
            <Label className="text-xs shrink-0">Monto</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={draft.monto}
              onChange={(e) => onUpdate({ monto: e.target.value } as Partial<Draft>)}
              placeholder="0,00"
              className="w-32 h-8 text-xs"
            />
          </div>
        )}
      </div>

      {draft.tipo === "TRANSFERENCIA" && (
        <div>
          <Label className="text-xs">Cuenta de origen</Label>
          <Select
            value={draft.cuentaId}
            onChange={(e) => onUpdate({ cuentaId: e.target.value } as Partial<Draft>)}
            className="h-8 text-xs mt-0.5"
          >
            <option value="">Seleccionar...</option>
            {cuentas.map((c) => <option key={c.id} value={c.id}>{c.nombre}{c.tipo ? ` (${c.tipo})` : ""}</option>)}
          </Select>
        </div>
      )}

      {draft.tipo === "CHEQUE_PROPIO" && (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Nº cheque *</Label>
              <Input
                value={draft.nroCheque}
                onChange={(e) => onUpdate({ nroCheque: e.target.value } as Partial<Draft>)}
                className="h-8 text-xs mt-0.5"
              />
            </div>
            <div>
              <Label className="text-xs">Chequera</Label>
              <Select
                value={draft.cuentaId}
                onChange={(e) => onUpdate({ cuentaId: e.target.value } as Partial<Draft>)}
                className="h-8 text-xs mt-0.5"
              >
                <option value="">Seleccionar...</option>
                {cuentasChequera.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Fecha emisión</Label>
              <Input
                type="date"
                value={draft.fechaEmision}
                onChange={(e) => onUpdate({ fechaEmision: e.target.value } as Partial<Draft>)}
                className="h-8 text-xs mt-0.5"
              />
            </div>
            <div>
              <Label className="text-xs">Fecha de pago</Label>
              <Input
                type="date"
                value={draft.fechaPago}
                onChange={(e) => onUpdate({ fechaPago: e.target.value } as Partial<Draft>)}
                className="h-8 text-xs mt-0.5"
              />
            </div>
          </div>
        </div>
      )}

      {(draft.tipo === "CHEQUE_FISICO_TERCERO" || draft.tipo === "CHEQUE_ELECTRONICO_TERCERO") && (
        <div>
          <Label className="text-xs">Cheque a endosar</Label>
          <div className="mt-1 border rounded overflow-auto max-h-44">
            {chequesFiltrados.length === 0 ? (
              <p className="px-3 py-2 text-xs text-muted-foreground">Sin cheques disponibles.</p>
            ) : (
              <table className="w-full text-xs">
                <tbody>
                  {chequesFiltrados.map((c) => (
                    <tr
                      key={c.id}
                      onClick={() => onUpdate({ chequeRecibidoId: c.id, monto: String(c.monto) } as Partial<Draft>)}
                      className={`border-b cursor-pointer hover:bg-muted/50 ${draft.chequeRecibidoId === c.id ? "bg-primary/5" : ""}`}
                    >
                      <td className="px-2 py-1.5">{c.bancoEmisor} · {c.nroCheque}</td>
                      <td className="px-2 py-1.5 text-muted-foreground">{c.empresa?.razonSocial ?? "—"}</td>
                      <td className="px-2 py-1.5 text-right font-medium">{ars(c.monto)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {draft.tipo === "TARJETA" && (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800">
          El gasto quedará pendiente de asignación a una tarjeta.
        </div>
      )}

      {requiereComprobante && (
        <div>
          <Label className="text-xs">Comprobante PDF *</Label>
          <UploadPDF
            prefijo="comprobantes-pago-proveedor"
            onUpload={(key) => onUpdate({ comprobantePdfS3Key: key } as Partial<Draft>)}
            s3Key={draft.comprobantePdfS3Key || undefined}
          />
        </div>
      )}

      {draftError && <p className="text-xs text-destructive">{draftError}</p>}

      <div className="flex justify-end gap-2 pt-1">
        <Button variant="outline" size="sm" onClick={onCancel}>Cancelar</Button>
        <Button size="sm" onClick={onConfirm}>Agregar</Button>
      </div>
    </div>
  )
}
