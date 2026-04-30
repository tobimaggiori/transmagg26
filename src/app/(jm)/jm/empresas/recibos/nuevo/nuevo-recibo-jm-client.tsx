"use client"

/**
 * NuevoReciboJmClient — clon adaptado de nuevo-recibo-client.tsx.
 *
 * Pasos:
 * 1. Seleccionar empresa + facturas (con NCs/NDs) y montos a aplicar.
 * 2. Retenciones + medios de pago.
 * 3. Confirmar + emitir.
 * 4. Resultado (sin envío email todavía — TODO).
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

interface Empresa { id: string; razonSocial: string; cuit: string }
interface Cuenta { id: string; nombre: string; banco: { id: string; nombre: string } | null }

interface NotaCDResumen {
  id: string
  tipo: string
  montoTotal: number
  montoDescontado: number
  disponible: number
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

interface Props { empresas: Empresa[]; cuentas: Cuenta[] }

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
  return ({ NC_EMITIDA: "NC emitida", NC_RECIBIDA: "NC recibida", ND_EMITIDA: "ND emitida", ND_RECIBIDA: "ND recibida" } as Record<string, string>)[t] ?? t
}
function tipoMedioLabel(t: string) {
  return ({ TRANSFERENCIA: "Transferencia", ECHEQ: "ECheq", CHEQUE_FISICO: "Cheque Físico", EFECTIVO: "Efectivo", SALDO_CTA_CTE: "Saldo Cta. Cte." } as Record<string, string>)[t] ?? t
}

export function NuevoReciboJmClient({ empresas, cuentas }: Props) {
  const router = useRouter()
  const [paso, setPaso] = useState(1)

  // Paso 1
  const [empresaId, setEmpresaId] = useState("")
  const [facturas, setFacturas] = useState<FacturaPendiente[]>([])
  const [loadingFacturas, setLoadingFacturas] = useState(false)
  const [errorFacturas, setErrorFacturas] = useState<string | null>(null)
  const [seleccionadas, setSeleccionadas] = useState<Set<string>>(new Set())
  const [importes, setImportes] = useState<Record<string, string>>({})
  const [notasSel, setNotasSel] = useState<Set<string>>(new Set())
  const [notasMonto, setNotasMonto] = useState<Record<string, string>>({})

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

  const cargarFacturas = useCallback(async (eId: string) => {
    if (!eId) return
    setLoadingFacturas(true); setErrorFacturas(null)
    try {
      const [resFact, resSaldo] = await Promise.all([
        fetch(`/api/jm/facturas-pendientes?empresaId=${eId}`),
        fetch(`/api/jm/empresas/${eId}/saldo-cc`),
      ])
      if (!resFact.ok) throw new Error("Error cargando facturas")
      const data: FacturaPendiente[] = await resFact.json()
      setFacturas(data)
      setSeleccionadas(new Set()); setImportes({}); setNotasSel(new Set()); setNotasMonto({})
      if (resSaldo.ok) {
        const saldoData = await resSaldo.json()
        setSaldoAFavorDisponible(saldoData.saldoAFavor ?? 0)
      }
    } catch {
      setErrorFacturas("No se pudieron cargar las facturas pendientes")
    } finally { setLoadingFacturas(false) }
  }, [])

  useEffect(() => {
    if (empresaId) cargarFacturas(empresaId)
    else {
      setFacturas([]); setSeleccionadas(new Set()); setImportes({})
      setNotasSel(new Set()); setNotasMonto({}); setSaldoAFavorDisponible(0)
    }
  }, [empresaId, cargarFacturas])

  const esNC = (t: string) => t === "NC_EMITIDA" || t === "NC_RECIBIDA"
  const esND = (t: string) => t === "ND_EMITIDA" || t === "ND_RECIBIDA"

  const notaInfo = useMemo(() => {
    const map = new Map<string, NotaCDResumen & { facturaId: string }>()
    facturas.forEach((f) => {
      f.notasCD?.forEach((n) => map.set(n.id, { ...n, facturaId: f.id }))
    })
    return map
  }, [facturas])

  const totalAplicado = useMemo(
    () => sumarImportes(Array.from(seleccionadas).map((id) => parsearImporte(importes[id] ?? "0"))),
    [seleccionadas, importes],
  )

  const retGananciasNum = parsearImporte(retGanancias)
  const retIIBBNum = parsearImporte(retIIBB)
  const retSUSSNum = parsearImporte(retSUSS)
  const totalRetenciones = sumarImportes([retGananciasNum, retIIBBNum, retSUSSNum])
  const totalMedios = sumarImportes(medios.map((m) => parsearImporte(m.monto)))
  const montoCubrir = totalAplicado
  const montoProvisto = sumarImportes([totalMedios, totalRetenciones])
  const saldoACuenta = Math.max(0, montoProvisto - montoCubrir)
  const balanceOk = montoProvisto >= montoCubrir - 0.01

  function calcularCashFactura(facturaId: string, notasSelLocal: Set<string>, notasMontoLocal: Record<string, string>) {
    const f = facturas.find((x) => x.id === facturaId)
    if (!f) return 0
    let nc = 0, nd = 0
    notasSelLocal.forEach((nid) => {
      const n = notaInfo.get(nid)
      if (!n || n.facturaId !== facturaId) return
      const monto = parsearImporte(notasMontoLocal[nid] ?? "0")
      if (esNC(n.tipo)) nc = sumarImportes([nc, monto])
      else if (esND(n.tipo)) nd = sumarImportes([nd, monto])
    })
    return Math.max(0, f.saldoPendiente - nc + nd)
  }

  function toggleFactura(id: string) {
    setSeleccionadas((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
        setImportes((p) => { const n = { ...p }; delete n[id]; return n })
        setNotasSel((p) => {
          const nx = new Set(p)
          nx.forEach((nid) => { if (notaInfo.get(nid)?.facturaId === id) nx.delete(nid) })
          return nx
        })
        setNotasMonto((p) => {
          const nx = { ...p }
          Object.keys(nx).forEach((nid) => { if (notaInfo.get(nid)?.facturaId === id) delete nx[nid] })
          return nx
        })
      } else {
        next.add(id)
        const f = facturas.find((f) => f.id === id)
        if (f) setImportes((p) => ({ ...p, [id]: f.saldoPendiente.toFixed(2) }))
      }
      return next
    })
  }

  function toggleNota(notaId: string) {
    const n = notaInfo.get(notaId)
    if (!n) return
    setNotasSel((prev) => {
      const next = new Set(prev)
      let nuevoMontoMap: Record<string, string>
      if (next.has(notaId)) {
        next.delete(notaId)
        nuevoMontoMap = { ...notasMonto }; delete nuevoMontoMap[notaId]
      } else {
        next.add(notaId)
        nuevoMontoMap = { ...notasMonto, [notaId]: n.disponible.toFixed(2) }
      }
      setNotasMonto(nuevoMontoMap)
      const cash = calcularCashFactura(n.facturaId, next, nuevoMontoMap)
      setImportes((p) => ({ ...p, [n.facturaId]: cash.toFixed(2) }))
      return next
    })
  }

  function actualizarMontoNota(notaId: string, valor: string) {
    const n = notaInfo.get(notaId)
    if (!n) return
    const nuevoMap = { ...notasMonto, [notaId]: valor }
    setNotasMonto(nuevoMap)
    const cash = calcularCashFactura(n.facturaId, notasSel, nuevoMap)
    setImportes((p) => ({ ...p, [n.facturaId]: cash.toFixed(2) }))
  }

  function actualizarImporte(id: string, valor: string) { setImportes((p) => ({ ...p, [id]: valor })) }

  function seleccionarTodas() {
    const ids = new Set(facturas.map((f) => f.id))
    setSeleccionadas(ids)
    const imp: Record<string, string> = {}
    facturas.forEach((f) => { imp[f.id] = f.saldoPendiente.toFixed(2) })
    setImportes(imp)
  }
  function deseleccionarTodas() {
    setSeleccionadas(new Set()); setImportes({})
    setNotasSel(new Set()); setNotasMonto({})
  }

  function agregarMedio() {
    setMedios([...medios, { tipo: "TRANSFERENCIA", monto: "", cuentaId: "", fechaTransferencia: hoyLocalYmd() }])
  }
  function quitarMedio(i: number) { setMedios(medios.filter((_, idx) => idx !== i)) }
  function actualizarMedio(i: number, campo: keyof MedioPago, valor: string) {
    setMedios(medios.map((m, idx) => (idx === i ? { ...m, [campo]: valor } : m)))
  }

  async function handleEmitir() {
    setLoading(true); setError(null)
    try {
      const facturasAplicadas = Array.from(seleccionadas).map((id) => ({
        facturaId: id,
        montoAplicado: parsearImporte(importes[id] ?? "0"),
      })).filter(fa => fa.montoAplicado > 0)

      const notasAplicadas = Array.from(notasSel).map((nid) => ({
        notaId: nid,
        monto: parsearImporte(notasMonto[nid] ?? "0"),
      })).filter(na => na.monto > 0)

      const body = {
        empresaId,
        facturasAplicadas,
        notasAplicadas,
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
        })).filter((m) => m.monto > 0),
        retencionGanancias: retGananciasNum,
        retencionIIBB: retIIBBNum,
        retencionSUSS: retSUSSNum,
        faltantes: [],
        fecha,
      }

      const res = await fetch("/api/jm/recibos-cobranza", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? "Error al crear el recibo")
      }
      setReciboCreado(await res.json())
      setPaso(4)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido")
    } finally { setLoading(false) }
  }

  function resetForm() {
    setEmpresaId(""); setFacturas([]); setSeleccionadas(new Set()); setImportes({})
    setNotasSel(new Set()); setNotasMonto({})
    setRetGanancias(""); setRetIIBB(""); setRetSUSS("")
    setMedios([{ tipo: "TRANSFERENCIA", monto: "", cuentaId: "", fechaTransferencia: hoyLocalYmd() }])
    setFecha(hoyLocalYmd()); setReciboCreado(null); setError(null); setSaldoAFavorDisponible(0); setPaso(1)
  }

  const empresaItem = empresas.map((e) => ({ id: e.id, label: e.razonSocial, sublabel: e.cuit }))

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
                      <Button variant="outline" size="sm" onClick={deseleccionarTodas}>Limpiar</Button>
                    </div>
                  )}
                </div>

                {loadingFacturas && <p className="text-sm text-muted-foreground">Cargando...</p>}
                {errorFacturas && <p className="text-sm text-red-600">{errorFacturas}</p>}
                {!loadingFacturas && facturas.length === 0 && !errorFacturas && (
                  <p className="text-sm text-muted-foreground">Sin facturas pendientes para esta empresa.</p>
                )}

                {facturas.map((f) => {
                  const seleccionada = seleccionadas.has(f.id)
                  return (
                    <div key={f.id} className={`border rounded p-3 space-y-2 ${seleccionada ? "bg-blue-50/40" : ""}`}>
                      <div className="flex items-start gap-2">
                        <input type="checkbox" checked={seleccionada} onChange={() => toggleFactura(f.id)} className="mt-1" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div>
                              <p className="font-medium">{tipoCbteLabel(f.tipoCbte)} {f.nroComprobante}</p>
                              <p className="text-xs text-muted-foreground">Emitida {fmtFecha(f.emitidaEn)} · Total {fmt(f.total)} · Saldo {fmt(f.saldoPendiente)}</p>
                            </div>
                            {seleccionada && (
                              <div>
                                <Label className="text-xs">Monto a aplicar</Label>
                                <Input type="number" step="0.01" value={importes[f.id] ?? ""} onChange={(e) => actualizarImporte(f.id, e.target.value)} className="h-8 w-32 text-right" />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      {seleccionada && f.notasCD && f.notasCD.filter(n => n.disponible > 0.01).length > 0 && (
                        <div className="ml-6 space-y-1.5 pt-1 border-t">
                          <p className="text-xs text-muted-foreground mt-1">Notas asociadas (aplicar a esta cobranza):</p>
                          {f.notasCD.filter(n => n.disponible > 0.01).map((n) => {
                            const sel = notasSel.has(n.id)
                            return (
                              <div key={n.id} className="flex items-center gap-2">
                                <input type="checkbox" checked={sel} onChange={() => toggleNota(n.id)} />
                                <span className="text-sm flex-1">{tipoNotaCDLabel(n.tipo)} {n.nro ?? ""} — disponible {fmt(n.disponible)}</span>
                                {sel && (
                                  <Input type="number" step="0.01" value={notasMonto[n.id] ?? ""} onChange={(e) => actualizarMontoNota(n.id, e.target.value)} className="h-7 w-28 text-right text-xs" />
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}

                {seleccionadas.size > 0 && (
                  <div className="bg-muted/40 px-3 py-2 rounded text-sm flex justify-between">
                    <span>Total a cobrar (cash neto):</span>
                    <span className="font-semibold">{fmt(totalAplicado)}</span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={() => setPaso(2)} disabled={seleccionadas.size === 0}>Siguiente</Button>
        </div>
      </div>
    )
  }

  // ════════ PASO 2 ════════
  if (paso === 2) {
    return (
      <div className="max-w-3xl mx-auto mt-8 space-y-6">
        <h1 className="text-2xl font-bold">Nuevo Recibo de Cobranza</h1>
        <Card>
          <CardHeader><CardTitle className="text-base">Paso 2 — Retenciones y medios de pago</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Fecha</Label>
              <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
            </div>

            <div>
              <p className="text-sm font-medium mb-2">Retenciones</p>
              <div className="grid grid-cols-3 gap-3">
                <div><Label className="text-xs">Ganancias</Label><Input type="number" step="0.01" value={retGanancias} onChange={(e) => setRetGanancias(e.target.value)} /></div>
                <div><Label className="text-xs">IIBB</Label><Input type="number" step="0.01" value={retIIBB} onChange={(e) => setRetIIBB(e.target.value)} /></div>
                <div><Label className="text-xs">SUSS</Label><Input type="number" step="0.01" value={retSUSS} onChange={(e) => setRetSUSS(e.target.value)} /></div>
              </div>
              {totalRetenciones > 0 && <p className="text-xs text-muted-foreground mt-1">Total retenciones: {fmt(totalRetenciones)}</p>}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Medios de pago</p>
                <Button variant="outline" size="sm" onClick={agregarMedio}>+ Agregar</Button>
              </div>
              {medios.map((m, i) => (
                <div key={i} className="border rounded p-3 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Tipo</Label>
                      <select value={m.tipo} onChange={(e) => actualizarMedio(i, "tipo", e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm">
                        <option value="TRANSFERENCIA">Transferencia</option>
                        <option value="ECHEQ">ECheq</option>
                        <option value="CHEQUE_FISICO">Cheque físico</option>
                        <option value="EFECTIVO">Efectivo</option>
                        <option value="SALDO_CTA_CTE">Saldo cta. cte.</option>
                      </select>
                    </div>
                    <div><Label className="text-xs">Monto</Label><Input type="number" step="0.01" value={m.monto} onChange={(e) => actualizarMedio(i, "monto", e.target.value)} /></div>
                  </div>
                  {m.tipo === "TRANSFERENCIA" && (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Cuenta</Label>
                        <select value={m.cuentaId ?? ""} onChange={(e) => actualizarMedio(i, "cuentaId", e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm">
                          <option value="">— elegir —</option>
                          {cuentas.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                        </select>
                      </div>
                      <div><Label className="text-xs">Fecha transferencia</Label><Input type="date" value={m.fechaTransferencia ?? ""} onChange={(e) => actualizarMedio(i, "fechaTransferencia", e.target.value)} /></div>
                    </div>
                  )}
                  {(m.tipo === "ECHEQ" || m.tipo === "CHEQUE_FISICO") && (
                    <div className="grid grid-cols-2 gap-2">
                      <div><Label className="text-xs">Nro cheque</Label><Input value={m.nroCheque ?? ""} onChange={(e) => actualizarMedio(i, "nroCheque", e.target.value)} /></div>
                      <div><Label className="text-xs">Banco</Label><Input value={m.bancoEmisor ?? ""} onChange={(e) => actualizarMedio(i, "bancoEmisor", e.target.value)} /></div>
                      <div><Label className="text-xs">Emisión</Label><Input type="date" value={m.fechaEmision ?? ""} onChange={(e) => actualizarMedio(i, "fechaEmision", e.target.value)} /></div>
                      <div><Label className="text-xs">Pago</Label><Input type="date" value={m.fechaPago ?? ""} onChange={(e) => actualizarMedio(i, "fechaPago", e.target.value)} /></div>
                    </div>
                  )}
                  {m.tipo === "SALDO_CTA_CTE" && saldoAFavorDisponible > 0 && (
                    <p className="text-xs text-muted-foreground">Saldo a favor disponible: {fmt(saldoAFavorDisponible)}</p>
                  )}
                  {medios.length > 1 && (
                    <Button variant="outline" size="sm" onClick={() => quitarMedio(i)}>Quitar</Button>
                  )}
                </div>
              ))}
            </div>

            <div className="bg-muted/40 px-3 py-2 rounded text-sm space-y-1">
              <div className="flex justify-between"><span>Monto a cobrar:</span><span>{fmt(montoCubrir)}</span></div>
              <div className="flex justify-between"><span>Provisto (medios + ret.):</span><span>{fmt(montoProvisto)}</span></div>
              <div className="flex justify-between font-semibold"><span>Saldo a cuenta:</span><span>{fmt(saldoACuenta)}</span></div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-between">
          <Button variant="outline" onClick={() => setPaso(1)}>← Anterior</Button>
          <Button onClick={() => setPaso(3)} disabled={!balanceOk}>Siguiente</Button>
        </div>
      </div>
    )
  }

  // ════════ PASO 3 — Confirmar ════════
  if (paso === 3) {
    const empresa = empresas.find((e) => e.id === empresaId)
    return (
      <div className="max-w-3xl mx-auto mt-8 space-y-6">
        <h1 className="text-2xl font-bold">Nuevo Recibo de Cobranza</h1>
        <Card>
          <CardHeader><CardTitle className="text-base">Paso 3 — Confirmar y emitir</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p><strong>Empresa:</strong> {empresa?.razonSocial}</p>
            <p><strong>Fecha:</strong> {fecha}</p>
            <p><strong>Facturas aplicadas:</strong> {seleccionadas.size}</p>
            <p><strong>Notas aplicadas:</strong> {notasSel.size}</p>
            <p><strong>Total cobrado (medios):</strong> {fmt(totalMedios)}</p>
            <p><strong>Retenciones:</strong> {fmt(totalRetenciones)}</p>
            <p><strong>Saldo a cuenta:</strong> {fmt(saldoACuenta)}</p>
            <div className="space-y-1 pt-2 border-t">
              <p className="font-medium">Medios de pago:</p>
              {medios.filter(m => parsearImporte(m.monto) > 0).map((m, i) => (
                <p key={i} className="text-xs">{tipoMedioLabel(m.tipo)}: {fmt(parsearImporte(m.monto))}</p>
              ))}
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
          </CardContent>
        </Card>

        <div className="flex justify-between">
          <Button variant="outline" onClick={() => setPaso(2)}>← Anterior</Button>
          <Button onClick={handleEmitir} disabled={loading}>{loading ? "Emitiendo..." : "Emitir recibo"}</Button>
        </div>
      </div>
    )
  }

  // ════════ PASO 4 — Resultado ════════
  return (
    <div className="max-w-3xl mx-auto mt-8 space-y-6">
      <h1 className="text-2xl font-bold">Recibo emitido</h1>
      <Card>
        <CardContent className="pt-6 text-center space-y-3">
          <p className="text-2xl font-bold">Recibo Nº {reciboCreado?.nro}</p>
          <p className="text-sm text-muted-foreground">El recibo se creó correctamente. La generación de PDF está pendiente.</p>
          <div className="flex justify-center gap-2 pt-2">
            <Button variant="outline" onClick={() => router.push("/jm/empresas/recibos/consultar")}>Ver listado</Button>
            <Button onClick={resetForm}>Nuevo recibo</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
