"use client"

/**
 * Registrar pago a proveedor JM. Versión simple (sin cheques físicos/electrónicos
 * todavía — solo TRANSFERENCIA, EFECTIVO).
 */

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { SearchCombobox } from "@/components/ui/search-combobox"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FormError } from "@/components/ui/form-error"
import { hoyLocalYmd } from "@/lib/date-local"
import { formatearFecha, formatearMoneda } from "@/lib/utils"

type Proveedor = { id: string; razonSocial: string; cuit: string }
type Cuenta = { id: string; nombre: string }

type FacturaPendiente = {
  id: string
  nroComprobante: string
  ptoVenta: string | null
  tipoCbte: string
  fechaCbte: string
  total: string | number
  saldoPendiente: number
}

interface Props { proveedores: Proveedor[]; cuentas: Cuenta[] }

export function RegistrarPagoProveedorJmClient({ proveedores, cuentas }: Props) {
  const router = useRouter()
  const [proveedorId, setProveedorId] = useState("")
  const [facturas, setFacturas] = useState<FacturaPendiente[]>([])
  const [facturaId, setFacturaId] = useState("")
  const [monto, setMonto] = useState("")
  const [tipo, setTipo] = useState<"TRANSFERENCIA" | "EFECTIVO" | "CHEQUE_PROPIO" | "CHEQUE_FISICO_TERCERO" | "CHEQUE_ELECTRONICO_TERCERO" | "TARJETA">("TRANSFERENCIA")
  const [cuentaId, setCuentaId] = useState("")
  const [fecha, setFecha] = useState(hoyLocalYmd())
  const [observaciones, setObservaciones] = useState("")
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [exito, setExito] = useState<string | null>(null)

  useEffect(() => {
    if (!proveedorId) { setFacturas([]); setFacturaId(""); return }
    fetch(`/api/jm/facturas-proveedor?proveedorId=${proveedorId}&estadoPago=PENDIENTE`)
      .then(r => r.json())
      .then((data) => {
        const pendientes = (Array.isArray(data) ? data : []).filter((f: FacturaPendiente) => f.saldoPendiente > 0.01)
        setFacturas(pendientes)
      })
      .catch(() => setFacturas([]))
  }, [proveedorId])

  const factura = facturas.find((f) => f.id === facturaId)
  const montoNum = Number(monto) || 0
  const puedeGuardar = factura && montoNum > 0 && montoNum <= factura.saldoPendiente + 0.01 && (tipo !== "TRANSFERENCIA" || cuentaId)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setCargando(true); setError(null); setExito(null)
    try {
      const res = await fetch("/api/jm/pagos-proveedor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          facturaProveedorId: facturaId,
          monto: montoNum,
          fecha,
          tipo,
          cuentaId: cuentaId || undefined,
          observaciones: observaciones.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Error al registrar pago")
        return
      }
      setExito(`Pago de ${formatearMoneda(montoNum)} registrado.`)
      setMonto(""); setObservaciones("")
      // Refrescar facturas
      if (proveedorId) {
        const refreshed = await fetch(`/api/jm/facturas-proveedor?proveedorId=${proveedorId}&estadoPago=PENDIENTE`).then(r => r.json())
        setFacturas((Array.isArray(refreshed) ? refreshed : []).filter((f: FacturaPendiente) => f.saldoPendiente > 0.01))
      }
      router.refresh()
    } catch {
      setError("Error de red")
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Registrar pago a proveedor</h1>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader><CardTitle className="text-base">Datos del pago</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Proveedor</Label>
              <SearchCombobox
                items={proveedores.map((p) => ({ id: p.id, label: p.razonSocial, sublabel: p.cuit }))}
                value={proveedorId}
                onChange={setProveedorId}
                placeholder="Buscar proveedor..."
              />
            </div>

            {proveedorId && (
              <div>
                <Label>Factura a pagar</Label>
                <Select value={facturaId} onChange={(e) => {
                  setFacturaId(e.target.value)
                  const f = facturas.find((x) => x.id === e.target.value)
                  if (f) setMonto(f.saldoPendiente.toFixed(2))
                }}>
                  <option value="">— Elegir factura —</option>
                  {facturas.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.tipoCbte} {f.ptoVenta ? `${f.ptoVenta}-` : ""}{f.nroComprobante} · {formatearFecha(new Date(f.fechaCbte))} · saldo {formatearMoneda(f.saldoPendiente)}
                    </option>
                  ))}
                </Select>
                {facturas.length === 0 && <p className="text-xs text-muted-foreground mt-1">Este proveedor no tiene facturas pendientes.</p>}
              </div>
            )}

            {factura && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Monto</Label><Input type="number" step="0.01" value={monto} onChange={(e) => setMonto(e.target.value)} required /></div>
                  <div><Label>Fecha</Label><Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} required /></div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Tipo</Label>
                    <Select value={tipo} onChange={(e) => setTipo(e.target.value as typeof tipo)}>
                      <option value="TRANSFERENCIA">Transferencia</option>
                      <option value="EFECTIVO">Efectivo</option>
                      <option value="CHEQUE_PROPIO">Cheque propio</option>
                      <option value="CHEQUE_FISICO_TERCERO">Cheque físico tercero</option>
                      <option value="CHEQUE_ELECTRONICO_TERCERO">Cheque electrónico tercero</option>
                      <option value="TARJETA">Tarjeta</option>
                    </Select>
                  </div>
                  {tipo === "TRANSFERENCIA" && (
                    <div>
                      <Label>Cuenta</Label>
                      <Select value={cuentaId} onChange={(e) => setCuentaId(e.target.value)}>
                        <option value="">— Elegir —</option>
                        {cuentas.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                      </Select>
                    </div>
                  )}
                </div>

                <div>
                  <Label>Observaciones</Label>
                  <Input value={observaciones} onChange={(e) => setObservaciones(e.target.value)} />
                </div>

                <p className="text-xs text-muted-foreground">Saldo pendiente actual: {formatearMoneda(factura.saldoPendiente)}</p>
              </>
            )}

            {error && <FormError message={error} />}
            {exito && <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2">{exito}</p>}

            <div className="flex justify-end">
              <Button type="submit" disabled={!puedeGuardar || cargando}>{cargando ? "Registrando..." : "Registrar pago"}</Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
