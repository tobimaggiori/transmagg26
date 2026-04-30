"use client"

/**
 * Propósito: Dashboard financiero interactivo de Transmagg.
 * Muestra tarjetas con métricas clave, modales de detalle y alertas FCI.
 * Las tarjetas son clickeables y abren modales con información detallada y opción de PDF.
 */

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PDFViewer } from "@/components/ui/pdf-viewer"
import { usePDFViewer } from "@/hooks/use-pdf-viewer"
import { formatearMoneda, formatearFecha, formatearCuit } from "@/lib/utils"
import { sumarImportes } from "@/lib/money"
import { formatearNroComprobante } from "@/lib/liquidacion-utils"

// --- Tipos ---

interface AlertaFci {
  fciId: string
  fciNombre: string
  cuentaId: string
  diasSinActualizar: number
}

interface CuentaDashboard {
  id: string
  nombre: string
  tipo: string
  moneda: string
  activa: boolean
  saldoContable: number
  saldoEnFciPropios: number
  saldoDisponible: number
  coberturaCheques30Dias: number
  fciDetalle: Array<{ id: string; nombre: string; saldoInformadoActual: number }>
  capitalEnviado: number
  capitalRescatado: number
  capitalNetoEnBroker: number
  rendimiento: number
}

interface DashboardData {
  deudaEmpresas: number
  deudaFleteros: number
  pendienteFacturar: number
  pendienteLiquidar: number
  chequesEnCartera: { alDia: number; noAlDia: number; total: number; fisico: number; electronico: number }
  chequesEmitidosNoCobrados: number
  alertasFci: AlertaFci[]
  cuentas: CuentaDashboard[]
}

interface NotaCDDashboard {
  id: string
  tipo: "NC_EMITIDA" | "ND_EMITIDA"
  tipoCbte: number | null
  nroComprobante: number | null
  ptoVenta: number | null
  monto: number
  signo: -1 | 1
  emitidaEn: string
}

interface DeudaEmpresa {
  empresaId: string
  razonSocial: string
  cuit: string
  totalFacturado: number
  totalPagado: number
  saldoDeudor: number
  facturas: Array<{ id: string; nroComprobante: string | null; ptoVenta: number | null; tipoCbte: number; total: number; totalPagado: number; saldo: number; emitidaEn: string; estado: string }>
  notas: NotaCDDashboard[]
}

interface DeudaFletero {
  fleteroId: string
  razonSocial: string
  cuit: string
  totalLiquidado: number
  totalPagado: number
  saldoAPagar: number
  liquidaciones: Array<{
    id: string
    grabadaEn: string
    total: number
    totalPagado: number
    saldo: number
    estado: string
    nroComprobante: number | null
    ptoVenta: number | null
    tipoCbte: number | null
    pdfS3Key: string | null
  }>
  notas: NotaCDDashboard[]
}

interface ChequeCartera {
  id: string
  empresa: string
  nroCheque: string
  bancoEmisor: string
  monto: number
  fechaCobro: string
  estado: string
  esElectronico: boolean
}

interface ChequeEmitido {
  id: string
  beneficiario: string
  nroCheque: string | null
  monto: number
  fechaPago: string
  cuenta: string
}


type ModalTipo =
  | "deuda-empresas"
  | "deuda-fleteros"
  | "pendiente-facturar"
  | "pendiente-liquidar"
  | "cheques-cartera-al-dia"
  | "cheques-cartera-no-al-dia"
  | "cheques-emitidos"
  | null

// --- Modal ---

