"use client"

/**
 * Componente cliente para la página de detalle NC/ND de una factura.
 * Muestra dos paneles: emitidas por Trans-Magg (izquierda) y recibidas de la empresa (derecha).
 * Cada panel tiene botones para emitir o ingresar NC/ND.
 */

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { formatearMoneda, formatearFecha, formatearCuit } from "@/lib/utils"
import { labelSubtipoNotaCD, esEmitida } from "@/lib/nota-cd-utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ModalEmitirNotaEmpresa, type FacturaParaModal } from "@/components/modals/modal-emitir-nota-empresa"
import { ModalIngresarNDFaltante, type ViajeParaFaltante } from "@/components/modals/modal-ingresar-nd-faltante"

// ─── Tipos ──────────────────────────────────────────────────────────────────────

type NotaCD = {
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
  ptoVenta: number
  nroComprobanteExterno: string | null
  fechaComprobanteExterno: string | null
  creadoEn: string
  pdfS3Key: string | null
  operador: { nombre: string; apellido: string }
  items: Array<{ concepto: string; subtotal: number }>
  viajesAfectados: Array<{ viajeId: string; kilosOriginal: number | null; subtotalOriginal: number }>
}

type FacturaData = {
  id: string
  nroComprobante: string | null
  ptoVenta: number | null
  tipoCbte: number
  modalidadMiPymes: string | null
  neto: number
  ivaPct: number
  ivaMonto: number
  total: number
  estado: string
  estadoArca: string
  emitidaEn: string
  empresa: { id: string; razonSocial: string; cuit: string }
}

// ─── Helpers ────────────────────────────────────────────────────────────────────

function formatNroComprobante(ptoVenta: number | null, nro: string | number | null): string {
  if (!nro) return "—"
  return `${String(ptoVenta ?? 1).padStart(4, "0")}-${String(nro).padStart(8, "0")}`
}

function labelTipoCbte(tipoCbte: number, modalidad?: string | null): string {
  if (tipoCbte === 1) return "Fact. A"
  if (tipoCbte === 6) return "Fact. B"
  if (tipoCbte === 201) return modalidad ? `MiPyme ${modalidad}` : "MiPyme"
  return `Cbte ${tipoCbte}`
}

function badgeColorArca(estado: string | null): string {
  if (estado === "AUTORIZADA") return "bg-green-100 text-green-800"
  if (estado === "PENDIENTE") return "bg-yellow-100 text-yellow-800"
  if (estado === "RECHAZADA") return "bg-red-100 text-red-800"
  return "bg-gray-100 text-gray-600"
}

// ─── Componente ─────────────────────────────────────────────────────────────────

