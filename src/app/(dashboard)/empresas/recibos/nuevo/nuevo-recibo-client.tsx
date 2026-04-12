"use client"

/**
 * Propósito: Formulario multi-paso para crear un Recibo de Cobranza.
 *
 * Paso 1: Seleccionar empresa + facturas con monto editable (aplicación parcial)
 * Paso 2: Retenciones y medios de pago (incl. efectivo y saldo cta cte)
 * Paso 3: Confirmar y emitir
 * Paso 4 (éxito): Ver PDF / Enviar por mail / Nuevo recibo
 */

import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { SearchCombobox } from "@/components/ui/search-combobox"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { sumarImportes, parsearImporte } from "@/lib/money"
import { hoyLocalYmd } from "@/lib/date-local"

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Empresa { id: string; razonSocial: string; cuit: string }
interface Cuenta { id: string; nombre: string; bancoOEntidad: string }
interface ContactoEmail { id: string; email: string; nombre: string | null }

interface ViajeEnFactura {
  viajeId: string
  fleteroId: string
  fechaViaje: string
  remito: string | null
  procedencia: string | null
  destino: string | null
  kilos: number | null
}

interface NotaCDResumen {
  tipo: string   // NC_EMITIDA | NC_RECIBIDA | ND_EMITIDA | ND_RECIBIDA
  montoTotal: number
  nro: string | null
}

interface FacturaPendiente {
  id: string
  nroComprobante: string | null
  tipoCbte: number
  total: number
  emitidaEn: string
  neto: number
  ivaMonto: number
  estadoCobro: string
  saldoPendiente: number
  notasCD?: NotaCDResumen[]
  viajes: ViajeEnFactura[]
}

interface MedioPago {
  tipo: "TRANSFERENCIA" | "ECHEQ" | "CHEQUE_FISICO" | "EFECTIVO" | "SALDO_CTA_CTE"
  monto: string
  cuentaId?: string
  fechaTransferencia?: string
  referencia?: string
  nroCheque?: string
  bancoEmisor?: string
  fechaEmision?: string
  fechaPago?: string
}

interface NuevoReciboClientProps { empresas: Empresa[]; cuentas: Cuenta[] }

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 2 }).format(n)
}

function fmtFecha(s: string) { return new Date(s).toLocaleDateString("es-AR") }

function tipoCbteLabel(t: number) {
  if (t === 1) return "Fact. A"
  if (t === 6) return "Fact. B"
  if (t === 201) return "Fact. A MiPyme"
  return `Cbte ${t}`
}

function tipoNotaCDLabel(t: string) {
  const map: Record<string, string> = {
    NC_EMITIDA: "NC emitida",
    NC_RECIBIDA: "NC recibida",
    ND_EMITIDA: "ND emitida",
    ND_RECIBIDA: "ND recibida",
  }
  return map[t] ?? t
}

