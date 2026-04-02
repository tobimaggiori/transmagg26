"use client"

/**
 * Propósito: Gestión unificada de chequeras.
 * Tab 1 — ECheq Emitidos: consulta y gestión de estado (generados desde pagos).
 * Tab 2 — Cartera Recibidos: consulta + alta de adelantos + depositar/endosar/descontar.
 */

import { useState, useEffect, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { FormError } from "@/components/ui/form-error"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { formatearMoneda, formatearFecha } from "@/lib/utils"
import { Plus, AlertTriangle, Clock, ChevronDown, Info } from "lucide-react"

// --- Tipos ---

interface ChequeEmitido {
  id: string
  nroCheque: string | null
  nroDocBeneficiario: string
  monto: number
  fechaEmision: string
  fechaPago: string
  motivoPago: string
  estado: string
  cuenta: { id: string; nombre: string }
  fletero: { id: string; razonSocial: string; cuit: string } | null
  proveedor: { id: string; razonSocial: string; cuit: string } | null
  liquidacion: { id: string; estado: string; total: number } | null
  planillaGalicia: { id: string; nombre: string; estado: string } | null
}

interface ChequeRecibido {
  id: string
  nroCheque: string
  bancoEmisor: string
  monto: number
  fechaCobro: string
  fechaEmision: string
  estado: string
  esElectronico: boolean
  endosadoABrokerId: string | null
  fechaDepositoBroker: string | null
  empresa: { id: string; razonSocial: string }
  factura: { id: string; nroComprobante: string; tipoCbte: string } | null
  reciboCobranza: { id: string; nro: number } | null
  endosadoAFletero: { id: string; razonSocial: string } | null
  endosadoAProveedor: { id: string; razonSocial: string } | null
  endosadoABroker: { id: string; nombre: string } | null
}

interface Cuenta { id: string; nombre: string }
interface Empresa { id: string; razonSocial: string }
interface Fletero { id: string; razonSocial: string }
interface Proveedor { id: string; razonSocial: string }
interface Broker { id: string; nombre: string; cuentaId: string }

type TabId = "emitidos" | "recibidos"

type AccionRecibido =
  | { tipo: "depositar"; cheque: ChequeRecibido }
  | { tipo: "endosar-broker"; cheque: ChequeRecibido }
  | { tipo: "confirmar-broker"; cheque: ChequeRecibido }
  | { tipo: "endosar-proveedor"; cheque: ChequeRecibido }
  | { tipo: "endosar-fletero"; cheque: ChequeRecibido }
  | { tipo: "descontar-banco"; cheque: ChequeRecibido }
  | { tipo: "detalle"; cheque: ChequeRecibido }
  | null

type AccionEmitido =
  | { tipo: "depositar"; cheque: ChequeEmitido }
  | { tipo: "rechazar"; cheque: ChequeEmitido }
  | { tipo: "detalle"; cheque: ChequeEmitido }
  | null

// --- Helpers ---

const hoy = () => new Date().toISOString().slice(0, 10)

function diasHasta(fechaStr: string): number {
  const ahora = new Date(); ahora.setHours(0, 0, 0, 0)
  const fecha = new Date(fechaStr); fecha.setHours(0, 0, 0, 0)
  return Math.round((fecha.getTime() - ahora.getTime()) / 86400000)
}

function BadgeEmitido({ estado }: { estado: string }) {
  const colores: Record<string, string> = {
    PENDIENTE_EMISION: "bg-gray-100 text-gray-700",
    EMITIDO: "bg-blue-100 text-blue-800",
    DEPOSITADO: "bg-green-100 text-green-800",
    RECHAZADO: "bg-red-100 text-red-800",
  }
  return (
    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${colores[estado] ?? "bg-muted text-muted-foreground"}`}>
      {estado.replace("_", " ")}
    </span>
  )
}

function BadgeRecibido({ estado, pendienteBroker }: { estado: string; pendienteBroker?: boolean }) {
  const colores: Record<string, string> = {
    EN_CARTERA: "bg-blue-100 text-blue-800",
    DEPOSITADO: "bg-green-100 text-green-800",
    ENDOSADO_FLETERO: "bg-violet-100 text-violet-800",
    ENDOSADO_PROVEEDOR: "bg-orange-100 text-orange-800",
    ENDOSADO_BROKER: "bg-cyan-100 text-cyan-800",
    DESCONTADO_BANCO: "bg-amber-100 text-amber-800",
    RECHAZADO: "bg-red-100 text-red-800",
  }
  return (
    <span className={`text-xs px-1.5 py-0.5 rounded font-medium inline-flex items-center gap-1 ${colores[estado] ?? "bg-muted text-muted-foreground"}`}>
      {pendienteBroker && <Clock className="h-3 w-3" />}
      {estado.replace(/_/g, " ")}
    </span>
  )
}

// --- Tab ECheq Emitidos ---

function TabEmitidos() {
  const [cheques, setCheques] = useState<ChequeEmitido[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const limit = 50

  const [filtroCuentaId, setFiltroCuentaId] = useState("")
  const [filtroEstado, setFiltroEstado] = useState("")
  const [filtroDesde, setFiltroDesde] = useState("")
  const [filtroHasta, setFiltroHasta] = useState("")
  const [filtroBeneficiario, setFiltroBeneficiario] = useState("")
  const [cuentas, setCuentas] = useState<Cuenta[]>([])

  const [accion, setAccion] = useState<AccionEmitido>(null)
  const [fechaDeposito, setFechaDeposito] = useState(hoy())
  const [errorAccion, setErrorAccion] = useState("")
  const [guardando, setGuardando] = useState(false)

  // Estado del flujo de rechazo con preview
  type ImpactoItem = { tipo: "LIQUIDACION" | "FACTURA_PROVEEDOR" | "CC_PROVEEDOR" | "CC_FLETERO"; referencia: string; montoAnulado: number; estadoActual: string; estadoResultante: string }
  type ImpactoData = { impactos: ImpactoItem[]; costoBancario: { aplica: boolean } }
  const [impactoData, setImpactoData] = useState<ImpactoData | null>(null)
  const [loadingImpacto, setLoadingImpacto] = useState(false)
  const [costoBancarioMonto, setCostoBancarioMonto] = useState("")

  const cargar = useCallback(() => {
    setLoading(true)
    const p = new URLSearchParams()
    if (filtroCuentaId) p.set("cuentaId", filtroCuentaId)
    if (filtroEstado) p.set("estado", filtroEstado)
    if (filtroDesde) p.set("desde", filtroDesde)
    if (filtroHasta) p.set("hasta", filtroHasta)
    if (filtroBeneficiario) p.set("beneficiario", filtroBeneficiario)
    p.set("page", String(page))
    p.set("limit", String(limit))
    fetch(`/api/cheques-emitidos?${p}`)
      .then(r => r.json())
      .then(d => { setCheques(Array.isArray(d.cheques) ? d.cheques : []); setTotal(d.total ?? 0); setLoading(false) })
      .catch(() => setLoading(false))
  }, [filtroCuentaId, filtroEstado, filtroDesde, filtroHasta, filtroBeneficiario, page])

  useEffect(() => { cargar() }, [cargar])

  useEffect(() => {
    fetch("/api/cuentas").then(r => r.json()).then(d => setCuentas(Array.isArray(d) ? d : []))
  }, [])

  const proximos7 = cheques.filter(c => c.estado === "EMITIDO" && diasHasta(c.fechaPago) >= 0 && diasHasta(c.fechaPago) <= 7)
  const vencidos = cheques.filter(c => c.estado === "EMITIDO" && diasHasta(c.fechaPago) < 0)

  async function ejecutarDepositar() {
    if (!accion || accion.tipo !== "depositar") return
    setErrorAccion("")
    setGuardando(true)
    const res = await fetch(`/api/cheques-emitidos/${accion.cheque.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado: "DEPOSITADO", fechaDeposito }),
    })
    setGuardando(false)
    if (res.ok) { setAccion(null); cargar() }
    else { const d = await res.json() as { error?: string }; setErrorAccion(d.error ?? "Error al actualizar") }
  }

  async function abrirImpactoRechazo(cheque: ChequeEmitido) {
    setErrorAccion("")
    setImpactoData(null)
    setCostoBancarioMonto("")
    setAccion({ tipo: "rechazar", cheque })
    setLoadingImpacto(true)
    try {
      const res = await fetch(`/api/cheques/${cheque.id}/impacto-rechazo`)
      if (res.ok) {
        const data = await res.json() as ImpactoData
        setImpactoData(data)
      } else {
        const d = await res.json() as { error?: string }
        setErrorAccion(d.error ?? "Error al cargar impacto")
      }
    } catch {
      setErrorAccion("Error de conexión")
    } finally {
      setLoadingImpacto(false)
    }
  }

  async function confirmarRechazo() {
    if (!accion || accion.tipo !== "rechazar") return
    setErrorAccion("")
    setGuardando(true)
    const body: { costoBancarioMonto?: number } = {}
    const monto = parseFloat(costoBancarioMonto)
    if (!isNaN(monto) && monto > 0) body.costoBancarioMonto = monto
    const res = await fetch(`/api/cheques/${accion.cheque.id}/confirmar-rechazo`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    setGuardando(false)
    if (res.ok) { setAccion(null); setImpactoData(null); cargar() }
    else { const d = await res.json() as { error?: string }; setErrorAccion(d.error ?? "Error al rechazar") }
  }

  function VinculadoA({ c }: { c: ChequeEmitido }) {
    if (c.liquidacion) {
      return <span className="text-xs text-blue-700">LP #{c.liquidacion.id.slice(-6).toUpperCase()}</span>
    }
    if (c.planillaGalicia) {
      return <span className="text-xs text-muted-foreground">{c.planillaGalicia.nombre}</span>
    }
    return <span className="text-muted-foreground">—</span>
  }

  return (
    <div className="space-y-4">
      {/* Nota aclaratoria */}
      <div className="border border-blue-100 bg-blue-50 rounded p-3 flex gap-2 items-start text-sm text-blue-800">
        <Info className="h-4 w-4 mt-0.5 shrink-0" />
        <span>
          Los cheques emitidos se registran automáticamente al pagar un Líquido Producto o una factura de proveedor con cheque propio.
          Desde esta sección podés consultar su estado y registrar cuando fueron depositados por el beneficiario.
        </span>
      </div>

      {/* Alertas */}
      {proximos7.length > 0 && (
        <div className="border border-yellow-200 bg-yellow-50 rounded p-3 flex gap-2 items-start">
          <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 shrink-0" />
          <div className="text-sm text-yellow-800">
            <strong>⚠ {proximos7.length} cheque(s)</strong> a vencer en los próximos 7 días —{" "}
            {formatearMoneda(proximos7.reduce((s, c) => s + c.monto, 0))}
          </div>
        </div>
      )}
      {vencidos.length > 0 && (
        <div className="border border-red-200 bg-red-50 rounded p-3 flex gap-2 items-start">
          <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
          <div className="text-sm text-red-800">
            <strong>🔴 {vencidos.length} cheque(s)</strong> vencidos sin depositar —{" "}
            {formatearMoneda(vencidos.reduce((s, c) => s + c.monto, 0))}
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <Label className="text-xs">Estado</Label>
          <Select value={filtroEstado} onChange={e => { setFiltroEstado(e.target.value); setPage(1) }} className="w-44">
            <option value="">Todos</option>
            <option value="PENDIENTE_EMISION">Pendiente emisión</option>
            <option value="EMITIDO">Emitido</option>
            <option value="DEPOSITADO">Depositado</option>
            <option value="RECHAZADO">Rechazado</option>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Cuenta / Chequera</Label>
          <Select value={filtroCuentaId} onChange={e => { setFiltroCuentaId(e.target.value); setPage(1) }} className="w-44">
            <option value="">Todas</option>
            {cuentas.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </Select>
        </div>
        <div>
          <Label className="text-xs">Beneficiario</Label>
          <Input
            value={filtroBeneficiario}
            onChange={e => { setFiltroBeneficiario(e.target.value); setPage(1) }}
            placeholder="Nombre o CUIT..."
            className="w-44"
          />
        </div>
        <div>
          <Label className="text-xs">Desde</Label>
          <Input type="date" value={filtroDesde} onChange={e => { setFiltroDesde(e.target.value); setPage(1) }} className="w-36" />
        </div>
        <div>
          <Label className="text-xs">Hasta</Label>
          <Input type="date" value={filtroHasta} onChange={e => { setFiltroHasta(e.target.value); setPage(1) }} className="w-36" />
        </div>
      </div>

      {/* Tabla */}
      {loading ? (
        <p className="text-muted-foreground text-sm">Cargando...</p>
      ) : cheques.length === 0 ? (
        <div className="border rounded p-6 text-center text-muted-foreground text-sm">Sin cheques emitidos.</div>
      ) : (
        <div className="border rounded overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-3 py-2">Nro. Cheque</th>
                <th className="text-left px-3 py-2">Cuenta</th>
                <th className="text-left px-3 py-2">Beneficiario</th>
                <th className="text-left px-3 py-2">CUIT</th>
                <th className="text-right px-3 py-2">Monto</th>
                <th className="text-left px-3 py-2">F. Emisión</th>
                <th className="text-left px-3 py-2">F. Pago</th>
                <th className="text-left px-3 py-2">Motivo</th>
                <th className="text-left px-3 py-2">Estado</th>
                <th className="text-left px-3 py-2">Vinculado a</th>
                <th className="text-left px-3 py-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {cheques.map(c => {
                const dias = diasHasta(c.fechaPago)
                const esProximo = c.estado === "EMITIDO" && dias >= 0 && dias <= 7
                const esVencido = c.estado === "EMITIDO" && dias < 0
                return (
                  <tr
                    key={c.id}
                    className={`border-t ${esVencido ? "bg-red-50" : esProximo ? "bg-yellow-50" : "hover:bg-muted/20"}`}
                  >
                    <td className="px-3 py-2 font-mono text-xs">{c.nroCheque ?? "—"}</td>
                    <td className="px-3 py-2 text-xs">{c.cuenta.nombre}</td>
                    <td className="px-3 py-2">{c.fletero?.razonSocial ?? c.proveedor?.razonSocial ?? "—"}</td>
                    <td className="px-3 py-2 text-xs text-muted-foreground font-mono">
                      {c.fletero?.cuit ?? c.proveedor?.cuit ?? c.nroDocBeneficiario}
                    </td>
                    <td className="px-3 py-2 text-right">{formatearMoneda(c.monto)}</td>
                    <td className="px-3 py-2 text-xs">{formatearFecha(c.fechaEmision)}</td>
                    <td className={`px-3 py-2 text-xs ${esVencido ? "text-red-600 font-semibold" : esProximo ? "text-yellow-700 font-medium" : ""}`}>
                      {formatearFecha(c.fechaPago)}
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">{c.motivoPago}</td>
                    <td className="px-3 py-2"><BadgeEmitido estado={c.estado} /></td>
                    <td className="px-3 py-2"><VinculadoA c={c} /></td>
                    <td className="px-3 py-2">
                      <div className="flex gap-1">
                        {c.estado === "EMITIDO" && (
                          <button
                            type="button"
                            onClick={() => { setFechaDeposito(hoy()); setErrorAccion(""); setAccion({ tipo: "depositar", cheque: c }) }}
                            className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded hover:bg-green-100"
                          >
                            Depositado
                          </button>
                        )}
                        {c.estado === "EMITIDO" && (
                          <button
                            type="button"
                            onClick={() => abrirImpactoRechazo(c)}
                            className="text-xs bg-red-50 text-red-700 px-2 py-0.5 rounded hover:bg-red-100"
                          >
                            Rechazado
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setAccion({ tipo: "detalle", cheque: c })}
                          className="text-xs bg-muted px-2 py-0.5 rounded hover:bg-muted/80"
                        >
                          Detalle
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Paginación */}
      {total > limit && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{total} cheques</span>
          <div className="flex gap-2 items-center">
            <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Anterior</Button>
            <span className="text-muted-foreground">Pág. {page}</span>
            <Button size="sm" variant="outline" disabled={page * limit >= total} onClick={() => setPage(p => p + 1)}>Siguiente</Button>
          </div>
        </div>
      )}

      {/* Modal marcar depositado */}
      <Dialog open={accion?.tipo === "depositar"} onOpenChange={o => !o && setAccion(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Marcar como depositado</DialogTitle>
            <DialogDescription>
              Cheque {accion?.tipo === "depositar" ? (accion.cheque.nroCheque ?? "s/n") : ""} —{" "}
              {accion?.tipo === "depositar" ? formatearMoneda(accion.cheque.monto) : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Fecha de depósito</Label>
              <Input type="date" value={fechaDeposito} onChange={e => setFechaDeposito(e.target.value)} />
            </div>
            {errorAccion && <FormError message={errorAccion} />}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setAccion(null)}>Cancelar</Button>
            <Button onClick={ejecutarDepositar} disabled={guardando}>
              {guardando ? "Guardando..." : "Confirmar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal marcar rechazado con preview de impacto */}
      <Dialog open={accion?.tipo === "rechazar"} onOpenChange={o => !o && (setAccion(null), setImpactoData(null))}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Marcar como rechazado</DialogTitle>
            <DialogDescription>
              Cheque {accion?.tipo === "rechazar" ? (accion.cheque.nroCheque ?? "s/n") : ""} —{" "}
              {accion?.tipo === "rechazar" ? formatearMoneda(accion.cheque.monto) : ""}
            </DialogDescription>
          </DialogHeader>

          {loadingImpacto ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Calculando impacto...</p>
          ) : impactoData ? (
            <div className="space-y-4">
              {impactoData.impactos.length === 0 ? (
                <p className="text-sm text-muted-foreground">Este cheque no tiene pagos asociados activos.</p>
              ) : (
                <div>
                  <p className="text-sm font-medium mb-2">Documentos afectados:</p>
                  <table className="w-full text-xs border rounded">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left px-2 py-1.5">Documento</th>
                        <th className="text-right px-2 py-1.5">Monto anulado</th>
                        <th className="text-left px-2 py-1.5">Estado actual</th>
                        <th className="text-left px-2 py-1.5">Nuevo estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {impactoData.impactos.map((imp, i) => {
                        const esCC = imp.tipo === "CC_PROVEEDOR" || imp.tipo === "CC_FLETERO"
                        return (
                          <tr key={i} className={`border-t ${esCC ? "bg-blue-50/40" : ""}`}>
                            <td className="px-2 py-1.5">
                              {esCC ? (
                                <span className="text-blue-700">{imp.referencia}</span>
                              ) : (
                                <span className="font-mono">{imp.referencia}</span>
                              )}
                            </td>
                            <td className="px-2 py-1.5 text-right text-destructive">{formatearMoneda(imp.montoAnulado)}</td>
                            <td className="px-2 py-1.5 text-muted-foreground">{imp.estadoActual}</td>
                            <td className="px-2 py-1.5 font-medium">{imp.estadoResultante}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {impactoData.costoBancario.aplica && (
                <div>
                  <Label htmlFor="costo-bancario" className="text-sm">Costo bancario (opcional)</Label>
                  <Input
                    id="costo-bancario"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={costoBancarioMonto}
                    onChange={e => setCostoBancarioMonto(e.target.value)}
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Se registrará como EGRESO en la cuenta del cheque.</p>
                </div>
              )}
            </div>
          ) : null}

          {errorAccion && <FormError message={errorAccion} />}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => { setAccion(null); setImpactoData(null) }}>Cancelar</Button>
            <Button
              variant="destructive"
              onClick={confirmarRechazo}
              disabled={guardando || loadingImpacto || !!errorAccion}
            >
              {guardando ? "Procesando..." : "Confirmar rechazo"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal detalle */}
      <Dialog open={accion?.tipo === "detalle"} onOpenChange={o => !o && setAccion(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalle del cheque emitido</DialogTitle>
          </DialogHeader>
          {accion?.tipo === "detalle" && (
            <div className="space-y-2 text-sm">
              {[
                ["Nro. Cheque", accion.cheque.nroCheque ?? "—"],
                ["Cuenta", accion.cheque.cuenta.nombre],
                ["Beneficiario", accion.cheque.fletero?.razonSocial ?? accion.cheque.proveedor?.razonSocial ?? "—"],
                ["CUIT", accion.cheque.fletero?.cuit ?? accion.cheque.proveedor?.cuit ?? accion.cheque.nroDocBeneficiario],
                ["Monto", formatearMoneda(accion.cheque.monto)],
                ["F. Emisión", formatearFecha(accion.cheque.fechaEmision)],
                ["F. Pago", formatearFecha(accion.cheque.fechaPago)],
                ["Motivo", accion.cheque.motivoPago],
                ["Estado", accion.cheque.estado],
                ["Liquidación", accion.cheque.liquidacion ? `LP #${accion.cheque.liquidacion.id.slice(-6).toUpperCase()}` : "—"],
                ["Planilla", accion.cheque.planillaGalicia?.nombre ?? "—"],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span className="text-muted-foreground">{k}</span>
                  <span className="font-medium">{v}</span>
                </div>
              ))}
            </div>
          )}
          <div className="flex justify-end pt-2">
            <Button variant="outline" onClick={() => setAccion(null)}>Cerrar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// --- Tab Cartera Recibidos ---

function TabRecibidos() {
  const [cheques, setCheques] = useState<ChequeRecibido[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const limit = 50

  const [filtroEstado, setFiltroEstado] = useState("")
  const [filtroEsElectronico, setFiltroEsElectronico] = useState("")
  const [filtroEmpresaId, setFiltroEmpresaId] = useState("")
  const [filtroTieneFactura, setFiltroTieneFactura] = useState("")
  const [filtroDesde, setFiltroDesde] = useState("")
  const [filtroHasta, setFiltroHasta] = useState("")

  const [modalAdelanto, setModalAdelanto] = useState(false)
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [formAdelanto, setFormAdelanto] = useState({
    empresaId: "", esElectronico: false, nroCheque: "", bancoEmisor: "",
    monto: "", fechaEmision: hoy(), fechaCobro: hoy(), observaciones: "",
  })
  const [errorAdelanto, setErrorAdelanto] = useState("")
  const [guardandoAdelanto, setGuardandoAdelanto] = useState(false)

  const [accion, setAccion] = useState<AccionRecibido>(null)
  const [cuentas, setCuentas] = useState<Cuenta[]>([])
  const [fleteros, setFleteros] = useState<Fletero[]>([])
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [brokers, setBrokers] = useState<Broker[]>([])
  const [formDepositar, setFormDepositar] = useState({ cuentaId: "", fechaDeposito: hoy() })
  const [formBroker, setFormBroker] = useState({ brokerId: "" })
  const [formConfirmarBroker, setFormConfirmarBroker] = useState({ fechaDepositoBroker: hoy() })
  const [formFletero, setFormFletero] = useState({ fleteroId: "" })
  const [formProveedor, setFormProveedor] = useState({ proveedorId: "" })
  const [formDescontar, setFormDescontar] = useState({ cuentaId: "", tasaDescuento: "", fecha: hoy() })
  const [errorAccion, setErrorAccion] = useState("")
  const [guardandoAccion, setGuardandoAccion] = useState(false)

  const cargar = useCallback(() => {
    setLoading(true)
    const p = new URLSearchParams()
    if (filtroEstado) p.set("estado", filtroEstado)
    if (filtroEsElectronico) p.set("esElectronico", filtroEsElectronico)
    if (filtroEmpresaId) p.set("empresaId", filtroEmpresaId)
    if (filtroTieneFactura) p.set("tieneFactura", filtroTieneFactura)
    if (filtroDesde) p.set("desde", filtroDesde)
    if (filtroHasta) p.set("hasta", filtroHasta)
    p.set("page", String(page))
    p.set("limit", String(limit))
    fetch(`/api/cheques-recibidos?${p}`)
      .then(r => r.json())
      .then(d => { setCheques(Array.isArray(d.cheques) ? d.cheques : []); setTotal(d.total ?? 0); setLoading(false) })
      .catch(() => setLoading(false))
  }, [filtroEstado, filtroEsElectronico, filtroEmpresaId, filtroTieneFactura, filtroDesde, filtroHasta, page])

  useEffect(() => { cargar() }, [cargar])

  useEffect(() => {
    fetch("/api/empresas").then(r => r.json()).then(d => setEmpresas(Array.isArray(d) ? d : []))
  }, [])

  // Alertas client-side a partir de los datos cargados
  const estaSemanaMas5 = new Date(); estaSemanaMas5.setDate(estaSemanaMas5.getDate() + 7)
  const proxSemana = cheques.filter(c => c.estado === "EN_CARTERA" && diasHasta(c.fechaCobro) >= 0 && diasHasta(c.fechaCobro) <= 7)
  const vencidosSinCobrar = cheques.filter(c => c.estado === "EN_CARTERA" && diasHasta(c.fechaCobro) < 0)
  const brokerPendientes = cheques.filter(c => c.estado === "ENDOSADO_BROKER" && !c.fechaDepositoBroker)

  function abrirAccion(a: AccionRecibido) {
    setAccion(a)
    setErrorAccion("")
    if (a?.tipo === "depositar" || a?.tipo === "descontar-banco") {
      if (cuentas.length === 0) fetch("/api/cuentas").then(r => r.json()).then(d => setCuentas(Array.isArray(d) ? d : []))
    }
    if (a?.tipo === "endosar-fletero") {
      if (fleteros.length === 0) fetch("/api/fleteros").then(r => r.json()).then(d => setFleteros(Array.isArray(d) ? d : []))
    }
    if (a?.tipo === "endosar-proveedor") {
      if (proveedores.length === 0) fetch("/api/proveedores").then(r => r.json()).then(d => setProveedores(Array.isArray(d) ? d : []))
    }
    if (a?.tipo === "endosar-broker") {
      if (brokers.length === 0) fetch("/api/brokers").then(r => r.json()).then(d => setBrokers(Array.isArray(d) ? d : []))
    }
  }

  async function ejecutarAccion() {
    if (!accion || accion.tipo === "detalle") return
    setErrorAccion("")
    setGuardandoAccion(true)
    const id = accion.cheque.id
    let url = "", body: Record<string, unknown> = {}
    if (accion.tipo === "depositar") { url = `/api/cheques-recibidos/${id}/depositar`; body = formDepositar }
    else if (accion.tipo === "endosar-broker") { url = `/api/cheques-recibidos/${id}/endosar-broker`; body = formBroker }
    else if (accion.tipo === "confirmar-broker") { url = `/api/cheques-recibidos/${id}/confirmar-deposito-broker`; body = formConfirmarBroker }
    else if (accion.tipo === "endosar-fletero") { url = `/api/cheques-recibidos/${id}/endosar-fletero`; body = formFletero }
    else if (accion.tipo === "endosar-proveedor") { url = `/api/cheques-recibidos/${id}/endosar-proveedor`; body = formProveedor }
    else if (accion.tipo === "descontar-banco") { url = `/api/cheques-recibidos/${id}/descontar-banco`; body = { ...formDescontar, tasaDescuento: parseFloat(formDescontar.tasaDescuento) } }
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
    setGuardandoAccion(false)
    if (res.ok) { setAccion(null); cargar() }
    else { const d = await res.json(); setErrorAccion(d.error ?? "Error al procesar") }
  }

  async function guardarAdelanto() {
    setErrorAdelanto("")
    setGuardandoAdelanto(true)
    const res = await fetch("/api/cheques-recibidos/adelanto", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...formAdelanto, monto: parseFloat(formAdelanto.monto), observaciones: formAdelanto.observaciones || null }),
    })
    setGuardandoAdelanto(false)
    if (res.ok) {
      setModalAdelanto(false)
      setFormAdelanto({ empresaId: "", esElectronico: false, nroCheque: "", bancoEmisor: "", monto: "", fechaEmision: hoy(), fechaCobro: hoy(), observaciones: "" })
      cargar()
    } else {
      const d = await res.json(); setErrorAdelanto(d.error ?? "Error al guardar")
    }
  }

  // Dropdown de acciones por fila
  function AccionesDropdown({ c }: { c: ChequeRecibido }) {
    const [open, setOpen] = useState(false)
    const pendienteBroker = c.estado === "ENDOSADO_BROKER" && !c.fechaDepositoBroker
    if (c.estado !== "EN_CARTERA" && !pendienteBroker) {
      return (
        <button type="button" onClick={() => abrirAccion({ tipo: "detalle", cheque: c })}
          className="text-xs bg-muted px-2 py-1 rounded hover:bg-muted/80">Ver detalle</button>
      )
    }
    return (
      <div className="relative">
        <button type="button" onClick={() => setOpen(o => !o)}
          className="flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded hover:bg-muted/80">
          Acción <ChevronDown className="h-3 w-3" />
        </button>
        {open && (
          <div className="absolute right-0 top-7 z-10 bg-white border rounded shadow-md min-w-[180px]">
            {c.estado === "EN_CARTERA" && ([
              { label: "Depositar", tipo: "depositar" as const },
              { label: "Endosar a broker", tipo: "endosar-broker" as const },
              { label: "Endosar a proveedor", tipo: "endosar-proveedor" as const },
              { label: "Endosar a fletero", tipo: "endosar-fletero" as const },
              { label: "Descontar en banco", tipo: "descontar-banco" as const },
            ] as const).map(op => (
              <button key={op.tipo} type="button"
                className="w-full text-left px-3 py-2 text-sm hover:bg-muted/60"
                onClick={() => { setOpen(false); abrirAccion({ tipo: op.tipo, cheque: c }) }}>
                {op.label}
              </button>
            ))}
            {pendienteBroker && (
              <button type="button"
                className="w-full text-left px-3 py-2 text-sm hover:bg-muted/60 text-cyan-700"
                onClick={() => { setOpen(false); setFormConfirmarBroker({ fechaDepositoBroker: hoy() }); abrirAccion({ tipo: "confirmar-broker", cheque: c }) }}>
                Confirmar depósito broker
              </button>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Nota aclaratoria */}
      <div className="border border-blue-100 bg-blue-50 rounded p-3 flex gap-2 items-start text-sm text-blue-800">
        <Info className="h-4 w-4 mt-0.5 shrink-0" />
        <span>
          Los cheques recibidos se registran al cobrar una factura emitida a una empresa.
          El botón <strong>Registrar adelanto</strong> es solo para cheques recibidos antes de emitir la factura.
        </span>
      </div>

      {/* Alertas */}
      {proxSemana.length > 0 && (
        <div className="border border-blue-200 bg-blue-50 rounded p-3 flex gap-2 items-start">
          <AlertTriangle className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
          <div className="text-sm text-blue-800">
            <strong>📅 {proxSemana.length} cheque(s)</strong> a cobrar esta semana —{" "}
            {formatearMoneda(proxSemana.reduce((s, c) => s + c.monto, 0))}
          </div>
        </div>
      )}
      {vencidosSinCobrar.length > 0 && (
        <div className="border border-red-200 bg-red-50 rounded p-3 flex gap-2 items-start">
          <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
          <div className="text-sm text-red-800">
            <strong>🔴 {vencidosSinCobrar.length} cheque(s)</strong> vencidos sin cobrar —{" "}
            {formatearMoneda(vencidosSinCobrar.reduce((s, c) => s + c.monto, 0))}
          </div>
        </div>
      )}
      {brokerPendientes.length > 0 && (
        <div className="border border-cyan-200 bg-cyan-50 rounded p-3 flex gap-2 items-start">
          <Clock className="h-4 w-4 text-cyan-600 mt-0.5 shrink-0" />
          <div className="text-sm text-cyan-800">
            <strong>⏳ {brokerPendientes.length} cheque(s)</strong> endosados a brokers pendientes de confirmar depósito —{" "}
            {formatearMoneda(brokerPendientes.reduce((s, c) => s + c.monto, 0))}
          </div>
        </div>
      )}

      {/* Barra herramientas */}
      <div className="flex flex-wrap items-end gap-3 justify-between">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <Label className="text-xs">Estado</Label>
            <Select value={filtroEstado} onChange={e => { setFiltroEstado(e.target.value); setPage(1) }} className="w-44">
              <option value="">Todos</option>
              <option value="EN_CARTERA">En cartera</option>
              <option value="DEPOSITADO">Depositado</option>
              <option value="ENDOSADO_FLETERO">Endosado fletero</option>
              <option value="ENDOSADO_PROVEEDOR">Endosado proveedor</option>
              <option value="ENDOSADO_BROKER">Endosado broker</option>
              <option value="DESCONTADO_BANCO">Descontado banco</option>
              <option value="RECHAZADO">Rechazado</option>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Tipo</Label>
            <Select value={filtroEsElectronico} onChange={e => { setFiltroEsElectronico(e.target.value); setPage(1) }} className="w-32">
              <option value="">Todos</option>
              <option value="false">Físico</option>
              <option value="true">ECheq</option>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Empresa</Label>
            <Select value={filtroEmpresaId} onChange={e => { setFiltroEmpresaId(e.target.value); setPage(1) }} className="w-44">
              <option value="">Todas</option>
              {empresas.map(e => <option key={e.id} value={e.id}>{e.razonSocial}</option>)}
            </Select>
          </div>
          <div>
            <Label className="text-xs">Factura</Label>
            <Select value={filtroTieneFactura} onChange={e => { setFiltroTieneFactura(e.target.value); setPage(1) }} className="w-36">
              <option value="">Ambos</option>
              <option value="true">Con factura</option>
              <option value="false">Sin factura</option>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Desde</Label>
            <Input type="date" value={filtroDesde} onChange={e => { setFiltroDesde(e.target.value); setPage(1) }} className="w-36" />
          </div>
          <div>
            <Label className="text-xs">Hasta</Label>
            <Input type="date" value={filtroHasta} onChange={e => { setFiltroHasta(e.target.value); setPage(1) }} className="w-36" />
          </div>
        </div>
        <Button size="sm" onClick={() => setModalAdelanto(true)}>
          <Plus className="h-4 w-4 mr-1" /> Registrar adelanto sin factura
        </Button>
      </div>

      {/* Tabla */}
      {loading ? (
        <p className="text-muted-foreground text-sm">Cargando...</p>
      ) : cheques.length === 0 ? (
        <div className="border rounded p-6 text-center text-muted-foreground text-sm">Sin cheques recibidos.</div>
      ) : (
        <div className="border rounded overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-3 py-2">Tipo</th>
                <th className="text-left px-3 py-2">Nro. Cheque</th>
                <th className="text-left px-3 py-2">Banco</th>
                <th className="text-left px-3 py-2">Empresa</th>
                <th className="text-left px-3 py-2">Origen</th>
                <th className="text-right px-3 py-2">Monto</th>
                <th className="text-left px-3 py-2">F. Pago</th>
                <th className="text-left px-3 py-2">Estado</th>
                <th className="text-left px-3 py-2">Destino</th>
                <th className="text-left px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {cheques.map(c => {
                const pendienteBroker = c.estado === "ENDOSADO_BROKER" && !c.fechaDepositoBroker
                const dias = diasHasta(c.fechaCobro)
                const esAlerta = c.estado === "EN_CARTERA" && dias <= 7
                return (
                  <tr key={c.id} className={`border-t ${dias < 0 && c.estado === "EN_CARTERA" ? "bg-red-50" : esAlerta ? "bg-yellow-50" : "hover:bg-muted/20"}`}>
                    <td className="px-3 py-2">
                      {c.esElectronico
                        ? <span className="text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-medium">ECheq</span>
                        : <span className="text-xs bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded font-medium">Físico</span>
                      }
                    </td>
                    <td className="px-3 py-2 font-mono text-xs">{c.nroCheque}</td>
                    <td className="px-3 py-2 text-xs">{c.bancoEmisor}</td>
                    <td className="px-3 py-2">{c.empresa.razonSocial}</td>
                    <td className="px-3 py-2 text-xs">
                      {c.reciboCobranza
                        ? (
                          <a
                            href={`/empresas/recibos/${c.reciboCobranza.id}`}
                            className="text-blue-700 underline underline-offset-2 hover:text-blue-900"
                          >
                            Ver Recibo {String(c.reciboCobranza.nro).padStart(8, "0")}
                          </a>
                        )
                        : c.factura
                          ? <span className="text-blue-700">{c.factura.tipoCbte} {c.factura.nroComprobante}</span>
                          : <span className="text-muted-foreground">—</span>
                      }
                    </td>
                    <td className="px-3 py-2 text-right">{formatearMoneda(c.monto)}</td>
                    <td className={`px-3 py-2 text-xs ${dias < 0 && c.estado === "EN_CARTERA" ? "text-red-600 font-semibold" : ""}`}>
                      {formatearFecha(c.fechaCobro)}
                    </td>
                    <td className="px-3 py-2">
                      <BadgeRecibido estado={c.estado} pendienteBroker={pendienteBroker} />
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">
                      {c.endosadoABroker?.nombre ?? c.endosadoAProveedor?.razonSocial ?? c.endosadoAFletero?.razonSocial ?? "—"}
                    </td>
                    <td className="px-3 py-2">
                      <AccionesDropdown c={c} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Paginación */}
      {total > limit && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{total} cheques</span>
          <div className="flex gap-2 items-center">
            <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Anterior</Button>
            <span className="text-muted-foreground">Pág. {page}</span>
            <Button size="sm" variant="outline" disabled={page * limit >= total} onClick={() => setPage(p => p + 1)}>Siguiente</Button>
          </div>
        </div>
      )}

      {/* Modal adelanto */}
      <Dialog open={modalAdelanto} onOpenChange={setModalAdelanto}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Registrar adelanto sin factura</DialogTitle>
            <DialogDescription>Cheque recibido antes de emitir la factura correspondiente.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Empresa</Label>
              <Select value={formAdelanto.empresaId} onChange={e => setFormAdelanto(f => ({ ...f, empresaId: e.target.value }))}>
                <option value="">Seleccionar...</option>
                {empresas.map(e => <option key={e.id} value={e.id}>{e.razonSocial}</option>)}
              </Select>
            </div>
            <div className="flex items-center gap-4">
              <Label className="text-sm font-medium">Tipo cheque:</Label>
              <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                <input type="radio" name="tipoAdelanto" checked={!formAdelanto.esElectronico}
                  onChange={() => setFormAdelanto(f => ({ ...f, esElectronico: false }))} />
                Físico
              </label>
              <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                <input type="radio" name="tipoAdelanto" checked={formAdelanto.esElectronico}
                  onChange={() => setFormAdelanto(f => ({ ...f, esElectronico: true }))} />
                ECheq
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Nro. de cheque</Label><Input value={formAdelanto.nroCheque} onChange={e => setFormAdelanto(f => ({ ...f, nroCheque: e.target.value }))} /></div>
              <div><Label>Banco emisor</Label><Input value={formAdelanto.bancoEmisor} onChange={e => setFormAdelanto(f => ({ ...f, bancoEmisor: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Monto</Label><Input type="number" value={formAdelanto.monto} onChange={e => setFormAdelanto(f => ({ ...f, monto: e.target.value }))} /></div>
              <div><Label>Fecha emisión</Label><Input type="date" value={formAdelanto.fechaEmision} onChange={e => setFormAdelanto(f => ({ ...f, fechaEmision: e.target.value }))} /></div>
              <div><Label>Fecha cobro</Label><Input type="date" value={formAdelanto.fechaCobro} onChange={e => setFormAdelanto(f => ({ ...f, fechaCobro: e.target.value }))} /></div>
            </div>
            <div><Label>Observaciones</Label><Input value={formAdelanto.observaciones} onChange={e => setFormAdelanto(f => ({ ...f, observaciones: e.target.value }))} placeholder="Opcional" /></div>
            {errorAdelanto && <FormError message={errorAdelanto} />}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setModalAdelanto(false)}>Cancelar</Button>
            <Button onClick={guardarAdelanto} disabled={guardandoAdelanto}>{guardandoAdelanto ? "Guardando..." : "Guardar"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal depositar */}
      <Dialog open={accion?.tipo === "depositar"} onOpenChange={o => !o && setAccion(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Depositar cheque</DialogTitle>
            <DialogDescription>
              {accion?.tipo === "depositar" ? `${accion.cheque.nroCheque} — ${formatearMoneda(accion.cheque.monto)}` : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Cuenta de depósito</Label>
              <Select value={formDepositar.cuentaId} onChange={e => setFormDepositar(f => ({ ...f, cuentaId: e.target.value }))}>
                <option value="">Seleccionar...</option>
                {cuentas.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </Select>
            </div>
            <div><Label>Fecha de depósito</Label><Input type="date" value={formDepositar.fechaDeposito} onChange={e => setFormDepositar(f => ({ ...f, fechaDeposito: e.target.value }))} /></div>
            {errorAccion && <FormError message={errorAccion} />}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setAccion(null)}>Cancelar</Button>
            <Button onClick={ejecutarAccion} disabled={guardandoAccion}>{guardandoAccion ? "Guardando..." : "Depositar"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal endosar broker */}
      <Dialog open={accion?.tipo === "endosar-broker"} onOpenChange={o => !o && setAccion(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Endosar a broker</DialogTitle>
            <DialogDescription>
              {accion?.tipo === "endosar-broker" ? `${accion.cheque.nroCheque} — ${formatearMoneda(accion.cheque.monto)}` : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Broker</Label>
              <Select value={formBroker.brokerId} onChange={e => setFormBroker({ brokerId: e.target.value })}>
                <option value="">Seleccionar...</option>
                {brokers.map(b => <option key={b.id} value={b.id}>{b.nombre}</option>)}
              </Select>
            </div>
            {errorAccion && <FormError message={errorAccion} />}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setAccion(null)}>Cancelar</Button>
            <Button onClick={ejecutarAccion} disabled={guardandoAccion}>{guardandoAccion ? "Guardando..." : "Endosar"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal confirmar depósito broker */}
      <Dialog open={accion?.tipo === "confirmar-broker"} onOpenChange={o => !o && setAccion(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar depósito broker</DialogTitle>
            <DialogDescription>
              {accion?.tipo === "confirmar-broker" ? `${accion.cheque.nroCheque} — ${formatearMoneda(accion.cheque.monto)}` : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div><Label>Fecha de depósito en broker</Label><Input type="date" value={formConfirmarBroker.fechaDepositoBroker} onChange={e => setFormConfirmarBroker({ fechaDepositoBroker: e.target.value })} /></div>
            {errorAccion && <FormError message={errorAccion} />}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setAccion(null)}>Cancelar</Button>
            <Button onClick={ejecutarAccion} disabled={guardandoAccion}>{guardandoAccion ? "Guardando..." : "Confirmar"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal endosar proveedor */}
      <Dialog open={accion?.tipo === "endosar-proveedor"} onOpenChange={o => !o && setAccion(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Endosar a proveedor</DialogTitle>
            <DialogDescription>
              {accion?.tipo === "endosar-proveedor" ? `${accion.cheque.nroCheque} — ${formatearMoneda(accion.cheque.monto)}` : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Proveedor</Label>
              <Select value={formProveedor.proveedorId} onChange={e => setFormProveedor({ proveedorId: e.target.value })}>
                <option value="">Seleccionar...</option>
                {proveedores.map(p => <option key={p.id} value={p.id}>{p.razonSocial}</option>)}
              </Select>
            </div>
            {errorAccion && <FormError message={errorAccion} />}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setAccion(null)}>Cancelar</Button>
            <Button onClick={ejecutarAccion} disabled={guardandoAccion}>{guardandoAccion ? "Guardando..." : "Endosar"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal endosar fletero */}
      <Dialog open={accion?.tipo === "endosar-fletero"} onOpenChange={o => !o && setAccion(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Endosar a fletero</DialogTitle>
            <DialogDescription>
              {accion?.tipo === "endosar-fletero" ? `${accion.cheque.nroCheque} — ${formatearMoneda(accion.cheque.monto)}` : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Fletero</Label>
              <Select value={formFletero.fleteroId} onChange={e => setFormFletero({ fleteroId: e.target.value })}>
                <option value="">Seleccionar...</option>
                {fleteros.map(f => <option key={f.id} value={f.id}>{f.razonSocial}</option>)}
              </Select>
            </div>
            {errorAccion && <FormError message={errorAccion} />}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setAccion(null)}>Cancelar</Button>
            <Button onClick={ejecutarAccion} disabled={guardandoAccion}>{guardandoAccion ? "Guardando..." : "Endosar"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal descontar banco */}
      <Dialog open={accion?.tipo === "descontar-banco"} onOpenChange={o => !o && setAccion(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Descontar en banco</DialogTitle>
            <DialogDescription>
              {accion?.tipo === "descontar-banco" ? `${accion.cheque.nroCheque} — ${formatearMoneda(accion.cheque.monto)}` : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Cuenta bancaria</Label>
              <Select value={formDescontar.cuentaId} onChange={e => setFormDescontar(f => ({ ...f, cuentaId: e.target.value }))}>
                <option value="">Seleccionar...</option>
                {cuentas.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Tasa de descuento (%)</Label>
                <Input type="number" step="0.01" min="0" max="100" value={formDescontar.tasaDescuento}
                  onChange={e => setFormDescontar(f => ({ ...f, tasaDescuento: e.target.value }))} placeholder="Ej: 2.5" />
              </div>
              <div>
                <Label>Fecha</Label>
                <Input type="date" value={formDescontar.fecha} onChange={e => setFormDescontar(f => ({ ...f, fecha: e.target.value }))} />
              </div>
            </div>
            {accion?.tipo === "descontar-banco" && formDescontar.tasaDescuento && !isNaN(parseFloat(formDescontar.tasaDescuento)) && (
              <div className="text-xs text-muted-foreground border rounded p-2 bg-muted/20 space-y-0.5">
                <div>Comisión: {formatearMoneda(Math.round(accion.cheque.monto * parseFloat(formDescontar.tasaDescuento) / 100 * 100) / 100)}</div>
                <div>Neto a acreditar: {formatearMoneda(Math.round((accion.cheque.monto * (1 - parseFloat(formDescontar.tasaDescuento) / 100)) * 100) / 100)}</div>
              </div>
            )}
            {errorAccion && <FormError message={errorAccion} />}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setAccion(null)}>Cancelar</Button>
            <Button onClick={ejecutarAccion} disabled={guardandoAccion}>{guardandoAccion ? "Guardando..." : "Descontar"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal detalle */}
      <Dialog open={accion?.tipo === "detalle"} onOpenChange={o => !o && setAccion(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Detalle del cheque recibido</DialogTitle></DialogHeader>
          {accion?.tipo === "detalle" && (
            <div className="space-y-2 text-sm">
              {[
                ["Nro. Cheque", accion.cheque.nroCheque],
                ["Tipo", accion.cheque.esElectronico ? "ECheq" : "Físico"],
                ["Banco", accion.cheque.bancoEmisor],
                ["Empresa", accion.cheque.empresa.razonSocial],
                ["Factura", accion.cheque.factura ? `${accion.cheque.factura.tipoCbte} ${accion.cheque.factura.nroComprobante}` : "Sin factura"],
                ["Monto", formatearMoneda(accion.cheque.monto)],
                ["F. Cobro", formatearFecha(accion.cheque.fechaCobro)],
                ["Estado", accion.cheque.estado],
                ["Destino", accion.cheque.endosadoABroker?.nombre ?? accion.cheque.endosadoAProveedor?.razonSocial ?? accion.cheque.endosadoAFletero?.razonSocial ?? "—"],
                ["Dep. broker", accion.cheque.fechaDepositoBroker ? formatearFecha(accion.cheque.fechaDepositoBroker) : "Pendiente"],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span className="text-muted-foreground">{k}</span>
                  <span className="font-medium">{v}</span>
                </div>
              ))}
            </div>
          )}
          <div className="flex justify-end pt-2">
            <Button variant="outline" onClick={() => setAccion(null)}>Cerrar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// --- Componente principal ---

export function ChiquerasClient({ tabInicial }: { tabInicial?: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [tabActivo, setTabActivo] = useState<TabId>(tabInicial === "recibidos" ? "recibidos" : "emitidos")

  function cambiarTab(tab: TabId) {
    setTabActivo(tab)
    const p = new URLSearchParams(searchParams.toString())
    p.set("tab", tab)
    router.push(`/contabilidad/chequeras?${p}`, { scroll: false })
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Chequeras</h2>
        <p className="text-muted-foreground">Gestión de ECheq emitidos y cartera de cheques recibidos</p>
      </div>

      <div className="border-b">
        <nav className="flex gap-0 -mb-px">
          {([["emitidos", "ECheq Emitidos"], ["recibidos", "Cartera Recibidos"]] as const).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => cambiarTab(id)}
              className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                tabActivo === id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </nav>
      </div>

      <div>
        {tabActivo === "emitidos" && <TabEmitidos />}
        {tabActivo === "recibidos" && <TabRecibidos />}
      </div>
    </div>
  )
}
