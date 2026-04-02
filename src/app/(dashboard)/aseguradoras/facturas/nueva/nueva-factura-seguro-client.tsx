"use client"

/**
 * Propósito: Formulario multi-paso para ingresar una nueva factura de seguro.
 * Paso 1: Datos de factura. Paso 2: Pólizas. Paso 3: Forma de pago.
 */

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SearchCombobox } from "@/components/ui/search-combobox"
import { formatearMoneda } from "@/lib/utils"
import { Plus, Trash2 } from "lucide-react"

interface Proveedor {
  id: string
  razonSocial: string
  cuit: string
}

interface Tarjeta {
  id: string
  nombre: string
  banco: string
  ultimos4: string
}

interface Camion {
  id: string
  patenteChasis: string
  patenteAcoplado?: string | null
  tipoCamion: string
}

interface Cuenta {
  id: string
  nombre: string
  tipo: string
}

interface PolizaForm {
  tipoBien: string
  camionId?: string
  descripcionBien?: string
  nroPoliza: string
  cobertura?: string
  vigenciaDesde: string
  vigenciaHasta: string
}

interface Props {
  proveedores: Proveedor[]
  tarjetas: Tarjeta[]
  camiones: Camion[]
  cuentas: Cuenta[]
}

const TIPO_BIEN_OPTIONS = [
  { value: "CAMION", label: "Camión" },
  { value: "VEHICULO", label: "Vehículo" },
  { value: "INMUEBLE", label: "Inmueble" },
  { value: "EQUIPO", label: "Equipo" },
  { value: "CARGA_GENERAL", label: "Carga General" },
]