function tipoMedioLabel(t: string) {
  const map: Record<string, string> = {
    TRANSFERENCIA: "Transferencia",
    ECHEQ: "ECheq",
    CHEQUE_FISICO: "Cheque Físico",
    EFECTIVO: "Efectivo",
    SALDO_CTA_CTE: "Saldo Cta. Cte.",
  }
  return map[t] ?? t
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function NuevoReciboClient({ empresas, cuentas }: NuevoReciboClientProps) {
  const router = useRouter()
  const [paso, setPaso] = useState(1)

  // Paso 1
  const [empresaId, setEmpresaId] = useState("")
  const [facturas, setFacturas] = useState<FacturaPendiente[]>([])
  const [loadingFacturas, setLoadingFacturas] = useState(false)
  const [errorFacturas, setErrorFacturas] = useState<string | null>(null)
  const [seleccionadas, setSeleccionadas] = useState<Set<string>>(new Set())
  const [importes, setImportes] = useState<Record<string, string>>({}) // facturaId → monto string

  // Paso 2
  const [fecha, setFecha] = useState(hoyLocalYmd())
  const [retGanancias, setRetGanancias] = useState("")
  const [retIIBB, setRetIIBB] = useState("")
  const [retSUSS, setRetSUSS] = useState("")
  const [medios, setMedios] = useState<MedioPago[]>([
    { tipo: "TRANSFERENCIA", monto: "", cuentaId: "", fechaTransferencia: hoyLocalYmd(), referencia: "" },
  ])
  const [saldoAFavorDisponible, setSaldoAFavorDisponible] = useState(0)

  // Paso 3 / resultado
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reciboCreado, setReciboCreado] = useState<{ id: string; nro: number } | null>(null)
  const [loadingPDF, setLoadingPDF] = useState(false)

  // Email
  const [contactosEmail, setContactosEmail] = useState<ContactoEmail[]>([])
  const [loadingContactos, setLoadingContactos] = useState(false)
  const [mostrarEnvioMail, setMostrarEnvioMail] = useState(false)
  const [emailSeleccionado, setEmailSeleccionado] = useState("")
  const [enviandoMail, setEnviandoMail] = useState(false)
  const [resultadoMail, setResultadoMail] = useState<{ ok: boolean; msg: string } | null>(null)

  // ─── Cargar facturas + saldo CC ──────────────────────────────────────────

  const cargarFacturas = useCallback(async (eId: string) => {
    if (!eId) return
    setLoadingFacturas(true)
    setErrorFacturas(null)
    try {
      const [resFact, resSaldo] = await Promise.all([
        fetch(`/api/facturas-pendientes?empresaId=${eId}`),
        fetch(`/api/empresas/${eId}/saldo-cc`),
      ])
      if (!resFact.ok) throw new Error("Error cargando facturas")
      const data: FacturaPendiente[] = await resFact.json()
      setFacturas(data)
      setSeleccionadas(new Set())
      setImportes({})
      if (resSaldo.ok) {
        const saldoData = await resSaldo.json()
        setSaldoAFavorDisponible(saldoData.saldoAFavor ?? 0)
      }
    } catch {
      setErrorFacturas("No se pudieron cargar las facturas pendientes")
    } finally {
      setLoadingFacturas(false)
    }
  }, [])

  useEffect(() => {
    if (empresaId) cargarFacturas(empresaId)
    else { setFacturas([]); setSeleccionadas(new Set()); setImportes({}); setSaldoAFavorDisponible(0) }
  }, [empresaId, cargarFacturas])

  // ─── Cálculos ─────────────────────────────────────────────────────────────

  const totalAplicado = useMemo(() => {
    return sumarImportes(
      Array.from(seleccionadas).map((id) => parsearImporte(importes[id] ?? "0"))
    )
  }, [seleccionadas, importes])

  const totalOriginalFacturas = useMemo(() => {
    return sumarImportes(
      facturas.filter((f) => seleccionadas.has(f.id)).map((f) => f.total)
    )
  }, [facturas, seleccionadas])

  const retGananciasNum = parsearImporte(retGanancias)
  const retIIBBNum = parsearImporte(retIIBB)
  const retSUSSNum = parsearImporte(retSUSS)
  const totalRetenciones = sumarImportes([retGananciasNum, retIIBBNum, retSUSSNum])
  const totalMedios = sumarImportes(medios.map((m) => parsearImporte(m.monto)))

  const montoCubrir = totalAplicado
  const montoProvisto = sumarImportes([totalMedios, totalRetenciones])
  const saldoACuenta = Math.max(0, montoProvisto - montoCubrir)
  const balanceOk = montoProvisto >= montoCubrir - 0.01

  // ─── Funciones de UI ──────────────────────────────────────────────────────

  function toggleFactura(id: string) {
    setSeleccionadas((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
        setImportes((prev) => { const n = { ...prev }; delete n[id]; return n })
      } else {
        next.add(id)
        const f = facturas.find((f) => f.id === id)
        if (f) setImportes((prev) => ({ ...prev, [id]: f.saldoPendiente.toFixed(2) }))
      }
      return next
    })
  }

  function seleccionarTodas() {
    const ids = new Set(facturas.map((f) => f.id))
    setSeleccionadas(ids)
    const imp: Record<string, string> = {}
    facturas.forEach((f) => { imp[f.id] = f.saldoPendiente.toFixed(2) })
    setImportes(imp)
  }

  function deseleccionarTodas() { setSeleccionadas(new Set()); setImportes({}) }

  function actualizarImporte(id: string, valor: string) {
    setImportes((prev) => ({ ...prev, [id]: valor }))
  }

  function agregarMedio() {
    setMedios([...medios, { tipo: "TRANSFERENCIA", monto: "", cuentaId: "", fechaTransferencia: hoyLocalYmd() }])
  }
  function quitarMedio(i: number) { setMedios(medios.filter((_, idx) => idx !== i)) }
  function actualizarMedio(i: number, campo: keyof MedioPago, valor: string) {
    setMedios(medios.map((m, idx) => (idx === i ? { ...m, [campo]: valor } : m)))
  }

  // ─── Envío ────────────────────────────────────────────────────────────────

  async function handleEmitir() {
    setLoading(true)
    setError(null)
    try {
      const facturasAplicadas = Array.from(seleccionadas).map((id) => ({
        facturaId: id,
        montoAplicado: parsearImporte(importes[id] ?? "0"),
      }))

      const body = {
        empresaId,
        facturasAplicadas,
        mediosPago: medios.map((m) => ({
          tipo: m.tipo,
          monto: parsearImporte(m.monto),
          cuentaId: m.cuentaId || undefined,
          fechaTransferencia: m.fechaTransferencia || undefined,
          referencia: m.referencia || undefined,
          nroCheque: m.nroCheque || undefined,
          bancoEmisor: m.bancoEmisor || undefined,
          fechaEmision: m.fechaEmision || undefined,
          fechaPago: m.fechaPago || undefined,
        })),
        retencionGanancias: retGananciasNum,
        retencionIIBB: retIIBBNum,
        retencionSUSS: retSUSSNum,
        faltantes: [],
        fecha,
      }

      const res = await fetch("/api/recibos-cobranza", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? "Error al crear el recibo")
      }

      const data = await res.json()
      setReciboCreado(data)
      setPaso(4)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido")
    } finally {
      setLoading(false)
    }
  }

  async function verPDF() {
    if (!reciboCreado) return
    setLoadingPDF(true)
    try {
      const res = await fetch(`/api/recibos-cobranza/${reciboCreado.id}/pdf`)
      if (!res.ok) throw new Error("Error obteniendo PDF")
      const { url } = await res.json()
      window.open(url, "_blank")
    } catch { alert("No se pudo obtener el PDF") }
    finally { setLoadingPDF(false) }
  }

  async function abrirEnvioMail() {
    setMostrarEnvioMail(true)
    setResultadoMail(null)
    setEmailSeleccionado("")
    if (contactosEmail.length === 0) {
      setLoadingContactos(true)
      try {
        const res = await fetch(`/api/empresas/${empresaId}/contactos-email`)
        if (res.ok) {
          const data: ContactoEmail[] = await res.json()
          setContactosEmail(data)
          if (data.length === 1) setEmailSeleccionado(data[0].email)
        }
      } catch { /* silencioso */ }
      finally { setLoadingContactos(false) }
    }
  }

  async function enviarPorMail() {
    if (!reciboCreado || !emailSeleccionado) return
    setEnviandoMail(true)
    setResultadoMail(null)
    try {
      const res = await fetch(`/api/recibos-cobranza/${reciboCreado.id}/enviar-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailDestino: emailSeleccionado }),
      })
      const data = await res.json()
      setResultadoMail(res.ok ? { ok: true, msg: `Email enviado a ${data.emailDestino}` } : { ok: false, msg: data.error ?? "Error" })
    } catch { setResultadoMail({ ok: false, msg: "Error de conexión" }) }
    finally { setEnviandoMail(false) }
  }

  function resetForm() {
    setEmpresaId(""); setFacturas([]); setSeleccionadas(new Set()); setImportes({})
    setRetGanancias(""); setRetIIBB(""); setRetSUSS("")
    setMedios([{ tipo: "TRANSFERENCIA", monto: "", cuentaId: "", fechaTransferencia: hoyLocalYmd() }])
    setFecha(hoyLocalYmd()); setReciboCreado(null); setError(null)
    setContactosEmail([]); setMostrarEnvioMail(false); setResultadoMail(null); setEmailSeleccionado("")
    setSaldoAFavorDisponible(0); setPaso(1)
  }

  // ─── Renderizado ──────────────────────────────────────────────────────────

  const empresaItem = empresas.map((e) => ({ id: e.id, label: e.razonSocial, sublabel: e.cuit }))
  const empresa = empresas.find((e) => e.id === empresaId)

  // ════════ PASO 1 ════════
  if (paso === 1) {
    return (
      <div className="max-w-3xl mx-auto mt-8 space-y-6">
        <h1 className="text-2xl font-bold">Nuevo Recibo de Cobranza</h1>
        <Card>
          <CardHeader><CardTitle className="text-base">Paso 1 — Seleccionar empresa y facturas</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Empresa</Label>
              <SearchCombobox items={empresaItem} value={empresaId} onChange={setEmpresaId} placeholder="Buscar empresa..." />
            </div>

            {empresaId && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-muted-foreground">Facturas pendientes de cobro</p>
                  {facturas.length > 0 && (
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={seleccionarTodas}>Todas al 100%</Button>
                      <Button variant="outline" size="sm" onClick={deseleccionarTodas}>Ninguna</Button>
                    </div>
                  )}
                </div>

                {loadingFacturas ? (
                  <p className="text-muted-foreground text-sm">Cargando facturas...</p>
                ) : errorFacturas ? (
                  <p className="text-destructive text-sm">{errorFacturas}</p>
                ) : facturas.length === 0 ? (
                  <p className="text-muted-foreground text-sm">Esta empresa no tiene facturas pendientes de cobro.</p>
                ) : (
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 pr-2 w-8"></th>
                        <th className="text-left py-2 pr-2">Fecha</th>
                        <th className="text-left py-2 pr-2">Tipo</th>
                        <th className="text-left py-2 pr-2">Nro.</th>
                        <th className="text-right py-2 pr-2">Total</th>
                        <th className="text-right py-2 pr-2">Saldo</th>
                        <th className="text-right py-2">Aplicar</th>
                      </tr>
                    </thead>
                    <tbody>
                      {facturas.map((f) => {
                        const sel = seleccionadas.has(f.id)
                        const notas = f.notasCD ?? []
                        const tieneNotas = notas.length > 0
                        return (
                          <tr key={f.id} className={`border-b hover:bg-muted/40 ${tieneNotas && sel ? "border-b-0" : ""}`}>
                            <td className="py-2 pr-2">
                              <input type="checkbox" checked={sel} onChange={() => toggleFactura(f.id)} />
                            </td>
                            <td className="py-2 pr-2">{fmtFecha(f.emitidaEn)}</td>
                            <td className="py-2 pr-2">
                              {tipoCbteLabel(f.tipoCbte)}
                              {f.estadoCobro === "PARCIALMENTE_COBRADA" && (
                                <span className="ml-1 text-[10px] bg-amber-100 text-amber-700 rounded-full px-1.5 py-0.5">Parcial</span>
                              )}
                            </td>
                            <td className="py-2 pr-2 font-mono text-xs">{f.nroComprobante ?? "—"}</td>
                            <td className="py-2 pr-2 text-right font-mono">{fmt(f.total)}</td>
                            <td className="py-2 pr-2 text-right font-mono">{fmt(f.saldoPendiente)}</td>
                            <td className="py-2 text-right">
                              {sel ? (
                                <Input
                                  type="number" min="0.01" step="0.01"
                                  max={f.saldoPendiente}
                                  value={importes[f.id] ?? ""}
                                  onChange={(e) => actualizarImporte(f.id, e.target.value)}
                                  className="h-7 w-28 text-sm text-right ml-auto"
                                />
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                      {/* Desglose NC/ND de facturas seleccionadas que tengan notas */}
                      {(() => {
                        const facturasConNotas = facturas.filter(
                          (f) => seleccionadas.has(f.id) && f.notasCD && f.notasCD.length > 0
                        )
                        if (facturasConNotas.length === 0) return null
                        return (
                          <tr>
                            <td colSpan={7} className="p-0">
                              <div className="bg-muted/30 border-t border-b px-4 py-2 space-y-2">
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Notas de Crédito / Débito asociadas</p>
                                {facturasConNotas.map((f) => (
                                  <div key={f.id} className="space-y-0.5">
                                    {facturasConNotas.length > 1 && (
                                      <p className="text-xs text-muted-foreground">Factura {f.nroComprobante ?? f.id.slice(0, 8)}:</p>
                                    )}
                                    {f.notasCD!.map((n, i) => {
                                      const esNC = n.tipo === "NC_EMITIDA" || n.tipo === "NC_RECIBIDA"
                                      return (
                                        <div key={i} className="flex justify-between items-center text-xs">
                                          <span>
                                            <span className={`inline-block w-2 h-2 rounded-full mr-1.5 ${esNC ? "bg-green-500" : "bg-amber-500"}`} />
                                            {tipoNotaCDLabel(n.tipo)}
                                            {n.nro && <span className="font-mono ml-1">{n.nro}</span>}
                                          </span>
                                          <span className={`font-mono font-medium ${esNC ? "text-green-700" : "text-amber-700"}`}>
                                            {esNC ? "−" : "+"} {fmt(n.montoTotal)}
                                          </span>
                                        </div>
                                      )
                                    })}
                                  </div>
                                ))}
                              </div>
                            </td>
                          </tr>
                        )
                      })()}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan={6} className="py-2 font-semibold">
                          {seleccionadas.size} factura(s) — Total a aplicar:
                        </td>
                        <td className="py-2 text-right font-bold font-mono">{fmt(totalAplicado)}</td>
                      </tr>
                    </tfoot>
                  </table>
                )}
              </div>
            )}

            <Button disabled={!empresaId || seleccionadas.size === 0 || totalAplicado <= 0} onClick={() => setPaso(2)}>
              Siguiente
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ════════ PASO 2 ════════
  if (paso === 2) {
    return (
      <div className="max-w-4xl mx-auto mt-8">
        <h1 className="text-2xl font-bold mb-2">Nuevo Recibo de Cobranza</h1>
        <p className="text-muted-foreground mb-6">Empresa: <span className="font-semibold">{empresa?.razonSocial}</span></p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Panel izquierdo */}
          <Card>
            <CardHeader><CardTitle className="text-base">Resumen y retenciones</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total original ({seleccionadas.size} fact.):</span>
                <span className="font-mono">{fmt(totalOriginalFacturas)}</span>
              </div>

              {/* Desglose NC/ND */}
              {(() => {
                const facturasConNotas = facturas.filter(
                  (f) => seleccionadas.has(f.id) && f.notasCD && f.notasCD.length > 0
                )
                const notas = facturasConNotas.flatMap((f) =>
                  f.notasCD!.map((n) => ({ ...n, factNro: f.nroComprobante }))
                )
                if (notas.length === 0) return null
                return (
                  <div className="rounded-lg border bg-muted/30 p-3 space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Notas de Crédito / Débito incluidas en saldo</p>
                    {notas.map((n, i) => {
                      const esNC = n.tipo === "NC_EMITIDA" || n.tipo === "NC_RECIBIDA"
                      return (
                        <div key={i} className="flex justify-between items-center text-xs">
                          <span>
                            <span className={`inline-block w-2 h-2 rounded-full mr-1.5 ${esNC ? "bg-green-500" : "bg-amber-500"}`} />
                            {tipoNotaCDLabel(n.tipo)}
                            {n.nro && <span className="font-mono ml-1">{n.nro}</span>}
                          </span>
                          <span className={`font-mono font-medium ${esNC ? "text-green-700" : "text-amber-700"}`}>
                            {esNC ? "−" : "+"} {fmt(n.montoTotal)}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )
              })()}

              <div className="flex justify-between text-sm font-semibold">
                <span className="text-muted-foreground">Total aplicado:</span>
                <span className="font-bold font-mono">{fmt(totalAplicado)}</span>
              </div>

              <hr />

              <p className="text-sm font-semibold">Retenciones</p>
              <div className="space-y-2">
                {[
                  { label: "Ganancias", value: retGanancias, set: setRetGanancias },
                  { label: "IIBB", value: retIIBB, set: setRetIIBB },
                  { label: "SUSS", value: retSUSS, set: setRetSUSS },
                ].map(({ label, value, set }) => (
                  <div key={label} className="flex items-center gap-2">
                    <Label className="w-32 text-xs">{label}</Label>
                    <Input type="number" min="0" step="0.01" value={value} onChange={(e) => set(e.target.value)} placeholder="0.00" className="h-8 text-sm" />
                  </div>
                ))}
              </div>

              <hr />
              <div className="space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Total retenciones:</span><span className="font-mono">{fmt(totalRetenciones)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Total medios de pago:</span><span className="font-mono">{fmt(totalMedios)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">A cubrir:</span><span className="font-mono">{fmt(montoCubrir)}</span></div>
                {saldoACuenta > 0 && (
                  <div className="flex justify-between text-blue-600"><span>Saldo a cuenta:</span><span className="font-mono">{fmt(saldoACuenta)}</span></div>
                )}
                <div className={`flex justify-between font-bold ${balanceOk ? "text-green-600" : "text-destructive"}`}>
                  <span>{balanceOk ? "Balance OK" : "Falta cubrir:"}</span>
                  <span className="font-mono">{balanceOk ? "✓" : fmt(montoCubrir - montoProvisto)}</span>
                </div>
              </div>

              <hr />
              <div className="space-y-1">
                <Label className="text-xs">Fecha del recibo</Label>
                <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className="h-8 text-sm" />
              </div>
            </CardContent>
          </Card>

          {/* Panel derecho: medios de pago */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Medios de Pago</CardTitle>
              <Button variant="outline" size="sm" onClick={agregarMedio}>+ Agregar</Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {saldoAFavorDisponible > 0 && (
                <p className="text-xs text-blue-600 bg-blue-50 rounded p-2">
                  Saldo a favor disponible: <span className="font-bold">{fmt(saldoAFavorDisponible)}</span>
                </p>
              )}
              {medios.map((m, i) => (
                <div key={i} className="border rounded-md p-3 space-y-2 relative">
                  {medios.length > 1 && (
                    <button onClick={() => quitarMedio(i)} className="absolute top-2 right-2 text-muted-foreground hover:text-destructive text-xs">✕</button>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Tipo</Label>
                      <select value={m.tipo} onChange={(e) => actualizarMedio(i, "tipo", e.target.value)} className="h-8 w-full rounded-md border bg-background px-2 text-sm">
                        <option value="TRANSFERENCIA">Transferencia</option>
                        <option value="ECHEQ">ECheq</option>
                        <option value="CHEQUE_FISICO">Cheque Físico</option>
                        <option value="EFECTIVO">Efectivo</option>
                        {saldoAFavorDisponible > 0 && <option value="SALDO_CTA_CTE">Saldo Cta. Cte.</option>}
                      </select>
                    </div>
                    <div>
                      <Label className="text-xs">Monto</Label>
                      <Input type="number" min="0" step="0.01" value={m.monto} onChange={(e) => actualizarMedio(i, "monto", e.target.value)}
                        placeholder="0.00" className="h-8 text-sm"
                        max={m.tipo === "SALDO_CTA_CTE" ? saldoAFavorDisponible : undefined}
                      />
                    </div>
                  </div>

                  {m.tipo === "TRANSFERENCIA" && (
                    <>
                      <div>
                        <Label className="text-xs">Cuenta destino</Label>
                        <select value={m.cuentaId ?? ""} onChange={(e) => actualizarMedio(i, "cuentaId", e.target.value)} className="h-8 w-full rounded-md border bg-background px-2 text-sm">
                          <option value="">— Sin cuenta —</option>
                          {cuentas.map((c) => <option key={c.id} value={c.id}>{c.nombre} ({c.bancoOEntidad})</option>)}
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs">Fecha transferencia</Label>
                          <Input type="date" value={m.fechaTransferencia ?? ""} onChange={(e) => actualizarMedio(i, "fechaTransferencia", e.target.value)} className="h-8 text-sm" />
                        </div>
                        <div>
                          <Label className="text-xs">Referencia</Label>
                          <Input value={m.referencia ?? ""} onChange={(e) => actualizarMedio(i, "referencia", e.target.value)} placeholder="Nro. CBU o ref." className="h-8 text-sm" />
                        </div>
                      </div>
                    </>
                  )}

                  {(m.tipo === "ECHEQ" || m.tipo === "CHEQUE_FISICO") && (
                    <>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs">Nro. Cheque</Label>
                          <Input value={m.nroCheque ?? ""} onChange={(e) => actualizarMedio(i, "nroCheque", e.target.value)} placeholder="00000000" className="h-8 text-sm" />
                        </div>
                        <div>
                          <Label className="text-xs">Banco emisor</Label>
                          <Input value={m.bancoEmisor ?? ""} onChange={(e) => actualizarMedio(i, "bancoEmisor", e.target.value)} placeholder="Banco..." className="h-8 text-sm" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs">Fecha emisión</Label>
                          <Input type="date" value={m.fechaEmision ?? ""} onChange={(e) => actualizarMedio(i, "fechaEmision", e.target.value)} className="h-8 text-sm" />
                        </div>
                        <div>
                          <Label className="text-xs">Fecha vto/pago</Label>
                          <Input type="date" value={m.fechaPago ?? ""} onChange={(e) => actualizarMedio(i, "fechaPago", e.target.value)} className="h-8 text-sm" />
                        </div>
                      </div>
                    </>
                  )}

                  {m.tipo === "SALDO_CTA_CTE" && (
                    <p className="text-xs text-muted-foreground">Se descontará del saldo a favor de la empresa en cta. cte.</p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-3 mt-6">
          <Button variant="outline" onClick={() => setPaso(1)}>Atrás</Button>
          <Button disabled={!balanceOk || seleccionadas.size === 0} onClick={() => setPaso(3)}>Siguiente</Button>
        </div>
      </div>
    )
  }

  // ════════ PASO 3 ════════
  if (paso === 3) {
    return (
      <div className="max-w-2xl mx-auto mt-8">
        <h1 className="text-2xl font-bold mb-6">Nuevo Recibo — Confirmar</h1>
        <Card>
          <CardHeader><CardTitle className="text-base">Resumen del Recibo</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Empresa:</span><span className="font-semibold">{empresa?.razonSocial}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Fecha:</span><span>{fmtFecha(fecha + "T00:00:00")}</span></div>
            <hr />
            <p className="font-semibold">Facturas aplicadas:</p>
            {Array.from(seleccionadas).map((id) => {
              const f = facturas.find((f) => f.id === id)
              if (!f) return null
              return (
                <div key={id} className="flex justify-between">
                  <span className="text-muted-foreground">{tipoCbteLabel(f.tipoCbte)} {f.nroComprobante ?? ""}</span>
                  <span className="font-mono">{fmt(parsearImporte(importes[id] ?? "0"))}</span>
                </div>
              )
            })}
            <div className="flex justify-between font-bold"><span>Total aplicado:</span><span className="font-mono">{fmt(totalAplicado)}</span></div>

            {totalRetenciones > 0 && (
              <>
                <hr />
                <div className="flex justify-between"><span className="text-muted-foreground">Total retenciones:</span><span className="font-mono">{fmt(totalRetenciones)}</span></div>
              </>
            )}

            <hr />
            <p className="font-semibold">Medios de pago:</p>
            {medios.map((m, i) => (
              <div key={i} className="flex justify-between">
                <span className="text-muted-foreground">
                  {tipoMedioLabel(m.tipo)}
                  {m.nroCheque ? ` Nro ${m.nroCheque}` : ""}
                  {m.bancoEmisor ? ` — ${m.bancoEmisor}` : ""}
                </span>
                <span className="font-mono">{fmt(parsearImporte(m.monto))}</span>
              </div>
            ))}
            <div className="flex justify-between font-bold"><span>Total cobrado:</span><span className="font-mono">{fmt(totalMedios)}</span></div>

            {saldoACuenta > 0 && (
              <div className="flex justify-between text-blue-600 font-semibold">
                <span>Saldo a cuenta:</span><span className="font-mono">{fmt(saldoACuenta)}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {error && (
          <div className="mt-4 p-3 bg-destructive/10 border border-destructive/30 rounded-md text-sm text-destructive">{error}</div>
        )}

        <div className="flex gap-3 mt-6">
          <Button variant="outline" onClick={() => setPaso(2)} disabled={loading}>Atrás</Button>
          <Button onClick={handleEmitir} disabled={loading || !balanceOk}>
            {loading ? "Emitiendo..." : "Emitir Recibo"}
          </Button>
        </div>
      </div>
    )
  }

  // ════════ PASO 4 ════════
  if (paso === 4 && reciboCreado) {
    return (
      <div className="max-w-lg mx-auto mt-8 text-center space-y-6">
        <div className="text-5xl">&#10003;</div>
        <h1 className="text-2xl font-bold">Recibo emitido</h1>
        <p className="text-muted-foreground">
          Recibo Nro <span className="font-mono font-semibold">0001-{String(reciboCreado.nro).padStart(8, "0")}</span> creado correctamente.
        </p>
        {saldoACuenta > 0 && (
          <p className="text-blue-600 text-sm">Se registró saldo a cuenta de <span className="font-bold">{fmt(saldoACuenta)}</span> en la cta. cte. de la empresa.</p>
        )}
        <div className="flex flex-col gap-3 items-center">
          <Button onClick={verPDF} disabled={loadingPDF} className="w-48">{loadingPDF ? "Cargando..." : "Ver PDF"}</Button>

          {!mostrarEnvioMail ? (
            <Button variant="outline" onClick={abrirEnvioMail} className="w-48">Enviar por mail</Button>
          ) : (
            <div className="w-full max-w-sm border rounded-md p-4 space-y-3 text-left">
              <p className="text-sm font-medium">Enviar recibo por email</p>
              {loadingContactos ? (
                <p className="text-xs text-muted-foreground">Cargando contactos...</p>
              ) : contactosEmail.length > 0 ? (
                <div className="space-y-2">
                  <Label className="text-xs">Destinatario</Label>
                  <select value={emailSeleccionado} onChange={(e) => setEmailSeleccionado(e.target.value)} className="h-8 w-full rounded-md border bg-background px-2 text-sm">
                    <option value="">Seleccionar contacto...</option>
                    {contactosEmail.map((c) => <option key={c.id} value={c.email}>{c.nombre ? `${c.nombre} <${c.email}>` : c.email}</option>)}
                  </select>
                  <Input type="email" value={emailSeleccionado} onChange={(e) => setEmailSeleccionado(e.target.value)} placeholder="o escribir email..." className="h-8 text-sm" />
                </div>
              ) : (
                <div className="space-y-1">
                  <Label className="text-xs">Email destinatario</Label>
                  <Input type="email" value={emailSeleccionado} onChange={(e) => setEmailSeleccionado(e.target.value)} placeholder="nombre@empresa.com" className="h-8 text-sm" />
                </div>
              )}
              {resultadoMail && <p className={`text-xs ${resultadoMail.ok ? "text-green-700" : "text-destructive"}`}>{resultadoMail.msg}</p>}
              <div className="flex gap-2">
                <Button size="sm" onClick={enviarPorMail} disabled={enviandoMail || !emailSeleccionado}>{enviandoMail ? "Enviando..." : "Enviar"}</Button>
                <Button size="sm" variant="ghost" onClick={() => setMostrarEnvioMail(false)}>Cancelar</Button>
              </div>
            </div>
          )}

          <Button variant="outline" onClick={() => router.push("/empresas/recibos")} className="w-48">Volver</Button>
          <Button variant="ghost" onClick={resetForm} className="w-48">Nuevo recibo</Button>
        </div>
      </div>
    )
  }

  return null
}
