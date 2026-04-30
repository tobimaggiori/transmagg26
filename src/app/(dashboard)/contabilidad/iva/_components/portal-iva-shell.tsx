"use client"

/**
 * PortalIvaShell — Client component que envuelve los tabs nuevos del Portal IVA.
 *
 * Tabs:
 *  - Resumen (estado del período + cards)
 *  - Validaciones
 *  - Ajustes manuales
 *  - Exportaciones TXT
 *
 * Se monta dentro de la página actual de Libro IVA, debajo de los cards
 * resumen y arriba de los tabs viejos (ventas / compras / alícuotas).
 */

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { FormError } from "@/components/ui/form-error"
import { formatearFecha, formatearMoneda } from "@/lib/utils"

const NOMBRES_MES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
]

function formatMesAnio(mesAnio: string): string {
  const [anio, mes] = mesAnio.split("-")
  const idx = parseInt(mes ?? "", 10) - 1
  if (idx >= 0 && idx < 12) return `${NOMBRES_MES[idx]} ${anio}`
  return mesAnio
}

type EstadoPeriodo =
  | "ABIERTO"
  | "EN_REVISION_CONTADOR"
  | "TXT_GENERADO"
  | "CONCILIADO"
  | "PRESENTADO"
  | "REABIERTO"

type ValidacionItem = {
  codigo: string
  mensaje: string
  referencia?: { tipoReferencia: string; id: string | null; cbte?: string }
}

type Validaciones = { errores: ValidacionItem[]; advertencias: ValidacionItem[] }

type Ajuste = {
  id: string
  tipoLibro: string
  tipoAjuste: string
  motivo: string
  creadoEn: string
  anulado: boolean
  motivoAnulacion: string | null
  tipoComprobanteArca: number | null
  puntoVenta: number | null
  numeroDesde: bigint | string | number | null
  netoGravado: string | number | null
  iva: string | number | null
  total: string | number | null
  alicuota: number | null
  creadoPor: { nombre: string; apellido: string; email: string | null } | null
}

type Exportacion = {
  id: string
  estado: string
  generadoEn: string
  hashZip: string | null
  observaciones: string | null
  generadoPor: { nombre: string; apellido: string; email: string | null } | null
}

type DatosPeriodo = {
  periodo: { id: string; mesAnio: string; estado: EstadoPeriodo; observaciones: string | null }
  resumen: {
    totalNetoVentas: number
    totalIvaVentas: number
    totalNetoCompras: number
    totalIvaCompras: number
    posicionIva: number
    cantVentas: number
    cantCompras: number
    cantAjustesAplicados: number
    emisor: { cuit: string; razonSocial: string }
  } | null
  validaciones: Validaciones
  ajustes: Ajuste[]
  exportaciones: Exportacion[]
}

interface Props { mesAnioInicial: string }

const TABS = ["resumen", "validaciones", "ajustes", "exportaciones"] as const
type TabKey = typeof TABS[number]

const COLOR_ESTADO: Record<EstadoPeriodo, string> = {
  ABIERTO: "bg-blue-100 text-blue-800",
  EN_REVISION_CONTADOR: "bg-amber-100 text-amber-800",
  TXT_GENERADO: "bg-purple-100 text-purple-800",
  CONCILIADO: "bg-emerald-100 text-emerald-800",
  PRESENTADO: "bg-green-100 text-green-800",
  REABIERTO: "bg-orange-100 text-orange-800",
}

