"use client"

/**
 * Propósito: Componente client para gestión de cuentas bancarias.
 * Muestra lista de cuentas y detalle con tabs: Movimientos (CRUD inline),
 * Resúmenes Bancarios, Broker Pendiente, Planillas Galicia, FCI Propios,
 * Tarjetas Prepagas, Configuración.
 */

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { FormError } from "@/components/ui/form-error"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { UploadPDF } from "@/components/upload-pdf"
import { ViewPDF } from "@/components/view-pdf"
import { formatearMoneda, formatearFecha } from "@/lib/utils"
import { Plus, RefreshCw, Download, Trash2, Pencil } from "lucide-react"
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

interface Movimiento {
  id: string
  tipo: string
  categoria: string
  monto: number
  fecha: string
  descripcion: string
  referencia: string | null
  comprobanteS3Key: string | null
  saldoDespues: number | null
  operador: { nombre: string; apellido: string }
}

interface ResumenBancario {
  id: string
  mes: number
  anio: number
  estado: string
  pdfS3Key: string | null
  creadoEn: string
  operador: { nombre: string; apellido: string }
}

interface ChequeRecibidoBroker {
  id: string
  nroCheque: string
  monto: number
  fechaCobro: string
  creadoEn: string
  empresa: { razonSocial: string }
  endosadoABrokerId: string | null
  fechaDepositoBroker: string | null
}

interface PlanillaGalicia {
  id: string
  nombre: string
  estado: string
  totalMonto: number
  cantidadCheques: number
  creadaEn: string
}

type TabId =
  | "movimientos"
  | "resumenes-bancarios"
  | "broker-pendiente"
  | "planillas-galicia"
  | "fci"
  | "tarjetas"
  | "configuracion"

interface CuentasClientProps {
  cuentaInicialId?: string
  tabInicial?: string
  esAdmin?: boolean
}

const CATEGORIAS = [
  "CHEQUE_DEPOSITADO",
  "CHEQUE_EMITIDO_DEBITADO",
  "TRANSFERENCIA_RECIBIDA",
  "TRANSFERENCIA_ENVIADA",
  "TRANSFERENCIA_ENTRE_CUENTAS_PROPIAS",
  "ENVIO_A_BROKER",
  "RESCATE_DE_BROKER",
  "INTERES_CUENTA_REMUNERADA",
  "PAGO_SERVICIO",
  "MANTENIMIENTO_CUENTA",
  "PAGO_TARJETA",
  "DESCUENTO_CHEQUE_BANCO",
  "PAGO_SUELDO",
  "OTRO",
]

const MESES = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
]

// --- Sub-componente: Tab Movimientos (CRUD inline) ---

