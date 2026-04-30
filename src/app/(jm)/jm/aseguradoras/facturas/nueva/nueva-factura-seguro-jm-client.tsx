"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { SearchCombobox } from "@/components/ui/search-combobox"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FormError } from "@/components/ui/form-error"
import { hoyLocalYmd } from "@/lib/date-local"
import { formatearMoneda } from "@/lib/utils"

type Aseguradora = { id: string; razonSocial: string; cuit: string }
type Cuenta = { id: string; nombre: string }
type Tarjeta = { id: string; nombre: string }

interface Props {
  aseguradoras: Aseguradora[]
  cuentas: Cuenta[]
  tarjetas: Tarjeta[]
}

export function NuevaFacturaSeguroJmClient({ aseguradoras, cuentas, tarjetas }: Props) {
  const router = useRouter()
  const [aseguradoraId, setAseguradoraId] = useState("")
  const [tipoComprobante, setTipoComprobante] = useState("A")
  const [nroComprobante, setNroComprobante] = useState("")
  const [fecha, setFecha] = useState(hoyLocalYmd())
  const [periodoDesde, setPeriodoDesde] = useState("")
  const [periodoHasta, setPeriodoHasta] = useState("")
  const [neto, setNeto] = useState("")
  const [iva, setIva] = useState("")
  const [formaPago, setFormaPago] = useState<"CONTADO" | "TARJETA">("CONTADO")
  const [medioPagoContado, setMedioPagoContado] = useState<"TRANSFERENCIA" | "EFECTIVO">("TRANSFERENCIA")
  const [cuentaId, setCuentaId] = useState("")
  const [tarjetaId, setTarjetaId] = useState("")
  const [cantCuotas, setCantCuotas] = useState("")
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const netoNum = Number(neto) || 0
  const ivaNum = Number(iva) || 0
  const total = netoNum + ivaNum
  const cantCuotasNum = Number(cantCuotas) || 0
  const montoCuota = cantCuotasNum > 0 ? Math.round((total / cantCuotasNum) * 100) / 100 : 0

  const puedeGuardar = aseguradoraId && nroComprobante.trim() && fecha && periodoDesde && periodoHasta && total > 0 &&
    (formaPago === "CONTADO" ? (medioPagoContado === "TRANSFERENCIA" ? cuentaId : true) : (tarjetaId && cantCuotasNum > 0))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setCargando(true); setError(null); setSuccess(null)
    try {
      const res = await fetch("/api/jm/facturas-seguro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          aseguradoraId,
          nroComprobante: nroComprobante.trim(),
          tipoComprobante,
          fecha,
          periodoDesde,
          periodoHasta,
          neto: netoNum,
          iva: ivaNum,
          total,
          formaPago,
          medioPagoContado: formaPago === "CONTADO" ? medioPagoContado : undefined,
          cuentaId: formaPago === "CONTADO" && medioPagoContado === "TRANSFERENCIA" ? cuentaId : undefined,
          tarjetaId: formaPago === "TARJETA" ? tarjetaId : undefined,
          cantCuotas: formaPago === "TARJETA" ? cantCuotasNum : undefined,
          montoCuota: formaPago === "TARJETA" ? montoCuota : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Error al guardar")
        return
      }
      setSuccess(`Factura ${nroComprobante} guardada`)
      setNroComprobante(""); setNeto(""); setIva("")
      router.refresh()
    } catch {
      setError("Error de red")
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Nueva factura de seguro</h1>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader><CardTitle className="text-base">Datos del comprobante</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Aseguradora</Label>
              <SearchCombobox
                items={aseguradoras.map((a) => ({ id: a.id, label: a.razonSocial, sublabel: a.cuit }))}
                value={aseguradoraId}
                onChange={setAseguradoraId}
                placeholder="Buscar aseguradora..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <Label>Tipo</Label>
                <Select value={tipoComprobante} onChange={(e) => setTipoComprobante(e.target.value)}>
                  <option value="A">A</option><option value="B">B</option><option value="C">C</option>
                </Select>
              </div>
              <div className="md:col-span-2"><Label>Nro comprobante</Label><Input value={nroComprobante} onChange={(e) => setNroComprobante(e.target.value)} required /></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div><Label>Fecha</Label><Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} required /></div>
              <div><Label>Vigencia desde</Label><Input type="date" value={periodoDesde} onChange={(e) => setPeriodoDesde(e.target.value)} required /></div>
              <div><Label>Vigencia hasta</Label><Input type="date" value={periodoHasta} onChange={(e) => setPeriodoHasta(e.target.value)} required /></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div><Label>Neto</Label><Input type="number" step="0.01" value={neto} onChange={(e) => setNeto(e.target.value)} required /></div>
              <div><Label>IVA</Label><Input type="number" step="0.01" value={iva} onChange={(e) => setIva(e.target.value)} required /></div>
              <div><Label>Total</Label><Input value={total.toFixed(2)} disabled /></div>
            </div>

            <div>
              <Label>Forma de pago</Label>
              <Select value={formaPago} onChange={(e) => setFormaPago(e.target.value as "CONTADO" | "TARJETA")}>
                <option value="CONTADO">Contado</option>
                <option value="TARJETA">Tarjeta (cuotas)</option>
              </Select>
            </div>

            {formaPago === "CONTADO" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label>Medio</Label>
                  <Select value={medioPagoContado} onChange={(e) => setMedioPagoContado(e.target.value as "TRANSFERENCIA" | "EFECTIVO")}>
                    <option value="TRANSFERENCIA">Transferencia</option>
                    <option value="EFECTIVO">Efectivo</option>
                  </Select>
                </div>
                {medioPagoContado === "TRANSFERENCIA" && (
                  <div>
                    <Label>Cuenta</Label>
                    <Select value={cuentaId} onChange={(e) => setCuentaId(e.target.value)} required>
                      <option value="">— Elegir —</option>
                      {cuentas.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                    </Select>
                  </div>
                )}
              </div>
            )}

            {formaPago === "TARJETA" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <Label>Tarjeta</Label>
                  <Select value={tarjetaId} onChange={(e) => setTarjetaId(e.target.value)} required>
                    <option value="">— Elegir —</option>
                    {tarjetas.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                  </Select>
                </div>
                <div><Label>Cuotas</Label><Input type="number" min="1" value={cantCuotas} onChange={(e) => setCantCuotas(e.target.value)} /></div>
                <div><Label>Monto cuota</Label><Input value={montoCuota.toFixed(2)} disabled /></div>
              </div>
            )}

            {error && <FormError message={error} />}
            {success && <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2">{success}</p>}

            <div className="flex justify-end">
              <Button type="submit" disabled={!puedeGuardar || cargando}>{cargando ? "Guardando..." : `Guardar factura — ${formatearMoneda(total)}`}</Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
