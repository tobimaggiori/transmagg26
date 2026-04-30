"use client"

import { useState, Fragment } from "react"
import { formatearMoneda, formatearFecha } from "@/lib/utils"
import { sumarImportes } from "@/lib/money"
import { calcularToneladas } from "@/lib/viajes"
import type { Liquidacion } from "./types"
import { ModalEnviarEmailOP } from "./modal-enviar-email-op"
import { HistorialPagoFletero } from "./historial-pago-fletero"

// ─── Estado badge (inline helper) ────────────────────────────────────────────

function EstadoBadge({ estado }: { estado: string }) {
  const estilos: Record<string, string> = {
    EMITIDA: "bg-blue-100 text-blue-800",
    PARCIALMENTE_PAGADA: "bg-amber-100 text-amber-800",
    PAGADA: "bg-green-100 text-green-800",
  }
  const labels: Record<string, string> = {
    PARCIALMENTE_PAGADA: "Parcial",
  }
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${estilos[estado] ?? "bg-gray-100 text-gray-800"}`}>
      {labels[estado] ?? estado}
    </span>
  )
}

/**
 * ModalDetalleLiquidacion: props -> JSX.Element
 *
 * Dado una liquidación, muestra el detalle de viajes y totales con botones de acción.
 * Existe para ver el desglose de una liquidación y cambiar su estado.
 *
 * Ejemplos:
 * <ModalDetalleLiquidacion liq={liq} onCambiarEstado={fn} onCerrar={fn} />
 */
export function ModalDetalleLiquidacion({
  liq,
  onAnularPago,
  onEditarPago,
  onCerrar,
}: {
  liq: Liquidacion
  onCambiarEstado?: (estado: string) => void
  onAnularPago?: (pagoId: string) => void
  onEditarPago?: (pagoId: string) => void
  onCerrar: () => void
  cargando?: boolean
}) {
  const [modalEmail, setModalEmail] = useState<{ opId: string; opNro: string } | null>(null)

  // Obtener la Orden de Pago del primer pago no anulado que la tenga
  const ordenPago = liq.pagos.find((p) => !p.anulado && p.ordenPago)?.ordenPago ?? null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">Liquidación — {liq.fletero.razonSocial}</h2>
            <p className="text-sm text-muted-foreground">{formatearFecha(new Date(liq.grabadaEn))} · <EstadoBadge estado={liq.estado} /></p>
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
                <th className="px-3 py-2 text-left">Cupo</th>
                <th className="px-3 py-2 text-left">Mercadería</th>
                <th className="px-3 py-2 text-left">Origen</th>
                <th className="px-3 py-2 text-left">Destino</th>
                <th className="px-3 py-2 text-right">Kilos</th>
                <th className="px-3 py-2 text-right">Ton</th>
                <th className="px-3 py-2 text-right">Tarifa al fletero / ton</th>
                <th className="px-3 py-2 text-right">Importe guardado</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {liq.viajes.map((v) => (
                <tr key={v.id}>
                  <td className="px-3 py-2">{formatearFecha(new Date(v.fechaViaje))}</td>
                  <td className="px-3 py-2">{v.remito ?? "-"}</td>
                  <td className="px-3 py-2">{v.cupo ?? "—"}</td>
                  <td className="px-3 py-2">{v.mercaderia ?? "-"}</td>
                  <td className="px-3 py-2">{v.provinciaOrigen ?? v.procedencia ?? "-"}</td>
                  <td className="px-3 py-2">{v.provinciaDestino ?? v.destino ?? "-"}</td>
                  <td className="px-3 py-2 text-right">{v.kilos?.toLocaleString("es-AR") ?? "-"}</td>
                  <td className="px-3 py-2 text-right">{v.kilos != null ? calcularToneladas(v.kilos) : "-"}</td>
                  <td className="px-3 py-2 text-right">{formatearMoneda(v.tarifaFletero)}</td>
                  <td className="px-3 py-2 text-right font-medium">{formatearMoneda(v.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totales */}
        <div className="space-y-1 text-sm mb-4">
          <div className="flex justify-between"><span>Total viajes:</span><span>{formatearMoneda(liq.subtotalBruto)}</span></div>
          <div className="flex justify-between"><span>Comisión ({liq.comisionPct}%):</span><span>- {formatearMoneda(liq.comisionMonto)}</span></div>
          <div className="flex justify-between font-medium"><span>Subtotal neto:</span><span>{formatearMoneda(liq.neto)}</span></div>
          <div className="flex justify-between"><span>IVA ({liq.ivaPct ?? 21}%):</span><span>+ {formatearMoneda(liq.ivaMonto)}</span></div>
          <div className="flex justify-between font-bold text-base border-t pt-1"><span>TOTAL FINAL:</span><span>{formatearMoneda(liq.total)}</span></div>
        </div>

        {/* Pagos registrados */}
        {liq.pagos.length > 0 && (
          <div className="mb-4">
            <p className="text-sm font-medium mb-2">Pagos registrados</p>
            <div className="rounded border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-3 py-2 text-left">Fecha</th>
                    <th className="px-3 py-2 text-left">Tipo</th>
                    <th className="px-3 py-2 text-right">Monto</th>
                    <th className="px-3 py-2" />
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {liq.pagos.map((p) => (
                    <Fragment key={p.id}>
                      <tr className={p.anulado ? "opacity-50 line-through" : ""}>
                        <td className="px-3 py-2">{formatearFecha(new Date(p.fechaPago))}</td>
                        <td className="px-3 py-2 capitalize">{p.tipoPago.replace(/_/g, " ").toLowerCase()}</td>
                        <td className="px-3 py-2 text-right">{formatearMoneda(p.monto)}</td>
                        <td className="px-3 py-2">
                          {!p.anulado && (
                            <div className="flex gap-1 justify-end">
                              <button
                                onClick={() => onEditarPago?.(p.id)}
                                className="h-6 px-2 rounded border text-xs font-medium hover:bg-accent"
                              >
                                Editar
                              </button>
                              <button
                                onClick={() => onAnularPago?.(p.id)}
                                className="h-6 px-2 rounded border text-xs font-medium text-red-600 hover:bg-red-50"
                              >
                                Anular
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                      <tr>
                        <td colSpan={4} className="px-3 pb-2">
                          <HistorialPagoFletero pagoId={p.id} />
                        </td>
                      </tr>
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Gastos descontados */}
        {(liq.gastoDescuentos?.length ?? 0) > 0 && (
          <div className="mb-4">
            <p className="text-sm font-medium mb-2">Gastos descontados</p>
            <div className="rounded border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-3 py-2 text-left">Proveedor</th>
                    <th className="px-3 py-2 text-left">Comprobante</th>
                    <th className="px-3 py-2 text-right">Monto descontado</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {liq.gastoDescuentos!.map((d) => (
                    <tr key={d.id}>
                      <td className="px-3 py-2">{d.gasto.facturaProveedor.proveedor.razonSocial}</td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {d.gasto.facturaProveedor.tipoCbte} {d.gasto.facturaProveedor.nroComprobante ?? "s/n"}
                      </td>
                      <td className="px-3 py-2 text-right text-orange-600">
                        {formatearMoneda(d.montoDescontado)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t font-semibold">
                    <td colSpan={2} className="px-3 py-2">Total gastos descontados</td>
                    <td className="px-3 py-2 text-right text-orange-600">
                      {formatearMoneda(sumarImportes(liq.gastoDescuentos!.map(d => d.montoDescontado)))}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* Orden de Pago */}
        {ordenPago && (
          <div className="mb-4 pt-4 border-t">
            <p className="text-sm font-medium mb-2">
              Orden de Pago Nro {ordenPago.nro}-{ordenPago.anio}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => { window.location.href = `/api/ordenes-pago/${ordenPago.id}/pdf` }}
                className="h-8 px-3 rounded-md border text-xs font-medium hover:bg-accent"
              >
                Ver PDF
              </button>
              <button
                onClick={() => setModalEmail({ opId: ordenPago.id, opNro: `${ordenPago.nro}-${ordenPago.anio}` })}
                className="h-8 px-3 rounded-md border text-xs font-medium hover:bg-accent"
              >
                Enviar por email
              </button>
            </div>
          </div>
        )}

        {modalEmail && (
          <ModalEnviarEmailOP
            opId={modalEmail.opId}
            opNro={modalEmail.opNro}
            fleteroId={liq.fleteroId}
            onCerrar={() => setModalEmail(null)}
          />
        )}

        {/* Acciones */}
        <div className="flex justify-between items-center">
          <button
            onClick={() => window.print()}
            className="h-9 px-4 rounded-md border text-sm font-medium hover:bg-accent"
          >
            Descargar PDF
          </button>
          <div className="flex gap-2" />
        </div>
      </div>
    </div>
  )
}