export function NuevaFacturaSeguroClient({ proveedores, tarjetas, camiones, cuentas }: Props) {
  const router = useRouter()
  const today = new Date().toISOString().split("T")[0]

  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [exito, setExito] = useState(false)

  // Step 1 state
  const [aseguradoraId, setAseguradoraId] = useState("")
  const [nroComprobante, setNroComprobante] = useState("")
  const [tipoComprobante, setTipoComprobante] = useState("A")
  const [fecha, setFecha] = useState(today)
  const [periodoDesde, setPeriodoDesde] = useState("")
  const [periodoHasta, setPeriodoHasta] = useState("")
  const [neto, setNeto] = useState("")
  const ivaCalc = neto ? Math.round(parseFloat(neto) * 0.21 * 100) / 100 : 0
  const totalCalc = neto ? Math.round((parseFloat(neto) + ivaCalc) * 100) / 100 : 0

  // Step 2 state
  const [polizas, setPolizas] = useState<PolizaForm[]>([
    { tipoBien: "CAMION", nroPoliza: "", vigenciaDesde: "", vigenciaHasta: "" },
  ])

  // Step 3 state
  const [formaPago, setFormaPago] = useState<"CONTADO" | "TARJETA">("CONTADO")
  const [medioPagoContado, setMedioPagoContado] = useState("TRANSFERENCIA")
  const [cuentaId, setCuentaId] = useState("")
  const [tarjetaId, setTarjetaId] = useState("")
  const [cantCuotas, setCantCuotas] = useState("1")
  const [primerMesAnio, setPrimerMesAnio] = useState("")

  const cuentasBanco = cuentas.filter((c) => c.tipo === "BANCO")

  function addPoliza() {
    setPolizas((prev) => [
      ...prev,
      { tipoBien: "CAMION", nroPoliza: "", vigenciaDesde: "", vigenciaHasta: "" },
    ])
  }

  function removePoliza(index: number) {
    setPolizas((prev) => prev.filter((_, i) => i !== index))
  }

  function updatePoliza(index: number, field: keyof PolizaForm, value: string) {
    setPolizas((prev) => prev.map((p, i) => (i === index ? { ...p, [field]: value } : p)))
  }

  function getCuotasPreview(): Array<{ nro: number; mesAnio: string; monto: number }> {
    if (!primerMesAnio || !cantCuotas) return []
    const n = parseInt(cantCuotas)
    if (isNaN(n) || n < 1) return []
    const monto = Math.round((totalCalc / n) * 100) / 100
    const [anio, mes] = primerMesAnio.split("-").map(Number)
    return Array.from({ length: n }, (_, i) => {
      const d = new Date(anio, mes - 1 + i, 1)
      return {
        nro: i + 1,
        mesAnio: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
        monto,
      }
    })
  }

  function validateStep1(): boolean {
    if (!aseguradoraId) { setError("Seleccioná una aseguradora"); return false }
    if (!nroComprobante) { setError("Ingresá el número de comprobante"); return false }
    if (!fecha) { setError("Ingresá la fecha"); return false }
    if (!periodoDesde || !periodoHasta) { setError("Ingresá el período de cobertura"); return false }
    if (!neto || parseFloat(neto) <= 0) { setError("Ingresá el monto neto"); return false }
    return true
  }

  function validateStep2(): boolean {
    for (const p of polizas) {
      if (!p.nroPoliza) { setError("Todas las pólizas requieren número de póliza"); return false }
      if (!p.vigenciaDesde || !p.vigenciaHasta) { setError("Todas las pólizas requieren fechas de vigencia"); return false }
      if (p.tipoBien === "CAMION" && !p.camionId) { setError("Seleccioná el camión para la póliza"); return false }
      if (p.tipoBien !== "CAMION" && !p.descripcionBien) { setError("Ingresá la descripción del bien"); return false }
    }
    return true
  }

  async function handleSubmit() {
    setError(null)
    setLoading(true)

    const payload = {
      aseguradoraId,
      nroComprobante,
      tipoComprobante,
      fecha,
      periodoDesde,
      periodoHasta,
      neto: parseFloat(neto),
      iva: ivaCalc,
      total: totalCalc,
      formaPago,
      medioPagoContado: formaPago === "CONTADO" ? medioPagoContado : undefined,
      cuentaId: formaPago === "CONTADO" && cuentaId ? cuentaId : undefined,
      tarjetaId: formaPago === "TARJETA" && tarjetaId ? tarjetaId : undefined,
      cantCuotas: formaPago === "TARJETA" ? parseInt(cantCuotas) : undefined,
      primerMesAnio: formaPago === "TARJETA" ? primerMesAnio : undefined,
      polizas: polizas.map((p) => ({
        tipoBien: p.tipoBien,
        camionId: p.camionId || undefined,
        descripcionBien: p.descripcionBien || undefined,
        nroPoliza: p.nroPoliza,
        cobertura: p.cobertura || undefined,
        vigenciaDesde: p.vigenciaDesde,
        vigenciaHasta: p.vigenciaHasta,
      })),
    }

    try {
      const res = await fetch("/api/aseguradoras/facturas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? "Error al guardar la factura")
        return
      }

      setExito(true)
    } catch {
      setError("Error de conexión")
    } finally {
      setLoading(false)
    }
  }

  if (exito) {
    return (
      <div className="space-y-6 max-w-2xl">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-green-600">Factura registrada</h2>
          <p className="text-muted-foreground mt-1">La factura de seguro fue guardada correctamente.</p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => {
              setStep(1)
              setAseguradoraId("")
              setNroComprobante("")
              setTipoComprobante("A")
              setFecha(today)
              setPeriodoDesde("")
              setPeriodoHasta("")
              setNeto("")
              setPolizas([{ tipoBien: "CAMION", nroPoliza: "", vigenciaDesde: "", vigenciaHasta: "" }])
              setFormaPago("CONTADO")
              setMedioPagoContado("TRANSFERENCIA")
              setCuentaId("")
              setTarjetaId("")
              setCantCuotas("1")
              setPrimerMesAnio("")
              setExito(false)
            }}
          >
            Nueva factura
          </Button>
          <Button variant="outline" onClick={() => router.push("/aseguradoras/facturas/consultar")}>
            Ver consulta
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Nueva Factura de Seguro</h2>
        <p className="text-muted-foreground">Paso {step} de 3</p>
      </div>

      {/* Step indicators */}
      <div className="flex gap-2 text-sm">
        {(["Datos", "Pólizas", "Pago"] as const).map((label, i) => (
          <span
            key={label}
            className={`px-3 py-1 rounded-full font-medium ${
              step === i + 1
                ? "bg-primary text-primary-foreground"
                : step > i + 1
                ? "bg-green-100 text-green-700"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {i + 1}. {label}
          </span>
        ))}
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* STEP 1 */}
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <Label>Aseguradora</Label>
            <SearchCombobox
              items={proveedores.map((p) => ({ id: p.id, label: p.razonSocial, sublabel: p.cuit }))}
              value={aseguradoraId}
              onChange={setAseguradoraId}
              placeholder="Buscar aseguradora..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Nro. Comprobante</Label>
              <Input value={nroComprobante} onChange={(e) => setNroComprobante(e.target.value)} placeholder="0001-00001234" />
            </div>
            <div>
              <Label>Tipo</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={tipoComprobante}
                onChange={(e) => setTipoComprobante(e.target.value)}
              >
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
              </select>
            </div>
          </div>

          <div>
            <Label>Fecha</Label>
            <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Período desde</Label>
              <Input type="date" value={periodoDesde} onChange={(e) => setPeriodoDesde(e.target.value)} />
            </div>
            <div>
              <Label>Período hasta</Label>
              <Input type="date" value={periodoHasta} onChange={(e) => setPeriodoHasta(e.target.value)} />
            </div>
          </div>

          <div>
            <Label>Neto ($)</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={neto}
              onChange={(e) => setNeto(e.target.value)}
              placeholder="0.00"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>IVA 21% (calculado)</Label>
              <Input value={neto ? formatearMoneda(ivaCalc) : ""} readOnly className="bg-muted" />
            </div>
            <div>
              <Label>Total (calculado)</Label>
              <Input value={neto ? formatearMoneda(totalCalc) : ""} readOnly className="bg-muted" />
            </div>
          </div>

          <Button
            onClick={() => {
              setError(null)
              if (validateStep1()) setStep(2)
            }}
          >
            Siguiente
          </Button>
        </div>
      )}

      {/* STEP 2 */}
      {step === 2 && (
        <div className="space-y-6">
          {polizas.map((poliza, idx) => (
            <div key={idx} className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">Póliza {idx + 1}</span>
                {polizas.length > 1 && (
                  <Button size="sm" variant="ghost" onClick={() => removePoliza(idx)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div>
                <Label>Tipo de bien</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={poliza.tipoBien}
                  onChange={(e) => updatePoliza(idx, "tipoBien", e.target.value)}
                >
                  {TIPO_BIEN_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              {poliza.tipoBien === "CAMION" ? (
                <div>
                  <Label>Camión</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={poliza.camionId ?? ""}
                    onChange={(e) => updatePoliza(idx, "camionId", e.target.value)}
                  >
                    <option value="">Seleccionar camión</option>
                    {camiones.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.patenteChasis}{c.patenteAcoplado ? ` / ${c.patenteAcoplado}` : ""} — {c.tipoCamion}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <Label>Descripción del bien</Label>
                  <Input
                    value={poliza.descripcionBien ?? ""}
                    onChange={(e) => updatePoliza(idx, "descripcionBien", e.target.value)}
                    placeholder="Descripción del bien asegurado"
                  />
                </div>
              )}

              <div>
                <Label>Nro. Póliza</Label>
                <Input
                  value={poliza.nroPoliza}
                  onChange={(e) => updatePoliza(idx, "nroPoliza", e.target.value)}
                  placeholder="Número de póliza"
                />
              </div>

              <div>
                <Label>Cobertura (opcional)</Label>
                <Input
                  value={poliza.cobertura ?? ""}
                  onChange={(e) => updatePoliza(idx, "cobertura", e.target.value)}
                  placeholder="Tipo de cobertura"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Vigencia desde</Label>
                  <Input type="date" value={poliza.vigenciaDesde} onChange={(e) => updatePoliza(idx, "vigenciaDesde", e.target.value)} />
                </div>
                <div>
                  <Label>Vigencia hasta</Label>
                  <Input type="date" value={poliza.vigenciaHasta} onChange={(e) => updatePoliza(idx, "vigenciaHasta", e.target.value)} />
                </div>
              </div>
            </div>
          ))}

          <Button variant="outline" onClick={addPoliza} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Agregar póliza
          </Button>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(1)}>Atrás</Button>
            <Button
              onClick={() => {
                setError(null)
                if (validateStep2()) setStep(3)
              }}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}

      {/* STEP 3 */}
      {step === 3 && (
        <div className="space-y-5">
          <div>
            <Label>Forma de pago</Label>
            <div className="flex gap-4 mt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="formaPago"
                  value="CONTADO"
                  checked={formaPago === "CONTADO"}
                  onChange={() => setFormaPago("CONTADO")}
                />
                Contado
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="formaPago"
                  value="TARJETA"
                  checked={formaPago === "TARJETA"}
                  onChange={() => setFormaPago("TARJETA")}
                />
                Tarjeta
              </label>
            </div>
          </div>

          {formaPago === "CONTADO" && (
            <>
              <div>
                <Label>Medio de pago</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={medioPagoContado}
                  onChange={(e) => setMedioPagoContado(e.target.value)}
                >
                  <option value="TRANSFERENCIA">Transferencia</option>
                  <option value="CHEQUE">Cheque</option>
                  <option value="EFECTIVO">Efectivo</option>
                </select>
              </div>
              <div>
                <Label>Cuenta bancaria</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={cuentaId}
                  onChange={(e) => setCuentaId(e.target.value)}
                >
                  <option value="">Sin cuenta (solo registro)</option>
                  {cuentasBanco.map((c) => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          {formaPago === "TARJETA" && (
            <>
              <div>
                <Label>Tarjeta de crédito</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={tarjetaId}
                  onChange={(e) => setTarjetaId(e.target.value)}
                >
                  <option value="">Seleccionar tarjeta</option>
                  {tarjetas.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nombre} — {t.banco} xxxx{t.ultimos4}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Cantidad de cuotas</Label>
                  <Input
                    type="number"
                    min="1"
                    max="36"
                    value={cantCuotas}
                    onChange={(e) => setCantCuotas(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Primer mes/año</Label>
                  <Input
                    type="month"
                    value={primerMesAnio}
                    onChange={(e) => setPrimerMesAnio(e.target.value)}
                  />
                </div>
              </div>

              {getCuotasPreview().length > 0 && (
                <div className="rounded-md border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="px-3 py-2 text-left">Cuota</th>
                        <th className="px-3 py-2 text-left">Período</th>
                        <th className="px-3 py-2 text-right">Monto</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getCuotasPreview().map((cuota) => (
                        <tr key={cuota.nro} className="border-b last:border-0">
                          <td className="px-3 py-2">{cuota.nro}/{cantCuotas}</td>
                          <td className="px-3 py-2">{cuota.mesAnio}</td>
                          <td className="px-3 py-2 text-right">{formatearMoneda(cuota.monto)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          <div className="pt-2 border-t text-sm text-muted-foreground">
            Total a pagar: <span className="font-semibold text-foreground">{formatearMoneda(totalCalc)}</span>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(2)}>Atrás</Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? "Guardando..." : "Guardar factura"}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