export function PortalIvaShell({ mesAnioInicial }: Props) {
  const mesAnio = mesAnioInicial
  const [data, setData] = useState<DatosPeriodo | null>(null)
  const [tab, setTab] = useState<TabKey>("resumen")
  const [, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [accionEnCurso, setAccionEnCurso] = useState(false)
  const [formAjusteAbierto, setFormAjusteAbierto] = useState(false)

  const cargar = useCallback(async (m: string) => {
    setCargando(true); setError(null)
    try {
      const res = await fetch(`/api/contabilidad/iva/periodo?mesAnio=${m}`)
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? "Error al cargar período")
        return
      }
      setData(json)
    } catch {
      setError("Error de red")
    } finally { setCargando(false) }
  }, [])

  useEffect(() => { void cargar(mesAnio) }, [mesAnio, cargar])

  async function generarTxt() {
    if (!confirm(`¿Generar TXT ARCA para el período ${mesAnio}? Se creará una nueva exportación.`)) return
    setAccionEnCurso(true); setError(null)
    try {
      const res = await fetch("/api/contabilidad/iva/generar-txt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mesAnio }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? "Error al generar TXT")
        return
      }
      await cargar(mesAnio)
      alert("TXT generado y guardado. Revisar la solapa Exportaciones.")
    } finally { setAccionEnCurso(false) }
  }

  async function cambiarEstado(nuevoEstado: EstadoPeriodo) {
    if (!data) return
    let motivo: string | null = null
    if (nuevoEstado === "REABIERTO") {
      motivo = prompt("Motivo para REABRIR el período (obligatorio):") ?? ""
      if (!motivo || motivo.trim().length < 3) {
        alert("Motivo obligatorio (mín 3 caracteres)")
        return
      }
    }
    setAccionEnCurso(true); setError(null)
    try {
      const res = await fetch(`/api/contabilidad/iva/periodo/${data.periodo.id}/estado`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nuevoEstado, motivo: motivo ?? undefined }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? "Error al cambiar estado")
        return
      }
      await cargar(mesAnio)
    } finally { setAccionEnCurso(false) }
  }

  async function descargarExportacion(id: string) {
    const res = await fetch(`/api/contabilidad/iva/exportaciones/${id}/descargar`)
    const json = await res.json()
    if (!res.ok) { alert(json.error ?? "Error al descargar"); return }
    window.open(json.url as string, "_blank", "noopener,noreferrer")
    await cargar(mesAnio)
  }

  async function anularAjuste(id: string) {
    const motivo = prompt("Motivo de anulación:") ?? ""
    if (!motivo || motivo.trim().length < 3) return
    setAccionEnCurso(true); setError(null)
    try {
      const res = await fetch(`/api/contabilidad/iva/ajustes/${id}/anular`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ motivo }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? "Error al anular"); return }
      await cargar(mesAnio)
    } finally { setAccionEnCurso(false) }
  }

  return (
    <div className="space-y-4 mt-6 border-t pt-6">
      <div className="flex flex-wrap items-center gap-3">
        <h3 className="text-base font-semibold">Portal IVA — {formatMesAnio(mesAnio)}</h3>
        {data && (
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${COLOR_ESTADO[data.periodo.estado]}`}>
            {data.periodo.estado.replace(/_/g, " ")}
          </span>
        )}
      </div>

      {error && <FormError message={error} />}

      {data && (
        <>
          {/* Tabs Portal IVA */}
          <div className="border-b">
            <nav className="flex gap-0 -mb-px">
              {TABS.map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    tab === t
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t === "resumen" && "Portal IVA"}
                  {t === "validaciones" && `Validaciones (${data.validaciones.errores.length + data.validaciones.advertencias.length})`}
                  {t === "ajustes" && `Ajustes (${data.ajustes.filter(a => !a.anulado).length})`}
                  {t === "exportaciones" && `Exportaciones (${data.exportaciones.length})`}
                </button>
              ))}
            </nav>
          </div>

          {/* TAB Resumen */}
          {tab === "resumen" && (
            <div className="space-y-4">
              <Card>
                <CardHeader><CardTitle className="text-base">Estado y acciones</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {data.periodo.estado === "ABIERTO" && (
                      <Button variant="outline" size="sm" onClick={() => cambiarEstado("EN_REVISION_CONTADOR")} disabled={accionEnCurso}>
                        → En revisión contador
                      </Button>
                    )}
                    {(data.periodo.estado === "EN_REVISION_CONTADOR" || data.periodo.estado === "TXT_GENERADO" || data.periodo.estado === "REABIERTO") && (
                      <Button onClick={generarTxt} disabled={accionEnCurso || data.validaciones.errores.length > 0}>
                        Generar TXT ARCA
                      </Button>
                    )}
                    {data.periodo.estado === "TXT_GENERADO" && (
                      <Button variant="outline" size="sm" onClick={() => cambiarEstado("CONCILIADO")} disabled={accionEnCurso}>
                        → Conciliado
                      </Button>
                    )}
                    {data.periodo.estado === "CONCILIADO" && (
                      <Button variant="outline" size="sm" onClick={() => cambiarEstado("PRESENTADO")} disabled={accionEnCurso}>
                        → Presentado
                      </Button>
                    )}
                    {data.periodo.estado === "PRESENTADO" && (
                      <Button variant="destructive" size="sm" onClick={() => cambiarEstado("REABIERTO")} disabled={accionEnCurso}>
                        Reabrir período
                      </Button>
                    )}
                  </div>
                  {data.validaciones.errores.length > 0 && (
                    <p className="text-xs text-red-600">
                      Hay {data.validaciones.errores.length} error(es) bloqueante(s). No se puede generar TXT hasta corregir.
                    </p>
                  )}
                </CardContent>
              </Card>

              {data.resumen && (
                <div className="grid gap-3 md:grid-cols-4">
                  <Card><CardContent className="pt-4">
                    <p className="text-xs text-muted-foreground">Comprobantes ventas</p>
                    <p className="text-2xl font-bold">{data.resumen.cantVentas}</p>
                  </CardContent></Card>
                  <Card><CardContent className="pt-4">
                    <p className="text-xs text-muted-foreground">Comprobantes compras</p>
                    <p className="text-2xl font-bold">{data.resumen.cantCompras}</p>
                  </CardContent></Card>
                  <Card><CardContent className="pt-4">
                    <p className="text-xs text-muted-foreground">Ajustes aplicados</p>
                    <p className="text-2xl font-bold">{data.resumen.cantAjustesAplicados}</p>
                  </CardContent></Card>
                  <Card><CardContent className="pt-4">
                    <p className="text-xs text-muted-foreground">Última exportación</p>
                    <p className="text-sm font-medium">
                      {data.exportaciones[0]
                        ? formatearFecha(new Date(data.exportaciones[0].generadoEn))
                        : "—"}
                    </p>
                  </CardContent></Card>
                </div>
              )}
              {data.resumen && (
                <Card>
                  <CardContent className="pt-4 grid gap-3 md:grid-cols-4 text-sm">
                    <div><p className="text-xs text-muted-foreground">Neto ventas</p><p className="font-semibold">{formatearMoneda(data.resumen.totalNetoVentas)}</p></div>
                    <div><p className="text-xs text-muted-foreground">IVA ventas</p><p className="font-semibold">{formatearMoneda(data.resumen.totalIvaVentas)}</p></div>
                    <div><p className="text-xs text-muted-foreground">Neto compras</p><p className="font-semibold">{formatearMoneda(data.resumen.totalNetoCompras)}</p></div>
                    <div><p className="text-xs text-muted-foreground">IVA compras</p><p className="font-semibold">{formatearMoneda(data.resumen.totalIvaCompras)}</p></div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* TAB Validaciones */}
          {tab === "validaciones" && (
            <div className="space-y-3">
              {data.validaciones.errores.length === 0 && data.validaciones.advertencias.length === 0 && (
                <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded p-3">
                  Sin errores ni advertencias. El período está listo para exportar.
                </p>
              )}
              {data.validaciones.errores.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-red-700 mb-2">Errores bloqueantes ({data.validaciones.errores.length})</h3>
                  <div className="space-y-1.5">
                    {data.validaciones.errores.map((e, i) => (
                      <div key={i} className="border-l-4 border-red-500 bg-red-50 p-2 text-xs">
                        <p className="font-mono text-red-700">{e.codigo}</p>
                        <p>{e.mensaje}</p>
                        {e.referencia?.cbte && <p className="text-muted-foreground mt-1">Cbte: {e.referencia.cbte}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {data.validaciones.advertencias.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-amber-700 mb-2">Advertencias ({data.validaciones.advertencias.length})</h3>
                  <div className="space-y-1.5">
                    {data.validaciones.advertencias.map((a, i) => (
                      <div key={i} className="border-l-4 border-amber-500 bg-amber-50 p-2 text-xs">
                        <p className="font-mono text-amber-700">{a.codigo}</p>
                        <p>{a.mensaje}</p>
                        {a.referencia?.cbte && <p className="text-muted-foreground mt-1">Cbte: {a.referencia.cbte}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB Ajustes */}
          {tab === "ajustes" && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">{data.ajustes.length} ajuste(s) en este período</p>
                <Button size="sm" onClick={() => setFormAjusteAbierto(true)} disabled={data.periodo.estado === "PRESENTADO" || data.periodo.estado === "CONCILIADO"}>
                  + Nuevo ajuste
                </Button>
              </div>
              {data.ajustes.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">Sin ajustes.</p>
              ) : (
                <div className="border rounded overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-3 py-2 text-left">Tipo</th>
                        <th className="px-3 py-2 text-left">Libro</th>
                        <th className="px-3 py-2 text-left">Comprobante</th>
                        <th className="px-3 py-2 text-right">Monto</th>
                        <th className="px-3 py-2 text-left">Motivo</th>
                        <th className="px-3 py-2 text-left">Creado por</th>
                        <th className="px-3 py-2 text-left">Estado</th>
                        <th className="px-3 py-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.ajustes.map((a) => (
                        <tr key={a.id} className={`border-t ${a.anulado ? "opacity-60 line-through" : ""}`}>
                          <td className="px-3 py-2 text-xs">{a.tipoAjuste}</td>
                          <td className="px-3 py-2 text-xs">{a.tipoLibro}</td>
                          <td className="px-3 py-2 text-xs">
                            {a.tipoComprobanteArca ? `${a.tipoComprobanteArca} ` : ""}
                            {a.puntoVenta ? `${String(a.puntoVenta).padStart(4, "0")}-` : ""}
                            {a.numeroDesde ? String(a.numeroDesde) : ""}
                          </td>
                          <td className="px-3 py-2 text-right">
                            {a.total != null ? formatearMoneda(Number(a.total)) : a.netoGravado != null ? formatearMoneda(Number(a.netoGravado)) : "—"}
                          </td>
                          <td className="px-3 py-2 max-w-[300px] truncate" title={a.motivo}>{a.motivo}</td>
                          <td className="px-3 py-2 text-xs">{a.creadoPor ? `${a.creadoPor.apellido}, ${a.creadoPor.nombre}` : "—"}</td>
                          <td className="px-3 py-2 text-xs">
                            {a.anulado ? <span className="text-red-700">Anulado</span> : <span className="text-green-700">Activo</span>}
                          </td>
                          <td className="px-3 py-2 text-right">
                            {!a.anulado && (
                              <Button variant="outline" size="sm" onClick={() => anularAjuste(a.id)} disabled={accionEnCurso}>
                                Anular
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {formAjusteAbierto && (
                <FormularioAjuste
                  periodoIvaId={data.periodo.id}
                  onCerrar={() => setFormAjusteAbierto(false)}
                  onCreado={() => { setFormAjusteAbierto(false); cargar(mesAnio) }}
                />
              )}
            </div>
          )}

          {/* TAB Exportaciones */}
          {tab === "exportaciones" && (
            <div className="space-y-3">
              {data.exportaciones.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">Sin exportaciones generadas para este período.</p>
              ) : (
                <div className="border rounded overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-3 py-2 text-left">Generada</th>
                        <th className="px-3 py-2 text-left">Estado</th>
                        <th className="px-3 py-2 text-left">Por</th>
                        <th className="px-3 py-2 text-left">Hash ZIP (SHA256)</th>
                        <th className="px-3 py-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.exportaciones.map((e) => (
                        <tr key={e.id} className="border-t">
                          <td className="px-3 py-2 text-xs">{new Date(e.generadoEn).toLocaleString("es-AR")}</td>
                          <td className="px-3 py-2"><span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">{e.estado}</span></td>
                          <td className="px-3 py-2 text-xs">{e.generadoPor ? `${e.generadoPor.apellido}, ${e.generadoPor.nombre}` : "—"}</td>
                          <td className="px-3 py-2 font-mono text-xs truncate max-w-[260px]" title={e.hashZip ?? ""}>{e.hashZip?.slice(0, 16)}…</td>
                          <td className="px-3 py-2 text-right">
                            <Button variant="outline" size="sm" onClick={() => descargarExportacion(e.id)}>
                              Descargar ZIP
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ─── Subcomponente: form de ajuste manual ────────────────────────────────────

function FormularioAjuste({
  periodoIvaId, onCerrar, onCreado,
}: {
  periodoIvaId: string
  onCerrar: () => void
  onCreado: () => void
}) {
  const [tipoLibro, setTipoLibro] = useState<"VENTAS" | "COMPRAS">("VENTAS")
  const [tipoAjuste, setTipoAjuste] = useState<"AGREGAR" | "MODIFICAR" | "EXCLUIR" | "REDONDEO" | "RECLASIFICAR">("MODIFICAR")
  const [tipoComprobanteArca, setTipoComprobanteArca] = useState("")
  const [puntoVenta, setPuntoVenta] = useState("")
  const [numeroDesde, setNumeroDesde] = useState("")
  const [cuit, setCuit] = useState("")
  const [razon, setRazon] = useState("")
  const [neto, setNeto] = useState("")
  const [iva, setIva] = useState("")
  const [total, setTotal] = useState("")
  const [alic, setAlic] = useState("21")
  const [motivo, setMotivo] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError(null)
    try {
      const body: Record<string, unknown> = {
        periodoIvaId, tipoLibro, tipoAjuste, motivo,
      }
      if (tipoComprobanteArca) body.tipoComprobanteArca = parseInt(tipoComprobanteArca)
      if (puntoVenta) body.puntoVenta = parseInt(puntoVenta)
      if (numeroDesde) body.numeroDesde = parseInt(numeroDesde)
      if (cuit) body.cuitContraparte = cuit
      if (razon) body.razonSocialContraparte = razon
      if (neto) body.netoGravado = parseFloat(neto)
      if (iva) body.iva = parseFloat(iva)
      if (total) body.total = parseFloat(total)
      if (alic) body.alicuota = parseFloat(alic)

      const res = await fetch("/api/contabilidad/iva/ajustes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? "Error al crear ajuste")
        return
      }
      onCreado()
    } finally { setLoading(false) }
  }

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Nuevo ajuste</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Libro</Label>
              <Select value={tipoLibro} onChange={(e) => setTipoLibro(e.target.value as "VENTAS" | "COMPRAS")}>
                <option value="VENTAS">Ventas</option>
                <option value="COMPRAS">Compras</option>
              </Select>
            </div>
            <div>
              <Label>Tipo</Label>
              <Select value={tipoAjuste} onChange={(e) => setTipoAjuste(e.target.value as typeof tipoAjuste)}>
                <option value="AGREGAR">Agregar fila nueva</option>
                <option value="MODIFICAR">Modificar fila existente</option>
                <option value="EXCLUIR">Excluir fila</option>
                <option value="REDONDEO">Ajuste de redondeo</option>
                <option value="RECLASIFICAR">Reclasificar (cambiar libro)</option>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div><Label className="text-xs">Tipo cbte ARCA</Label><Input value={tipoComprobanteArca} onChange={(e) => setTipoComprobanteArca(e.target.value)} placeholder="1, 6, 60..." /></div>
            <div><Label className="text-xs">Pto venta</Label><Input value={puntoVenta} onChange={(e) => setPuntoVenta(e.target.value)} /></div>
            <div><Label className="text-xs">Nro</Label><Input value={numeroDesde} onChange={(e) => setNumeroDesde(e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label className="text-xs">CUIT contraparte</Label><Input value={cuit} onChange={(e) => setCuit(e.target.value)} /></div>
            <div><Label className="text-xs">Razón social</Label><Input value={razon} onChange={(e) => setRazon(e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-4 gap-2">
            <div><Label className="text-xs">Neto</Label><Input type="number" step="0.01" value={neto} onChange={(e) => setNeto(e.target.value)} /></div>
            <div><Label className="text-xs">Alícuota %</Label><Input type="number" step="0.5" value={alic} onChange={(e) => setAlic(e.target.value)} /></div>
            <div><Label className="text-xs">IVA</Label><Input type="number" step="0.01" value={iva} onChange={(e) => setIva(e.target.value)} /></div>
            <div><Label className="text-xs">Total</Label><Input type="number" step="0.01" value={total} onChange={(e) => setTotal(e.target.value)} /></div>
          </div>
          <div>
            <Label>Motivo (obligatorio)</Label>
            <Input value={motivo} onChange={(e) => setMotivo(e.target.value)} required minLength={3} />
          </div>
          {error && <FormError message={error} />}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onCerrar}>Cancelar</Button>
            <Button type="submit" disabled={loading || motivo.trim().length < 3}>{loading ? "Guardando..." : "Crear ajuste"}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