export function NotasFacturaClient({ facturaId }: { facturaId: string }) {
  const [factura, setFactura] = useState<FacturaData | null>(null)
  const [notas, setNotas] = useState<NotaCD[]>([])
  const [viajes, setViajes] = useState<ViajeParaFaltante[]>([])
  const [loading, setLoading] = useState(true)
  const [modalEmitir, setModalEmitir] = useState<"NC" | "ND" | null>(null)
  const [modalIngresar, setModalIngresar] = useState<"ND" | null>(null)

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/facturas/${facturaId}/notas`)
      if (res.ok) {
        const data = await res.json()
        setFactura(data.factura)
        setNotas(data.notas)
        setViajes(data.viajes)
      }
    } finally {
      setLoading(false)
    }
  }, [facturaId])

  useEffect(() => { void cargar() }, [cargar])

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Cargando...</div>
  }

  if (!factura) {
    return <div className="p-8 text-center text-muted-foreground">Factura no encontrada</div>
  }

  const notasEmitidas = notas.filter((n) => esEmitida(n.tipo))
  const notasRecibidas = notas.filter((n) => !esEmitida(n.tipo))

  const puedeEmitir = factura.estadoArca === "AUTORIZADA" &&
    ["EMITIDA", "PARCIALMENTE_COBRADA", "COBRADA"].includes(factura.estado)

  // Preparar datos para el modal de emisión
  const facturaParaModal: FacturaParaModal = {
    id: factura.id,
    tipoCbte: factura.tipoCbte,
    modalidadMiPymes: factura.modalidadMiPymes,
    ptoVenta: factura.ptoVenta,
    nroComprobante: factura.nroComprobante,
    ivaPct: factura.ivaPct,
    total: factura.total,
    empresa: factura.empresa,
    totalPagado: 0,
    notasCreditoDebito: notas.map((n) => ({ tipo: n.tipo, montoTotal: n.montoTotal })),
  }

  return (
    <div className="space-y-5">
      {/* Volver */}
      <Link href="/empresas/facturas/consultar" className="text-sm text-primary hover:underline">
        &larr; Volver a facturas
      </Link>

      {/* Header factura */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          NC/ND — Factura {labelTipoCbte(factura.tipoCbte, factura.modalidadMiPymes)}{" "}
          {formatNroComprobante(factura.ptoVenta, factura.nroComprobante)}
        </h1>
        <div className="flex flex-wrap gap-x-6 gap-y-1 mt-2 text-sm text-muted-foreground">
          <span><strong>Empresa:</strong> {factura.empresa.razonSocial} — {formatearCuit(factura.empresa.cuit)}</span>
          <span><strong>Total:</strong> {formatearMoneda(factura.total)}</span>
          <span><strong>Fecha:</strong> {formatearFecha(factura.emitidaEn)}</span>
          <span><strong>Estado:</strong> {factura.estado}</span>
        </div>
      </div>

      {/* Grid 2 columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Panel izquierdo: Emitidas por Trans-Magg */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <h2 className="text-base font-semibold">Emitidas por Trans-Magg</h2>

            {notasEmitidas.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Sin NC/ND emitidas</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-2 py-2 text-left">Tipo</th>
                      <th className="px-2 py-2 text-left">Nro</th>
                      <th className="px-2 py-2 text-left">Fecha</th>
                      <th className="px-2 py-2 text-right">Total</th>
                      <th className="px-2 py-2 text-center">ARCA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {notasEmitidas.map((n) => (
                      <tr key={n.id} className="border-b hover:bg-muted/30">
                        <td className="px-2 py-1.5">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${n.tipo === "NC_EMITIDA" ? "bg-blue-100 text-blue-800" : "bg-orange-100 text-orange-800"}`}>
                            {n.tipo === "NC_EMITIDA" ? "NC" : "ND"}
                          </span>
                          {n.subtipo && <span className="ml-1 text-muted-foreground">{labelSubtipoNotaCD(n.subtipo)}</span>}
                        </td>
                        <td className="px-2 py-1.5 font-mono">
                          {n.arcaEstado === "AUTORIZADA" ? (
                            <Link
                              href={`/comprobantes/visor?tipo=nota-cd&id=${n.id}&titulo=${encodeURIComponent(
                                `${n.tipo === "NC_EMITIDA" ? "NC" : "ND"} ${formatNroComprobante(n.ptoVenta, n.nroComprobante)}`
                              )}`}
                              className="text-primary hover:underline"
                            >
                              {formatNroComprobante(n.ptoVenta, n.nroComprobante)}
                            </Link>
                          ) : (
                            formatNroComprobante(n.ptoVenta, n.nroComprobante)
                          )}
                        </td>
                        <td className="px-2 py-1.5">{formatearFecha(n.creadoEn)}</td>
                        <td className="px-2 py-1.5 text-right font-medium">{formatearMoneda(n.montoTotal)}</td>
                        <td className="px-2 py-1.5 text-center">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${badgeColorArca(n.arcaEstado)}`}>
                            {n.arcaEstado ?? "—"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {puedeEmitir && (
              <div className="flex gap-2 pt-2">
                <Button size="sm" variant="outline" onClick={() => setModalEmitir("NC")}>Emitir NC</Button>
                <Button size="sm" variant="outline" onClick={() => setModalEmitir("ND")}>Emitir ND</Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Panel derecho: Recibidas de la empresa */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <h2 className="text-base font-semibold">Recibidas de {factura.empresa.razonSocial}</h2>

            {notasRecibidas.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Sin NC/ND recibidas</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-2 py-2 text-left">Tipo</th>
                      <th className="px-2 py-2 text-left">Nro Externo</th>
                      <th className="px-2 py-2 text-left">Fecha</th>
                      <th className="px-2 py-2 text-right">Total</th>
                      <th className="px-2 py-2 text-center">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {notasRecibidas.map((n) => (
                      <tr key={n.id} className="border-b hover:bg-muted/30">
                        <td className="px-2 py-1.5">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${n.tipo === "NC_RECIBIDA" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                            {n.tipo === "NC_RECIBIDA" ? "NC" : "ND"}
                          </span>
                          {n.subtipo && <span className="ml-1 text-muted-foreground">{labelSubtipoNotaCD(n.subtipo)}</span>}
                        </td>
                        <td className="px-2 py-1.5 font-mono">
                          {n.pdfS3Key && n.nroComprobanteExterno ? (
                            <Link
                              href={`/comprobantes/visor?tipo=nota-cd&id=${n.id}&titulo=${encodeURIComponent(
                                `${n.tipo === "NC_RECIBIDA" ? "NC" : "ND"} Recibida ${n.nroComprobanteExterno}`
                              )}`}
                              className="text-primary hover:underline"
                            >
                              {n.nroComprobanteExterno}
                            </Link>
                          ) : (
                            n.nroComprobanteExterno ?? "—"
                          )}
                        </td>
                        <td className="px-2 py-1.5">{n.fechaComprobanteExterno ? formatearFecha(n.fechaComprobanteExterno) : formatearFecha(n.creadoEn)}</td>
                        <td className="px-2 py-1.5 text-right font-medium">{formatearMoneda(n.montoTotal)}</td>
                        <td className="px-2 py-1.5 text-center">
                          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium bg-gray-100 text-gray-700">
                            {n.estado}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button size="sm" variant="outline" disabled title="Próximamente">Ingresar NC</Button>
              <Button size="sm" variant="outline" onClick={() => setModalIngresar("ND")}>Ingresar ND</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal emisión NC/ND */}
      {modalEmitir && (
        <ModalEmitirNotaEmpresa
          factura={facturaParaModal}
          tipoForzado={modalEmitir}
          onClose={() => setModalEmitir(null)}
          onEmitida={() => { setModalEmitir(null); void cargar() }}
        />
      )}

      {/* Modal ingresar ND faltante */}
      {modalIngresar && (
        <ModalIngresarNDFaltante
          facturaId={facturaId}
          viajes={viajes}
          onClose={() => setModalIngresar(null)}
          onRegistrada={() => { setModalIngresar(null); void cargar() }}
        />
      )}
    </div>
  )
}
