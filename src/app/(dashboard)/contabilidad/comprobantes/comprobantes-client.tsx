"use client"

import { useState } from "react"

const OPCIONES_TIPO = [
  { value: "facturas-emitidas", label: "Facturas Emitidas" },
  { value: "liquidaciones", label: "Liquidaciones" },
  { value: "notas-credito-debito", label: "Notas de Crédito/Débito" },
  { value: "ordenes-pago", label: "Órdenes de Pago" },
  { value: "recibos-cobranza", label: "Recibos de Cobranza" },
  { value: "facturas-proveedor", label: "Facturas Proveedor" },
  { value: "resumenes-bancarios", label: "Resúmenes Bancarios" },
  { value: "resumenes-tarjeta", label: "Resúmenes Tarjeta" },
] as const

interface Comprobante {
  id: string
  tipo: string
  nombreArchivo: string
  fecha: string
  r2Key: string
  r2KeysExtra: string[]
}

interface Props {
  puedeEliminar: boolean
}

export function ComprobantesClient({ puedeEliminar }: Props) {
  const [tipo, setTipo] = useState("")
  const [desde, setDesde] = useState("")
  const [hasta, setHasta] = useState("")
  const [comprobantes, setComprobantes] = useState<Comprobante[]>([])
  const [cantidad, setCantidad] = useState(0)
  const [totalArchivos, setTotalArchivos] = useState(0)
  const [cargando, setCargando] = useState(false)
  const [exportando, setExportando] = useState(false)
  const [eliminando, setEliminando] = useState(false)
  const [confirmarEliminar, setConfirmarEliminar] = useState(false)
  const [mensaje, setMensaje] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null)

  async function buscar() {
    if (!tipo || !desde || !hasta) return
    setCargando(true)
    setMensaje(null)
    setConfirmarEliminar(false)
    try {
      const params = new URLSearchParams({ tipo, desde, hasta })
      const res = await fetch(`/api/contabilidad/comprobantes?${params}`)
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? "Error al buscar")
      }
      const data = await res.json()
      setComprobantes(data.comprobantes)
      setCantidad(data.cantidad)
      setTotalArchivos(data.totalArchivos)
    } catch (err) {
      setMensaje({ tipo: "error", texto: err instanceof Error ? err.message : "Error al buscar" })
      setComprobantes([])
    } finally {
      setCargando(false)
    }
  }

  async function exportarZip() {
    if (!tipo || !desde || !hasta) return
    setExportando(true)
    setMensaje(null)
    try {
      const res = await fetch("/api/contabilidad/comprobantes/exportar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo, desde, hasta }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? "Error al exportar")
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `comprobantes-${tipo}-${desde}-${hasta}.zip`
      a.click()
      URL.revokeObjectURL(url)
      setMensaje({ tipo: "ok", texto: "ZIP descargado correctamente" })
    } catch (err) {
      setMensaje({ tipo: "error", texto: err instanceof Error ? err.message : "Error al exportar" })
    } finally {
      setExportando(false)
    }
  }

  async function eliminar() {
    if (!tipo || !desde || !hasta) return
    setEliminando(true)
    setMensaje(null)
    try {
      const res = await fetch("/api/contabilidad/comprobantes", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo, desde, hasta }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? "Error al eliminar")
      }
      const data = await res.json()
      setMensaje({ tipo: "ok", texto: `${data.eliminados} archivo(s) eliminados de R2` })
      setComprobantes([])
      setCantidad(0)
      setTotalArchivos(0)
      setConfirmarEliminar(false)
    } catch (err) {
      setMensaje({ tipo: "error", texto: err instanceof Error ? err.message : "Error al eliminar" })
    } finally {
      setEliminando(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Comprobantes R2</h2>
        <p className="text-muted-foreground">Gestión de archivos PDF almacenados en Cloudflare R2</p>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-4 items-end">
        <div className="space-y-1">
          <label className="text-sm font-medium">Tipo de comprobante</label>
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            className="block w-56 rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">Seleccionar...</option>
            {OPCIONES_TIPO.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Desde</label>
          <input
            type="date"
            value={desde}
            onChange={(e) => setDesde(e.target.value)}
            className="block rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Hasta</label>
          <input
            type="date"
            value={hasta}
            onChange={(e) => setHasta(e.target.value)}
            className="block rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
        <button
          onClick={buscar}
          disabled={cargando || !tipo || !desde || !hasta}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {cargando ? "Buscando..." : "Buscar"}
        </button>
      </div>

      {/* Mensaje */}
      {mensaje && (
        <div className={`rounded-md px-4 py-3 text-sm ${mensaje.tipo === "ok" ? "bg-green-500/10 text-green-700 dark:text-green-400" : "bg-destructive/10 text-destructive"}`}>
          {mensaje.texto}
        </div>
      )}

      {/* Resultados */}
      {comprobantes.length > 0 && (
        <>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>{cantidad} comprobante(s)</span>
            <span>{totalArchivos} archivo(s) en R2</span>
          </div>

          <div className="flex gap-3">
            <button
              onClick={exportarZip}
              disabled={exportando}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {exportando ? "Exportando..." : "Exportar ZIP"}
            </button>

            {puedeEliminar && !confirmarEliminar && (
              <button
                onClick={() => setConfirmarEliminar(true)}
                className="rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90"
              >
                Eliminar
              </button>
            )}
          </div>

          {/* Panel confirmación eliminar */}
          {puedeEliminar && confirmarEliminar && (
            <div className="rounded-md border border-destructive bg-destructive/5 p-4 space-y-3">
              <p className="text-sm font-medium text-destructive">
                Se eliminarán {totalArchivos} archivo(s) de R2 y se limpiarán las keys en la base de datos. Esta acción es irreversible.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={eliminar}
                  disabled={eliminando}
                  className="rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
                >
                  {eliminando ? "Eliminando..." : "Confirmar eliminación"}
                </button>
                <button
                  onClick={() => setConfirmarEliminar(false)}
                  className="rounded-md border border-input px-4 py-2 text-sm font-medium hover:bg-accent"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Tabla */}
          <div className="rounded-md border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium">Archivo</th>
                  <th className="px-4 py-3 text-left font-medium">Fecha</th>
                  <th className="px-4 py-3 text-left font-medium">Extras</th>
                </tr>
              </thead>
              <tbody>
                {comprobantes.map((c) => (
                  <tr key={c.id} className="border-b last:border-0">
                    <td className="px-4 py-3 font-mono text-xs">{c.nombreArchivo}</td>
                    <td className="px-4 py-3">{new Date(c.fecha).toLocaleDateString("es-AR")}</td>
                    <td className="px-4 py-3">
                      {c.r2KeysExtra.length > 0 && (
                        <span className="inline-flex items-center rounded-full bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-400">
                          +{c.r2KeysExtra.length} comprobante{c.r2KeysExtra.length > 1 ? "s" : ""}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
