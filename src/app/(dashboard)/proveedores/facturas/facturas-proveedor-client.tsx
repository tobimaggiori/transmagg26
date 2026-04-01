"use client"

import { useState, useCallback, useEffect, Fragment } from "react"
import { SearchCombobox } from "@/components/ui/search-combobox"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ViewPDF } from "@/components/view-pdf"
import { formatearMoneda, formatearFecha } from "@/lib/utils"

type Proveedor = { id: string; razonSocial: string; cuit: string }

type ItemFacturaProveedor = {
  id: string
  descripcion: string
  cantidad: number
  precioUnitario: number
  alicuotaIva: number
  esExento: boolean
  subtotalNeto: number
  montoIva: number
  subtotalTotal: number
}

type PagoFactura = {
  id: string
  monto: number
  tipo: string
  fecha: string
  observaciones: string | null
  comprobantePdfS3Key: string | null
  resumenTarjeta: { id: string; periodo: string; s3Key: string | null } | null
  anulado?: boolean
}

type FacturaProveedor = {
  id: string
  nroComprobante: string
  tipoCbte: string
  fechaCbte: string
  neto: number
  ivaMonto: number
  total: number
  concepto: string | null
  pdfS3Key: string | null
  estadoPago: string
  proveedor: { id: string; razonSocial: string; cuit: string }
  saldoPendiente: number
  pagos: PagoFactura[]
  items: ItemFacturaProveedor[]
}

type FacturasProveedorClientProps = { proveedores: Proveedor[] }

const BADGE_ESTADO: Record<string, string> = {
  PENDIENTE: "bg-red-100 text-red-800",
  PARCIALMENTE_PAGADA: "bg-yellow-100 text-yellow-800",
  PAGADA: "bg-green-100 text-green-800",
}

const LABEL_ESTADO: Record<string, string> = {
  PENDIENTE: "Pendiente",
  PARCIALMENTE_PAGADA: "Parcial",
  PAGADA: "Pagada",
}

const LABEL_TIPO_PAGO: Record<string, string> = {
  TRANSFERENCIA: "Transferencia",
  CHEQUE_PROPIO: "Cheque propio",
  CHEQUE_FISICO_TERCERO: "Cheque físico",
  CHEQUE_ELECTRONICO_TERCERO: "ECheq",
  TARJETA_CREDITO: "T. Crédito",
  TARJETA_DEBITO: "T. Débito",
  TARJETA_PREPAGA: "T. Prepaga",
  EFECTIVO: "Efectivo",
}

/**
 * FacturasProveedorClient: FacturasProveedorClientProps -> JSX.Element
 *
 * Dado la lista de proveedores, muestra filtros y tabla de facturas de proveedores.
 * Incluye filtro por estado de pago, botones PDF para factura y comprobante de pago,
 * y modal de detalle con historial de pagos.
 */
