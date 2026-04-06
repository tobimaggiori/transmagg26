"use client"

import { useState, useEffect, useMemo } from "react"
import { formatearMoneda, formatearFecha } from "@/lib/utils"
import { sumarImportes } from "@/lib/money"
import { calcularToneladas } from "@/lib/viajes"
import { labelTipoNotaCD, labelSubtipoNotaCD } from "@/lib/nota-cd-utils"
import { notasDisponibles } from "@/lib/arca/catalogo"
import { ModalEmitirNC } from "./modal-emitir-nc"
import { ModalEmitirND } from "./modal-emitir-nd"
import type { Factura, NotaCDResumen } from "./types"

// ─── Estado badge (duplicado local, ~17 líneas) ─────────────────────────────

function EstadoBadge({ estado }: { estado: string }) {
  const estilos: Record<string, string> = {
    EMITIDA: "bg-blue-100 text-blue-800",
    PARCIALMENTE_COBRADA: "bg-amber-100 text-amber-800",
    COBRADA: "bg-green-100 text-green-800",
  }
  const labels: Record<string, string> = {
    PARCIALMENTE_COBRADA: "Parcial",
  }
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${estilos[estado] ?? "bg-gray-100 text-gray-800"}`}>
      {labels[estado] ?? estado}
    </span>
  )
}

// ─── Modal detalle factura ────────────────────────────────────────────────────

/**
 * ModalDetalleFactura: props -> JSX.Element
 *
 * Dado una factura, muestra el detalle de viajes y totales con botones de acción.
 * Existe para ver el desglose de una factura y cambiar su estado.
 *
 * Ejemplos:
 * <ModalDetalleFactura factura={fact} onCambiarEstado={fn} onCerrar={fn} />
 */
export function ModalDetalleFactura({
  factura,
  comprobantesHabilitados = [],
  onRegistrarCobro,
  onCerrar,
  cargando,
}: {
  factura: Factura
  comprobantesHabilitados?: number[]
  onCambiarEstado?: (estado: string, nroComprobante?: string) => void
  onRegistrarCobro: () => void
  onCerrar: () => void
  cargando: boolean
}) {
  const [notasCD, setNotasCD] = useState<NotaCDResumen[]>([])
  const [mostrarModalNC, setMostrarModalNC] = useState(false)
  const [mostrarModalND, setMostrarModalND] = useState(false)
  const pagado = sumarImportes(factura.pagos.map(p => p.monto))

  // Notas disponibles según config ARCA
  const notasDisp = useMemo(
    () => notasDisponibles(factura.tipoCbte, comprobantesHabilitados),
    [factura.tipoCbte, comprobantesHabilitados]
  )
  const puedeEmitirNC = notasDisp.some((n) => n.rol === "nota_credito")
  const puedeEmitirND = notasDisp.some((n) => n.rol === "nota_debito")

  useEffect(() => {
    async function cargarNotasCD() {
      try {
        const res = await fetch(`/api/notas-credito-debito?facturaId=${factura.id}`)
        if (res.ok) setNotasCD(await res.json())
      } catch { /* silencioso */ }
    }
    cargarNotasCD()
  }, [factura.id])

  function handleExitoNota() {
    setMostrarModalNC(false)
    setMostrarModalND(false)
    // Recargar notas
    fetch(`/api/notas-credito-debito?facturaId=${factura.id}`)
      .then((r) => r.json())
      .then(setNotasCD)
      .catch(() => {})
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">Factura — {factura.empresa.razonSocial}</h2>
            <p className="text-sm text-muted-foreground">
              {formatearFecha(new Date(factura.emitidaEn))} · Tipo {factura.tipoCbte}
              {factura.nroComprobante ? ` · #${factura.nroComprobante}` : ""} · <EstadoBadge estado={factura.estado} />
            </p>
          </div>
          <button onClick={onCerrar} className="text-muted-foreground hover:text-foreground text-xl leading-none">&times;</button>
        </div>

        {/* Tabla de viajes */}
        <div className="overflow-x-auto rounded border mb-4">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-3 py-2 text-left">Fecha</th>
                <th className="px-3 py-2 text-left">Remito</th>
                <th className="px-3 py-2 text-left">Mercadería</th>
                <th className="px-3 py-2 text-left">Origen</th>
                <th className="px-3 py-2 text-left">Destino</th>
                <th className="px-3 py-2 text-right">Kilos</th>
                <th className="px-3 py-2 text-right">Ton</th>
                <th className="px-3 py-2 text-right">Tarifa a la empresa / ton</th>
                <th className="px-3 py-2 text-right">Importe guardado</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {factura.viajes.map((v) => (
                <tr key={v.id}>
                  <td className="px-3 py-2">{formatearFecha(new Date(v.fechaViaje))}</td>
                  <td className="px-3 py-2">{v.remito ?? "-"}</td>
                  <td className="px-3 py-2">{v.mercaderia ?? "-"}</td>
                  <td className="px-3 py-2">{v.provinciaOrigen ?? v.procedencia ?? "-"}</td>
                  <td className="px-3 py-2">{v.provinciaDestino ?? v.destino ?? "-"}</td>
                  <td className="px-3 py-2 text-right">{v.kilos?.toLocaleString("es-AR") ?? "-"}</td>
                  <td className="px-3 py-2 text-right">{v.kilos != null ? calcularToneladas(v.kilos) : "-"}</td>
                  <td className="px-3 py-2 text-right">{formatearMoneda(v.tarifaEmpresa)}</td>
                  <td className="px-3 py-2 text-right font-medium">{formatearMoneda(v.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totales */}
        <div className="space-y-1 text-sm mb-4">
          <div className="flex justify-between font-medium"><span>Neto:</span><span>{formatearMoneda(factura.neto)}</span></div>
          <div className="flex justify-between"><span>IVA ({factura.ivaPct ?? 21}%):</span><span>+ {formatearMoneda(factura.ivaMonto)}</span></div>
          <div className="flex justify-between font-bold text-base border-t pt-1"><span>TOTAL:</span><span>{formatearMoneda(factura.total)}</span></div>
          {pagado > 0 && (
            <div className="flex justify-between text-green-700"><span>Pagado:</span><span>{formatearMoneda(pagado)}</span></div>
          )}
        </div>

        {/* Sección NC/ND */}
        <div className="mt-4 border-t pt-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-700">Notas de Crédito / Débito</h3>
            <div className="flex gap-2">
                {puedeEmitirNC && (
                  <button
                    onClick={() => setMostrarModalNC(true)}
                    className="h-7 px-3 rounded-md bg-blue-100 text-blue-700 text-xs font-medium hover:bg-blue-200"
                  >
                    Emitir NC
                  </button>
                )}
                {puedeEmitirND && (
                  <button
                    onClick={() => setMostrarModalND(true)}
                    className="h-7 px-3 rounded-md bg-orange-100 text-orange-700 text-xs font-medium hover:bg-orange-200"
                  >
                    Emitir ND
                  </button>
                )}
                {!puedeEmitirNC && !puedeEmitirND && (
                  <span className="text-xs text-muted-foreground">NC/ND no habilitadas en configuración ARCA</span>
                )}
              </div>
          </div>
          {notasCD.length === 0 ? (
            <p className="text-xs text-muted-foreground">No hay NC/ND para esta factura.</p>
          ) : (
            <div className="overflow-x-auto rounded border text-xs">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">Tipo</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">Fecha</th>
                    <th className="text-right px-3 py-2 font-medium text-gray-600">Monto</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {notasCD.map((n) => (
                    <tr key={n.id} className="border-t">
                      <td className="px-3 py-1.5">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${n.tipo === "NC_EMITIDA" ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700"}`}>
                          {labelTipoNotaCD(n.tipo)}
                        </span>
                        {n.subtipo && <span className="ml-1 text-gray-500">{labelSubtipoNotaCD(n.subtipo)}</span>}
                      </td>
                      <td className="px-3 py-1.5 text-gray-600">{formatearFecha(n.creadoEn)}</td>
                      <td className="px-3 py-1.5 text-right font-medium">{formatearMoneda(n.montoTotal)}</td>
                      <td className="px-3 py-1.5 text-gray-600">{n.estado}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Acciones */}
        <div className="flex justify-between items-center mt-4">
          <button
            onClick={() => window.print()}
            className="h-9 px-4 rounded-md border text-sm font-medium hover:bg-accent"
          >
            Descargar PDF
          </button>
          <div className="flex gap-2">
            {(factura.estado === "EMITIDA" || factura.estado === "PARCIALMENTE_COBRADA") && (
              <button
                onClick={onRegistrarCobro}
                disabled={cargando}
                className="h-9 px-4 rounded-md bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-50"
              >
                Registrar cobro
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Modales NC/ND (dentro del ModalDetalleFactura) */}
      {mostrarModalNC && (
        <ModalEmitirNC
          facturaId={factura.id}
          totalFactura={factura.total}
          netoFactura={factura.neto}
          viajes={factura.viajes}
          onExito={handleExitoNota}
          onClose={() => setMostrarModalNC(false)}
        />
      )}
      {mostrarModalND && (
        <ModalEmitirND
          facturaId={factura.id}
          onExito={handleExitoNota}
          onClose={() => setMostrarModalND(false)}
        />
      )}
    </div>
  )
}
