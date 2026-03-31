"use client"

/**
 * Propósito: Componente client para gestión de cuentas bancarias.
 * Muestra lista de cuentas y detalle con tabs: Movimientos, Cheques Recibidos,
 * Cheques Emitidos, Planillas Galicia, FCI Propios, Tarjetas Prepagas.
 */

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { FormError } from "@/components/ui/form-error"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { formatearMoneda, formatearFecha } from "@/lib/utils"
import { Plus, RefreshCw } from "lucide-react"
import { diasHabilesDesde } from "@/lib/financial"

// --- Tipos ---

interface Cuenta {
  id: string
  nombre: string
  tipo: string
  bancoOEntidad: string
  moneda: string
  activa: boolean
  tieneChequera: boolean
  tienePlanillaEmisionMasiva: boolean
  tieneCuentaRemunerada: boolean
  tieneTarjetasPrepagasChoferes: boolean
  tieneImpuestoDebcred: boolean
  alicuotaImpuesto: number
  saldoContable: number
  saldoEnFciPropios: number
  saldoDisponible: number
  fci: FciItem[]
  detalleFci: Array<{ id: string; nombre: string; saldoInformadoActual: number }>
}

interface FciItem {
  id: string
  nombre: string
  cuentaId: string
  moneda: string
  activo: boolean
  diasHabilesAlerta: number
  saldos: Array<{ id: string; saldoInformado: number; fechaActualizacion: string }>
}


interface ChequeRecibido {
  id: string
  empresa: { razonSocial: string }
  nroCheque: string
  bancoEmisor: string
  monto: number
  fechaCobro: string
  estado: string
  esElectronico: boolean
}

interface ChequeEmitido {
  id: string
  nroCheque: string | null
  nroDocBeneficiario: string
  monto: number
  fechaPago: string
  estado: string
  planillaGaliciaId: string | null
  esElectronico: boolean
}

interface PlanillaGalicia {
  id: string
  nombre: string
  estado: string
  totalMonto: number
  cantidadCheques: number
  creadaEn: string
}

type TabId = "movimientos" | "cheques-recibidos" | "cheques-emitidos" | "planillas-galicia" | "fci" | "tarjetas"

interface CuentasClientProps {
  cuentaInicialId?: string
  tabInicial?: string
}

// --- Sub-componente: Tab Movimientos ---

function TabMovimientos({ cuenta }: { cuenta: Cuenta }) {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-muted/30 p-5 text-sm text-muted-foreground">
        <p className="font-medium text-foreground mb-1">Los movimientos de esta cuenta se gestionan en Contabilidad → Movimientos.</p>
        <p className="mb-4">Podés registrar ingresos y egresos, filtrar por período, cuenta y categoría, y exportar a Excel.</p>
        <a
          href={`/contabilidad/movimientos?cuentaId=${cuenta.id}`}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Ver movimientos de {cuenta.nombre}
        </a>
      </div>
    </div>
  )
}

// --- Sub-componente: Tab Cheques Recibidos ---

