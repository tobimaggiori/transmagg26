"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { UploadPDF } from "@/components/upload-pdf"
import { SearchCombobox } from "@/components/ui/search-combobox"
import { parsearImporte } from "@/lib/money"

const TIPOS_BIEN = [
  { value: "CAMION",        label: "Camión propio Transmagg" },
  { value: "VEHICULO",      label: "Vehículo (auto, camioneta)" },
  { value: "INMUEBLE",      label: "Inmueble / Oficina" },
  { value: "EQUIPO",        label: "Equipo o maquinaria" },
  { value: "CARGA_GENERAL", label: "Cargas generales" },
]

interface Camion    { id: string; patenteChasis: string; patenteAcoplado: string | null }
interface Proveedor { id: string; razonSocial: string; cuit: string }

interface NuevaPolizaClientProps {
  camiones: Camion[]
  proveedores: Proveedor[]
  camionIdInicial?: string
}

export function NuevaPolizaClient({ camiones, proveedores, camionIdInicial }: NuevaPolizaClientProps) {
  const router = useRouter()
  const [tipoBien,        setTipoBien]        = useState("CAMION")
  const [aseguradora,     setAseguradora]     = useState("")
  const [proveedorId,     setProveedorId]     = useState("")
  const [nroPoliza,       setNroPoliza]       = useState("")
  const [camionId,        setCamionId]        = useState(camionIdInicial ?? "")
  const [descripcionBien, setDescripcionBien] = useState("")
  const [cobertura,       setCobertura]       = useState("")
  const [vigenciaDesde,   setVigenciaDesde]   = useState("")
  const [vigenciaHasta,   setVigenciaHasta]   = useState("")
  const [montoMensual,    setMontoMensual]    = useState("")
  const [pdfS3Key,        setPdfS3Key]        = useState<string | null>(null)
  const [loading,         setLoading]         = useState(false)
  const [error,           setError]           = useState<string | null>(null)

  // Cuando se selecciona un proveedor, auto-completar aseguradora
  function handleProveedorChange(id: string) {
    setProveedorId(id)
    if (id) {
      const prov = proveedores.find((p) => p.id === id)
      if (prov) setAseguradora(prov.razonSocial)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/polizas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipoBien,
          aseguradora,
          proveedorId: proveedorId || null,
          nroPoliza,
          camionId:        tipoBien === "CAMION" ? camionId   : undefined,
          descripcionBien: tipoBien !== "CAMION" ? descripcionBien || null : null,
          cobertura:       cobertura || null,
          vigenciaDesde,
          vigenciaHasta,
          montoMensual:    montoMensual ? parsearImporte(montoMensual) : null,
          pdfS3Key:        pdfS3Key ?? null,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? "Error al guardar"); return }
      router.push("/contabilidad/polizas/consultar")
    } catch {
      setError("Error de conexión.")
    } finally {
      setLoading(false)
    }
  }

  const proveedorItems = proveedores.map((p) => ({ id: p.id, label: p.razonSocial, sublabel: p.cuit }))

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Nueva póliza de seguro</h2>
        <p className="text-muted-foreground">Registrá los datos de la póliza emitida por la aseguradora.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Tipo de bien */}
        <div className="space-y-1">
          <label className="text-sm font-medium">Tipo de bien *</label>
          <select
            value={tipoBien}
            onChange={(e) => { setTipoBien(e.target.value); setCamionId(""); setDescripcionBien("") }}
            className="w-full h-9 rounded-md border bg-background px-3 text-sm"
            required
          >
            {TIPOS_BIEN.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        {/* Camión */}
        {tipoBien === "CAMION" && (
          <div className="space-y-1">
            <label className="text-sm font-medium">Camión *</label>
            <select
              value={camionId}
              onChange={(e) => setCamionId(e.target.value)}
              className="w-full h-9 rounded-md border bg-background px-3 text-sm"
              required
            >
              <option value="">Seleccioná un camión...</option>
              {camiones.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.patenteChasis}{c.patenteAcoplado ? ` / ${c.patenteAcoplado}` : ""}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Descripción del bien */}
        {tipoBien !== "CAMION" && (
          <div className="space-y-1">
            <label className="text-sm font-medium">Descripción del bien</label>
            <input
              type="text"
              value={descripcionBien}
              onChange={(e) => setDescripcionBien(e.target.value)}
              placeholder="Ej: Ford Ranger patente AB123CD"
              className="w-full h-9 rounded-md border bg-background px-3 text-sm"
            />
          </div>
        )}

        {/* Compañía aseguradora */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">Compañía aseguradora (ABM) *</label>
            <SearchCombobox
              items={proveedorItems}
              value={proveedorId}
              onChange={handleProveedorChange}
              placeholder="Buscar por nombre o CUIT..."
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Nombre aseguradora *</label>
            <input
              type="text"
              value={aseguradora}
              onChange={(e) => setAseguradora(e.target.value)}
              placeholder="O escribí el nombre libre"
              required
              className="w-full h-9 rounded-md border bg-background px-3 text-sm"
            />
          </div>
        </div>

        {/* Nro póliza + cobertura */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">Nro. de póliza *</label>
            <input
              type="text"
              value={nroPoliza}
              onChange={(e) => setNroPoliza(e.target.value)}
              required
              className="w-full h-9 rounded-md border bg-background px-3 text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Cobertura</label>
            <input
              type="text"
              value={cobertura}
              onChange={(e) => setCobertura(e.target.value)}
              placeholder="Ej: Todo riesgo"
              className="w-full h-9 rounded-md border bg-background px-3 text-sm"
            />
          </div>
        </div>

        {/* Vigencia */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">Vigencia desde *</label>
            <input
              type="date"
              value={vigenciaDesde}
              onChange={(e) => setVigenciaDesde(e.target.value)}
              required
              className="w-full h-9 rounded-md border bg-background px-3 text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Vigencia hasta *</label>
            <input
              type="date"
              value={vigenciaHasta}
              onChange={(e) => setVigenciaHasta(e.target.value)}
              required
              className="w-full h-9 rounded-md border bg-background px-3 text-sm"
            />
          </div>
        </div>

        {/* Monto mensual */}
        <div className="space-y-1">
          <label className="text-sm font-medium">Monto mensual ($)</label>
          <input
            type="number"
            step="0.01"
            value={montoMensual}
            onChange={(e) => setMontoMensual(e.target.value)}
            placeholder="Opcional"
            className="w-full h-9 rounded-md border bg-background px-3 text-sm"
          />
        </div>

        {/* PDF */}
        <div className="space-y-1">
          <label className="text-sm font-medium">PDF de la póliza</label>
          <UploadPDF
            prefijo="polizas"
            onUpload={(key) => setPdfS3Key(key)}
            label="Subir PDF de la póliza"
            s3Key={pdfS3Key ?? undefined}
          />
          <p className="text-xs text-muted-foreground">Subí el PDF emitido por la aseguradora (opcional).</p>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="h-9 px-4 rounded-md border text-sm font-medium hover:bg-accent"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? "Guardando..." : "Guardar póliza"}
          </button>
        </div>
      </form>
    </div>
  )
}
