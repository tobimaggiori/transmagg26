"use client"

/**
 * Ingresar factura de proveedor JM. Versión simplificada con totales
 * directos (sin items detallados). Permite percepciones IIBB / IVA / Ganancias.
 */

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
import { sumarImportes } from "@/lib/money"

type Proveedor = { id: string; razonSocial: string; cuit: string; condicionIva: string; tipo: string }

interface Props { proveedores: Proveedor[] }

const TIPOS_CBTE = ["A", "B", "C", "M", "X"] as const

export function IngresarFacturaProveedorJmClient({ proveedores }: Props) {
  const router = useRouter()
  const [proveedorId, setProveedorId] = useState("")
  const [nroComprobante, setNroComprobante] = useState("")
  const [ptoVenta, setPtoVenta] = useState("")
  const [tipoCbte, setTipoCbte] = useState<typeof TIPOS_CBTE[number]>("A")
  const [fechaCbte, setFechaCbte] = useState(hoyLocalYmd())
  const [neto, setNeto] = useState("")
  const [ivaPct, setIvaPct] = useState("21")
  const [percepcionIIBB, setPercepcionIIBB] = useState("")
  const [percepcionIVA, setPercepcionIVA] = useState("")
  const [percepcionGanancias, setPercepcionGanancias] = useState("")
  const [concepto, setConcepto] = useState("")
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [exito, setExito] = useState<string | null>(null)

  const netoNum = Number(neto) || 0
  const ivaPctNum = Number(ivaPct) || 0
  const ivaMonto = Math.round((netoNum * ivaPctNum / 100) * 100) / 100
  const totalSinPercep = sumarImportes([netoNum, ivaMonto])
  const percepIIBBNum = Number(percepcionIIBB) || 0
  const percepIVANum = Number(percepcionIVA) || 0
  const percepGcsNum = Number(percepcionGanancias) || 0
  const total = sumarImportes([totalSinPercep, percepIIBBNum, percepIVANum, percepGcsNum])

  const proveedor = proveedores.find((p) => p.id === proveedorId)

  const puedeGuardar = proveedorId && nroComprobante.trim() && fechaCbte && netoNum > 0

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setCargando(true); setError(null); setExito(null)
    try {
      const body = {
        proveedorId,
        nroComprobante: nroComprobante.trim(),
        ptoVenta: ptoVenta.trim() || undefined,
        tipoCbte,
        fechaCbte,
        neto: netoNum,
        ivaMonto,
        total,
        concepto: concepto.trim() || undefined,
        percepcionIIBB: percepIIBBNum > 0 ? percepIIBBNum : undefined,
        percepcionIVA: percepIVANum > 0 ? percepIVANum : undefined,
        percepcionGanancias: percepGcsNum > 0 ? percepGcsNum : undefined,
      }
      const res = await fetch("/api/jm/facturas-proveedor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Error al guardar")
        return
      }
      setExito(`Factura ${nroComprobante} ingresada (total ${formatearMoneda(total)})`)
      setNroComprobante(""); setPtoVenta(""); setNeto(""); setIvaPct("21")
      setPercepcionIIBB(""); setPercepcionIVA(""); setPercepcionGanancias(""); setConcepto("")
      router.refresh()
    } catch {
      setError("Error de red")
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Ingresar factura de proveedor</h1>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader><CardTitle className="text-base">Datos del comprobante</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Proveedor</Label>
              <SearchCombobox
                items={proveedores.map((p) => ({ id: p.id, label: p.razonSocial, sublabel: p.cuit }))}
                value={proveedorId}
                onChange={setProveedorId}
                placeholder="Buscar proveedor..."
              />
              {proveedor && (
                <p className="text-xs text-muted-foreground mt-1">{proveedor.condicionIva.replace(/_/g, " ")}{proveedor.tipo === "ASEGURADORA" ? " · Aseguradora" : ""}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <Label>Tipo</Label>
                <Select value={tipoCbte} onChange={(e) => setTipoCbte(e.target.value as typeof TIPOS_CBTE[number])}>
                  {TIPOS_CBTE.map(t => <option key={t} value={t}>{t}</option>)}
                </Select>
              </div>
              <div>
                <Label>Pto. venta</Label>
                <Input value={ptoVenta} onChange={(e) => setPtoVenta(e.target.value)} placeholder="0001" />
              </div>
              <div>
                <Label>Nro. comprobante</Label>
                <Input value={nroComprobante} onChange={(e) => setNroComprobante(e.target.value)} placeholder="00001234" required />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label>Fecha</Label>
                <Input type="date" value={fechaCbte} onChange={(e) => setFechaCbte(e.target.value)} required />
              </div>
              <div>
                <Label>Concepto</Label>
                <Input value={concepto} onChange={(e) => setConcepto(e.target.value)} placeholder="Combustible, neumáticos..." />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <Label>Neto</Label>
                <Input type="number" step="0.01" value={neto} onChange={(e) => setNeto(e.target.value)} required />
              </div>
              <div>
                <Label>IVA %</Label>
                <Select value={ivaPct} onChange={(e) => setIvaPct(e.target.value)}>
                  <option value="21">21%</option>
                  <option value="10.5">10.5%</option>
                  <option value="0">0%</option>
                </Select>
              </div>
              <div>
                <Label>Monto IVA</Label>
                <Input value={ivaMonto.toFixed(2)} disabled />
              </div>
            </div>

            <div>
              <p className="text-sm font-medium mb-2">Percepciones (opcionales)</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div><Label className="text-xs">IIBB</Label><Input type="number" step="0.01" value={percepcionIIBB} onChange={(e) => setPercepcionIIBB(e.target.value)} /></div>
                <div><Label className="text-xs">IVA</Label><Input type="number" step="0.01" value={percepcionIVA} onChange={(e) => setPercepcionIVA(e.target.value)} /></div>
                <div><Label className="text-xs">Ganancias</Label><Input type="number" step="0.01" value={percepcionGanancias} onChange={(e) => setPercepcionGanancias(e.target.value)} /></div>
              </div>
            </div>

            <div className="bg-muted/40 rounded p-3 space-y-1 text-sm">
              <div className="flex justify-between"><span>Neto</span><span>{formatearMoneda(netoNum)}</span></div>
              <div className="flex justify-between"><span>IVA</span><span>{formatearMoneda(ivaMonto)}</span></div>
              {(percepIIBBNum + percepIVANum + percepGcsNum) > 0 && (
                <div className="flex justify-between"><span>Percepciones</span><span>{formatearMoneda(percepIIBBNum + percepIVANum + percepGcsNum)}</span></div>
              )}
              <div className="flex justify-between text-base font-bold pt-2 border-t"><span>Total</span><span>{formatearMoneda(total)}</span></div>
            </div>

            {error && <FormError message={error} />}
            {exito && <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2">{exito}</p>}

            <div className="flex justify-end">
              <Button type="submit" disabled={!puedeGuardar || cargando}>{cargando ? "Guardando..." : "Guardar factura"}</Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