export function FacturasProveedorClient({ proveedores }: FacturasProveedorClientProps) {
  const [desde, setDesde] = useState("")
  const [hasta, setHasta] = useState("")
  const [proveedorId, setProveedorId] = useState("")
  const [nroComprobante, setNroComprobante] = useState("")
  const [estadoPago, setEstadoPago] = useState("")
  const [facturas, setFacturas] = useState<FacturaProveedor[]>([])
  const [loading, setLoading] = useState(false)
  const [buscado, setBuscado] = useState(false)
  const [facturaDetalle, setFacturaDetalle] = useState<FacturaProveedor | null>(null)
  const [anulandoPago, setAnulandoPago] = useState<{ pagoId: string; pagoMonto: number; pagoTipo: string; pagoFecha: string } | null>(null)

  const buscar = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (desde) params.set("desde", desde)
      if (hasta) params.set("hasta", hasta)
      if (proveedorId) params.set("proveedorId", proveedorId)
      if (nroComprobante) params.set("nroComprobante", nroComprobante)
      if (estadoPago) params.set("estadoPago", estadoPago)

      const res = await fetch(`/api/facturas-proveedor?${params.toString()}`)
      if (res.ok) {
        const data = await res.json() as FacturaProveedor[]
        setFacturas(data)
      }
    } finally {
      setLoading(false)
      setBuscado(true)
    }
  }, [desde, hasta, proveedorId, nroComprobante, estadoPago])

  const totalGeneral = facturas.reduce((acc, f) => acc + f.total, 0)
  const totalPendiente = facturas.reduce((acc, f) => acc + f.saldoPendiente, 0)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Consultar Facturas de Proveedores</h2>
        <p className="text-muted-foreground">Buscá y filtrá las facturas recibidas de proveedores.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filtros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="desde">Desde</Label>
              <Input id="desde" type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="hasta">Hasta</Label>
              <Input id="hasta" type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Proveedor</Label>
            <SearchCombobox
              items={proveedores.map((p) => ({ id: p.id, label: p.razonSocial, sublabel: p.cuit }))}
              value={proveedorId}
              onChange={setProveedorId}
              placeholder="Todos los proveedores..."
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="nroComprobante">Número de comprobante</Label>
              <Input
                id="nroComprobante"
                value={nroComprobante}
                onChange={(e) => setNroComprobante(e.target.value)}
                placeholder="0001-..."
              />
            </div>
            <div className="space-y-1.5">
              <Label>Estado de pago</Label>
              <Select value={estadoPago} onChange={(e) => setEstadoPago(e.target.value)}>
                <option value="">Todos</option>
                <option value="PENDIENTE">Pendiente</option>
                <option value="PARCIALMENTE_PAGADA">Parcialmente pagada</option>
                <option value="PAGADA">Pagada</option>
              </Select>
            </div>
          </div>
          <Button onClick={buscar} disabled={loading}>
            {loading ? "Buscando..." : "Buscar"}
          </Button>
        </CardContent>
      </Card>

      {buscado && (
        <>
          {facturas.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Sin resultados</CardTitle>
                <CardDescription>No se encontraron facturas con los filtros aplicados.</CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Resultados</CardTitle>
                <CardDescription>
                  {facturas.length} factura(s) · Total: {formatearMoneda(totalGeneral)} · Pendiente: {formatearMoneda(totalPendiente)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="pb-2 pr-3">Fecha</th>
                        <th className="pb-2 pr-3">Número</th>
                        <th className="pb-2 pr-3">Proveedor</th>
                        <th className="pb-2 pr-3 text-right">Total</th>
                        <th className="pb-2 pr-3 text-right">Saldo</th>
                        <th className="pb-2 pr-3 text-center">Estado</th>
                        <th className="pb-2 pr-3 text-center">Factura</th>
                        <th className="pb-2 text-center">Comprobante</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {facturas.map((f) => {
                        // Primer comprobante de pago disponible
                        const primerComprobante = f.pagos.find(
                          (p) => p.comprobantePdfS3Key || p.resumenTarjeta?.s3Key
                        )
                        const compKey = primerComprobante?.comprobantePdfS3Key
                          ?? primerComprobante?.resumenTarjeta?.s3Key
                          ?? null

                        return (
                          <tr
                            key={f.id}
                            className="hover:bg-muted/50 cursor-pointer"
                            onClick={() => setFacturaDetalle(f)}
                          >
                            <td className="py-2 pr-3 whitespace-nowrap">{formatearFecha(f.fechaCbte)}</td>
                            <td className="py-2 pr-3 font-mono text-xs">{f.tipoCbte} {f.nroComprobante}</td>
                            <td className="py-2 pr-3">
                              <span>{f.proveedor.razonSocial}</span>
                            </td>
                            <td className="py-2 pr-3 text-right font-semibold">{formatearMoneda(f.total)}</td>
                            <td className="py-2 pr-3 text-right text-destructive">
                              {f.saldoPendiente > 0.01 ? formatearMoneda(f.saldoPendiente) : "—"}
                            </td>
                            <td className="py-2 pr-3 text-center">
                              <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${BADGE_ESTADO[f.estadoPago] ?? "bg-gray-100 text-gray-800"}`}>
                                {LABEL_ESTADO[f.estadoPago] ?? f.estadoPago}
                              </span>
                            </td>
                            <td className="py-2 pr-3 text-center" onClick={(e) => e.stopPropagation()}>
                              <ViewPDF s3Key={f.pdfS3Key} size="sm" label="Ver" />
                            </td>
                            <td className="py-2 text-center" onClick={(e) => e.stopPropagation()}>
                              {f.pagos.length > 1 ? (
                                <button
                                  className="text-xs text-primary underline underline-offset-2"
                                  onClick={() => setFacturaDetalle(f)}
                                >
                                  {f.pagos.length} pagos
                                </button>
                              ) : (
                                <ViewPDF s3Key={compKey} size="sm" label="Ver" />
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Modal detalle de factura */}
      <Dialog open={!!facturaDetalle} onOpenChange={(open) => !open && setFacturaDetalle(null)}>
        {facturaDetalle && (
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                Factura {facturaDetalle.tipoCbte} {facturaDetalle.nroComprobante} — {facturaDetalle.proveedor.razonSocial}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {/* Datos factura */}
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Fecha</p>
                  <p>{formatearFecha(facturaDetalle.fechaCbte)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Concepto</p>
                  <p>{facturaDetalle.concepto ?? "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Estado</p>
                  <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${BADGE_ESTADO[facturaDetalle.estadoPago] ?? "bg-gray-100"}`}>
                    {LABEL_ESTADO[facturaDetalle.estadoPago] ?? facturaDetalle.estadoPago}
                  </span>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Neto</p>
                  <p>{formatearMoneda(facturaDetalle.neto)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">IVA</p>
                  <p>{formatearMoneda(facturaDetalle.ivaMonto)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Total</p>
                  <p className="font-semibold">{formatearMoneda(facturaDetalle.total)}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <ViewPDF s3Key={facturaDetalle.pdfS3Key} label="Ver factura PDF" />
              </div>

              {/* Ítems */}
              {facturaDetalle.items && facturaDetalle.items.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Ítems</p>
                  <div className="border rounded overflow-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-left px-3 py-2">Descripción</th>
                          <th className="text-right px-3 py-2">Cant.</th>
                          <th className="text-right px-3 py-2">P. Unit.</th>
                          <th className="text-right px-3 py-2">Alíc. IVA</th>
                          <th className="text-right px-3 py-2">Subtotal</th>
                          <th className="text-right px-3 py-2">IVA</th>
                          <th className="text-right px-3 py-2">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {facturaDetalle.items.map((item) => (
                          <tr key={item.id} className="border-t">
                            <td className="px-3 py-2">{item.descripcion}</td>
                            <td className="px-3 py-2 text-right">{item.cantidad}</td>
                            <td className="px-3 py-2 text-right">{formatearMoneda(item.precioUnitario)}</td>
                            <td className="px-3 py-2 text-right text-muted-foreground text-xs">
                              {item.esExento ? "Exento" : `${item.alicuotaIva}%`}
                            </td>
                            <td className="px-3 py-2 text-right">{formatearMoneda(item.subtotalNeto)}</td>
                            <td className="px-3 py-2 text-right text-muted-foreground">{formatearMoneda(item.montoIva)}</td>
                            <td className="px-3 py-2 text-right font-medium">{formatearMoneda(item.subtotalTotal)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Historial de pagos */}
              <div>
                <p className="text-sm font-medium mb-2">
                  Historial de pagos
                  {facturaDetalle.saldoPendiente > 0.01 && (
                    <span className="ml-2 text-destructive text-xs">
                      Saldo pendiente: {formatearMoneda(facturaDetalle.saldoPendiente)}
                    </span>
                  )}
                </p>
                {facturaDetalle.pagos.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sin pagos registrados.</p>
                ) : (
                  <div className="border rounded overflow-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-left px-3 py-2">Fecha</th>
                          <th className="text-left px-3 py-2">Tipo</th>
                          <th className="text-right px-3 py-2">Monto</th>
                          <th className="text-center px-3 py-2">Comprobante</th>
                          <th className="px-3 py-2" />
                        </tr>
                      </thead>
                      <tbody>
                        {facturaDetalle.pagos.map((p) => {
                          const compKey = p.comprobantePdfS3Key ?? p.resumenTarjeta?.s3Key ?? null
                          return (
                            <Fragment key={p.id}>
                              <tr className={`border-t${p.anulado ? " opacity-50 line-through" : ""}`}>
                                <td className="px-3 py-2 whitespace-nowrap">{formatearFecha(p.fecha)}</td>
                                <td className="px-3 py-2">
                                  {LABEL_TIPO_PAGO[p.tipo] ?? p.tipo}
                                  {p.resumenTarjeta && (
                                    <span className="ml-1 text-xs text-muted-foreground">({p.resumenTarjeta.periodo})</span>
                                  )}
                                </td>
                                <td className="px-3 py-2 text-right font-medium">{formatearMoneda(p.monto)}</td>
                                <td className="px-3 py-2 text-center">
                                  <ViewPDF s3Key={compKey} size="sm" label="Ver" />
                                </td>
                                <td className="px-3 py-2">
                                  {!p.anulado && (
                                    <button
                                      onClick={() => setAnulandoPago({ pagoId: p.id, pagoMonto: p.monto, pagoTipo: p.tipo, pagoFecha: p.fecha })}
                                      className="h-6 px-2 rounded border text-xs font-medium text-red-600 hover:bg-red-50"
                                    >
                                      Anular
                                    </button>
                                  )}
                                </td>
                              </tr>
                              <tr className="border-t">
                                <td colSpan={5} className="px-3 pb-2">
                                  <HistorialPagoProveedor pagoId={p.id} />
                                </td>
                              </tr>
                            </Fragment>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>

      {/* Modal anular pago proveedor */}
      {anulandoPago && (
        <ModalAnularPagoProveedor
          pagoId={anulandoPago.pagoId}
          pagoMonto={anulandoPago.pagoMonto}
          pagoTipo={anulandoPago.pagoTipo}
          pagoFecha={anulandoPago.pagoFecha}
          onConfirmar={() => {
            setAnulandoPago(null)
            setFacturaDetalle(null)
            buscar()
          }}
          onCerrar={() => setAnulandoPago(null)}
        />
      )}
    </div>
  )
}

// ─── Modal anular pago proveedor ──────────────────────────────────────────────

function ModalAnularPagoProveedor({
  pagoId,
  pagoMonto,
  pagoTipo,
  pagoFecha,
  onConfirmar,
  onCerrar,
}: {
  pagoId: string
  pagoMonto: number
  pagoTipo: string
  pagoFecha: string
  onConfirmar: () => void
  onCerrar: () => void
}) {
  const [justificacion, setJustificacion] = useState("")
  const [impactos, setImpactos] = useState<{ tipo: string; descripcion: string; detalle: string; estadoActual: string; nuevoEstado: string }[]>([])
  const [cargandoPreview, setCargandoPreview] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setCargandoPreview(true)
    fetch(`/api/pagos-proveedor/${pagoId}/impacto-modificacion`)
      .then((r) => r.json())
      .then((data) => setImpactos(data.impactos ?? []))
      .catch(() => setImpactos([]))
      .finally(() => setCargandoPreview(false))
  }, [pagoId])

  async function confirmar() {
    if (justificacion.trim().length < 10) {
      setError("La justificación debe tener al menos 10 caracteres")
      return
    }
    setEnviando(true)
    setError(null)
    try {
      const res = await fetch(`/api/pagos-proveedor/${pagoId}/anular`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ justificacion }),
      })
      if (!res.ok) {
        const err = await res.json()
        setError(err.error ?? "Error al anular el pago")
        return
      }
      onConfirmar()
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
      <div className="bg-background rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-red-600">
            Anular pago de {formatearMoneda(pagoMonto)} — {LABEL_TIPO_PAGO[pagoTipo] ?? pagoTipo} — {formatearFecha(pagoFecha)}
          </h2>
          <button onClick={onCerrar} className="text-muted-foreground hover:text-foreground text-xl leading-none">&times;</button>
        </div>
        <div className="mb-4">
          <label className="text-sm font-medium mb-1 block">Justificación (obligatoria)</label>
          <textarea
            value={justificacion}
            onChange={(e) => setJustificacion(e.target.value)}
            rows={3}
            placeholder="Mínimo 10 caracteres..."
            className="w-full rounded border bg-background px-3 py-2 text-sm resize-none"
          />
          {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
        </div>
        <div className="mb-4">
          <p className="text-sm font-medium mb-2">Registros afectados</p>
          {cargandoPreview ? (
            <p className="text-sm text-muted-foreground">Calculando impacto...</p>
          ) : (
            <div className="rounded border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-3 py-2 text-left">Documento</th>
                    <th className="px-3 py-2 text-left">Estado actual</th>
                    <th className="px-3 py-2 text-left">Nuevo estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {impactos.map((imp, i) => (
                    <tr key={i} className={imp.tipo.startsWith("CC") ? "bg-blue-50/50" : ""}>
                      <td className="px-3 py-2">
                        <p className="font-medium">{imp.descripcion}</p>
                        <p className="text-xs text-muted-foreground">{imp.detalle}</p>
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">{imp.estadoActual}</td>
                      <td className="px-3 py-2 font-medium">{imp.nuevoEstado}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onCerrar} className="h-9 px-4 rounded-md border text-sm font-medium hover:bg-accent">
            Cancelar
          </button>
          <button
            onClick={confirmar}
            disabled={enviando || justificacion.trim().length < 10}
            className="h-9 px-4 rounded-md bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50"
          >
            {enviando ? "Anulando..." : "Confirmar anulación"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Historial de pagos ───────────────────────────────────────────────────────

type EntradaHistorial = {
  id: string
  tipoEvento: string
  justificacion: string
  estadoAnterior: string | null
  creadoEn: string
  operador: { nombre: string; apellido: string }
}

function HistorialPagoProveedor({ pagoId }: { pagoId: string }) {
  const [historial, setHistorial] = useState<EntradaHistorial[]>([])
  const [cargando, setCargando] = useState(false)
  const [abierto, setAbierto] = useState(false)

  function cargar() {
    if (abierto) { setAbierto(false); return }
    setCargando(true)
    fetch(`/api/pagos-proveedor/${pagoId}/historial`)
      .then((r) => r.json())
      .then((data) => setHistorial(data ?? []))
      .catch(() => setHistorial([]))
      .finally(() => { setCargando(false); setAbierto(true) })
  }

  const BADGE_EVENTO: Record<string, string> = {
    CREACION: "bg-green-100 text-green-800",
    MODIFICACION: "bg-blue-100 text-blue-800",
    ANULACION: "bg-red-100 text-red-800",
  }

  return (
    <div className="mt-1">
      <button
        onClick={cargar}
        className="text-xs text-primary underline underline-offset-2"
      >
        {cargando ? "Cargando..." : abierto ? "Ocultar historial" : "Ver historial"}
      </button>
      {abierto && (
        <div className="mt-2 space-y-2 border-l-2 border-muted pl-3">
          {historial.length === 0 ? (
            <p className="text-xs text-muted-foreground">Sin historial registrado.</p>
          ) : (
            historial.map((h) => (
              <div key={h.id}>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${BADGE_EVENTO[h.tipoEvento] ?? "bg-gray-100 text-gray-800"}`}>
                    {h.tipoEvento}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatearFecha(new Date(h.creadoEn))} — {h.operador.apellido}, {h.operador.nombre}
                  </span>
                </div>
                <p className="text-xs mt-0.5 text-muted-foreground">{h.justificacion}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
