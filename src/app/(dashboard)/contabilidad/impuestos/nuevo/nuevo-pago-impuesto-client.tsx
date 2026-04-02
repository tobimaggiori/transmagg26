"use client"

/**
 * Formulario para registrar un pago de impuesto (IIBB, IVA, Ganancias, Otro).
 * Sube comprobante PDF a R2 si el medio de pago es cuenta bancaria.
 * Crea PagoImpuesto y MovimientoSinFactura (EGRESO) si corresponde.
 */

import { useState } from "react"
import Link from "next/link"

interface Cuenta {
  id: string
  nombre: string
  tipo: string
}

interface NuevoPagoImpuestoClientProps {
  cuentas: Cuenta[]
}

const TIPOS_IMPUESTO = [
  { value: "IIBB", label: "Ingresos Brutos" },
  { value: "IVA", label: "IVA" },
  { value: "GANANCIAS", label: "Imp. a las Ganancias" },
  { value: "OTRO", label: "Otro impuesto" },
]

const MEDIOS_PAGO = [
  { value: "CUENTA_BANCARIA", label: "Desde cuenta bancaria" },
  { value: "EFECTIVO", label: "Efectivo" },
  { value: "TARJETA", label: "Tarjeta" },
]

const MESES = [
  { value: "01", label: "Enero" },
  { value: "02", label: "Febrero" },
  { value: "03", label: "Marzo" },
  { value: "04", label: "Abril" },
  { value: "05", label: "Mayo" },
  { value: "06", label: "Junio" },
  { value: "07", label: "Julio" },
  { value: "08", label: "Agosto" },
  { value: "09", label: "Septiembre" },
  { value: "10", label: "Octubre" },
  { value: "11", label: "Noviembre" },
  { value: "12", label: "Diciembre" },
]