function TabMovimientos({ cuenta, esAdmin }: { cuenta: Cuenta; esAdmin: boolean }) {
  const [movimientos, setMovimientos] = useState<Movimiento[]>([])
  const [total, setTotal] = useState(0)
  const [totalCreditos, setTotalCreditos] = useState(0)
  const [totalDebitos, setTotalDebitos] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const limit = 50

  const [filtroTipo, setFiltroTipo] = useState("")
  const [filtroCategoria, setFiltroCategoria] = useState("")
  const [filtroDesde, setFiltroDesde] = useState("")
  const [filtroHasta, setFiltroHasta] = useState("")

  const [modalNuevo, setModalNuevo] = useState(false)
  const [form, setForm] = useState({
    tipo: "INGRESO", categoria: "OTRO", monto: "", fecha: new Date().toISOString().slice(0, 10),
    descripcion: "", referencia: "",
  })
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState("")

  const [editando, setEditando] = useState<Movimiento | null>(null)
  const [formEdit, setFormEdit] = useState({ descripcion: "", referencia: "" })
  const [guardandoEdit, setGuardandoEdit] = useState(false)
  const [errorEdit, setErrorEdit] = useState("")

  const buildQuery = useCallback((p: number) => {
    const params = new URLSearchParams()
    params.set("page", String(p))
    params.set("limit", String(limit))
    if (filtroTipo) params.set("tipo", filtroTipo)
    if (filtroCategoria) params.set("categoria", filtroCategoria)
    if (filtroDesde) params.set("desde", filtroDesde)
    if (filtroHasta) params.set("hasta", filtroHasta)
    return params.toString()
  }, [filtroTipo, filtroCategoria, filtroDesde, filtroHasta])

  const cargar = useCallback((p = 1) => {
    setLoading(true)
    fetch(`/api/cuentas/${cuenta.id}/movimientos?${buildQuery(p)}`)
      .then(r => r.json())
      .then(d => {
        setMovimientos(Array.isArray(d.movimientos) ? d.movimientos : [])
        setTotal(d.total ?? 0)
        setTotalCreditos(d.totalCreditos ?? 0)
        setTotalDebitos(d.totalDebitos ?? 0)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [cuenta.id, buildQuery])

  useEffect(() => { setPage(1); cargar(1) }, [cargar])

  function aplicarFiltros() { setPage(1); cargar(1) }
  function limpiarFiltros() {
    setFiltroTipo(""); setFiltroCategoria(""); setFiltroDesde(""); setFiltroHasta("")
    setPage(1)
  }

  async function guardarNuevo() {
    setError("")
    if (!form.monto || !form.fecha || !form.descripcion) { setError("Completá todos los campos obligatorios"); return }
    setGuardando(true)
    const res = await fetch(`/api/cuentas/${cuenta.id}/movimientos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tipo: form.tipo,
        categoria: form.categoria,
        monto: parseFloat(form.monto),
        fecha: form.fecha,
        descripcion: form.descripcion,
        referencia: form.referencia || null,
      }),
    })
    setGuardando(false)
    if (res.ok) {
      setModalNuevo(false)
      setForm({ tipo: "INGRESO", categoria: "OTRO", monto: "", fecha: new Date().toISOString().slice(0, 10), descripcion: "", referencia: "" })
      cargar(1)
    } else {
      const d = await res.json()
      setError(d.error ?? "Error al guardar")
    }
  }

  function abrirEditar(m: Movimiento) {
    setEditando(m)
    setFormEdit({ descripcion: m.descripcion, referencia: m.referencia ?? "" })
    setErrorEdit("")
  }

  async function guardarEdit() {
    if (!editando) return
    setErrorEdit("")
    setGuardandoEdit(true)
    const res = await fetch(`/api/cuentas/${cuenta.id}/movimientos/${editando.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        descripcion: formEdit.descripcion,
        referencia: formEdit.referencia || null,
      }),
    })
    setGuardandoEdit(false)
    if (res.ok) { setEditando(null); cargar(page) }
    else { const d = await res.json(); setErrorEdit(d.error ?? "Error al actualizar") }
  }

  async function eliminar(id: string) {
    if (!confirm("¿Eliminar este movimiento?")) return
    await fetch(`/api/cuentas/${cuenta.id}/movimientos/${id}`, { method: "DELETE" })
    cargar(page)
  }

  function descargarExcel() {
    const params = new URLSearchParams()
    if (filtroTipo) params.set("tipo", filtroTipo)
    if (filtroCategoria) params.set("categoria", filtroCategoria)
    if (filtroDesde) params.set("desde", filtroDesde)
    if (filtroHasta) params.set("hasta", filtroHasta)
    window.open(`/api/cuentas/${cuenta.id}/movimientos/excel?${params.toString()}`)
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 items-end border rounded p-3 bg-muted/20">
        <div>
          <Label className="text-xs">Tipo</Label>
          <Select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)} className="h-8 text-xs w-28">
            <option value="">Todos</option>
            <option value="INGRESO">INGRESO</option>
            <option value="EGRESO">EGRESO</option>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Categoría</Label>
          <Select value={filtroCategoria} onChange={e => setFiltroCategoria(e.target.value)} className="h-8 text-xs w-44">
            <option value="">Todas</option>
            {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
          </Select>
        </div>
        <div>
          <Label className="text-xs">Desde</Label>
          <Input type="date" value={filtroDesde} onChange={e => setFiltroDesde(e.target.value)} className="h-8 text-xs w-36" />
        </div>
        <div>
          <Label className="text-xs">Hasta</Label>
          <Input type="date" value={filtroHasta} onChange={e => setFiltroHasta(e.target.value)} className="h-8 text-xs w-36" />
        </div>
        <Button size="sm" onClick={aplicarFiltros} className="h-8">Filtrar</Button>
        <Button size="sm" variant="outline" onClick={limpiarFiltros} className="h-8">Limpiar</Button>
        <Button size="sm" variant="outline" onClick={descargarExcel} className="h-8 ml-auto">
          <Download className="h-3 w-3 mr-1" /> Excel
        </Button>
        <Button size="sm" onClick={() => setModalNuevo(true)} className="h-8">
          <Plus className="h-3 w-3 mr-1" /> Nuevo
        </Button>
      </div>

      {!loading && (
        <div className="grid grid-cols-3 gap-2 text-sm">
          <div className="border rounded px-3 py-2 bg-green-50">
            <p className="text-xs text-muted-foreground">Ingresos período</p>
            <p className="font-semibold text-green-700">{formatearMoneda(totalCreditos)}</p>
          </div>
          <div className="border rounded px-3 py-2 bg-red-50">
            <p className="text-xs text-muted-foreground">Egresos período</p>
            <p className="font-semibold text-red-700">{formatearMoneda(totalDebitos)}</p>
          </div>
          <div className="border rounded px-3 py-2 bg-muted/30">
            <p className="text-xs text-muted-foreground">Neto período</p>
            <p className={`font-semibold ${totalCreditos - totalDebitos < 0 ? "text-destructive" : ""}`}>
              {formatearMoneda(totalCreditos - totalDebitos)}
            </p>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-muted-foreground text-sm">Cargando...</p>
      ) : movimientos.length === 0 ? (
        <div className="border rounded p-6 text-center text-muted-foreground text-sm">Sin movimientos para los filtros seleccionados.</div>
      ) : (
        <div className="border rounded overflow-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-2 py-2">Fecha</th>
                <th className="text-left px-2 py-2">Categoría</th>
                <th className="text-left px-2 py-2">Descripción</th>
                <th className="text-right px-2 py-2">Ingreso</th>
                <th className="text-right px-2 py-2">Egreso</th>
                <th className="text-right px-2 py-2">Saldo</th>
                <th className="text-left px-2 py-2">Operador</th>
                <th className="px-2 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {movimientos.map((m) => (
                <tr key={m.id} className="border-t hover:bg-muted/20">
                  <td className="px-2 py-1.5 whitespace-nowrap">{formatearFecha(m.fecha)}</td>
                  <td className="px-2 py-1.5 text-muted-foreground">{m.categoria}</td>
                  <td className="px-2 py-1.5">
                    <div>{m.descripcion}</div>
                    {m.referencia && <div className="text-muted-foreground text-xs">{m.referencia}</div>}
                  </td>
                  <td className="px-2 py-1.5 text-right">
                    {m.tipo === "INGRESO" && <span className="text-green-700 font-medium">{formatearMoneda(m.monto)}</span>}
                  </td>
                  <td className="px-2 py-1.5 text-right">
                    {m.tipo === "EGRESO" && <span className="text-red-700 font-medium">{formatearMoneda(m.monto)}</span>}
                  </td>
                  <td className="px-2 py-1.5 text-right whitespace-nowrap font-medium">
                    {m.saldoDespues != null ? formatearMoneda(m.saldoDespues) : "-"}
                  </td>
                  <td className="px-2 py-1.5 text-muted-foreground whitespace-nowrap">
                    {m.operador.nombre} {m.operador.apellido}
                  </td>
                  <td className="px-2 py-1.5">
                    <div className="flex gap-1">
                      <button onClick={() => abrirEditar(m)} className="text-muted-foreground hover:text-foreground" title="Editar">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      {esAdmin && (
                        <button onClick={() => eliminar(m.id)} className="text-muted-foreground hover:text-destructive" title="Eliminar">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                      {m.comprobanteS3Key && <ViewPDF s3Key={m.comprobanteS3Key} label="PDF" />}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{total} movimientos — página {page} de {totalPages}</span>
          <div className="flex gap-1">
            <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => { setPage(p => p - 1); cargar(page - 1) }} className="h-7 text-xs">Anterior</Button>
            <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => { setPage(p => p + 1); cargar(page + 1) }} className="h-7 text-xs">Siguiente</Button>
          </div>
        </div>
      )}

      <Dialog open={modalNuevo} onOpenChange={setModalNuevo}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo movimiento</DialogTitle>
            <DialogDescription>Registrar un ingreso o egreso en {cuenta.nombre}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Tipo</Label>
                <Select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}>
                  <option value="INGRESO">INGRESO</option>
                  <option value="EGRESO">EGRESO</option>
                </Select>
              </div>
              <div>
                <Label>Categoría</Label>
                <Select value={form.categoria} onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))}>
                  {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Monto</Label><Input type="number" step="0.01" value={form.monto} onChange={e => setForm(f => ({ ...f, monto: e.target.value }))} /></div>
              <div><Label>Fecha</Label><Input type="date" value={form.fecha} onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))} /></div>
            </div>
            <div><Label>Descripción</Label><Input value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} /></div>
            <div><Label>Referencia (opcional)</Label><Input value={form.referencia} onChange={e => setForm(f => ({ ...f, referencia: e.target.value }))} /></div>
            {error && <FormError message={error} />}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setModalNuevo(false)}>Cancelar</Button>
            <Button onClick={guardarNuevo} disabled={guardando}>{guardando ? "Guardando..." : "Guardar"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editando} onOpenChange={() => setEditando(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar movimiento</DialogTitle>
            <DialogDescription>Solo se pueden modificar descripción y referencia</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div><Label>Descripción</Label><Input value={formEdit.descripcion} onChange={e => setFormEdit(f => ({ ...f, descripcion: e.target.value }))} /></div>
            <div><Label>Referencia</Label><Input value={formEdit.referencia} onChange={e => setFormEdit(f => ({ ...f, referencia: e.target.value }))} /></div>
            {errorEdit && <FormError message={errorEdit} />}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setEditando(null)}>Cancelar</Button>
            <Button onClick={guardarEdit} disabled={guardandoEdit}>{guardandoEdit ? "Guardando..." : "Guardar"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// --- Sub-componente: Tab Resúmenes Bancarios ---

function TabResumenesBancarios({ cuenta }: { cuenta: Cuenta }) {
  const [resumenes, setResumenes] = useState<ResumenBancario[]>([])
  const [loading, setLoading] = useState(true)
  const [modalNuevo, setModalNuevo] = useState(false)
  const [formNuevo, setFormNuevo] = useState({
    mes: new Date().getMonth() + 1,
    anio: new Date().getFullYear(),
  })
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState("")

  const cargar = useCallback(() => {
    setLoading(true)
    fetch(`/api/cuentas/${cuenta.id}/resumenes-bancarios`)
      .then(r => r.json())
      .then(d => { setResumenes(Array.isArray(d.resumenes) ? d.resumenes : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [cuenta.id])

  useEffect(() => { cargar() }, [cargar])

  async function crearResumen() {
    setError("")
    setGuardando(true)
    const res = await fetch(`/api/cuentas/${cuenta.id}/resumenes-bancarios`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formNuevo),
    })
    setGuardando(false)
    if (res.ok) { setModalNuevo(false); cargar() }
    else { const d = await res.json(); setError(d.error ?? "Error al crear") }
  }

  async function subirPdf(resId: string, s3Key: string) {
    await fetch(`/api/cuentas/${cuenta.id}/resumenes-bancarios/${resId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pdfS3Key: s3Key, estado: "CARGADO" }),
    })
    cargar()
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setModalNuevo(true)}><Plus className="h-4 w-4 mr-1" /> Nuevo mes</Button>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-sm">Cargando...</p>
      ) : resumenes.length === 0 ? (
        <div className="border rounded p-6 text-center text-muted-foreground text-sm">Sin resúmenes cargados.</div>
      ) : (
        <div className="space-y-2">
          {resumenes.map((r) => (
            <div key={r.id} className="border rounded p-3 flex items-center justify-between gap-3">
              <div>
                <p className="font-medium text-sm">{MESES[r.mes - 1]} {r.anio}</p>
                <p className="text-xs text-muted-foreground">
                  {r.operador.nombre} {r.operador.apellido} — {formatearFecha(r.creadoEn)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded ${r.estado === "CARGADO" ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>
                  {r.estado}
                </span>
                {r.pdfS3Key ? (
                  <ViewPDF s3Key={r.pdfS3Key} label="Ver PDF" />
                ) : (
                  <UploadPDF
                    prefijo="resumenes-bancarios"
                    onUpload={(key: string) => subirPdf(r.id, key)}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={modalNuevo} onOpenChange={setModalNuevo}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo resumen bancario</DialogTitle>
            <DialogDescription>Crear un registro para un mes/año de esta cuenta</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Mes</Label>
                <Select value={String(formNuevo.mes)} onChange={e => setFormNuevo(f => ({ ...f, mes: parseInt(e.target.value) }))}>
                  {MESES.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
                </Select>
              </div>
              <div>
                <Label>Año</Label>
                <Input type="number" value={formNuevo.anio} onChange={e => setFormNuevo(f => ({ ...f, anio: parseInt(e.target.value) }))} />
              </div>
            </div>
            {error && <FormError message={error} />}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setModalNuevo(false)}>Cancelar</Button>
            <Button onClick={crearResumen} disabled={guardando}>{guardando ? "Creando..." : "Crear"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// --- Sub-componente: Tab Broker Pendiente ---

function TabBrokerPendiente({ cuenta }: { cuenta: Cuenta }) {
  const [cheques, setCheques] = useState<ChequeRecibidoBroker[]>([])
  const [loading, setLoading] = useState(true)
  const [modalConfirmar, setModalConfirmar] = useState(false)
  const [chequeSeleccionado, setChequeSeleccionado] = useState<ChequeRecibidoBroker | null>(null)
  const [fechaDeposito, setFechaDeposito] = useState(new Date().toISOString().slice(0, 10))
  const [error, setError] = useState("")
  const [guardando, setGuardando] = useState(false)

  const cargar = useCallback(() => {
    setLoading(true)
    fetch(`/api/cheques-recibidos?estado=ENDOSADO_BROKER&limit=200`)
      .then(r => r.json())
      .then(d => {
        const todos = Array.isArray(d.cheques) ? d.cheques : []
        setCheques(todos.filter((c: ChequeRecibidoBroker) => c.endosadoABrokerId === cuenta.id && !c.fechaDepositoBroker))
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [cuenta.id])

  useEffect(() => { cargar() }, [cargar])

  function diasDesde(fechaStr: string): number {
    const ahora = new Date()
    ahora.setHours(0, 0, 0, 0)
    const fecha = new Date(fechaStr)
    fecha.setHours(0, 0, 0, 0)
    return Math.round((ahora.getTime() - fecha.getTime()) / 86400000)
  }

  async function confirmarDeposito() {
    if (!chequeSeleccionado) return
    setError("")
    setGuardando(true)
    const res = await fetch(`/api/cheques-recibidos/${chequeSeleccionado.id}/confirmar-deposito-broker`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fechaDepositoBroker: fechaDeposito }),
    })
    setGuardando(false)
    if (res.ok) {
      setModalConfirmar(false)
      setChequeSeleccionado(null)
      cargar()
    } else {
      const d = await res.json()
      setError(d.error ?? "Error al confirmar")
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Cheques endosados a esta cuenta de broker pendientes de confirmación de depósito.
      </p>

      {loading ? (
        <p className="text-muted-foreground text-sm">Cargando...</p>
      ) : cheques.length === 0 ? (
        <div className="border rounded p-6 text-center text-muted-foreground text-sm">
          Sin cheques pendientes de depósito.
        </div>
      ) : (
        <div className="border rounded overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-3 py-2">Nro. Cheque</th>
                <th className="text-left px-3 py-2">Empresa</th>
                <th className="text-right px-3 py-2">Monto</th>
                <th className="text-left px-3 py-2">F. Cobro</th>
                <th className="text-left px-3 py-2">Días endosado</th>
                <th className="text-left px-3 py-2">Acción</th>
              </tr>
            </thead>
            <tbody>
              {cheques.map(c => {
                const dias = diasDesde(c.creadoEn)
                const esVencido = dias > 30
                return (
                  <tr key={c.id} className={`border-t ${esVencido ? "bg-red-50 hover:bg-red-100/50" : "hover:bg-muted/20"}`}>
                    <td className="px-3 py-2 font-mono">{c.nroCheque}</td>
                    <td className="px-3 py-2">{c.empresa.razonSocial}</td>
                    <td className="px-3 py-2 text-right">{formatearMoneda(c.monto)}</td>
                    <td className="px-3 py-2">{formatearFecha(c.fechaCobro)}</td>
                    <td className={`px-3 py-2 ${esVencido ? "text-red-600 font-semibold" : ""}`}>{dias}d</td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded hover:bg-blue-100"
                        onClick={() => {
                          setChequeSeleccionado(c)
                          setFechaDeposito(new Date().toISOString().slice(0, 10))
                          setError("")
                          setModalConfirmar(true)
                        }}
                      >
                        Confirmar depósito
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={modalConfirmar} onOpenChange={o => { if (!o) setModalConfirmar(false) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar depósito broker</DialogTitle>
            <DialogDescription>
              Cheque {chequeSeleccionado?.nroCheque} — {chequeSeleccionado ? formatearMoneda(chequeSeleccionado.monto) : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Fecha de depósito</Label>
              <Input type="date" value={fechaDeposito} onChange={e => setFechaDeposito(e.target.value)} />
            </div>
            {error && <FormError message={error} />}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setModalConfirmar(false)}>Cancelar</Button>
            <Button onClick={confirmarDeposito} disabled={guardando}>
              {guardando ? "Guardando..." : "Confirmar"}
            </Button>
          </div>
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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

// --- Sub-componente: Tab Configuración ---

function TabConfiguracion({ cuenta, onCuentaActualizada }: { cuenta: Cuenta; onCuentaActualizada: () => void }) {
  const [form, setForm] = useState({
    nombre: cuenta.nombre,
    bancoOEntidad: cuenta.bancoOEntidad,
    tieneImpuestoDebcred: cuenta.tieneImpuestoDebcred,
    alicuotaImpuesto: String(cuenta.alicuotaImpuesto),
    tieneChequera: cuenta.tieneChequera,
    tienePlanillaEmisionMasiva: cuenta.tienePlanillaEmisionMasiva,
    tieneCuentaRemunerada: cuenta.tieneCuentaRemunerada,
    tieneTarjetasPrepagasChoferes: cuenta.tieneTarjetasPrepagasChoferes,
  })
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState("")
  const [exito, setExito] = useState(false)
  const [confirmandoBaja, setConfirmandoBaja] = useState(false)

  async function guardar() {
    setError(""); setExito(false)
    setGuardando(true)
    const res = await fetch(`/api/cuentas/${cuenta.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, alicuotaImpuesto: parseFloat(form.alicuotaImpuesto) }),
    })
    setGuardando(false)
    if (res.ok) { setExito(true); onCuentaActualizada() }
    else { const d = await res.json(); setError(d.error ?? "Error al guardar") }
  }

  async function darDeBaja() {
    const res = await fetch(`/api/cuentas/${cuenta.id}`, { method: "DELETE" })
    if (res.ok) { setConfirmandoBaja(false); onCuentaActualizada() }
  }

  return (
    <div className="space-y-4 max-w-lg">
      <div className="space-y-3">
        <div><Label>Nombre</Label><Input value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} /></div>
        <div><Label>Entidad / Banco</Label><Input value={form.bancoOEntidad} onChange={e => setForm(f => ({ ...f, bancoOEntidad: e.target.value }))} /></div>
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={form.tieneImpuestoDebcred} onChange={e => setForm(f => ({ ...f, tieneImpuestoDebcred: e.target.checked }))} />
            Impuesto débito/crédito
          </label>
          {form.tieneImpuestoDebcred && (
            <div><Label>Alícuota impuesto</Label><Input type="number" step="0.001" value={form.alicuotaImpuesto} onChange={e => setForm(f => ({ ...f, alicuotaImpuesto: e.target.value }))} /></div>
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
                checked={form[key as keyof typeof form] as boolean}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.checked }))}
              />
              {label}
            </label>
          ))}
        </div>
        {error && <FormError message={error} />}
        {exito && <p className="text-sm text-green-700">Guardado correctamente.</p>}
      </div>
      <div className="flex items-center justify-between pt-2">
        <Button onClick={guardar} disabled={guardando}>{guardando ? "Guardando..." : "Guardar cambios"}</Button>
        <Button variant="outline" onClick={() => setConfirmandoBaja(true)} className="text-destructive border-destructive hover:bg-destructive/5">
          Dar de baja cuenta
        </Button>
      </div>

      <Dialog open={confirmandoBaja} onOpenChange={setConfirmandoBaja}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Dar de baja la cuenta?</DialogTitle>
            <DialogDescription>
              La cuenta quedará inactiva. El historial se conserva. Esta acción no se puede deshacer fácilmente.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setConfirmandoBaja(false)}>Cancelar</Button>
            <Button variant="outline" onClick={darDeBaja} className="text-destructive border-destructive">Confirmar baja</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// --- Componente principal ---

