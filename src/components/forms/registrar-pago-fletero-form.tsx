"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select } from "@/components/ui/select"
import { formatearMoneda, formatearFecha } from "@/lib/utils"

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
  facturaProveedor: {
    id: string
    tipoCbte: string
    nroComprobante: string | null
    fechaCbte: string
    proveedor: { razonSocial: string }
  }
}

type Props = {
  liquidacion: {
    id: string
    nroComprobante: number | null
    ptoVenta: number | null
    total: number
    pagosExistentes: number
    fletero: { id: string; razonSocial: string; cuit: string }
  }
  cuentasBancarias: CuentaBancaria[]
  chequesEnCartera: ChequeEnCartera[]
  saldoAFavorCC: number
  gastosPendientes?: GastoPendiente[]
  onSuccess: () => void
  onClose: () => void
}

type PagoItemTransferencia = {
  tipoPago: "TRANSFERENCIA"
  monto: string
  cuentaBancariaId: string
  referencia: string
}
type PagoItemChequePropio = {
  tipoPago: "CHEQUE_PROPIO"
  monto: string
  cuentaId: string
  nroCheque: string
  tipoDocBeneficiario: string
  nroDocBeneficiario: string
  mailBeneficiario: string
  fechaEmision: string
  fechaPago: string
  clausula: string
  descripcion1: string
  descripcion2: string
}
type PagoItemChequeTercero = {
  tipoPago: "CHEQUE_TERCERO"
  monto: string
  chequeRecibidoId: string
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

const ars = (n: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(n)

function defaultPago(): PagoItem {
  return { tipoPago: "TRANSFERENCIA", monto: "", cuentaBancariaId: "", referencia: "" }
}

export function RegistrarPagoFleteroModal({
  liquidacion,
  cuentasBancarias,
  chequesEnCartera,
  saldoAFavorCC,
  gastosPendientes = [],
  onSuccess,
  onClose,
}: Props) {
  const [pagos, setPagos] = useState<PagoItem[]>([defaultPago()])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // mapa gastoId → monto a descontar (string para el input)
  const [gastosDescontar, setGastosDescontar] = useState<Record<string, string>>({})

  const saldoPendiente = liquidacion.total - liquidacion.pagosExistentes
  const totalActual = pagos.reduce((sum, p) => sum + (parseFloat(p.monto) || 0), 0)
  const despuesPago = saldoPendiente - totalActual
  const excedente = Math.max(0, totalActual - saldoPendiente)

  function updatePago(index: number, updates: Partial<PagoItem>) {
    setPagos((prev) =>
      prev.map((p, i) => (i === index ? ({ ...p, ...updates } as PagoItem) : p))
    )
  }

  function changeTipo(index: number, tipo: PagoItem["tipoPago"]) {
    const monto = pagos[index].monto
    let next: PagoItem
    if (tipo === "TRANSFERENCIA") {
      next = { tipoPago: "TRANSFERENCIA", monto, cuentaBancariaId: "", referencia: "" }
    } else if (tipo === "CHEQUE_PROPIO") {
      const today = new Date().toISOString().slice(0, 10)
      next = {
        tipoPago: "CHEQUE_PROPIO",
        monto,
        cuentaId: "",
        nroCheque: "",
        tipoDocBeneficiario: "CUIT",
        nroDocBeneficiario: liquidacion.fletero.cuit,
        mailBeneficiario: "",
        fechaEmision: today,
        fechaPago: "",
        clausula: "NO_A_LA_ORDEN",
        descripcion1: "",
        descripcion2: "",
      }
    } else if (tipo === "CHEQUE_TERCERO") {
      next = { tipoPago: "CHEQUE_TERCERO", monto, chequeRecibidoId: "" }
    } else if (tipo === "EFECTIVO") {
      next = { tipoPago: "EFECTIVO", monto }
    } else {
      next = { tipoPago: "SALDO_A_FAVOR", monto }
    }
    setPagos((prev) => prev.map((p, i) => (i === index ? next : p)))
  }

  function removePago(index: number) {
    setPagos((prev) => prev.filter((_, i) => i !== index))
  }

  function addPago() {
    setPagos((prev) => [...prev, defaultPago()])
  }

  function getStatusMessage() {
    if (totalActual === 0) return null
    if (excedente > 0) {
      return `Excedente de ${ars(excedente)} irá como saldo a favor`
    }
    if (totalActual >= saldoPendiente) {
      return "La liquidación pasará a PAGADA"
    }
    return "La liquidación pasará a PARCIALMENTE PAGADA"
  }

  async function handleSubmit() {
    setError(null)
    setLoading(true)
    try {
      const today = new Date().toISOString().split("T")[0]
      const gastosPayload = Object.entries(gastosDescontar)
        .map(([gastoId, montoStr]) => ({ gastoId, montoDescontar: parseFloat(montoStr) }))
        .filter((g) => !isNaN(g.montoDescontar) && g.montoDescontar > 0)

      const body = {
        pagos: pagos.map((p) => {
          const monto = parseFloat(p.monto)
          if (p.tipoPago === "TRANSFERENCIA") {
            return { tipoPago: p.tipoPago, monto, cuentaBancariaId: p.cuentaBancariaId, referencia: p.referencia || undefined }
          } else if (p.tipoPago === "CHEQUE_PROPIO") {
            return {
              tipoPago: p.tipoPago,
              monto,
              chequePropio: {
                cuentaId: p.cuentaId,
                nroCheque: p.nroCheque || null,
                tipoDocBeneficiario: p.tipoDocBeneficiario,
                nroDocBeneficiario: p.nroDocBeneficiario,
                mailBeneficiario: p.mailBeneficiario || null,
                fechaEmision: p.fechaEmision,
                fechaPago: p.fechaPago,
                clausula: p.clausula || "NO_A_LA_ORDEN",
                descripcion1: p.descripcion1 || null,
                descripcion2: p.descripcion2 || null,
              },
            }
          } else if (p.tipoPago === "CHEQUE_TERCERO") {
            return { tipoPago: p.tipoPago, monto, chequeRecibidoId: p.chequeRecibidoId }
          } else if (p.tipoPago === "EFECTIVO") {
            return { tipoPago: p.tipoPago, monto }
          } else {
            return { tipoPago: p.tipoPago, monto }
          }
        }),
        fecha: today,
        gastos: gastosPayload.length > 0 ? gastosPayload : undefined,
      }
      const res = await fetch(`/api/liquidaciones/${liquidacion.id}/pago`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Error al registrar pago")
        return
      }
      onSuccess()
    } catch {
      setError("Error de red al registrar pago")
    } finally {
      setLoading(false)
    }
  }

  const nroLabel = liquidacion.ptoVenta != null && liquidacion.nroComprobante != null
    ? `${liquidacion.ptoVenta.toString().padStart(4, "0")}-${liquidacion.nroComprobante.toString().padStart(8, "0")}`
    : "(sin número)"

  const statusMsg = getStatusMessage()

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Registrar pago — Liquidación {nroLabel}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">{liquidacion.fletero.razonSocial}</p>
          <div className="flex gap-4 text-sm mt-1">
            <span>Total: {ars(liquidacion.total)}</span>
            <span>Pagado: {ars(liquidacion.pagosExistentes)}</span>
            <span className="font-medium">Pendiente: {ars(saldoPendiente)}</span>
          </div>
          {saldoAFavorCC > 0 && (
            <p className="text-sm text-green-600">
              Saldo a favor disponible: {ars(saldoAFavorCC)}
            </p>
          )}
        </DialogHeader>

        <div className="space-y-4 py-2">
          {pagos.map((pago, i) => (
            <div key={i} className="border rounded-md p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Pago {i + 1}</span>
                {pagos.length > 1 && (
                  <Button variant="ghost" size="sm" onClick={() => removePago(i)}>
                    Eliminar
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Tipo de pago</Label>
                  <Select
                    value={pago.tipoPago}
                    onChange={(e) => changeTipo(i, e.target.value as PagoItem["tipoPago"])}
                  >
                    <option value="TRANSFERENCIA">Transferencia</option>
                    <option value="CHEQUE_PROPIO">Cheque propio</option>
                    <option value="CHEQUE_TERCERO" disabled={chequesEnCartera.length === 0}>
                      {chequesEnCartera.length === 0 ? "Cheque de tercero (sin cheques)" : "Cheque de tercero"}
                    </option>
                    <option value="EFECTIVO">Efectivo</option>
                    <option value="SALDO_A_FAVOR" disabled={saldoAFavorCC <= 0}>
                      Saldo a favor {saldoAFavorCC > 0 ? `(${ars(saldoAFavorCC)})` : "(sin saldo)"}
                    </option>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label>Monto</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={pago.monto}
                    onChange={(e) => updatePago(i, { monto: e.target.value } as Partial<PagoItem>)}
                    placeholder="0.00"
                  />
                </div>
              </div>

              {pago.tipoPago === "TRANSFERENCIA" && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Cuenta bancaria</Label>
                    <Select
                      value={pago.cuentaBancariaId}
                      onChange={(e) => updatePago(i, { cuentaBancariaId: e.target.value } as Partial<PagoItem>)}
                    >
                      <option value="">Seleccionar cuenta...</option>
                      {cuentasBancarias.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nombre} — {c.bancoOEntidad}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Referencia (opcional)</Label>
                    <Input
                      value={pago.referencia}
                      onChange={(e) => updatePago(i, { referencia: e.target.value } as Partial<PagoItem>)}
                    />
                  </div>
                </div>
              )}

              {pago.tipoPago === "CHEQUE_PROPIO" && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>Cuenta (chequera)</Label>
                      <Select
                        value={pago.cuentaId}
                        onChange={(e) => updatePago(i, { cuentaId: e.target.value } as Partial<PagoItem>)}
                      >
                        <option value="">Seleccionar cuenta...</option>
                        {cuentasBancarias.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.nombre} — {c.bancoOEntidad}
                          </option>
                        ))}
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label>Nro cheque (opcional)</Label>
                      <Input
                        value={pago.nroCheque}
                        onChange={(e) => updatePago(i, { nroCheque: e.target.value } as Partial<PagoItem>)}
                        placeholder="Asignado al emitir"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>Fecha emisión</Label>
                      <Input
                        type="date"
                        value={pago.fechaEmision}
                        onChange={(e) => updatePago(i, { fechaEmision: e.target.value } as Partial<PagoItem>)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Fecha de pago</Label>
                      <Input
                        type="date"
                        value={pago.fechaPago}
                        onChange={(e) => updatePago(i, { fechaPago: e.target.value } as Partial<PagoItem>)}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>Tipo doc beneficiario</Label>
                      <Select
                        value={pago.tipoDocBeneficiario}
                        onChange={(e) => updatePago(i, { tipoDocBeneficiario: e.target.value } as Partial<PagoItem>)}
                      >
                        <option value="CUIT">CUIT</option>
                        <option value="CUIL">CUIL</option>
                        <option value="CDI">CDI</option>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label>Nro doc beneficiario</Label>
                      <Input
                        value={pago.nroDocBeneficiario}
                        onChange={(e) => updatePago(i, { nroDocBeneficiario: e.target.value } as Partial<PagoItem>)}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>Cláusula</Label>
                      <Select
                        value={pago.clausula}
                        onChange={(e) => updatePago(i, { clausula: e.target.value } as Partial<PagoItem>)}
                      >
                        <option value="NO_A_LA_ORDEN">No a la orden</option>
                        <option value="AL_DIA">Al día</option>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label>Mail beneficiario (opcional)</Label>
                      <Input
                        type="email"
                        value={pago.mailBeneficiario}
                        onChange={(e) => updatePago(i, { mailBeneficiario: e.target.value } as Partial<PagoItem>)}
                        placeholder="email@ejemplo.com"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>Descripción 1 (opcional)</Label>
                      <Input
                        value={pago.descripcion1}
                        onChange={(e) => updatePago(i, { descripcion1: e.target.value } as Partial<PagoItem>)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Descripción 2 (opcional)</Label>
                      <Input
                        value={pago.descripcion2}
                        onChange={(e) => updatePago(i, { descripcion2: e.target.value } as Partial<PagoItem>)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {pago.tipoPago === "CHEQUE_TERCERO" && (
                <div className="space-y-1">
                  <Label>Cheque en cartera</Label>
                  <Select
                    value={pago.chequeRecibidoId}
                    onChange={(e) => {
                      const cheque = chequesEnCartera.find((c) => c.id === e.target.value)
                      updatePago(i, {
                        chequeRecibidoId: e.target.value,
                        monto: cheque ? String(cheque.monto) : pago.monto,
                      } as Partial<PagoItem>)
                    }}
                  >
                    <option value="">Seleccionar cheque...</option>
                    {chequesEnCartera.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nroCheque} — {c.bancoEmisor} — {ars(c.monto)} — vence {c.fechaCobro}
                      </option>
                    ))}
                  </Select>
                </div>
              )}
            </div>
          ))}

          <Button variant="outline" onClick={addPago} className="w-full">
            + Agregar medio de pago
          </Button>

          {gastosPendientes.length > 0 && (
            <div className="border rounded-md p-3 space-y-2">
              <p className="text-sm font-medium text-blue-800">Gastos por cuenta del fletero a descontar</p>
              <p className="text-xs text-muted-foreground">Ingresá el monto a descontar de cada gasto en este pago (opcional).</p>
              {gastosPendientes.map((g) => {
                const saldoGasto = g.montoPagado - g.montoDescontado
                return (
                  <div key={g.id} className="grid grid-cols-[1fr_auto] gap-3 items-center border-t pt-2">
                    <div>
                      <p className="text-xs font-medium">
                        {g.tipo} — {g.facturaProveedor.proveedor.razonSocial}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {g.facturaProveedor.tipoCbte} {g.facturaProveedor.nroComprobante ?? "s/n"} · {formatearFecha(g.facturaProveedor.fechaCbte)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Saldo: {formatearMoneda(saldoGasto)}
                        {g.montoDescontado > 0 && ` (pagado: ${formatearMoneda(g.montoPagado)}, ya descontado: ${formatearMoneda(g.montoDescontado)})`}
                      </p>
                    </div>
                    <div className="w-32">
                      <Input
                        type="number"
                        min="0"
                        max={saldoGasto}
                        step="0.01"
                        placeholder="0.00"
                        value={gastosDescontar[g.id] ?? ""}
                        onChange={(e) => setGastosDescontar((prev) => ({ ...prev, [g.id]: e.target.value }))}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          <div className="border rounded-md p-3 space-y-1 bg-muted/30">
            <div className="flex justify-between text-sm">
              <span>Total a pagar</span>
              <span className="font-medium">{ars(totalActual)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Pendiente después del pago</span>
              <span className={despuesPago < 0 ? "text-green-600 font-medium" : "font-medium"}>
                {ars(Math.max(0, despuesPago))}
              </span>
            </div>
            {statusMsg && (
              <p className="text-sm font-medium text-blue-600 pt-1">{statusMsg}</p>
            )}
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading || totalActual <= 0}>
            {loading ? "Registrando..." : "Confirmar pago"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