function TabChequesRecibidos({ cuenta }: { cuenta: Cuenta }) {
  const [cheques, setCheques] = useState<ChequeRecibido[]>([])
  const [loading, setLoading] = useState(true)
  const [modalAlta, setModalAlta] = useState(false)
  const [form, setForm] = useState({ empresaId: "", nroCheque: "", bancoEmisor: "", monto: "", fechaEmision: new Date().toISOString().slice(0,10), fechaCobro: new Date().toISOString().slice(0,10), esElectronico: false })
  const [empresas, setEmpresas] = useState<Array<{ id: string; razonSocial: string }>>([])
  const [error, setError] = useState("")
  const [guardando, setGuardando] = useState(false)

  const cargar = useCallback(() => {
    setLoading(true)
    fetch(`/api/cheques-recibidos?cuentaId=${cuenta.id}`)
      .then(r => r.json())
      .then(d => { setCheques(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [cuenta.id])

  useEffect(() => { cargar() }, [cargar])

  function abrirModal() {
    fetch("/api/empresas").then(r => r.json()).then(setEmpresas)
    setModalAlta(true)
  }

  async function guardar() {
    setError("")
    setGuardando(true)
    const res = await fetch("/api/cheques-recibidos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        monto: parseFloat(form.monto),
        cuentaDepositoId: cuenta.id,
        estado: "EN_CARTERA",
      }),
    })
    setGuardando(false)
    if (res.ok) { setModalAlta(false); cargar() }
    else { const d = await res.json(); setError(d.error ?? "Error al guardar") }
  }

  async function cambiarEstado(id: string, estado: string, extra: Record<string, unknown> = {}) {
    await fetch(`/api/cheques-recibidos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado, ...extra }),
    })
    cargar()
  }

  const chequesFisicos = cheques.filter((c) => !c.esElectronico)
  const chequesElectronicos = cheques.filter((c) => c.esElectronico)

  function FilaChequeRecibido({ c }: { c: ChequeRecibido }) {
    return (
      <tr key={c.id} className="border-t hover:bg-muted/20">
        <td className="px-3 py-2">{c.empresa.razonSocial}</td>
        <td className="px-3 py-2">
          <span>{c.nroCheque}</span>
          {c.esElectronico && <span className="ml-1.5 text-xs bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded font-medium">ECheq</span>}
        </td>
        <td className="px-3 py-2">{c.bancoEmisor}</td>
        <td className="px-3 py-2 text-right">{formatearMoneda(c.monto)}</td>
        <td className="px-3 py-2 text-right">{formatearFecha(c.fechaCobro)}</td>
        <td className="px-3 py-2"><span className="text-xs bg-muted px-1.5 py-0.5 rounded">{c.estado}</span></td>
        <td className="px-3 py-2">
          {c.estado === "EN_CARTERA" && (
            <div className="flex flex-wrap gap-1">
              <button onClick={() => cambiarEstado(c.id, "DEPOSITADO")} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded hover:bg-blue-100">Depositar</button>
              <button onClick={() => cambiarEstado(c.id, "ENDOSADO_FLETERO")} className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded hover:bg-green-100">Endosar</button>
              <button onClick={() => cambiarEstado(c.id, "DESCONTADO_BANCO")} className="text-xs bg-orange-50 text-orange-700 px-2 py-0.5 rounded hover:bg-orange-100">Descontar</button>
              <button onClick={() => cambiarEstado(c.id, "RECHAZADO")} className="text-xs bg-red-50 text-red-700 px-2 py-0.5 rounded hover:bg-red-100">Rechazar</button>
            </div>
          )}
        </td>
      </tr>
    )
  }

  function TablaGrupoCheques({ titulo, lista }: { titulo: string; lista: ChequeRecibido[] }) {
    if (lista.length === 0) return null
    return (
      <div className="border rounded overflow-auto">
        <div className="bg-muted/30 px-3 py-1.5 flex items-center justify-between text-xs font-medium text-muted-foreground">
          <span>{titulo}</span>
          <span>{lista.length} cheque(s) — {formatearMoneda(lista.reduce((acc, c) => acc + c.monto, 0))}</span>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-3 py-2">Empresa</th>
              <th className="text-left px-3 py-2">Nro. Cheque</th>
              <th className="text-left px-3 py-2">Banco</th>
              <th className="text-right px-3 py-2">Monto</th>
              <th className="text-right px-3 py-2">Fecha cobro</th>
              <th className="text-left px-3 py-2">Estado</th>
              <th className="text-left px-3 py-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {lista.map((c) => <FilaChequeRecibido key={c.id} c={c} />)}
          </tbody>
          <tfoot>
            <tr className="border-t font-semibold">
              <td colSpan={3} className="px-3 py-2">Total {titulo}</td>
              <td className="px-3 py-2 text-right">{formatearMoneda(lista.reduce((acc, c) => acc + c.monto, 0))}</td>
              <td colSpan={3}></td>
            </tr>
          </tfoot>
        </table>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={abrirModal}><Plus className="h-4 w-4 mr-1" /> Registrar cheque</Button>
      </div>
      {loading ? <p className="text-muted-foreground text-sm">Cargando...</p> : (
        cheques.length === 0 ? (
          <div className="border rounded p-6 text-center text-muted-foreground text-sm">Sin cheques registrados.</div>
        ) : (
          <div className="space-y-3">
            <TablaGrupoCheques titulo="Cheques físicos en cartera" lista={chequesFisicos} />
            <TablaGrupoCheques titulo="Cheques electrónicos (ECheq)" lista={chequesElectronicos} />
            {chequesFisicos.length > 0 && chequesElectronicos.length > 0 && (
              <div className="border rounded px-3 py-2 bg-muted/20 flex justify-between text-sm font-semibold">
                <span>Total en cartera</span>
                <span>{formatearMoneda(cheques.reduce((acc, c) => acc + c.monto, 0))}</span>
              </div>
            )}
          </div>
        )
      )}

      <Dialog open={modalAlta} onOpenChange={setModalAlta}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar cheque recibido</DialogTitle>
            <DialogDescription>Ingresar los datos del cheque recibido</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Empresa</Label>
              <Select value={form.empresaId} onChange={(e) => setForm(f => ({ ...f, empresaId: e.target.value }))}>
                <option value="">Seleccionar...</option>
                {empresas.map(e => <option key={e.id} value={e.id}>{e.razonSocial}</option>)}
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Nro. Cheque</Label><Input value={form.nroCheque} onChange={(e) => setForm(f => ({ ...f, nroCheque: e.target.value }))} /></div>
              <div><Label>Banco emisor</Label><Input value={form.bancoEmisor} onChange={(e) => setForm(f => ({ ...f, bancoEmisor: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Monto</Label><Input type="number" value={form.monto} onChange={(e) => setForm(f => ({ ...f, monto: e.target.value }))} /></div>
              <div><Label>Fecha emisión</Label><Input type="date" value={form.fechaEmision} onChange={(e) => setForm(f => ({ ...f, fechaEmision: e.target.value }))} /></div>
              <div><Label>Fecha cobro</Label><Input type="date" value={form.fechaCobro} onChange={(e) => setForm(f => ({ ...f, fechaCobro: e.target.value }))} /></div>
            </div>
            <div className="flex items-center gap-2">
              <input
                id="esElectronico"
                type="checkbox"
                checked={form.esElectronico}
                onChange={(e) => setForm(f => ({ ...f, esElectronico: e.target.checked }))}
                className="h-4 w-4 rounded border-input"
              />
              <Label htmlFor="esElectronico" className="cursor-pointer">¿Es cheque electrónico (ECheq)?</Label>
            </div>
            {error && <FormError message={error} />}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setModalAlta(false)}>Cancelar</Button>
            <Button onClick={guardar} disabled={guardando}>{guardando ? "Guardando..." : "Guardar"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// --- Sub-componente: Tab Cheques Emitidos ---

function TabChequesEmitidos({ cuenta }: { cuenta: Cuenta }) {
  const [cheques, setCheques] = useState<ChequeEmitido[]>([])
  const [loading, setLoading] = useState(true)
  const [modalDeposito, setModalDeposito] = useState(false)
  const [modalPlanilla, setModalPlanilla] = useState(false)
  const [formDeposito, setFormDeposito] = useState({ nroCheque: "", monto: "", descripcion: "Débito por cheque emitido depositado" })
  const [formPlanilla, setFormPlanilla] = useState({ nombre: "" })
  const [error, setError] = useState("")
  const [guardando, setGuardando] = useState(false)

  const cargar = useCallback(() => {
    setLoading(true)
    fetch(`/api/cheques-emitidos?cuentaId=${cuenta.id}`)
      .then(r => r.json())
      .then(d => { setCheques(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [cuenta.id])

  useEffect(() => { cargar() }, [cargar])

  async function guardarDeposito() {
    setError("")
    setGuardando(true)
    const res = await fetch("/api/cheques-emitidos/registrar-deposito", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...formDeposito, monto: parseFloat(formDeposito.monto), cuentaId: cuenta.id }),
    })
    setGuardando(false)
    if (res.ok) { setModalDeposito(false); cargar() }
    else { const d = await res.json(); setError(d.error ?? "Error al guardar") }
  }

  async function guardarPlanilla() {
    setError("")
    setGuardando(true)
    const res = await fetch("/api/planillas-galicia", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre: formPlanilla.nombre, cuentaId: cuenta.id, totalMonto: 0, cantidadCheques: 0 }),
    })
    setGuardando(false)
    if (res.ok) { setModalPlanilla(false) }
    else { const d = await res.json(); setError(d.error ?? "Error al guardar") }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 justify-end">
        <Button size="sm" variant="outline" onClick={() => setModalPlanilla(true)}>Nueva planilla Galicia</Button>
        <Button size="sm" onClick={() => setModalDeposito(true)}><Plus className="h-4 w-4 mr-1" /> Registrar depósito</Button>
      </div>
      {loading ? <p className="text-muted-foreground text-sm">Cargando...</p> : (
        <div className="border rounded overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-3 py-2">Beneficiario (doc)</th>
                <th className="text-left px-3 py-2">Nro. Cheque</th>
                <th className="text-right px-3 py-2">Monto</th>
                <th className="text-right px-3 py-2">Fecha pago</th>
                <th className="text-left px-3 py-2">Estado</th>
                <th className="text-left px-3 py-2">Planilla</th>
              </tr>
            </thead>
            <tbody>
              {cheques.map((c) => (
                <tr key={c.id} className="border-t hover:bg-muted/20">
                  <td className="px-3 py-2">{c.nroDocBeneficiario}</td>
                  <td className="px-3 py-2">
                    <span>{c.nroCheque ?? "-"}</span>
                    <span className="ml-1.5 text-xs bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded font-medium">ECheq</span>
                  </td>
                  <td className="px-3 py-2 text-right">{formatearMoneda(c.monto)}</td>
                  <td className="px-3 py-2 text-right">{formatearFecha(c.fechaPago)}</td>
                  <td className="px-3 py-2"><span className="text-xs bg-muted px-1.5 py-0.5 rounded">{c.estado}</span></td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">{c.planillaGaliciaId ?? "-"}</td>
                </tr>
              ))}
              {cheques.length === 0 && (
                <tr><td colSpan={6} className="px-3 py-4 text-center text-muted-foreground">Sin cheques emitidos.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={modalDeposito} onOpenChange={setModalDeposito}>
        <DialogContent>
          <DialogHeader><DialogTitle>Registrar depósito diario</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nro. Cheque</Label><Input value={formDeposito.nroCheque} onChange={(e) => setFormDeposito(f => ({ ...f, nroCheque: e.target.value }))} /></div>
            <div><Label>Monto</Label><Input type="number" value={formDeposito.monto} onChange={(e) => setFormDeposito(f => ({ ...f, monto: e.target.value }))} /></div>
            <div><Label>Descripción</Label><Input value={formDeposito.descripcion} onChange={(e) => setFormDeposito(f => ({ ...f, descripcion: e.target.value }))} /></div>
            {error && <FormError message={error} />}
          </div>
          <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setModalDeposito(false)}>Cancelar</Button><Button onClick={guardarDeposito} disabled={guardando}>Guardar</Button></div>
        </DialogContent>
      </Dialog>

      <Dialog open={modalPlanilla} onOpenChange={setModalPlanilla}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nueva planilla Galicia</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nombre</Label><Input value={formPlanilla.nombre} onChange={(e) => setFormPlanilla({ nombre: e.target.value })} /></div>
            {error && <FormError message={error} />}
          </div>
          <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setModalPlanilla(false)}>Cancelar</Button><Button onClick={guardarPlanilla} disabled={guardando}>Crear</Button></div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// --- Sub-componente: Tab Planillas Galicia ---

function TabPlanillasGalicia({ cuenta }: { cuenta: Cuenta }) {
  const [planillas, setPlanillas] = useState<PlanillaGalicia[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/planillas-galicia?cuentaId=${cuenta.id}`)
      .then(r => r.json())
      .then(d => { setPlanillas(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [cuenta.id])

  async function descargarExcel(planillaId: string) {
    const res = await fetch(`/api/planillas-galicia/${planillaId}/generar-excel`, { method: "POST" })
    if (res.ok) {
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `planilla-galicia-${planillaId}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  if (loading) return <p className="text-muted-foreground text-sm">Cargando...</p>

  return (
    <div className="space-y-3">
      {planillas.length === 0 ? (
        <p className="text-muted-foreground">Sin planillas registradas.</p>
      ) : planillas.map((p) => (
        <div key={p.id} className="border rounded p-3 flex items-center justify-between">
          <div>
            <p className="font-medium">{p.nombre}</p>
            <p className="text-xs text-muted-foreground">{formatearFecha(p.creadaEn)} — {p.cantidadCheques} cheques — {formatearMoneda(p.totalMonto)}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-muted px-2 py-0.5 rounded">{p.estado}</span>
            {p.estado === "BORRADOR" && (
              <Button size="sm" variant="outline" onClick={() => descargarExcel(p.id)}>Descargar Excel</Button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

// --- Sub-componente: Tab FCI Propios ---

function TabFCI({ cuenta }: { cuenta: Cuenta }) {
  const [fcis, setFcis] = useState<FciItem[]>([])
  const [loading, setLoading] = useState(true)
  const [modalSaldo, setModalSaldo] = useState<string | null>(null)
  const [modalMovFci, setModalMovFci] = useState<{ fciId: string; tipo: "SUSCRIPCION" | "RESCATE" } | null>(null)
  const [formSaldo, setFormSaldo] = useState({ saldoInformado: "", fechaActualizacion: new Date().toISOString().slice(0,10) })
  const [formMov, setFormMov] = useState({ monto: "", fecha: new Date().toISOString().slice(0,10), descripcion: "" })
  const [error, setError] = useState("")
  const [guardando, setGuardando] = useState(false)

  const cargar = useCallback(() => {
    fetch(`/api/fci?cuentaId=${cuenta.id}`)
      .then(r => r.json())
      .then(d => { setFcis(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [cuenta.id])

  useEffect(() => { cargar() }, [cargar])

  async function guardarSaldo(fciId: string) {
    setError("")
    setGuardando(true)
    const res = await fetch("/api/saldos-fci", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fciId, saldoInformado: parseFloat(formSaldo.saldoInformado), fechaActualizacion: formSaldo.fechaActualizacion }),
    })
    setGuardando(false)
    if (res.ok) { setModalSaldo(null); cargar() }
    else { const d = await res.json(); setError(d.error ?? "Error al guardar") }
  }

  async function guardarMovFci() {
    if (!modalMovFci) return
    setError("")
    setGuardando(true)
    const res = await fetch("/api/movimientos-fci", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fciId: modalMovFci.fciId,
        cuentaOrigenDestinoId: cuenta.id,
        tipo: modalMovFci.tipo,
        monto: parseFloat(formMov.monto),
        fecha: formMov.fecha,
        descripcion: formMov.descripcion || null,
      }),
    })
    setGuardando(false)
    if (res.ok) { setModalMovFci(null); cargar() }
    else { const d = await res.json(); setError(d.error ?? "Error al guardar") }
  }

  if (loading) return <p className="text-muted-foreground text-sm">Cargando...</p>

  return (
    <div className="space-y-3">
      {fcis.length === 0 ? (
        <p className="text-muted-foreground">Sin FCI configurados para esta cuenta.</p>
      ) : fcis.map((fci) => {
        const ultimoSaldo = fci.saldos[0]
        const diasSin = ultimoSaldo ? diasHabilesDesde(new Date(ultimoSaldo.fechaActualizacion)) : 999
        const tieneAlerta = diasSin >= fci.diasHabilesAlerta
        return (
          <div key={fci.id} className="border rounded p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <p className="font-medium">{fci.nombre}</p>
                {tieneAlerta && (
                  <span className="text-xs bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full">{diasSin} día(s) sin actualizar</span>
                )}
              </div>
              <div className="text-right">
                <p className="font-bold">{formatearMoneda(ultimoSaldo?.saldoInformado ?? 0)}</p>
                {ultimoSaldo && <p className="text-xs text-muted-foreground">Al {formatearFecha(ultimoSaldo.fechaActualizacion)}</p>}
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => { setFormSaldo({ saldoInformado: "", fechaActualizacion: new Date().toISOString().slice(0,10) }); setModalSaldo(fci.id) }}>
                <RefreshCw className="h-3 w-3 mr-1" /> Actualizar saldo
              </Button>
              <Button size="sm" variant="outline" onClick={() => { setFormMov({ monto: "", fecha: new Date().toISOString().slice(0,10), descripcion: "" }); setModalMovFci({ fciId: fci.id, tipo: "SUSCRIPCION" }) }}>Suscripción</Button>
              <Button size="sm" variant="outline" onClick={() => { setFormMov({ monto: "", fecha: new Date().toISOString().slice(0,10), descripcion: "" }); setModalMovFci({ fciId: fci.id, tipo: "RESCATE" }) }}>Rescate</Button>
            </div>
          </div>
        )
      })}

      <Dialog open={!!modalSaldo} onOpenChange={() => setModalSaldo(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Actualizar saldo FCI</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Saldo informado</Label><Input type="number" value={formSaldo.saldoInformado} onChange={(e) => setFormSaldo(f => ({ ...f, saldoInformado: e.target.value }))} /></div>
            <div><Label>Fecha actualización</Label><Input type="date" value={formSaldo.fechaActualizacion} onChange={(e) => setFormSaldo(f => ({ ...f, fechaActualizacion: e.target.value }))} /></div>
            {error && <FormError message={error} />}
          </div>
          <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setModalSaldo(null)}>Cancelar</Button><Button onClick={() => guardarSaldo(modalSaldo!)} disabled={guardando}>Guardar</Button></div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!modalMovFci} onOpenChange={() => setModalMovFci(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{modalMovFci?.tipo === "SUSCRIPCION" ? "Suscripción FCI" : "Rescate FCI"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Monto</Label><Input type="number" value={formMov.monto} onChange={(e) => setFormMov(f => ({ ...f, monto: e.target.value }))} /></div>
            <div><Label>Fecha</Label><Input type="date" value={formMov.fecha} onChange={(e) => setFormMov(f => ({ ...f, fecha: e.target.value }))} /></div>
            <div><Label>Descripción</Label><Input value={formMov.descripcion} onChange={(e) => setFormMov(f => ({ ...f, descripcion: e.target.value }))} /></div>
            {error && <FormError message={error} />}
          </div>
          <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setModalMovFci(null)}>Cancelar</Button><Button onClick={guardarMovFci} disabled={guardando}>Guardar</Button></div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// --- Sub-componente: Tab Tarjetas Prepagas (movido a /contabilidad/tarjetas) ---

function TabTarjetasPrepagas(_props: { cuenta: Cuenta }) {
  return (
    <div className="flex flex-col items-center justify-center h-48 gap-3 text-center">
      <p className="text-muted-foreground text-sm">
        Las tarjetas prepagas de choferes se gestionan en el módulo unificado de Tarjetas.
      </p>
      <a
        href="/contabilidad/tarjetas"
        className="text-primary text-sm underline underline-offset-2 hover:opacity-80"
      >
        Ir a Contabilidad → Tarjetas
      </a>
    </div>
  )
}

// --- Componente principal ---

/**
 * CuentasClient: CuentasClientProps -> JSX.Element
 *
 * Dado [los parámetros iniciales de cuenta y tab], renderiza la lista de cuentas y el detalle con tabs.
 * Existe para gestionar la selección de cuenta y el tab activo como estado local del cliente.
 *
 * Ejemplos:
 * <CuentasClient /> // lista de cuentas vacía + placeholder de selección
 * <CuentasClient cuentaInicialId="xxx" /> // cuenta pre-seleccionada
 * <CuentasClient cuentaInicialId="xxx" tabInicial="fci" /> // cuenta y tab pre-seleccionados
 */
export function CuentasClient({ cuentaInicialId, tabInicial }: CuentasClientProps) {
  const router = useRouter()
  const [cuentas, setCuentas] = useState<Cuenta[]>([])
  const [loading, setLoading] = useState(true)
  const [cuentaSeleccionada, setCuentaSeleccionada] = useState<string | null>(cuentaInicialId ?? null)
  const [tabActivo, setTabActivo] = useState<TabId>((tabInicial as TabId) ?? "movimientos")
  const [modalNuevaCuenta, setModalNuevaCuenta] = useState(false)
  const [formCuenta, setFormCuenta] = useState({
    nombre: "", tipo: "BANCO", bancoOEntidad: "", moneda: "PESOS",
    saldoInicial: "0", activa: true, tieneImpuestoDebcred: false, alicuotaImpuesto: "0.006",
    tieneChequera: false, tienePlanillaEmisionMasiva: false, tieneCuentaRemunerada: false,
    tieneTarjetasPrepagasChoferes: false,
  })
  const [errorCuenta, setErrorCuenta] = useState("")
  const [guardandoCuenta, setGuardandoCuenta] = useState(false)

  const cargarCuentas = useCallback(() => {
    fetch("/api/cuentas")
      .then(r => r.json())
      .then(d => { setCuentas(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => { cargarCuentas() }, [cargarCuentas])

  const cuenta = cuentas.find(c => c.id === cuentaSeleccionada)

  function seleccionarCuenta(id: string) {
    setCuentaSeleccionada(id)
    setTabActivo("movimientos")
    router.push(`/cuentas?cuenta=${id}`, { scroll: false })
  }

  function seleccionarTab(tab: TabId) {
    setTabActivo(tab)
    if (cuentaSeleccionada) {
      router.push(`/cuentas?cuenta=${cuentaSeleccionada}&tab=${tab}`, { scroll: false })
    }
  }

  async function guardarNuevaCuenta() {
    setErrorCuenta("")
    setGuardandoCuenta(true)
    const res = await fetch("/api/cuentas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...formCuenta,
        saldoInicial: parseFloat(formCuenta.saldoInicial),
        alicuotaImpuesto: parseFloat(formCuenta.alicuotaImpuesto),
      }),
    })
    setGuardandoCuenta(false)
    if (res.ok) { setModalNuevaCuenta(false); cargarCuentas() }
    else { const d = await res.json(); setErrorCuenta(d.error ?? "Error al guardar") }
  }

  const getTabs = (c: Cuenta): Array<{ id: TabId; label: string }> => {
    const tabs: Array<{ id: TabId; label: string }> = [
      { id: "movimientos", label: "Movimientos" },
      { id: "cheques-recibidos", label: "Cheques Recibidos" },
    ]
    if (c.tieneChequera) tabs.push({ id: "cheques-emitidos", label: "Cheques Emitidos" })
    if (c.tienePlanillaEmisionMasiva) tabs.push({ id: "planillas-galicia", label: "Planillas Galicia" })
    if (c.tieneCuentaRemunerada) tabs.push({ id: "fci", label: "FCI Propios" })
    if (c.tieneTarjetasPrepagasChoferes) tabs.push({ id: "tarjetas", label: "Tarjetas Prepagas" })
    return tabs
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Cuentas</h2>
          <p className="text-muted-foreground">Gestión de cuentas bancarias y financieras</p>
        </div>
        <Button onClick={() => setModalNuevaCuenta(true)}><Plus className="h-4 w-4 mr-1" /> Nueva cuenta</Button>
      </div>

      <div className="grid grid-cols-3 gap-4 min-h-[600px]">
        {/* Lista de cuentas */}
        <div className="col-span-1 border rounded p-2 space-y-1 overflow-auto">
          {loading ? (
            <p className="text-muted-foreground text-sm p-2">Cargando...</p>
          ) : cuentas.filter(c => c.activa).map((c) => (
            <div
              key={c.id}
              onClick={() => seleccionarCuenta(c.id)}
              className={`p-3 rounded cursor-pointer hover:bg-muted/60 ${cuentaSeleccionada === c.id ? "bg-muted border border-primary/40" : ""}`}
            >
              <div className="flex items-center justify-between">
                <p className="font-medium text-sm">{c.nombre}</p>
                <span className="text-xs bg-muted px-1.5 py-0.5 rounded">{c.tipo}</span>
              </div>
              <p className={`text-sm font-semibold mt-1 ${c.saldoDisponible < 0 ? "text-destructive" : ""}`}>
                {formatearMoneda(c.saldoDisponible)}
              </p>
              <p className="text-xs text-muted-foreground">{c.moneda}</p>
            </div>
          ))}
          {!loading && cuentas.filter(c => c.activa).length === 0 && (
            <p className="text-muted-foreground text-sm p-2">Sin cuentas activas.</p>
          )}
        </div>

        {/* Detalle de cuenta */}
        <div className="col-span-2 border rounded overflow-hidden">
          {!cuenta ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <p>Seleccioná una cuenta para ver su detalle.</p>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              {/* Header cuenta */}
              <div className="border-b px-4 py-3 bg-muted/20">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{cuenta.nombre}</h3>
                    <p className="text-sm text-muted-foreground">{cuenta.bancoOEntidad} — {cuenta.moneda}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Saldo disponible</p>
                    <p className={`text-xl font-bold ${cuenta.saldoDisponible < 0 ? "text-destructive" : ""}`}>
                      {formatearMoneda(cuenta.saldoDisponible)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="border-b">
                <nav className="flex gap-0 px-2 -mb-px overflow-x-auto">
                  {getTabs(cuenta).map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => seleccionarTab(tab.id)}
                      className={`px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                        tabActivo === tab.id
                          ? "border-primary text-primary"
                          : "border-transparent text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Contenido tab */}
              <div className="flex-1 overflow-auto p-4">
                {tabActivo === "movimientos" && <TabMovimientos cuenta={cuenta} />}
                {tabActivo === "cheques-recibidos" && <TabChequesRecibidos cuenta={cuenta} />}
                {tabActivo === "cheques-emitidos" && cuenta.tieneChequera && <TabChequesEmitidos cuenta={cuenta} />}
                {tabActivo === "planillas-galicia" && cuenta.tienePlanillaEmisionMasiva && <TabPlanillasGalicia cuenta={cuenta} />}
                {tabActivo === "fci" && cuenta.tieneCuentaRemunerada && <TabFCI cuenta={cuenta} />}
                {tabActivo === "tarjetas" && cuenta.tieneTarjetasPrepagasChoferes && <TabTarjetasPrepagas cuenta={cuenta} />}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal nueva cuenta */}
      <Dialog open={modalNuevaCuenta} onOpenChange={setModalNuevaCuenta}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva cuenta</DialogTitle>
            <DialogDescription>Crear una nueva cuenta bancaria o financiera</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-[60vh] overflow-auto">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Nombre</Label><Input value={formCuenta.nombre} onChange={(e) => setFormCuenta(f => ({ ...f, nombre: e.target.value }))} /></div>
              <div><Label>Tipo</Label>
                <Select value={formCuenta.tipo} onChange={(e) => setFormCuenta(f => ({ ...f, tipo: e.target.value }))}>
                  <option value="BANCO">BANCO</option>
                  <option value="BILLETERA_VIRTUAL">BILLETERA_VIRTUAL</option>
                  <option value="BROKER">BROKER</option>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Entidad</Label><Input value={formCuenta.bancoOEntidad} onChange={(e) => setFormCuenta(f => ({ ...f, bancoOEntidad: e.target.value }))} /></div>
              <div><Label>Moneda</Label>
                <Select value={formCuenta.moneda} onChange={(e) => setFormCuenta(f => ({ ...f, moneda: e.target.value }))}>
                  <option value="PESOS">PESOS</option>
                  <option value="DOLARES">DOLARES</option>
                  <option value="OTRO">OTRO</option>
                </Select>
              </div>
            </div>
            <div><Label>Saldo inicial</Label><Input type="number" value={formCuenta.saldoInicial} onChange={(e) => setFormCuenta(f => ({ ...f, saldoInicial: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={formCuenta.tieneImpuestoDebcred} onChange={(e) => setFormCuenta(f => ({ ...f, tieneImpuestoDebcred: e.target.checked }))} />
                Impuesto débito/crédito
              </label>
              {formCuenta.tieneImpuestoDebcred && (
                <div><Label>Alícuota</Label><Input type="number" step="0.001" value={formCuenta.alicuotaImpuesto} onChange={(e) => setFormCuenta(f => ({ ...f, alicuotaImpuesto: e.target.value }))} /></div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: "tieneChequera", label: "Tiene chequera" },
                { key: "tienePlanillaEmisionMasiva", label: "Planilla emisión masiva" },
                { key: "tieneCuentaRemunerada", label: "Cuenta remunerada (FCI)" },
                { key: "tieneTarjetasPrepagasChoferes", label: "Tarjetas prepagas" },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formCuenta[key as keyof typeof formCuenta] as boolean}
                    onChange={(e) => setFormCuenta(f => ({ ...f, [key]: e.target.checked }))}
                  />
                  {label}
                </label>
              ))}
            </div>
            {errorCuenta && <FormError message={errorCuenta} />}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setModalNuevaCuenta(false)}>Cancelar</Button>
            <Button onClick={guardarNuevaCuenta} disabled={guardandoCuenta}>{guardandoCuenta ? "Guardando..." : "Crear"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