function getAnios(): number[] {
  const current = new Date().getFullYear()
  const anios: number[] = []
  for (let y = current; y >= current - 5; y--) anios.push(y)
  return anios
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

export function NuevoPagoImpuestoClient({ cuentas }: NuevoPagoImpuestoClientProps) {
  const [tipoImpuesto, setTipoImpuesto] = useState("IIBB")
  const [descripcion, setDescripcion] = useState("")
  const [mes, setMes] = useState("01")
  const [anio, setAnio] = useState(String(new Date().getFullYear()))
  const [monto, setMonto] = useState("")
  const [medioPago, setMedioPago] = useState("CUENTA_BANCARIA")
  const [cuentaId, setCuentaId] = useState("")
  const [fechaPago, setFechaPago] = useState(todayISO())
  const [comprobante, setComprobante] = useState<File | null>(null)
  const [observaciones, setObservaciones] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const usaMes = tipoImpuesto === "IIBB" || tipoImpuesto === "IVA"
  const mostrarDescripcion = tipoImpuesto === "OTRO"
  const mostrarCuenta = medioPago === "CUENTA_BANCARIA"
  const mostrarComprobante = medioPago === "CUENTA_BANCARIA"

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const periodo = usaMes ? `${anio}-${mes}` : anio

      let comprobantePdfS3Key: string | undefined
      if (comprobante && mostrarComprobante) {
        const fd = new FormData()
        fd.append("file", comprobante)
        fd.append("prefijo", "comprobantes-impuestos")
        const upRes = await fetch("/api/storage/upload", { method: "POST", body: fd })
        if (!upRes.ok) {
          const d = await upRes.json()
          setError(d.error ?? "Error al subir comprobante")
          return
        }
        const upData = await upRes.json()
        comprobantePdfS3Key = upData.key
      }

      const body: Record<string, unknown> = {
        tipoImpuesto,
        descripcion: mostrarDescripcion ? descripcion : undefined,
        periodo,
        monto: parseFloat(monto),
        fechaPago,
        medioPago,
        cuentaId: mostrarCuenta && cuentaId ? cuentaId : undefined,
        comprobantePdfS3Key,
        observaciones: observaciones || undefined,
      }

      const res = await fetch("/api/contabilidad/impuestos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const d = await res.json()
        setError(d.error ?? "Error al guardar")
        return
      }

      setSuccess(true)
    } catch {
      setError("Error de red")
    } finally {
      setLoading(false)
    }
  }

  function resetForm() {
    setTipoImpuesto("IIBB")
    setDescripcion("")
    setMes("01")
    setAnio(String(new Date().getFullYear()))
    setMonto("")
    setMedioPago("CUENTA_BANCARIA")
    setCuentaId("")
    setFechaPago(todayISO())
    setComprobante(null)
    setObservaciones("")
    setError("")
    setSuccess(false)
  }

  if (success) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center space-y-4">
        <div className="text-green-600 text-xl font-semibold">Pago registrado correctamente</div>
        <div className="flex justify-center gap-4">
          <button
            onClick={resetForm}
            className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 text-sm"
          >
            Registrar otro
          </button>
          <Link
            href="/contabilidad/impuestos/consultar"
            className="px-4 py-2 border rounded text-sm hover:bg-gray-50"
          >
            Ver consulta
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Registrar Pago de Impuesto</h1>
        <p className="text-muted-foreground text-sm mt-1">Completá los datos del pago impositivo.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Tipo de impuesto */}
        <div>
          <label className="text-sm font-medium">Tipo de impuesto *</label>
          <select
            className="mt-1 w-full border rounded px-3 py-2 text-sm"
            value={tipoImpuesto}
            onChange={(e) => setTipoImpuesto(e.target.value)}
            required
          >
            {TIPOS_IMPUESTO.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        {/* Descripción (solo OTRO) */}
        {mostrarDescripcion && (
          <div>
            <label className="text-sm font-medium">Descripción *</label>
            <input
              className="mt-1 w-full border rounded px-3 py-2 text-sm"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Ej: Impuesto a los sellos"
              required
            />
          </div>
        )}

        {/* Período */}
        <div>
          <label className="text-sm font-medium">Período *</label>
          <div className="mt-1 flex gap-2">
            {usaMes && (
              <select
                className="flex-1 border rounded px-3 py-2 text-sm"
                value={mes}
                onChange={(e) => setMes(e.target.value)}
              >
                {MESES.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            )}
            <select
              className="flex-1 border rounded px-3 py-2 text-sm"
              value={anio}
              onChange={(e) => setAnio(e.target.value)}
            >
              {getAnios().map((y) => (
                <option key={y} value={String(y)}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Monto */}
        <div>
          <label className="text-sm font-medium">Monto *</label>
          <input
            type="number"
            step="0.01"
            min="0"
            className="mt-1 w-full border rounded px-3 py-2 text-sm"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            placeholder="0.00"
            required
          />
        </div>

        {/* Medio de pago */}
        <div>
          <label className="text-sm font-medium">Medio de pago *</label>
          <select
            className="mt-1 w-full border rounded px-3 py-2 text-sm"
            value={medioPago}
            onChange={(e) => setMedioPago(e.target.value)}
            required
          >
            {MEDIOS_PAGO.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>

        {/* Cuenta (solo CUENTA_BANCARIA) */}
        {mostrarCuenta && (
          <div>
            <label className="text-sm font-medium">Cuenta bancaria</label>
            <select
              className="mt-1 w-full border rounded px-3 py-2 text-sm"
              value={cuentaId}
              onChange={(e) => setCuentaId(e.target.value)}
            >
              <option value="">Seleccionar cuenta...</option>
              {cuentas.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </div>
        )}

        {/* Fecha de pago */}
        <div>
          <label className="text-sm font-medium">Fecha de pago *</label>
          <input
            type="date"
            className="mt-1 w-full border rounded px-3 py-2 text-sm"
            value={fechaPago}
            onChange={(e) => setFechaPago(e.target.value)}
            required
          />
        </div>

        {/* Comprobante PDF (solo CUENTA_BANCARIA) */}
        {mostrarComprobante && (
          <div>
            <label className="text-sm font-medium">Comprobante PDF</label>
            <input
              type="file"
              accept="application/pdf"
              className="mt-1 w-full text-sm"
              onChange={(e) => setComprobante(e.target.files?.[0] ?? null)}
            />
          </div>
        )}

        {/* Observaciones */}
        <div>
          <label className="text-sm font-medium">Observaciones</label>
          <textarea
            className="mt-1 w-full border rounded px-3 py-2 text-sm resize-none"
            rows={3}
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            placeholder="Opcional..."
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Link href="/contabilidad/impuestos" className="px-4 py-2 text-sm border rounded hover:bg-gray-50">
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-sm bg-black text-white rounded hover:bg-gray-800 disabled:opacity-50"
          >
            {loading ? "Guardando..." : "Registrar pago"}
          </button>
        </div>
      </form>
    </div>
  )
}
