"use client"

/**
 * Formulario para registrar un pago de impuesto (IIBB, IVA, Ganancias, Otro).
 * - CUENTA_BANCARIA: sube comprobante PDF a R2 (obligatorio) + MovimientoSinFactura EGRESO.
 * - TARJETA: requiere seleccionar tarjeta + MovimientoSinFactura EGRESO vinculado a tarjeta.
 * - EFECTIVO: sin comprobante ni movimiento bancario.
 */

import { useState } from "react"
import Link from "next/link"

interface Cuenta {
  id: string
  nombre: string
  tipo: string
}

interface Tarjeta {
  id: string
  nombre: string
  banco: string
  ultimos4: string
  tipo: string
}

interface NuevoPagoImpuestoClientProps {
  cuentas: Cuenta[]
  tarjetas: Tarjeta[]
}

const TIPOS_IMPUESTO = [
  { value: "IIBB",      label: "Ingresos Brutos" },
  { value: "IVA",       label: "IVA" },
  { value: "GANANCIAS", label: "Imp. a las Ganancias" },
  { value: "OTRO",      label: "Otro impuesto" },
]

const MEDIOS_PAGO = [
  { value: "CUENTA_BANCARIA", label: "Desde cuenta bancaria" },
  { value: "EFECTIVO",        label: "Efectivo" },
  { value: "TARJETA",         label: "Tarjeta" },
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

const COMPROBANTE_PREFIX = "comprobantes-impuestos"

export function NuevoPagoImpuestoClient({ cuentas, tarjetas }: NuevoPagoImpuestoClientProps) {
  const [tipoImpuesto, setTipoImpuesto] = useState("IIBB")
  const [descripcion, setDescripcion]   = useState("")
  const [mes, setMes]                   = useState("01")
  const [anio, setAnio]                 = useState(String(new Date().getFullYear()))
  const [monto, setMonto]               = useState("")
  const [medioPago, setMedioPago]       = useState("CUENTA_BANCARIA")
  const [cuentaId, setCuentaId]         = useState("")
  const [tarjetaId, setTarjetaId]       = useState("")
  const [fechaPago, setFechaPago]       = useState(todayISO())
  const [comprobante, setComprobante]   = useState<File | null>(null)
  const [observaciones, setObservaciones] = useState("")
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState("")
  const [success, setSuccess]           = useState(false)

  const usaMes              = tipoImpuesto === "IIBB" || tipoImpuesto === "IVA"
  const mostrarDescripcion  = tipoImpuesto === "OTRO"
  const esCuentaBancaria    = medioPago === "CUENTA_BANCARIA"
  const esTarjeta           = medioPago === "TARJETA"

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    // Validaciones client-side adicionales
    if (esCuentaBancaria && !cuentaId) {
      setError("Seleccioná una cuenta bancaria.")
      return
    }
    if (esCuentaBancaria && !comprobante) {
      setError("El comprobante PDF es obligatorio para pagos desde cuenta bancaria.")
      return
    }
    if (esTarjeta && !tarjetaId) {
      setError("Seleccioná la tarjeta con la que se realizó el pago.")
      return
    }

    setLoading(true)
    try {
      const periodo = usaMes ? `${anio}-${mes}` : anio

      // Subir comprobante a R2 solo para cuenta bancaria
      let comprobantePdfS3Key: string | undefined
      if (esCuentaBancaria && comprobante) {
        const fd = new FormData()
        fd.append("file", comprobante)
        fd.append("prefijo", COMPROBANTE_PREFIX)
        const upRes = await fetch("/api/storage/upload", { method: "POST", body: fd })
        if (!upRes.ok) {
          const d = await upRes.json() as { error?: string }
          setError(d.error ?? "Error al subir comprobante.")
          return
        }
        const upData = await upRes.json() as { key: string }
        // Verificar que la key pertenece al prefijo correcto (defensa en profundidad)
        if (!upData.key.startsWith(`${COMPROBANTE_PREFIX}/`)) {
          setError("Error de seguridad: key de comprobante inválida.")
          return
        }
        comprobantePdfS3Key = upData.key
      }

      const res = await fetch("/api/contabilidad/impuestos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipoImpuesto,
          descripcion: mostrarDescripcion ? descripcion : undefined,
          periodo,
          monto: parseFloat(monto),
          fechaPago,
          medioPago,
          cuentaId:            esCuentaBancaria ? cuentaId    : undefined,
          tarjetaId:           esTarjeta        ? tarjetaId   : undefined,
          comprobantePdfS3Key: esCuentaBancaria ? comprobantePdfS3Key : undefined,
          observaciones: observaciones || undefined,
        }),
      })

      if (!res.ok) {
        const d = await res.json() as { error?: string }
        setError(d.error ?? "Error al guardar.")
        return
      }

      setSuccess(true)
    } catch {
      setError("Error de red.")
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
    setTarjetaId("")
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
            min="0.01"
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
            onChange={(e) => { setMedioPago(e.target.value); setCuentaId(""); setTarjetaId(""); setComprobante(null) }}
            required
          >
            {MEDIOS_PAGO.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>

        {/* Cuenta (solo CUENTA_BANCARIA) */}
        {esCuentaBancaria && (
          <div>
            <label className="text-sm font-medium">Cuenta bancaria *</label>
            <select
              className="mt-1 w-full border rounded px-3 py-2 text-sm"
              value={cuentaId}
              onChange={(e) => setCuentaId(e.target.value)}
              required
            >
              <option value="">Seleccionar cuenta...</option>
              {cuentas.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </div>
        )}

        {/* Tarjeta (solo TARJETA) */}
        {esTarjeta && (
          <div>
            <label className="text-sm font-medium">Tarjeta *</label>
            <select
              className="mt-1 w-full border rounded px-3 py-2 text-sm"
              value={tarjetaId}
              onChange={(e) => setTarjetaId(e.target.value)}
              required
            >
              <option value="">Seleccionar tarjeta...</option>
              {tarjetas.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nombre} — {t.banco} ···{t.ultimos4}
                </option>
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

        {/* Comprobante PDF — obligatorio para CUENTA_BANCARIA */}
        {esCuentaBancaria && (
          <div>
            <label className="text-sm font-medium">
              Comprobante PDF *
              <span className="ml-1 text-xs font-normal text-muted-foreground">(obligatorio — máx. 10 MB)</span>
            </label>
            <input
              type="file"
              accept="application/pdf"
              className="mt-1 w-full text-sm"
              onChange={(e) => setComprobante(e.target.files?.[0] ?? null)}
              required
            />
            {comprobante && (
              <p className="text-xs text-green-700 mt-1">✓ {comprobante.name}</p>
            )}
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
