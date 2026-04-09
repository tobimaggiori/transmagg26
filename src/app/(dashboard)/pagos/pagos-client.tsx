"use client"

/**
 * Propósito: Componente client para el módulo de pagos.
 * Muestra 4 tabs: Recibidos de Empresas, A Fleteros, A Proveedores y Adelantos a Fleteros.
 */

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { FormError } from "@/components/ui/form-error"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { formatearMoneda, formatearFecha, formatearCuit } from "@/lib/utils"
import { parsearImporte, restarImportes } from "@/lib/money"
import { Plus } from "lucide-react"
import { hoyLocalYmd } from "@/lib/date-local"

// --- Tipos ---

interface PagoEmpresa {
  empresa: { id: string; razonSocial: string; cuit: string }
  saldoDeudor: number
  facturasImpagas: Array<{ id: string; nroComprobante: string | null; tipoCbte: string; total: number; estado: string; emitidaEn: string; saldo: number }>
  totalFacturado: number
}

interface PagoFletero {
  fletero: { id: string; razonSocial: string; cuit: string }
  saldoAPagar: number
  liquidacionesImpagas: Array<{ id: string; grabadaEn: string; total: number; neto: number; estado: string; saldo: number }>
  totalLiquidado: number
}

interface AdelantoFletero {
  id: string
  fecha: string
  tipo: string
  monto: number
  montoDescontado: number
  estado: string
  descripcion: string | null
  fletero: { id: string; razonSocial: string }
}

type TabId = "recibidos" | "fleteros" | "proveedores" | "adelantos"

// --- Tab: Recibidos de Empresas ---