function Modal({
  titulo, onClose, children, wide, pdfEndpoint, pdfFilename,
}: {
  titulo: string
  onClose: () => void
  children: React.ReactNode
  wide?: boolean
  /** Si se pasa, "Descargar PDF" descarga del endpoint (PDF real). Si no, usa window.print(). */
  pdfEndpoint?: string
  pdfFilename?: string
}) {
  const [descargando, setDescargando] = useState(false)

  async function handleDescargar() {
    if (!pdfEndpoint) { window.print(); return }
    setDescargando(true)
    try {
      const res = await fetch(pdfEndpoint)
      if (!res.ok) return
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = pdfFilename ?? "reporte.pdf"
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      setTimeout(() => URL.revokeObjectURL(url), 60_000)
    } finally {
      setDescargando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className={`bg-background rounded-lg shadow-xl w-full max-h-[90vh] flex flex-col ${wide ? "max-w-[95vw]" : "max-w-3xl"}`}>
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">{titulo}</h2>
          <div className="flex gap-2">
            <button
              onClick={handleDescargar}
              disabled={descargando}
              className="px-3 py-1.5 text-sm border rounded hover:bg-muted transition-colors disabled:opacity-50"
            >
              {descargando ? "Generando..." : "Descargar PDF"}
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-sm border rounded hover:bg-muted transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
        <div className="overflow-auto px-6 py-4 print-content">
          {children}
        </div>
      </div>
    </div>
  )
}

// --- Contenidos de modales ---

function labelTipoCbte(tipoCbte: number): string {
  if (tipoCbte === 1) return "Fact. A"
  if (tipoCbte === 6) return "Fact. B"
  if (tipoCbte === 11) return "Fact. C"
  if (tipoCbte === 201) return "MiPyme A"
  if (tipoCbte === 206) return "MiPyme B"
  if (tipoCbte === 211) return "MiPyme C"
  return `Cbte ${tipoCbte}`
}

function formatearNroFactura(ptoVenta: number | null, nro: string | null): string {
  if (!nro) return "s/n"
  const pv = String(ptoVenta ?? 1).padStart(4, "0")
  const n = /^\d+$/.test(nro) ? nro.padStart(8, "0") : nro
  return `${pv}-${n}`
}

async function abrirPDFFactura(id: string) {
  try {
    const res = await fetch(`/api/facturas/${id}/pdf`)
    if (!res.ok) return
    const data = await res.json().catch(() => ({}))
    if (data.url) window.open(data.url as string, "_blank", "noopener,noreferrer")
  } catch { /* ignore */ }
}

async function abrirPDFNotaCD(id: string) {
  try {
    const res = await fetch(`/api/notas-credito-debito/${id}/pdf`)
    if (!res.ok) return
    const data = await res.json().catch(() => ({}))
    if (data.url) window.open(data.url as string, "_blank", "noopener,noreferrer")
  } catch { /* ignore */ }
}

function labelTipoNota(tipo: "NC_EMITIDA" | "ND_EMITIDA", tipoCbte: number | null): string {
  const abrev = tipo === "NC_EMITIDA" ? "NC" : "ND"
  if (tipoCbte === 3 || tipoCbte === 2) return `${abrev} A`
  if (tipoCbte === 8 || tipoCbte === 7) return `${abrev} B`
  if (tipoCbte === 13 || tipoCbte === 12) return `${abrev} C`
  return abrev
}

function formatearNroNota(ptoVenta: number | null, nro: number | null): string {
  if (nro == null) return "s/n"
  return `${String(ptoVenta ?? 1).padStart(4, "0")}-${String(nro).padStart(8, "0")}`
}

function DeudaEmpresasModal() {
  const [data, setData] = useState<DeudaEmpresa[] | null>(null)
  useEffect(() => {
    fetch("/api/dashboard-financiero/deuda-empresas").then(r => r.json()).then(setData)
  }, [])
  if (!data) return <p className="text-muted-foreground">Cargando...</p>
  if (data.length === 0) return <p className="text-muted-foreground">Sin deudas pendientes.</p>
  return (
    <div className="space-y-4">
      {data.map((e) => (
        <div key={e.empresaId} className="border rounded p-3 space-y-2">
          <div className="flex justify-between items-center">
            <div>
              <p className="font-semibold">{e.razonSocial}</p>
              <p className="text-xs text-muted-foreground">CUIT: {formatearCuit(e.cuit)}</p>
            </div>
            <p className="font-bold text-destructive">{formatearMoneda(e.saldoDeudor)}</p>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-muted-foreground text-xs border-b">
                <th className="text-left py-1">Fecha</th>
                <th className="text-left py-1">Comprobante</th>
                <th className="text-right py-1">Total</th>
              </tr>
            </thead>
            <tbody>
              {e.facturas.map((f) => (
                <tr key={f.id} className="border-b last:border-0">
                  <td className="py-1">{formatearFecha(f.emitidaEn)}</td>
                  <td className="py-1">
                    <button
                      type="button"
                      onClick={() => abrirPDFFactura(f.id)}
                      className="text-primary hover:underline underline-offset-2 font-mono text-xs"
                      title="Ver PDF"
                    >
                      {labelTipoCbte(f.tipoCbte)} {formatearNroFactura(f.ptoVenta, f.nroComprobante)}
                    </button>
                  </td>
                  <td className="text-right py-1 font-medium">{formatearMoneda(f.total)}</td>
                </tr>
              ))}
              {e.notas.map((n) => (
                <tr key={n.id} className="border-b last:border-0">
                  <td className="py-1">{formatearFecha(n.emitidaEn)}</td>
                  <td className="py-1">
                    <button
                      type="button"
                      onClick={() => abrirPDFNotaCD(n.id)}
                      className="text-primary hover:underline underline-offset-2 font-mono text-xs"
                      title="Ver PDF"
                    >
                      {labelTipoNota(n.tipo, n.tipoCbte)} {formatearNroNota(n.ptoVenta, n.nroComprobante)}
                    </button>
                  </td>
                  <td className="text-right py-1 font-medium">
                    {n.signo < 0 ? "−" : ""}{formatearMoneda(n.monto)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  )
}

function labelTipoCbteLP(tipoCbte: number | null): string {
  if (tipoCbte === 60) return "LP A"
  if (tipoCbte === 61) return "LP B"
  if (tipoCbte == null) return "LP"
  return `Cbte ${tipoCbte}`
}

function formatearNroLiquidacion(ptoVenta: number | null, nroComprobante: number | null): string {
  if (ptoVenta === null || nroComprobante === null) return "s/n"
  return `${String(ptoVenta).padStart(4, "0")}-${String(nroComprobante).padStart(8, "0")}`
}

async function abrirPDFLiquidacion(id: string) {
  try {
    const res = await fetch(`/api/liquidaciones/${id}/pdf`)
    if (!res.ok) return
    const data = await res.json().catch(() => ({}))
    if (data.url) window.open(data.url as string, "_blank", "noopener,noreferrer")
  } catch { /* ignore */ }
}

function DeudaFleterosModal() {
  const [data, setData] = useState<DeudaFletero[] | null>(null)
  useEffect(() => {
    fetch("/api/dashboard-financiero/deuda-fleteros").then(r => r.json()).then(setData)
  }, [])
  if (!data) return <p className="text-muted-foreground">Cargando...</p>
  if (data.length === 0) return <p className="text-muted-foreground">Sin deudas pendientes.</p>
  return (
    <div className="space-y-4">
      {data.map((f) => (
        <div key={f.fleteroId} className="border rounded p-3 space-y-2">
          <div className="flex justify-between items-center">
            <div>
              <p className="font-semibold">{f.razonSocial}</p>
              <p className="text-xs text-muted-foreground">CUIT: {formatearCuit(f.cuit)}</p>
            </div>
            <p className="font-bold text-orange-600">{formatearMoneda(f.saldoAPagar)}</p>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-muted-foreground text-xs border-b">
                <th className="text-left py-1">Fecha</th>
                <th className="text-left py-1">Comprobante</th>
                <th className="text-right py-1">Total</th>
              </tr>
            </thead>
            <tbody>
              {f.liquidaciones.map((l) => (
                <tr key={l.id} className="border-b last:border-0">
                  <td className="py-1">{formatearFecha(l.grabadaEn)}</td>
                  <td className="py-1">
                    <button
                      type="button"
                      onClick={() => abrirPDFLiquidacion(l.id)}
                      className="text-primary hover:underline underline-offset-2 font-mono text-xs"
                      title="Ver PDF"
                    >
                      {labelTipoCbteLP(l.tipoCbte)} {formatearNroLiquidacion(l.ptoVenta, l.nroComprobante)}
                    </button>
                  </td>
                  <td className="text-right py-1 font-medium">{formatearMoneda(l.total)}</td>
                </tr>
              ))}
              {f.notas.map((n) => (
                <tr key={n.id} className="border-b last:border-0">
                  <td className="py-1">{formatearFecha(n.emitidaEn)}</td>
                  <td className="py-1">
                    <button
                      type="button"
                      onClick={() => abrirPDFNotaCD(n.id)}
                      className="text-primary hover:underline underline-offset-2 font-mono text-xs"
                      title="Ver PDF"
                    >
                      {labelTipoNota(n.tipo, n.tipoCbte)} {formatearNroNota(n.ptoVenta, n.nroComprobante)}
                    </button>
                  </td>
                  <td className="text-right py-1 font-medium">
                    {n.signo < 0 ? "−" : ""}{formatearMoneda(n.monto)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  )
}

function ChequesCarteraModal({ tipo }: { tipo: "al_dia" | "no_al_dia" }) {
  const [data, setData] = useState<ChequeCartera[] | null>(null)
  useEffect(() => {
    fetch(`/api/dashboard-financiero/cheques-cartera?tipo=${tipo}`).then(r => r.json()).then(setData)
  }, [tipo])
  if (!data) return <p className="text-muted-foreground">Cargando...</p>
  if (data.length === 0) return <p className="text-muted-foreground">Sin cheques.</p>
  return (
    <table className="w-full text-sm">
      <thead><tr className="text-muted-foreground text-xs border-b"><th className="text-left py-1">Empresa</th><th className="text-left py-1">Nro. Cheque</th><th className="text-left py-1">Banco</th><th className="text-right py-1">Monto</th><th className="text-right py-1">Fecha cobro</th></tr></thead>
      <tbody>
        {data.map((c) => (
          <tr key={c.id} className="border-b last:border-0">
            <td className="py-1">{c.empresa}</td>
            <td className="py-1">
              <span>{c.nroCheque}</span>
              {c.esElectronico && <span className="ml-1 text-xs bg-violet-100 text-violet-700 px-1 py-0.5 rounded">ECheq</span>}
            </td>
            <td className="py-1">{c.bancoEmisor}</td>
            <td className="text-right py-1 font-medium">{formatearMoneda(c.monto)}</td>
            <td className="text-right py-1">{formatearFecha(c.fechaCobro)}</td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr className="font-semibold border-t">
          <td colSpan={3} className="py-1">Total</td>
          <td className="text-right py-1">{formatearMoneda(sumarImportes(data.map(c => c.monto)))}</td>
          <td></td>
        </tr>
      </tfoot>
    </table>
  )
}

function ChequesEmitidosModal() {
  const [data, setData] = useState<ChequeEmitido[] | null>(null)
  useEffect(() => {
    fetch("/api/dashboard-financiero/cheques-emitidos-pendientes").then(r => r.json()).then(setData)
  }, [])
  if (!data) return <p className="text-muted-foreground">Cargando...</p>
  if (data.length === 0) return <p className="text-muted-foreground">Sin cheques emitidos pendientes.</p>
  return (
    <table className="w-full text-sm">
      <thead><tr className="text-muted-foreground text-xs border-b"><th className="text-left py-1">Beneficiario</th><th className="text-left py-1">Nro. Cheque</th><th className="text-left py-1">Cuenta</th><th className="text-right py-1">Monto</th><th className="text-right py-1">Fecha pago</th></tr></thead>
      <tbody>
        {data.map((c) => (
          <tr key={c.id} className="border-b last:border-0">
            <td className="py-1">{c.beneficiario}</td>
            <td className="py-1">{c.nroCheque ?? "-"}</td>
            <td className="py-1">{c.cuenta}</td>
            <td className="text-right py-1 font-medium">{formatearMoneda(c.monto)}</td>
            <td className="text-right py-1">{formatearFecha(c.fechaPago)}</td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr className="font-semibold border-t">
          <td colSpan={3} className="py-1">Total</td>
          <td className="text-right py-1">{formatearMoneda(sumarImportes(data.map(c => c.monto)))}</td>
          <td></td>
        </tr>
      </tfoot>
    </table>
  )
}

// --- Modal Pendiente de Liquidar ---

interface ViajeLiquidar {
  id: string
  fechaViaje: string
  nroCtg: string | null
  ctgS3Key: string | null
  tieneCtg: boolean
  remito: string | null
  cupo: string | null
  tieneCupo: boolean
  mercaderia: string | null
  procedencia: string | null
  destino: string | null
  kilos: number | null
  tarifa: number
  subtotal: number
  iva: number
  total: number
}

interface GrupoLiquidar {
  fleteroId: string
  razonSocial: string
  comisionPct: number
  totalGeneral: number
  cantidadViajes: number
  viajes: ViajeLiquidar[]
}

function PendienteLiquidarModal() {
  const [data, setData] = useState<GrupoLiquidar[] | null>(null)
  const { estado: estadoPDF, abrirPDF, cerrarPDF } = usePDFViewer()

  useEffect(() => {
    fetch("/api/dashboard-financiero/pendiente-liquidar").then(r => r.json()).then(setData)
  }, [])

  if (!data) return <p className="text-muted-foreground">Cargando...</p>
  if (data.length === 0) return <p className="text-muted-foreground">Sin viajes pendientes.</p>

  return (
    <>
      <div className="space-y-4">
        {data.map((grupo) => (
          <div key={grupo.fleteroId} className="border rounded p-3 space-y-2">
            <div className="flex justify-between items-center">
              <p className="font-semibold">{grupo.razonSocial}</p>
              <div className="text-right">
                <p className="font-bold">{formatearMoneda(grupo.totalGeneral)}</p>
                <p className="text-xs text-muted-foreground">{grupo.cantidadViajes} viaje(s) · Comisión {grupo.comisionPct}%</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="text-muted-foreground text-xs border-b uppercase">
                    <th className="text-left px-3 py-2 whitespace-nowrap">Fecha</th>
                    <th className="text-left px-3 py-2 whitespace-nowrap">CTG</th>
                    <th className="text-left px-3 py-2 whitespace-nowrap">Remito</th>
                    <th className="text-left px-3 py-2 whitespace-nowrap">Cupo</th>
                    <th className="text-left px-3 py-2 whitespace-nowrap">Mercadería</th>
                    <th className="text-left px-3 py-2 whitespace-nowrap">Origen</th>
                    <th className="text-left px-3 py-2 whitespace-nowrap">Destino</th>
                    <th className="text-right px-3 py-2 whitespace-nowrap">Kilos</th>
                  </tr>
                </thead>
                <tbody>
                  {grupo.viajes.map((v) => (
                    <tr key={v.id} className="border-b last:border-0">
                      <td className="px-3 py-2 whitespace-nowrap">{formatearFecha(v.fechaViaje)}</td>
                      <td className="px-3 py-2">
                        {v.tieneCtg && v.nroCtg ? (
                          v.ctgS3Key ? (
                            <button
                              type="button"
                              onClick={() => abrirPDF({
                                s3Key: v.ctgS3Key!,
                                titulo: `CTG — ${v.nroCtg}`,
                              })}
                              className="text-primary hover:underline font-medium text-xs"
                            >
                              {v.nroCtg}
                            </button>
                          ) : (
                            <span className="text-xs">{v.nroCtg}</span>
                          )
                        ) : <span className="text-xs text-muted-foreground">N/A</span>}
                      </td>
                      <td className="px-3 py-2">{v.remito ?? "—"}</td>
                      <td className="px-3 py-2">{v.tieneCupo && v.cupo ? v.cupo : <span className="text-muted-foreground">N/A</span>}</td>
                      <td className="px-3 py-2">{v.mercaderia ?? "—"}</td>
                      <td className="px-3 py-2">{v.procedencia ?? "—"}</td>
                      <td className="px-3 py-2">{v.destino ?? "—"}</td>
                      <td className="text-right px-3 py-2 tabular-nums">{v.kilos?.toLocaleString("es-AR") ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <a
              href={`/fleteros/liquidar?fleteroId=${grupo.fleteroId}&action=emitir`}
              className="inline-block text-sm text-primary hover:underline font-medium mt-1"
            >
              Ver más información →
            </a>
          </div>
        ))}
      </div>
      <PDFViewer {...estadoPDF} onClose={cerrarPDF} />
    </>
  )
}

// --- Modal Pendiente de Facturar (con LP y NRO CPE clickeables) ---

interface ViajeFacturar {
  id: string
  fechaViaje: string
  procedencia: string | null
  destino: string | null
  nroCtg: string | null
  ctgS3Key: string | null
  empresaRazonSocial: string
  totalEmpresa: number | null
  liquidacion: {
    id: string
    nroComprobante: number | null
    ptoVenta: number | null
    pdfS3Key: string | null
  } | null
}

interface GrupoFacturar {
  empresaId: string
  razonSocial: string
  total: number
  cantidadViajes: number
  viajes: ViajeFacturar[]
}

function PendienteFacturarModal() {
  const [data, setData] = useState<GrupoFacturar[] | null>(null)
  const { estado: estadoPDF, abrirPDF, cerrarPDF } = usePDFViewer()

  useEffect(() => {
    fetch("/api/dashboard-financiero/pendiente-facturar").then(r => r.json()).then(setData)
  }, [])

  if (!data) return <p className="text-muted-foreground">Cargando...</p>
  if (data.length === 0) return <p className="text-muted-foreground">Sin viajes pendientes.</p>

  function formatLP(liq: ViajeFacturar["liquidacion"]): string | null {
    if (!liq?.nroComprobante) return null
    return `${String(liq.ptoVenta ?? 1).padStart(4, "0")}-${formatearNroComprobante(liq.nroComprobante)}`
  }

  return (
    <>
      <div className="space-y-4">
        {data.map((grupo) => (
          <div key={grupo.empresaId} className="border rounded p-3 space-y-2">
            <div className="flex justify-between items-center">
              <p className="font-semibold">{grupo.razonSocial}</p>
              <div className="text-right">
                <p className="font-bold">{formatearMoneda(grupo.total)}</p>
                <p className="text-xs text-muted-foreground">{grupo.cantidadViajes} viaje(s)</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-muted-foreground text-xs border-b uppercase">
                    <th className="text-left py-1">Fecha</th>
                    <th className="text-left py-1">Liquidación</th>
                    <th className="text-left py-1">Procedencia</th>
                    <th className="text-left py-1">Destino</th>
                    <th className="text-left py-1">Nro CTG</th>
                    <th className="text-left py-1">Empresa</th>
                    <th className="text-right py-1">Total Empresa</th>
                  </tr>
                </thead>
                <tbody>
                  {grupo.viajes.map((v) => {
                    const nroLP = formatLP(v.liquidacion)
                    return (
                      <tr key={v.id} className="border-b last:border-0">
                        <td className="py-1 whitespace-nowrap">{formatearFecha(v.fechaViaje)}</td>
                        <td className="py-1">
                          {nroLP && v.liquidacion ? (
                            <button
                              type="button"
                              onClick={() => abrirPDF({
                                fetchUrl: `/api/liquidaciones/${v.liquidacion!.id}/pdf`,
                                titulo: `LP ${nroLP}`,
                              })}
                              className="text-primary hover:underline font-medium text-xs font-mono"
                            >
                              {nroLP}
                            </button>
                          ) : "—"}
                        </td>
                        <td className="py-1">{v.procedencia ?? "—"}</td>
                        <td className="py-1">{v.destino ?? "—"}</td>
                        <td className="py-1">
                          {v.nroCtg ? (
                            v.ctgS3Key ? (
                              <button
                                type="button"
                                onClick={() => abrirPDF({
                                  s3Key: v.ctgS3Key!,
                                  titulo: `CTG — ${v.nroCtg}`,
                                })}
                                className="text-primary hover:underline font-medium text-xs"
                              >
                                {v.nroCtg}
                              </button>
                            ) : (
                              <span className="text-xs">{v.nroCtg}</span>
                            )
                          ) : "—"}
                        </td>
                        <td className="py-1">{v.empresaRazonSocial}</td>
                        <td className="text-right py-1">{v.totalEmpresa != null ? formatearMoneda(v.totalEmpresa) : "—"}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
      <PDFViewer {...estadoPDF} onClose={cerrarPDF} />
    </>
  )
}

// --- Componente principal ---

/**
 * FinancialDashboardClient: { permisos: string[] } -> JSX.Element
 *
 * Dado el array de secciones habilitadas para el usuario, renderiza el dashboard
 * financiero mostrando solo las tarjetas y cuentas permitidas.
 * Existe como componente client para poder hacer fetch de datos y manejar estado de modales.
 *
 * Ejemplos:
 * <FinancialDashboardClient permisos={["dashboard.deuda_empresas", ...]} />
 * // => dashboard con tarjetas de deudas, cheques, cuentas permitidas
 */
export function FinancialDashboardClient({ permisos }: { permisos: string[] }) {
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [modalAbierto, setModalAbierto] = useState<ModalTipo>(null)
  useEffect(() => {
    fetch("/api/dashboard-financiero")
      .then((r) => r.json())
      .then((d) => {
        if (d && typeof d === "object" && !d.error) {
          setData({ ...d, alertasFci: d.alertasFci ?? [], cuentas: d.cuentas ?? [] })
        } else {
          setData(null)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Dashboard Financiero</h2>
          <p className="text-muted-foreground">Cargando datos...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold tracking-tight">Dashboard Financiero</h2>
        <p className="text-destructive">Error al cargar los datos.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard Financiero</h2>
      </div>

      {/* Alertas FCI — sólo si el usuario tiene permiso a la sección FCI */}
      {permisos.includes("contabilidad.fci") && (data.alertasFci?.length ?? 0) > 0 && (
        <div className="flex flex-wrap gap-2">
          <span className="text-sm font-medium text-muted-foreground self-center">Alertas FCI:</span>
          {(data.alertasFci ?? []).map((alerta) => (
            <button
              key={alerta.fciId}
              onClick={() => router.push(`/contabilidad/fci/${alerta.fciId}`)}
              className="inline-flex items-center rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-orange-800 hover:bg-orange-200 transition-colors"
            >
              FCI {alerta.fciNombre}: {alerta.diasSinActualizar} día(s) sin actualizar
            </button>
          ))}
        </div>
      )}

      {/* Tarjetas principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-fr">
        {permisos.includes("dashboard.deuda_empresas") && (
          <Card
            className="cursor-pointer hover:border-primary transition-colors"
            onClick={() => setModalAbierto("deuda-empresas")}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Deuda de Empresas</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-destructive">{formatearMoneda(data.deudaEmpresas)}</p>
              <p className="text-xs text-muted-foreground mt-1">Total a cobrar — click para ver detalle</p>
            </CardContent>
          </Card>
        )}

        {permisos.includes("dashboard.deuda_fleteros") && (
          <Card
            className="cursor-pointer hover:border-primary transition-colors"
            onClick={() => setModalAbierto("deuda-fleteros")}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Deuda a Fleteros</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-orange-600">{formatearMoneda(data.deudaFleteros)}</p>
              <p className="text-xs text-muted-foreground mt-1">Total a pagar — click para ver detalle</p>
            </CardContent>
          </Card>
        )}

        {permisos.includes("dashboard.cheques_cartera") && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Cheques en Cartera</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatearMoneda(data.chequesEnCartera?.total ?? 0)}</p>
              <div className="flex flex-wrap gap-2 mt-1">
                <button
                  onClick={() => setModalAbierto("cheques-cartera-al-dia")}
                  className="text-xs text-green-700 bg-green-50 hover:bg-green-100 px-2 py-0.5 rounded transition-colors"
                >
                  Al día: {formatearMoneda(data.chequesEnCartera?.alDia ?? 0)}
                </button>
                <button
                  onClick={() => setModalAbierto("cheques-cartera-no-al-dia")}
                  className="text-xs text-orange-700 bg-orange-50 hover:bg-orange-100 px-2 py-0.5 rounded transition-colors"
                >
                  No al día: {formatearMoneda(data.chequesEnCartera?.noAlDia ?? 0)}
                </button>
              </div>
              <div className="flex flex-wrap gap-2 mt-1">
                <span className="text-xs text-muted-foreground">
                  Físicos: {formatearMoneda(data.chequesEnCartera?.fisico ?? 0)}
                </span>
                <span className="text-xs text-violet-700">
                  ECheq: {formatearMoneda(data.chequesEnCartera?.electronico ?? 0)}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {permisos.includes("dashboard.pendiente_facturar") && (
          <Card
            className="cursor-pointer hover:border-primary transition-colors"
            onClick={() => setModalAbierto("pendiente-facturar")}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pendiente de Facturar</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatearMoneda(data.pendienteFacturar)}</p>
              <p className="text-xs text-muted-foreground mt-1">Viajes sin factura — click para ver detalle</p>
            </CardContent>
          </Card>
        )}

        {permisos.includes("dashboard.pendiente_liquidar") && (
          <Card
            className="cursor-pointer hover:border-primary transition-colors"
            onClick={() => setModalAbierto("pendiente-liquidar")}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pendiente de Liquidar</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatearMoneda(data.pendienteLiquidar)}</p>
              <p className="text-xs text-muted-foreground mt-1">Viajes sin liquidación — click para ver detalle</p>
            </CardContent>
          </Card>
        )}

        {permisos.includes("dashboard.cheques_emitidos") && (
          <Card
            className="cursor-pointer hover:border-primary transition-colors"
            onClick={() => setModalAbierto("cheques-emitidos")}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Cheques Emitidos No Cobrados</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatearMoneda(data.chequesEmitidosNoCobrados)}</p>
              <p className="text-xs text-muted-foreground mt-1">Estado EMITIDO — click para ver detalle</p>
            </CardContent>
          </Card>
        )}

      </div>

      {/* Sección cuentas */}
      {(data.cuentas?.length ?? 0) > 0 && permisos.some(p => p.startsWith("dashboard.cuentas_")) && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Cuentas Activas</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 auto-rows-fr">
            {(data.cuentas ?? [])
              .filter((cuenta) => {
                if (cuenta.tipo === "BANCO") return permisos.includes("dashboard.cuentas_bancos")
                if (cuenta.tipo === "BROKER") return permisos.includes("dashboard.cuentas_brokers")
                if (cuenta.tipo === "BILLETERA_VIRTUAL") return permisos.includes("dashboard.cuentas_billeteras")
                return false
              })
              .map((cuenta) => (
              <Card key={cuenta.id} className="cursor-pointer hover:border-primary transition-colors" onClick={() => router.push(`/contabilidad/cuentas/libro/${cuenta.id}`)}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">{cuenta.nombre}</CardTitle>
                    <span className="text-xs bg-muted px-2 py-0.5 rounded">{cuenta.tipo}</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-1">
                  {/* 1. Saldo líquido de la cuenta */}
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Saldo en cuenta</span>
                    <span className={`font-medium ${cuenta.saldoDisponible < 0 ? "text-destructive" : ""}`}>
                      {formatearMoneda(cuenta.saldoDisponible)}
                    </span>
                  </div>

                  {/* 2. Saldo de cada FCI en esta cuenta */}
                  {cuenta.fciDetalle.length > 0 && (
                    <div className="border-t pt-1 space-y-0.5">
                      {cuenta.fciDetalle.map((fci) => (
                        <div key={fci.id} className="flex justify-between text-sm">
                          <span className="text-muted-foreground truncate">{fci.nombre}</span>
                          <span className="font-medium text-blue-600">{formatearMoneda(fci.saldoInformadoActual)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 3. Total en la cuenta */}
                  <div className="flex justify-between text-sm border-t pt-1">
                    <span className="font-semibold">Total en {cuenta.nombre}</span>
                    <span className={`font-bold ${cuenta.saldoContable < 0 ? "text-destructive" : ""}`}>
                      {formatearMoneda(cuenta.saldoContable)}
                    </span>
                  </div>

                  {cuenta.coberturaCheques30Dias > 0 && (
                    <div className="flex justify-between text-xs text-orange-600 pt-1">
                      <span>Cheques próx. 30 días</span>
                      <span>{formatearMoneda(cuenta.coberturaCheques30Dias)}</span>
                    </div>
                  )}
                  {cuenta.tipo === "BROKER" && (
                    <div className="pt-1 border-t space-y-0.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Capital neto en broker</span>
                        <span>{formatearMoneda(cuenta.capitalNetoEnBroker)}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Rendimiento acumulado</span>
                        <span className={cuenta.rendimiento >= 0 ? "text-green-600" : "text-destructive"}>
                          {formatearMoneda(cuenta.rendimiento)}
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Modales */}
      {modalAbierto === "deuda-empresas" && (
        <Modal
          titulo="Deuda de Empresas"
          onClose={() => setModalAbierto(null)}
          pdfEndpoint="/api/dashboard-financiero/deuda-empresas/pdf"
          pdfFilename="deuda-empresas.pdf"
        >
          <DeudaEmpresasModal />
        </Modal>
      )}
      {modalAbierto === "deuda-fleteros" && (
        <Modal
          titulo="Deuda a Fleteros"
          onClose={() => setModalAbierto(null)}
          pdfEndpoint="/api/dashboard-financiero/deuda-fleteros/pdf"
          pdfFilename="deuda-fleteros.pdf"
        >
          <DeudaFleterosModal />
        </Modal>
      )}
      {modalAbierto === "pendiente-facturar" && (
        <Modal titulo="Pendiente de Facturar" onClose={() => setModalAbierto(null)}>
          <PendienteFacturarModal />
        </Modal>
      )}
      {modalAbierto === "pendiente-liquidar" && (
        <Modal titulo="Pendiente de Liquidar" onClose={() => setModalAbierto(null)} wide>
          <PendienteLiquidarModal />
        </Modal>
      )}
      {modalAbierto === "cheques-cartera-al-dia" && (
        <Modal titulo="Cheques en Cartera — Al día" onClose={() => setModalAbierto(null)}>
          <ChequesCarteraModal tipo="al_dia" />
        </Modal>
      )}
      {modalAbierto === "cheques-cartera-no-al-dia" && (
        <Modal titulo="Cheques en Cartera — No al día" onClose={() => setModalAbierto(null)}>
          <ChequesCarteraModal tipo="no_al_dia" />
        </Modal>
      )}
      {modalAbierto === "cheques-emitidos" && (
        <Modal titulo="Cheques Emitidos No Cobrados" onClose={() => setModalAbierto(null)}>
          <ChequesEmitidosModal />
        </Modal>
      )}
    </div>
  )
}