/**
 * CuentasClient: CuentasClientProps -> JSX.Element
 *
 * Dado [los parámetros iniciales de cuenta, tab y flag de admin], renderiza la lista de cuentas
 * y el detalle con tabs: Movimientos (CRUD inline), Resúmenes Bancarios, Cheques Recibidos,
 * Cheques Emitidos, Planillas Galicia, FCI Propios, Tarjetas Prepagas, Configuración.
 *
 * Ejemplos:
 * <CuentasClient /> // lista de cuentas vacía + placeholder de selección
 * <CuentasClient cuentaInicialId="xxx" esAdmin /> // cuenta pre-seleccionada con botones de admin
 * <CuentasClient cuentaInicialId="xxx" tabInicial="resumenes-bancarios" /> // tab pre-seleccionado
 */
export function CuentasClient({ cuentaInicialId, tabInicial, esAdmin = false }: CuentasClientProps) {
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
    router.push(`/contabilidad/cuentas?cuenta=${id}`, { scroll: false })
  }

  function seleccionarTab(tab: TabId) {
    setTabActivo(tab)
    if (cuentaSeleccionada) {
      router.push(`/contabilidad/cuentas?cuenta=${cuentaSeleccionada}&tab=${tab}`, { scroll: false })
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
      { id: "resumenes-bancarios", label: "Resúmenes" },
      { id: "broker-pendiente", label: "Broker Pendiente" },
    ]
    if (c.tienePlanillaEmisionMasiva) tabs.push({ id: "planillas-galicia", label: "Planillas Galicia" })
    if (c.tieneCuentaRemunerada) tabs.push({ id: "fci", label: "FCI Propios" })
    if (c.tieneTarjetasPrepagasChoferes) tabs.push({ id: "tarjetas", label: "Tarjetas Prepagas" })
    tabs.push({ id: "configuracion", label: "Configuración" })
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
                {tabActivo === "movimientos" && <TabMovimientos cuenta={cuenta} esAdmin={esAdmin} />}
                {tabActivo === "resumenes-bancarios" && <TabResumenesBancarios cuenta={cuenta} />}
                {tabActivo === "broker-pendiente" && <TabBrokerPendiente cuenta={cuenta} />}
                {tabActivo === "planillas-galicia" && cuenta.tienePlanillaEmisionMasiva && <TabPlanillasGalicia cuenta={cuenta} />}
                {tabActivo === "fci" && cuenta.tieneCuentaRemunerada && <TabFCI cuenta={cuenta} />}
                {tabActivo === "tarjetas" && cuenta.tieneTarjetasPrepagasChoferes && <TabTarjetasPrepagas cuenta={cuenta} />}
                {tabActivo === "configuracion" && <TabConfiguracion cuenta={cuenta} onCuentaActualizada={cargarCuentas} />}
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