function TabRecibidosEmpresas() {
  const [data, setData] = useState<PagoEmpresa[]>([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState("")
  const [seleccionada, setSeleccionada] = useState<string | null>(null)
  const [modalPago, setModalPago] = useState(false)
  const [formPago, setFormPago] = useState({ monto: "", tipo: "TRANSFERENCIA", referencia: "", fecha: hoyLocalYmd() })
  const [error, setError] = useState("")
  const [guardando, setGuardando] = useState(false)

  const cargar = () => {
    setLoading(true)
    fetch("/api/cuentas-corrientes/empresas")
      .then(r => r.json())
      .then(d => { setData(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { cargar() }, [])

  const filtradas = data.filter(e =>
    !busqueda || e.empresa.razonSocial.toLowerCase().includes(busqueda.toLowerCase()) ||
    e.empresa.cuit.includes(busqueda)
  )

  const empresaSelec = data.find(e => e.empresa.id === seleccionada)

  async function guardarPago() {
    if (!seleccionada) return
    setError("")
    setGuardando(true)
    const res = await fetch("/api/cuentas-corrientes/empresas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ empresaId: seleccionada, monto: parsearImporte(formPago.monto), tipo: formPago.tipo, referencia: formPago.referencia || null, fecha: formPago.fecha }),
    })
    setGuardando(false)
    if (res.ok) { setModalPago(false); cargar() }
    else { const d = await res.json(); setError(d.error ?? "Error al registrar pago") }
  }

  if (loading) return <p className="text-muted-foreground text-sm">Cargando...</p>

  return (
    <div className="grid grid-cols-5 gap-4">
      <div className="col-span-2 space-y-2">
        <Input placeholder="Buscar empresa..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
        {filtradas.filter(e => e.saldoDeudor > 0).map((e) => (
          <div
            key={e.empresa.id}
            onClick={() => setSeleccionada(e.empresa.id)}
            className={`border rounded p-3 cursor-pointer hover:border-primary ${seleccionada === e.empresa.id ? "border-primary bg-primary/5" : ""}`}
          >
            <p className="font-medium text-sm">{e.empresa.razonSocial}</p>
            <p className="text-xs text-muted-foreground">CUIT: {formatearCuit(e.empresa.cuit)}</p>
            <p className="text-base font-bold text-destructive mt-1">{formatearMoneda(e.saldoDeudor)}</p>
          </div>
        ))}
        {filtradas.filter(e => e.saldoDeudor > 0).length === 0 && (
          <p className="text-muted-foreground text-sm">Sin deudas pendientes.</p>
        )}
      </div>

      <div className="col-span-3">
        {!empresaSelec ? (
          <p className="text-muted-foreground">Seleccioná una empresa para ver el detalle.</p>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{empresaSelec.empresa.razonSocial}</h3>
              <Button size="sm" onClick={() => { setFormPago({ monto: "", tipo: "TRANSFERENCIA", referencia: "", fecha: hoyLocalYmd() }); setModalPago(true) }}>
                <Plus className="h-4 w-4 mr-1" /> Registrar pago
              </Button>
            </div>
            <div className="border rounded overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50"><tr><th className="text-left px-3 py-2">Comprobante</th><th className="text-left px-3 py-2">Estado</th><th className="text-right px-3 py-2">Total</th><th className="text-right px-3 py-2">Saldo</th></tr></thead>
                <tbody>
                  {empresaSelec.facturasImpagas.map((f) => (
                    <tr key={f.id} className="border-t">
                      <td className="px-3 py-2">{f.tipoCbte} {f.nroComprobante ?? ""} <span className="text-muted-foreground text-xs">({formatearFecha(f.emitidaEn)})</span></td>
                      <td className="px-3 py-2"><span className="text-xs bg-muted px-1.5 py-0.5 rounded">{f.estado}</span></td>
                      <td className="px-3 py-2 text-right">{formatearMoneda(f.total)}</td>
                      <td className="px-3 py-2 text-right font-semibold text-destructive">{formatearMoneda(f.saldo)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <Dialog open={modalPago} onOpenChange={setModalPago}>
        <DialogContent>
          <DialogHeader><DialogTitle>Registrar pago de empresa</DialogTitle><DialogDescription>{empresaSelec?.empresa.razonSocial}</DialogDescription></DialogHeader>
          <div className="space-y-3">
            <div><Label>Monto</Label><Input type="number" value={formPago.monto} onChange={(e) => setFormPago(f => ({ ...f, monto: e.target.value }))} /></div>
            <div><Label>Tipo</Label>
              <Select value={formPago.tipo} onChange={(e) => setFormPago(f => ({ ...f, tipo: e.target.value }))}>
                <option value="TRANSFERENCIA">TRANSFERENCIA</option>
                <option value="CHEQUE">CHEQUE</option>
                <option value="EFECTIVO">EFECTIVO</option>
              </Select>
            </div>
            <div><Label>Referencia</Label><Input value={formPago.referencia} onChange={(e) => setFormPago(f => ({ ...f, referencia: e.target.value }))} /></div>
            <div><Label>Fecha</Label><Input type="date" value={formPago.fecha} onChange={(e) => setFormPago(f => ({ ...f, fecha: e.target.value }))} /></div>
            {error && <FormError message={error} />}
          </div>
          <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setModalPago(false)}>Cancelar</Button><Button onClick={guardarPago} disabled={guardando}>Guardar</Button></div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// --- Tab: A Fleteros ---

function TabAFleteros() {
  const [data, setData] = useState<PagoFletero[]>([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState("")
  const [seleccionado, setSeleccionado] = useState<string | null>(null)
  const [modalPago, setModalPago] = useState(false)
  const [formPago, setFormPago] = useState({ monto: "", tipo: "TRANSFERENCIA", referencia: "", fecha: hoyLocalYmd() })
  const [error, setError] = useState("")
  const [guardando, setGuardando] = useState(false)

  const cargar = () => {
    setLoading(true)
    fetch("/api/cuentas-corrientes/fleteros")
      .then(r => r.json())
      .then(d => { setData(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { cargar() }, [])

  const filtrados = data.filter(f =>
    !busqueda || f.fletero.razonSocial.toLowerCase().includes(busqueda.toLowerCase()) ||
    f.fletero.cuit.includes(busqueda)
  )

  const fleteroSelec = data.find(f => f.fletero.id === seleccionado)

  async function guardarPago() {
    if (!seleccionado) return
    setError("")
    setGuardando(true)
    const res = await fetch("/api/cuentas-corrientes/fleteros", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fleteroId: seleccionado, monto: parsearImporte(formPago.monto), tipo: formPago.tipo, referencia: formPago.referencia || null, fecha: formPago.fecha }),
    })
    setGuardando(false)
    if (res.ok) { setModalPago(false); cargar() }
    else { const d = await res.json(); setError(d.error ?? "Error al registrar pago") }
  }

  if (loading) return <p className="text-muted-foreground text-sm">Cargando...</p>

  return (
    <div className="grid grid-cols-5 gap-4">
      <div className="col-span-2 space-y-2">
        <Input placeholder="Buscar fletero..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
        {filtrados.filter(f => f.saldoAPagar > 0).map((f) => (
          <div
            key={f.fletero.id}
            onClick={() => setSeleccionado(f.fletero.id)}
            className={`border rounded p-3 cursor-pointer hover:border-primary ${seleccionado === f.fletero.id ? "border-primary bg-primary/5" : ""}`}
          >
            <p className="font-medium text-sm">{f.fletero.razonSocial}</p>
            <p className="text-xs text-muted-foreground">CUIT: {formatearCuit(f.fletero.cuit)}</p>
            <p className="text-base font-bold text-orange-600 mt-1">{formatearMoneda(f.saldoAPagar)}</p>
          </div>
        ))}
        {filtrados.filter(f => f.saldoAPagar > 0).length === 0 && (
          <p className="text-muted-foreground text-sm">Sin pagos pendientes.</p>
        )}
      </div>

      <div className="col-span-3">
        {!fleteroSelec ? (
          <p className="text-muted-foreground">Seleccioná un fletero para ver el detalle.</p>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{fleteroSelec.fletero.razonSocial}</h3>
              <Button size="sm" onClick={() => { setFormPago({ monto: "", tipo: "TRANSFERENCIA", referencia: "", fecha: hoyLocalYmd() }); setModalPago(true) }}>
                <Plus className="h-4 w-4 mr-1" /> Registrar pago
              </Button>
            </div>
            <div className="border rounded overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50"><tr><th className="text-left px-3 py-2">Fecha</th><th className="text-left px-3 py-2">Estado</th><th className="text-right px-3 py-2">Total</th><th className="text-right px-3 py-2">Saldo</th></tr></thead>
                <tbody>
                  {fleteroSelec.liquidacionesImpagas.map((l) => (
                    <tr key={l.id} className="border-t">
                      <td className="px-3 py-2">{formatearFecha(l.grabadaEn)}</td>
                      <td className="px-3 py-2"><span className="text-xs bg-muted px-1.5 py-0.5 rounded">{l.estado}</span></td>
                      <td className="px-3 py-2 text-right">{formatearMoneda(l.total)}</td>
                      <td className="px-3 py-2 text-right font-semibold text-orange-600">{formatearMoneda(l.saldo)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <Dialog open={modalPago} onOpenChange={setModalPago}>
        <DialogContent>
          <DialogHeader><DialogTitle>Registrar pago a fletero</DialogTitle><DialogDescription>{fleteroSelec?.fletero.razonSocial}</DialogDescription></DialogHeader>
          <div className="space-y-3">
            <div><Label>Monto</Label><Input type="number" value={formPago.monto} onChange={(e) => setFormPago(f => ({ ...f, monto: e.target.value }))} /></div>
            <div><Label>Tipo</Label>
              <Select value={formPago.tipo} onChange={(e) => setFormPago(f => ({ ...f, tipo: e.target.value }))}>
                <option value="TRANSFERENCIA">TRANSFERENCIA</option>
                <option value="CHEQUE">CHEQUE</option>
                <option value="EFECTIVO">EFECTIVO</option>
              </Select>
            </div>
            <div><Label>Referencia</Label><Input value={formPago.referencia} onChange={(e) => setFormPago(f => ({ ...f, referencia: e.target.value }))} /></div>
            <div><Label>Fecha</Label><Input type="date" value={formPago.fecha} onChange={(e) => setFormPago(f => ({ ...f, fecha: e.target.value }))} /></div>
            {error && <FormError message={error} />}
          </div>
          <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setModalPago(false)}>Cancelar</Button><Button onClick={guardarPago} disabled={guardando}>Guardar</Button></div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// --- Tab: A Proveedores (stub básico) ---

function TabAProveedores() {
  const [proveedores, setProveedores] = useState<Array<{ id: string; razonSocial: string; cuit: string }>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/proveedores")
      .then(r => r.json())
      .then(d => { setProveedores(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-muted-foreground text-sm">Cargando...</p>

  return (
    <div className="space-y-3">
      <p className="text-muted-foreground text-sm">Listado de proveedores con pagos pendientes.</p>
      {proveedores.length === 0 ? (
        <Card><CardContent className="pt-4"><p className="text-muted-foreground text-center py-4">Sin proveedores registrados.</p></CardContent></Card>
      ) : (
        <div className="border rounded overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50"><tr><th className="text-left px-3 py-2">Razón Social</th><th className="text-left px-3 py-2">CUIT</th></tr></thead>
            <tbody>
              {proveedores.map((p) => (
                <tr key={p.id} className="border-t hover:bg-muted/20">
                  <td className="px-3 py-2">{p.razonSocial}</td>
                  <td className="px-3 py-2">{formatearCuit(p.cuit)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// --- Tab: Adelantos a Fleteros ---

function TabAdelantosFleteros() {
  const [adelantos, setAdelantos] = useState<AdelantoFletero[]>([])
  const [fleteros, setFleteros] = useState<Array<{ id: string; razonSocial: string }>>([])
  const [loading, setLoading] = useState(true)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [form, setForm] = useState({
    fleteroId: "", tipo: "TRANSFERENCIA", monto: "", fecha: hoyLocalYmd(), descripcion: "",
  })
  const [error, setError] = useState("")
  const [guardando, setGuardando] = useState(false)

  const cargar = () => {
    setLoading(true)
    fetch("/api/adelantos-fleteros")
      .then(r => r.json())
      .then(d => { setAdelantos(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    cargar()
    fetch("/api/fleteros").then(r => r.json()).then(d => setFleteros(Array.isArray(d) ? d.map((f: { id: string; razonSocial: string }) => ({ id: f.id, razonSocial: f.razonSocial })) : []))
  }, [])

  async function guardar() {
    setError("")
    setGuardando(true)
    const res = await fetch("/api/adelantos-fleteros", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, monto: parsearImporte(form.monto), descripcion: form.descripcion || null }),
    })
    setGuardando(false)
    if (res.ok) { setModalAbierto(false); cargar() }
    else { const d = await res.json(); setError(d.error ?? "Error al guardar") }
  }

  if (loading) return <p className="text-muted-foreground text-sm">Cargando...</p>

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setModalAbierto(true)}><Plus className="h-4 w-4 mr-1" /> Nuevo adelanto</Button>
      </div>
      <div className="border rounded overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-3 py-2">Fecha</th>
              <th className="text-left px-3 py-2">Fletero</th>
              <th className="text-left px-3 py-2">Tipo</th>
              <th className="text-right px-3 py-2">Monto</th>
              <th className="text-right px-3 py-2">Descontado</th>
              <th className="text-right px-3 py-2">Pendiente</th>
              <th className="text-left px-3 py-2">Estado</th>
            </tr>
          </thead>
          <tbody>
            {adelantos.map((a) => (
              <tr key={a.id} className="border-t hover:bg-muted/20">
                <td className="px-3 py-2">{formatearFecha(a.fecha)}</td>
                <td className="px-3 py-2">{a.fletero.razonSocial}</td>
                <td className="px-3 py-2"><span className="text-xs bg-muted px-1.5 py-0.5 rounded">{a.tipo}</span></td>
                <td className="px-3 py-2 text-right">{formatearMoneda(a.monto)}</td>
                <td className="px-3 py-2 text-right">{formatearMoneda(a.montoDescontado)}</td>
                <td className="px-3 py-2 text-right font-medium">{formatearMoneda(restarImportes(a.monto, a.montoDescontado))}</td>
                <td className="px-3 py-2"><span className="text-xs bg-muted px-1.5 py-0.5 rounded">{a.estado}</span></td>
              </tr>
            ))}
            {adelantos.length === 0 && (
              <tr><td colSpan={7} className="px-3 py-4 text-center text-muted-foreground">Sin adelantos registrados.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={modalAbierto} onOpenChange={setModalAbierto}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nuevo adelanto a fletero</DialogTitle><DialogDescription>Registrar un adelanto de pago</DialogDescription></DialogHeader>
          <div className="space-y-3">
            <div><Label>Fletero</Label>
              <Select value={form.fleteroId} onChange={(e) => setForm(f => ({ ...f, fleteroId: e.target.value }))}>
                <option value="">Seleccionar...</option>
                {fleteros.map(f => <option key={f.id} value={f.id}>{f.razonSocial}</option>)}
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Tipo</Label>
                <Select value={form.tipo} onChange={(e) => setForm(f => ({ ...f, tipo: e.target.value }))}>
                  {["EFECTIVO","TRANSFERENCIA","CHEQUE_PROPIO","CHEQUE_TERCERO","COMBUSTIBLE"].map(t => <option key={t} value={t}>{t}</option>)}
                </Select>
              </div>
              <div><Label>Monto</Label><Input type="number" value={form.monto} onChange={(e) => setForm(f => ({ ...f, monto: e.target.value }))} /></div>
            </div>
            <div><Label>Fecha</Label><Input type="date" value={form.fecha} onChange={(e) => setForm(f => ({ ...f, fecha: e.target.value }))} /></div>
            <div><Label>Descripción</Label><Input value={form.descripcion} onChange={(e) => setForm(f => ({ ...f, descripcion: e.target.value }))} /></div>
            {error && <FormError message={error} />}
          </div>
          <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setModalAbierto(false)}>Cancelar</Button><Button onClick={guardar} disabled={guardando}>Guardar</Button></div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// --- Componente principal ---

/**
 * PagosClient: () -> JSX.Element
 *
 * Dado [ningún parámetro], renderiza el módulo de pagos con 4 tabs.
 * Existe para centralizar la gestión de flujos de dinero hacia y desde Transmagg.
 *
 * Ejemplos:
 * <PagosClient /> // tabs: Recibidos, A Fleteros, Proveedores, Adelantos
 * <PagosClient /> // tab Adelantos con modal para nuevo adelanto
 * <PagosClient /> // tab Recibidos con panel lateral al seleccionar empresa
 */
export function PagosClient({ titulo = "Pagos" }: { titulo?: string } = {}) {
  const [tab, setTab] = useState<TabId>("recibidos")

  const TABS: Array<{ id: TabId; label: string }> = [
    { id: "recibidos", label: "Recibidos de Empresas" },
    { id: "fleteros", label: "A Fleteros" },
    { id: "proveedores", label: "A Proveedores" },
    { id: "adelantos", label: "Adelantos a Fleteros" },
  ]

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{titulo}</h2>
        <p className="text-muted-foreground">Gestión de pagos recibidos y realizados</p>
      </div>

      <div className="border-b">
        <nav className="flex gap-0 -mb-px">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                tab === t.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300"
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="pt-2">
        {tab === "recibidos" && <TabRecibidosEmpresas />}
        {tab === "fleteros" && <TabAFleteros />}
        {tab === "proveedores" && <TabAProveedores />}
        {tab === "adelantos" && <TabAdelantosFleteros />}
      </div>
    </div>
  )
}
