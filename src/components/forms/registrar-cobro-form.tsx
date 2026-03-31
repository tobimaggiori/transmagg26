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

type CuentaBancaria = {
  id: string
  nombre: string
  bancoOEntidad: string
}

type Props = {
  factura: {
    id: string
    nroComprobante: string | null
    tipoCbte: string
    total: number
    pagosExistentes: number
    empresa: { id: string; razonSocial: string }
  }
  cuentasBancarias: CuentaBancaria[]
  saldoAFavorCC: number
  onSuccess: () => void
  onClose: () => void
}

type PagoItemCheque = {
  tipoPago: "CHEQUE"
  monto: string
  nroCheque: string
  bancoEmisor: string
  fechaEmision: string
  fechaCobro: string
  cuitLibrador: string
}
type PagoItemTransferencia = {
  tipoPago: "TRANSFERENCIA"
  monto: string
  cuentaBancariaId: string
  referencia: string
}
type PagoItemEfectivo = {
  tipoPago: "EFECTIVO"
  monto: string
  descripcion: string
}
type PagoItemSaldoAFavor = {
  tipoPago: "SALDO_A_FAVOR"
  monto: string
}

type PagoItem =
  | PagoItemCheque
  | PagoItemTransferencia
  | PagoItemEfectivo
  | PagoItemSaldoAFavor

const ars = (n: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(n)

function defaultPago(): PagoItem {
  return { tipoPago: "TRANSFERENCIA", monto: "", cuentaBancariaId: "", referencia: "" }
}

export function RegistrarCobroModal({
  factura,
  cuentasBancarias,
  saldoAFavorCC,
  onSuccess,
  onClose,
}: Props) {
  const hoy = new Date().toISOString().split("T")[0]
  const [fecha, setFecha] = useState(hoy)
  const [pagos, setPagos] = useState<PagoItem[]>([defaultPago()])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const saldoPendiente = factura.total - factura.pagosExistentes
  const totalActual = pagos.reduce((sum, p) => sum + (parseFloat(p.monto) || 0), 0)
  const despuesCobro = saldoPendiente - totalActual
  const excedente = Math.max(0, totalActual - saldoPendiente)

  function updatePago(index: number, updates: Partial<PagoItem>) {
    setPagos((prev) =>
      prev.map((p, i) => (i === index ? ({ ...p, ...updates } as PagoItem) : p))
    )
  }

  function changeTipo(index: number, tipo: PagoItem["tipoPago"]) {
    const monto = pagos[index].monto
    let next: PagoItem
    if (tipo === "CHEQUE") {
      next = { tipoPago: "CHEQUE", monto, nroCheque: "", bancoEmisor: "", fechaEmision: "", fechaCobro: "", cuitLibrador: "" }
    } else if (tipo === "TRANSFERENCIA") {
      next = { tipoPago: "TRANSFERENCIA", monto, cuentaBancariaId: "", referencia: "" }
    } else if (tipo === "EFECTIVO") {
      next = { tipoPago: "EFECTIVO", monto, descripcion: "" }
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
      return "La factura pasará a COBRADA"
    }
    return "La factura pasará a PARCIALMENTE COBRADA"
  }

  async function handleSubmit() {
    setError(null)
    setLoading(true)
    try {
      const body = {
        pagos: pagos.map((p) => {
          const monto = parseFloat(p.monto)
          if (p.tipoPago === "CHEQUE") {
            return { tipoPago: p.tipoPago, monto, nroCheque: p.nroCheque, bancoEmisor: p.bancoEmisor, fechaEmision: p.fechaEmision, fechaCobro: p.fechaCobro, cuitLibrador: p.cuitLibrador || undefined }
          } else if (p.tipoPago === "TRANSFERENCIA") {
            return { tipoPago: p.tipoPago, monto, cuentaBancariaId: p.cuentaBancariaId, referencia: p.referencia || undefined }
          } else if (p.tipoPago === "EFECTIVO") {
            return { tipoPago: p.tipoPago, monto, descripcion: p.descripcion || undefined }
          } else {
            return { tipoPago: p.tipoPago, monto }
          }
        }),
        fecha,
      }
      const res = await fetch(`/api/facturas/${factura.id}/cobro`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Error al registrar cobro")
        return
      }
      onSuccess()
    } catch {
      setError("Error de red al registrar cobro")
    } finally {
      setLoading(false)
    }
  }

  const statusMsg = getStatusMessage()

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Registrar cobro — Factura {factura.tipoCbte} {factura.nroComprobante ?? "(sin número)"}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">{factura.empresa.razonSocial}</p>
          <div className="flex gap-4 text-sm mt-1">
            <span>Total: {ars(factura.total)}</span>
            <span>Pagado: {ars(factura.pagosExistentes)}</span>
            <span className="font-medium">Pendiente: {ars(saldoPendiente)}</span>
          </div>
          {saldoAFavorCC > 0 && (
            <p className="text-sm text-green-600">
              Saldo a favor disponible: {ars(saldoAFavorCC)}
            </p>
          )}
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1">
            <Label>Fecha del cobro</Label>
            <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
          </div>

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
                    <option value="CHEQUE">Cheque</option>
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

              {pago.tipoPago === "CHEQUE" && (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label>Nro cheque</Label>
                      <Input
                        value={pago.nroCheque}
                        onChange={(e) => updatePago(i, { nroCheque: e.target.value } as Partial<PagoItem>)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Banco emisor</Label>
                      <Input
                        value={pago.bancoEmisor}
                        onChange={(e) => updatePago(i, { bancoEmisor: e.target.value } as Partial<PagoItem>)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>CUIT librador</Label>
                      <Input
                        value={pago.cuitLibrador}
                        onChange={(e) => updatePago(i, { cuitLibrador: e.target.value } as Partial<PagoItem>)}
                        placeholder="20-12345678-1"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>Fecha de emisión</Label>
                      <Input
                        type="date"
                        value={pago.fechaEmision}
                        onChange={(e) => updatePago(i, { fechaEmision: e.target.value } as Partial<PagoItem>)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Fecha de cobro</Label>
                      <Input
                        type="date"
                        value={pago.fechaCobro}
                        onChange={(e) => updatePago(i, { fechaCobro: e.target.value } as Partial<PagoItem>)}
                      />
                    </div>
                  </div>
                </div>
              )}

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

              {pago.tipoPago === "EFECTIVO" && (
                <div className="space-y-1">
                  <Label>Descripción (opcional)</Label>
                  <Input
                    value={pago.descripcion}
                    onChange={(e) => updatePago(i, { descripcion: e.target.value } as Partial<PagoItem>)}
                    placeholder="Ej: pago en caja, efectivo mostrador..."
                  />
                </div>
              )}
            </div>
          ))}

          <Button variant="outline" onClick={addPago} className="w-full">
            + Agregar medio de pago
          </Button>

          <div className="border rounded-md p-3 space-y-1 bg-muted/30">
            <div className="flex justify-between text-sm">
              <span>Total a registrar</span>
              <span className="font-medium">{ars(totalActual)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Pendiente después del cobro</span>
              <span className={despuesCobro < 0 ? "text-green-600 font-medium" : "font-medium"}>
                {ars(Math.max(0, despuesCobro))}
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
            {loading ? "Registrando..." : "Confirmar cobro"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
