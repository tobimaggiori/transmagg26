"use client"

import { useState } from "react"
import Link from "next/link"
import { ShieldCheck, ShieldAlert, ShieldX, FileText, Trash2, Plus } from "lucide-react"

// ── Tipos ─────────────────────────────────────────────────────────────────────

type EstadoPoliza = "VIGENTE" | "POR_VENCER" | "VENCIDA"

interface Poliza {
  id: string
  tipoBien: string
  aseguradora: string
  nroPoliza: string
  cobertura: string | null
  montoMensual: number | null
  vigenciaDesde: string
  vigenciaHasta: string
  activa: boolean
  pdfS3Key: string | null
  descripcionBien: string | null
  camion: { patenteChasis: string; patenteAcoplado: string | null } | null
  proveedor: { razonSocial: string } | null
  estadoPoliza: EstadoPoliza
}

interface ConsultarPolizasClientProps {
  polizas: Poliza[]
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const TIPO_LABELS: Record<string, string> = {
  CAMION:        "Camión",
  VEHICULO:      "Vehículo",
  INMUEBLE:      "Inmueble",
  EQUIPO:        "Equipo",
  CARGA_GENERAL: "Carga general",
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" })
}

function fmtMoneda(n: number) {
  return n.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 })
}

function bienAsegurado(p: Poliza) {
  if (p.tipoBien === "CAMION" && p.camion) {
    return p.camion.patenteAcoplado
      ? `${p.camion.patenteChasis} / ${p.camion.patenteAcoplado}`
      : p.camion.patenteChasis
  }
  return p.descripcionBien ?? "—"
}

function EstadoBadge({ estado }: { estado: EstadoPoliza }) {
  const map: Record<EstadoPoliza, { cls: string; icon: React.ReactNode; label: string }> = {
    VIGENTE:    { cls: "bg-green-50 text-green-700 border-green-200",  icon: <ShieldCheck  className="h-3 w-3" />, label: "Vigente"    },
    POR_VENCER: { cls: "bg-amber-50 text-amber-700 border-amber-200",  icon: <ShieldAlert  className="h-3 w-3" />, label: "Por vencer" },
    VENCIDA:    { cls: "bg-red-50   text-red-700   border-red-200",    icon: <ShieldX      className="h-3 w-3" />, label: "Vencida"    },
  }
  const { cls, icon, label } = map[estado]
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium border rounded px-1.5 py-0.5 ${cls}`}>
      {icon} {label}
    </span>
  )
}

// ── Componente principal ───────────────────────────────────────────────────────

export function ConsultarPolizasClient({ polizas: initialPolizas }: ConsultarPolizasClientProps) {
  const [polizas, setPolizas]     = useState<Poliza[]>(initialPolizas)
  const [filtroEstado, setFiltroEstado] = useState<EstadoPoliza | "TODOS">("TODOS")
  const [filtroTipo, setFiltroTipo]     = useState<string>("TODOS")
  const [buscar, setBuscar]             = useState("")
  const [eliminando, setEliminando]     = useState<string | null>(null)

  const filtradas = polizas.filter((p) => {
    if (filtroEstado !== "TODOS" && p.estadoPoliza !== filtroEstado) return false
    if (filtroTipo   !== "TODOS" && p.tipoBien     !== filtroTipo)   return false
    if (buscar.trim()) {
      const q = buscar.toLowerCase()
      if (
        !p.aseguradora.toLowerCase().includes(q) &&
        !p.nroPoliza.toLowerCase().includes(q) &&
        !(p.camion?.patenteChasis?.toLowerCase().includes(q)) &&
        !(p.descripcionBien?.toLowerCase().includes(q))
      ) return false
    }
    return true
  })

  async function handleEliminar(id: string) {
    if (!confirm("¿Eliminar esta póliza?")) return
    setEliminando(id)
    try {
      const res = await fetch(`/api/polizas/${id}`, { method: "DELETE" })
      if (res.ok || res.status === 204) {
        setPolizas((prev) => prev.filter((p) => p.id !== id))
      }
    } finally {
      setEliminando(null)
    }
  }

  async function handleVerPDF(id: string) {
    const res = await fetch(`/api/polizas/${id}/pdf`)
    if (res.ok) {
      const { url } = await res.json()
      window.location.href = url as string
    }
  }

  const TIPOS = ["CAMION", "VEHICULO", "INMUEBLE", "EQUIPO", "CARGA_GENERAL"]

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Pólizas de seguro</h2>
          <p className="text-muted-foreground text-sm">{filtradas.length} póliza{filtradas.length !== 1 ? "s" : ""}</p>
        </div>
        <Link
          href="/contabilidad/polizas/nueva"
          className="inline-flex items-center gap-2 h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> Nueva póliza
        </Link>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Estado */}
        <div className="inline-flex rounded-md border overflow-hidden text-sm">
          {(["TODOS", "VIGENTE", "POR_VENCER", "VENCIDA"] as const).map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => setFiltroEstado(e)}
              className={`px-3 py-1.5 border-r last:border-r-0 font-medium transition-colors ${
                filtroEstado === e ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"
              }`}
            >
              {e === "TODOS" ? "Todos" : e === "POR_VENCER" ? "Por vencer" : e === "VIGENTE" ? "Vigentes" : "Vencidas"}
            </button>
          ))}
        </div>

        {/* Tipo */}
        <select
          value={filtroTipo}
          onChange={(e) => setFiltroTipo(e.target.value)}
          className="h-9 rounded-md border bg-background px-3 text-sm"
        >
          <option value="TODOS">Todos los tipos</option>
          {TIPOS.map((t) => (
            <option key={t} value={t}>{TIPO_LABELS[t]}</option>
          ))}
        </select>

        {/* Búsqueda */}
        <input
          type="text"
          placeholder="Buscar por aseguradora, nro. póliza, patente..."
          value={buscar}
          onChange={(e) => setBuscar(e.target.value)}
          className="h-9 rounded-md border bg-background px-3 text-sm min-w-[260px]"
        />
      </div>

      {/* Tabla */}
      {filtradas.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">
          <p>No se encontraron pólizas con los filtros seleccionados.</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Compañía</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Nro. Póliza</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tipo</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Bien asegurado</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Vigencia</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Estado</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">PDF</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtradas.map((p) => (
                <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium">{p.aseguradora}</p>
                    {p.proveedor && p.proveedor.razonSocial !== p.aseguradora && (
                      <p className="text-xs text-muted-foreground">{p.proveedor.razonSocial}</p>
                    )}
                    {p.cobertura && (
                      <p className="text-xs text-muted-foreground">{p.cobertura}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{p.nroPoliza}</td>
                  <td className="px-4 py-3 text-muted-foreground">{TIPO_LABELS[p.tipoBien] ?? p.tipoBien}</td>
                  <td className="px-4 py-3">{bienAsegurado(p)}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                    {fmt(p.vigenciaDesde)} → {fmt(p.vigenciaHasta)}
                    {p.montoMensual != null && (
                      <p className="text-xs">{fmtMoneda(p.montoMensual)}/mes</p>
                    )}
                  </td>
                  <td className="px-4 py-3"><EstadoBadge estado={p.estadoPoliza} /></td>
                  <td className="px-4 py-3 text-center">
                    {p.pdfS3Key ? (
                      <button
                        type="button"
                        onClick={() => handleVerPDF(p.id)}
                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                      >
                        <FileText className="h-3.5 w-3.5" /> Ver
                      </button>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleEliminar(p.id)}
                      disabled={eliminando === p.id}
                      className="text-xs text-red-600 hover:text-red-800 hover:underline disabled:opacity-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
