"use client"

/**
 * Propósito: Componente cliente para gestión de Notas de Crédito y Débito.
 * Muestra listado con filtros por tipo, detalle en modal, y botones de acción.
 */

import { useState, useEffect, useCallback } from "react"
import { labelTipoNotaCD, labelSubtipoNotaCD, esEmitida } from "@/lib/nota-cd-utils"
import { formatearMoneda, formatearFecha } from "@/lib/utils"

// ─── TIPOS ────────────────────────────────────────────────────────────────────

interface NotaCD {
  id: string
  tipo: string
  subtipo: string | null
  montoNeto: number
  montoIva: number
  montoTotal: number
  descripcion: string | null
  estado: string
  arcaEstado: string | null
  nroComprobante: number | null
  creadoEn: string
  factura: {
    id: string
    nroComprobante: string | null
    empresa: { razonSocial: string }
  } | null
  liquidacion: {
    id: string
    nroComprobante: number | null
    fletero: { razonSocial: string }
  } | null
  operador: { nombre: string; apellido: string }
  viajesAfectados: {
    id: string
    viajeId: string
    tarifaOriginal: number
    kilosOriginal: number | null
    subtotalOriginal: number
    subtotalCorregido: number | null
  }[]
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

/**
 * badgeColorTipo: string -> string
 *
 * Dado el tipo de nota CD, devuelve las clases CSS Tailwind para el badge de color.
 * NC_EMITIDA=azul, ND_EMITIDA=naranja, NC_RECIBIDA=verde, ND_RECIBIDA=rojo.
 * Existe para centralizar los colores de los badges sin duplicar en la tabla.
 *
 * Ejemplos:
 * badgeColorTipo("NC_EMITIDA")  === "bg-blue-100 text-blue-800"
 * badgeColorTipo("ND_EMITIDA")  === "bg-orange-100 text-orange-800"
 * badgeColorTipo("NC_RECIBIDA") === "bg-green-100 text-green-800"
 * badgeColorTipo("ND_RECIBIDA") === "bg-red-100 text-red-800"
 * badgeColorTipo("OTRO")        === "bg-gray-100 text-gray-800"
 */
function badgeColorTipo(tipo: string): string {
  const mapa: Record<string, string> = {
    NC_EMITIDA: "bg-blue-100 text-blue-800",
    ND_EMITIDA: "bg-orange-100 text-orange-800",
    NC_RECIBIDA: "bg-green-100 text-green-800",
    ND_RECIBIDA: "bg-red-100 text-red-800",
  }
  return mapa[tipo] ?? "bg-gray-100 text-gray-800"
}

/**
 * badgeColorArca: string -> string
 *
 * Dado el estado ARCA de una nota, devuelve las clases CSS Tailwind para el badge.
 * PENDIENTE=gris, AUTORIZADA=verde, RECHAZADA=rojo.
 * Existe para mostrar visualmente el estado de autorización ARCA en la tabla.
 *
 * Ejemplos:
 * badgeColorArca("PENDIENTE")  === "bg-gray-100 text-gray-600"
 * badgeColorArca("AUTORIZADA") === "bg-green-100 text-green-800"
 * badgeColorArca("RECHAZADA")  === "bg-red-100 text-red-800"
 */
function badgeColorArca(estado: string): string {
  const mapa: Record<string, string> = {
    PENDIENTE: "bg-gray-100 text-gray-600",
    AUTORIZADA: "bg-green-100 text-green-800",
    RECHAZADA: "bg-red-100 text-red-800",
  }
  return mapa[estado] ?? "bg-gray-100 text-gray-600"
}

/**
 * etiquetaAsociado: NotaCD -> string
 *
 * Dado una nota CD, devuelve texto describiendo el documento asociado
 * (factura, liquidación o cheque recibido).
 * Existe para la columna "Asociado a" de la tabla sin duplicar lógica condicional.
 *
 * Ejemplos:
 * etiquetaAsociado({ factura: { empresa: { razonSocial: "ABC" }, nroComprobante: "0001-001" } })
 * // === "Factura 0001-001 - ABC"
 * etiquetaAsociado({ liquidacion: { fletero: { razonSocial: "Juan" }, nroComprobante: 5 } })
 * // === "Liquidación 5 - Juan"
 */
function etiquetaAsociado(nota: NotaCD): string {
  if (nota.factura) {
    return `Factura ${nota.factura.nroComprobante ?? "s/n"} — ${nota.factura.empresa.razonSocial}`
  }
  if (nota.liquidacion) {
    return `Liquidación ${nota.liquidacion.nroComprobante ?? "s/n"} — ${nota.liquidacion.fletero.razonSocial}`
  }
  return "—"
}

// ─── MODAL DETALLE ────────────────────────────────────────────────────────────

/**
 * ModalDetalleNota: { nota: NotaCD; onClose: () => void } -> JSX.Element
 *
 * Dado una nota CD y función de cierre, renderiza un modal con todos los campos
 * de la nota, tabla de viajes afectados y botón "Descargar PDF".
 * La autorización ARCA se realiza al momento de crear la nota (emisión directa).
 * Existe para la vista de detalle de una NC/ND sin navegación a página nueva.
 *
 * Ejemplos:
 * <ModalDetalleNota nota={notaCD} onClose={() => setNotaSeleccionada(null)} />
 * // => modal con campos completos y viajes afectados
 */
function ModalDetalleNota({ nota, onClose }: { nota: NotaCD; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-semibold">Detalle de Nota</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 text-xl font-bold leading-none"
          >
            ×
          </button>
        </div>

        <div className="px-6 py-4 space-y-4">
          {/* Tipo y Subtipo */}
          <div className="flex flex-wrap gap-3 items-center">
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${badgeColorTipo(nota.tipo)}`}>
              {labelTipoNotaCD(nota.tipo)}
            </span>
            {nota.subtipo && (
              <span className="text-sm text-gray-500">{labelSubtipoNotaCD(nota.subtipo)}</span>
            )}
            <span className="text-sm text-gray-400">Estado: <strong>{nota.estado}</strong></span>
          </div>

          {/* Datos principales */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Nro. Comprobante</p>
              <p className="font-medium">{nota.nroComprobante ?? "—"}</p>
            </div>
            <div>
              <p className="text-gray-500">Fecha</p>
              <p className="font-medium">{formatearFecha(nota.creadoEn)}</p>
            </div>
            <div>
              <p className="text-gray-500">Monto Neto</p>
              <p className="font-medium">{formatearMoneda(nota.montoNeto)}</p>
            </div>
            <div>
              <p className="text-gray-500">IVA</p>
              <p className="font-medium">{formatearMoneda(nota.montoIva)}</p>
            </div>
            <div>
              <p className="text-gray-500">Total</p>
              <p className="font-semibold text-base">{formatearMoneda(nota.montoTotal)}</p>
            </div>
            {esEmitida(nota.tipo) && (
              <div>
                <p className="text-gray-500">Estado ARCA</p>
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${badgeColorArca(nota.arcaEstado ?? "PENDIENTE")}`}>
                  {nota.arcaEstado ?? "PENDIENTE"}
                </span>
              </div>
            )}
          </div>

          {/* Asociado a */}
          <div className="text-sm">
            <p className="text-gray-500">Asociado a</p>
            <p className="font-medium">{etiquetaAsociado(nota)}</p>
          </div>

          {/* Descripción */}
          {nota.descripcion && (
            <div className="text-sm">
              <p className="text-gray-500">Descripción</p>
              <p>{nota.descripcion}</p>
            </div>
          )}

          {/* Operador */}
          <div className="text-sm">
            <p className="text-gray-500">Operador</p>
            <p>{nota.operador.nombre} {nota.operador.apellido}</p>
          </div>

          {/* Viajes afectados */}
          {nota.viajesAfectados.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Viajes afectados</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border rounded-md">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-3 py-2 font-medium text-gray-600">Viaje ID</th>
                      <th className="text-right px-3 py-2 font-medium text-gray-600">Tarifa original</th>
                      <th className="text-right px-3 py-2 font-medium text-gray-600">Kilos</th>
                      <th className="text-right px-3 py-2 font-medium text-gray-600">Subtotal original</th>
                      <th className="text-right px-3 py-2 font-medium text-gray-600">Subtotal corregido</th>
                    </tr>
                  </thead>
                  <tbody>
                    {nota.viajesAfectados.map((v) => (
                      <tr key={v.id} className="border-t">
                        <td className="px-3 py-2 font-mono text-xs text-gray-500">{v.viajeId.slice(0, 8)}…</td>
                        <td className="px-3 py-2 text-right">{formatearMoneda(v.tarifaOriginal)}</td>
                        <td className="px-3 py-2 text-right">{v.kilosOriginal ?? "—"}</td>
                        <td className="px-3 py-2 text-right">{formatearMoneda(v.subtotalOriginal)}</td>
                        <td className="px-3 py-2 text-right">{v.subtotalCorregido != null ? formatearMoneda(v.subtotalCorregido) : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Botones de acción */}
        <div className="flex items-center justify-end gap-3 border-t px-6 py-4">
          <button
            onClick={() => alert("Generación de PDF pendiente")}
            className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-gray-50"
          >
            Descargar PDF
          </button>
          <button
            onClick={onClose}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────

/**
 * NotasCDClient: () -> JSX.Element
 *
 * Componente cliente principal de la sección Notas de Crédito / Débito.
 * Muestra encabezado, barra de filtros por tipo, tabla con columnas tipo,
 * subtipo, asociado a, fecha, monto total, estado, ARCA y botón de detalle.
 * Al hacer clic en "Ver detalle" abre ModalDetalleNota.
 * Recarga los datos al cambiar el filtro de tipo.
 * Existe para que el operador consulte, filtre y gestione todas las NC/ND del sistema.
 *
 * Ejemplos:
 * <NotasCDClient />
 * // => tabla de NC/ND con filtro "Todas" por defecto
 */
export function NotasCDClient() {
  const [filtroTipo, setFiltroTipo] = useState<string>("")
  const [notas, setNotas] = useState<NotaCD[]>([])
  const [cargando, setCargando] = useState(true)
  const [notaSeleccionada, setNotaSeleccionada] = useState<NotaCD | null>(null)

  const cargarNotas = useCallback(async () => {
    setCargando(true)
    try {
      const params = new URLSearchParams()
      if (filtroTipo) params.set("tipo", filtroTipo)
      const res = await fetch(`/api/notas-credito-debito?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setNotas(data)
      }
    } finally {
      setCargando(false)
    }
  }, [filtroTipo])

  useEffect(() => {
    cargarNotas()
  }, [cargarNotas])

  const TIPOS_FILTRO = [
    { value: "", label: "Todas" },
    { value: "NC_EMITIDA", label: "NC Emitidas" },
    { value: "ND_EMITIDA", label: "ND Emitidas" },
    { value: "NC_RECIBIDA", label: "NC Recibidas" },
    { value: "ND_RECIBIDA", label: "ND Recibidas" },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Notas de Crédito / Débito</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gestión de NC/ND emitidas y recibidas por Transmagg
        </p>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        {TIPOS_FILTRO.map((t) => (
          <button
            key={t.value}
            onClick={() => setFiltroTipo(t.value)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium border transition-colors ${
              filtroTipo === t.value
                ? "bg-primary text-white border-primary"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tabla */}
      {cargando ? (
        <div className="text-center py-12 text-muted-foreground">Cargando…</div>
      ) : notas.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No hay notas de crédito/débito para mostrar.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Tipo</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Subtipo</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Asociado a</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Fecha</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Monto total</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Estado</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">ARCA</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {notas.map((nota) => (
                <tr key={nota.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${badgeColorTipo(nota.tipo)}`}>
                      {labelTipoNotaCD(nota.tipo)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {nota.subtipo ? labelSubtipoNotaCD(nota.subtipo) : "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{etiquetaAsociado(nota)}</td>
                  <td className="px-4 py-3 text-gray-600">{formatearFecha(nota.creadoEn)}</td>
                  <td className="px-4 py-3 text-right font-medium">{formatearMoneda(nota.montoTotal)}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-medium text-gray-600">{nota.estado}</span>
                  </td>
                  <td className="px-4 py-3">
                    {esEmitida(nota.tipo) ? (
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${badgeColorArca(nota.arcaEstado ?? "PENDIENTE")}`}>
                        {nota.arcaEstado ?? "PENDIENTE"}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setNotaSeleccionada(nota)}
                      className="text-sm text-primary hover:underline font-medium"
                    >
                      Ver detalle
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {notaSeleccionada && (
        <ModalDetalleNota
          nota={notaSeleccionada}
          onClose={() => setNotaSeleccionada(null)}
        />
      )}
    </div>
  )
}
