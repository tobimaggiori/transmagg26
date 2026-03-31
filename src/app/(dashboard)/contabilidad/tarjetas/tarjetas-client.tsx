"use client"

/**
 * Propósito: Gestión unificada de tarjetas (corporativas + prepagas choferes).
 * Dos tabs: Corporativas (CREDITO/DEBITO empresa) y Prepagas choferes (PREPAGA).
 */

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { FormError } from "@/components/ui/form-error"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ViewPDF } from "@/components/view-pdf"
import { UploadPDF } from "@/components/upload-pdf"
import { formatearMoneda, formatearFecha } from "@/lib/utils"
import { Plus, CreditCard, X } from "lucide-react"

// --- Tipos ---

interface Tarjeta {
  id: string
  nombre: string
  tipo: string
  banco: string
  ultimos4: string
  titularTipo: string
  titularNombre: string
  cuentaId: string | null
  choferId: string | null
  limiteMensual: number | null
  activa: boolean
  cuenta: { id: string; nombre: string } | null
  chofer: { id: string; nombre: string; apellido: string } | null
  _count: { gastos: number; resumenes: number }
}

interface ResumenTarjeta {
  id: string
  tarjetaId: string
  periodo: string
  fechaVtoPago: string
  totalARS: number
  totalUSD: number | null
  s3Key: string | null
  pagado: boolean
  creadoEn: string
}

interface GastoTarjeta {
  id: string
  tarjetaId: string
  tipoGasto: string
  monto: number
  fecha: string
  descripcion: string | null
  comprobanteS3Key: string | null
  operador: { id: string; nombre: string; apellido: string }
}

interface Cuenta {
  id: string
  nombre: string
}

interface Chofer {
  id: string
  nombre: string
  apellido: string
}

interface TarjetasClientProps {
  tarjetasIniciales: Tarjeta[]
  cuentas: Cuenta[]
  choferes: Chofer[]
}

const TIPOS_GASTO = ["COMBUSTIBLE", "PEAJE", "COMIDA", "ALOJAMIENTO", "REPUESTO", "LAVADO", "OTRO"]

/**
 * TarjetasClient: TarjetasClientProps -> JSX.Element
 *
 * Dado las tarjetas iniciales, cuentas y choferes, renderiza el módulo de tarjetas
 * con dos tabs (Corporativas / Prepagas choferes) y gestión de resúmenes y gastos.
 * Existe para centralizar la gestión de todas las tarjetas en un solo lugar.
 *
 * Ejemplos:
 * <TarjetasClient tarjetasIniciales={[]} cuentas={[]} choferes={[]} />
 * // => módulo vacío con botón Nueva Tarjeta
 */
export function TarjetasClient({ tarjetasIniciales, cuentas, choferes }: TarjetasClientProps) {
  const [tarjetas, setTarjetas] = useState<Tarjeta[]>(tarjetasIniciales)
  const [tabActivo, setTabActivo] = useState<"corporativas" | "prepagas">("corporativas")
  const [seleccionada, setSeleccionada] = useState<string | null>(null)
  const [modalNueva, setModalNueva] = useState(false)
  const [formNueva, setFormNueva] = useState({
    nombre: "", tipo: "CREDITO", banco: "", ultimos4: "",
    titularTipo: "EMPRESA", titularNombre: "", cuentaId: "", choferId: "",
    limiteMensual: "",
  })
  const [errorNueva, setErrorNueva] = useState("")
  const [guardandoNueva, setGuardandoNueva] = useState(false)

  const tarjetasFiltradas = tarjetas.filter((t) =>
    tabActivo === "corporativas"
      ? t.tipo !== "PREPAGA"
      : t.tipo === "PREPAGA"
  )

  const tarjetaDetalle = tarjetas.find((t) => t.id === seleccionada) ?? null

  async function recargarTarjetas() {
    const r = await fetch("/api/tarjetas")
    const d = await r.json()
    if (Array.isArray(d)) setTarjetas(d)
  }

  async function crearTarjeta() {
    setErrorNueva("")
    setGuardandoNueva(true)
    const body = {
      nombre: formNueva.nombre,
      tipo: formNueva.tipo,
      banco: formNueva.banco,
      ultimos4: formNueva.ultimos4,
      titularTipo: formNueva.titularTipo,
      titularNombre: formNueva.titularNombre,
      cuentaId: formNueva.cuentaId || null,
      choferId: formNueva.choferId || null,
      limiteMensual: formNueva.limiteMensual ? parseFloat(formNueva.limiteMensual) : null,
    }
    const res = await fetch("/api/tarjetas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    setGuardandoNueva(false)
    if (res.ok) {
      setModalNueva(false)
      setFormNueva({ nombre: "", tipo: "CREDITO", banco: "", ultimos4: "", titularTipo: "EMPRESA", titularNombre: "", cuentaId: "", choferId: "", limiteMensual: "" })
      await recargarTarjetas()
    } else {
      const d = await res.json()
      setErrorNueva(d.error ?? "Error al crear")
    }
  }

  async function darDeBaja(id: string) {
    if (!confirm("¿Dar de baja esta tarjeta?")) return
    await fetch(`/api/tarjetas/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activa: false }),
    })
    await recargarTarjetas()
    if (seleccionada === id) setSeleccionada(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Tarjetas</h2>
          <p className="text-muted-foreground">Corporativas y prepagas de choferes</p>
        </div>
        <Button onClick={() => setModalNueva(true)}>
          <Plus className="h-4 w-4 mr-1" /> Nueva tarjeta
        </Button>
      </div>

      {/* Tabs principales */}
      <div className="border-b flex gap-0">
        {([
          { id: "corporativas", label: "Corporativas" },
          { id: "prepagas", label: "Prepagas choferes" },
        ] as const).map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setTabActivo(tab.id); setSeleccionada(null) }}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tabActivo === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label} ({tarjetas.filter(t => tab.id === "corporativas" ? t.tipo !== "PREPAGA" : t.tipo === "PREPAGA").length})
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4 min-h-[600px]">
        {/* Lista de tarjetas */}
        <div className="col-span-1 border rounded p-2 space-y-1 overflow-auto">
          {tarjetasFiltradas.length === 0 && (
            <p className="text-muted-foreground text-sm p-2">Sin tarjetas.</p>
          )}
          {tarjetasFiltradas.map((t) => (
            <div
              key={t.id}
              onClick={() => setSeleccionada(t.id)}
              className={`p-3 rounded cursor-pointer hover:bg-muted/60 group ${
                seleccionada === t.id ? "bg-muted border border-primary/40" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-1">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <CreditCard className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <p className="font-medium text-sm truncate">{t.nombre}</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{t.banco} •••• {t.ultimos4}</p>
                  <p className="text-xs text-muted-foreground">{t.titularNombre}</p>
                  {t.limiteMensual && (
                    <p className="text-xs mt-0.5">Límite: {formatearMoneda(t.limiteMensual)}</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="text-xs bg-muted px-1.5 py-0.5 rounded">{t.tipo}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); darDeBaja(t.id) }}
                    className="opacity-0 group-hover:opacity-100 text-destructive hover:opacity-80 transition-opacity"
                    title="Dar de baja"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Panel de detalle */}
        <div className="col-span-2 border rounded overflow-hidden">
          {!tarjetaDetalle ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <p>Seleccioná una tarjeta para ver su detalle.</p>
            </div>
          ) : (
            <TarjetaDetalle tarjeta={tarjetaDetalle} onActualizar={recargarTarjetas} />
          )}
        </div>
      </div>

      {/* Modal nueva tarjeta */}
      <Dialog open={modalNueva} onOpenChange={setModalNueva}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva tarjeta</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-[65vh] overflow-auto">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Nombre / apodo</Label>
                <Input value={formNueva.nombre} onChange={(e) => setFormNueva(f => ({ ...f, nombre: e.target.value }))} placeholder="ej: Visa Corporativa" />
              </div>
              <div>
                <Label>Tipo</Label>
                <Select value={formNueva.tipo} onChange={(e) => setFormNueva(f => ({ ...f, tipo: e.target.value }))}>
                  <option value="CREDITO">CRÉDITO</option>
                  <option value="DEBITO">DÉBITO</option>
                  <option value="PREPAGA">PREPAGA</option>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Banco / emisor</Label>
                <Input value={formNueva.banco} onChange={(e) => setFormNueva(f => ({ ...f, banco: e.target.value }))} placeholder="ej: Galicia" />
              </div>
              <div>
                <Label>Últimos 4 dígitos</Label>
                <Input value={formNueva.ultimos4} maxLength={4} onChange={(e) => setFormNueva(f => ({ ...f, ultimos4: e.target.value }))} placeholder="1234" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Titular tipo</Label>
                <Select value={formNueva.titularTipo} onChange={(e) => setFormNueva(f => ({ ...f, titularTipo: e.target.value }))}>
                  <option value="EMPRESA">EMPRESA</option>
                  <option value="CHOFER">CHOFER</option>
                  <option value="EMPLEADO">EMPLEADO</option>
                </Select>
              </div>
              <div>
                <Label>Nombre del titular</Label>
                <Input value={formNueva.titularNombre} onChange={(e) => setFormNueva(f => ({ ...f, titularNombre: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>Cuenta bancaria asociada (opcional)</Label>
              <Select value={formNueva.cuentaId} onChange={(e) => setFormNueva(f => ({ ...f, cuentaId: e.target.value }))}>
                <option value="">— Sin cuenta —</option>
                {cuentas.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </Select>
            </div>
            {formNueva.tipo === "PREPAGA" && (
              <div>
                <Label>Chofer asignado</Label>
                <Select value={formNueva.choferId} onChange={(e) => setFormNueva(f => ({ ...f, choferId: e.target.value }))}>
                  <option value="">— Sin chofer —</option>
                  {choferes.map((c) => <option key={c.id} value={c.id}>{c.apellido}, {c.nombre}</option>)}
                </Select>
              </div>
            )}
            <div>
              <Label>Límite mensual (opcional)</Label>
              <Input type="number" value={formNueva.limiteMensual} onChange={(e) => setFormNueva(f => ({ ...f, limiteMensual: e.target.value }))} placeholder="0" />
            </div>
            {errorNueva && <FormError message={errorNueva} />}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setModalNueva(false)}>Cancelar</Button>
            <Button onClick={crearTarjeta} disabled={guardandoNueva}>
              {guardandoNueva ? "Guardando..." : "Crear tarjeta"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// --- Sub-componente: Detalle de tarjeta ---

function TarjetaDetalle({ tarjeta, onActualizar }: { tarjeta: Tarjeta; onActualizar: () => Promise<void> }) {
  const [tab, setTab] = useState<"resumenes" | "gastos">("resumenes")
  const [resumenes, setResumenes] = useState<ResumenTarjeta[] | null>(null)
  const [gastos, setGastos] = useState<GastoTarjeta[] | null>(null)
  const [cargandoResumenes, setCargandoResumenes] = useState(false)
  const [cargandoGastos, setCargandoGastos] = useState(false)
  const [modalResumen, setModalResumen] = useState(false)
  const [modalGasto, setModalGasto] = useState(false)
  const [formResumen, setFormResumen] = useState({
    periodo: new Date().toISOString().slice(0, 7),
    fechaVtoPago: "",
    totalARS: "",
    totalUSD: "",
    s3Key: "",
    pagado: false,
  })
  const [formGasto, setFormGasto] = useState({
    tipoGasto: "COMBUSTIBLE",
    monto: "",
    fecha: new Date().toISOString().slice(0, 10),
    descripcion: "",
    comprobanteS3Key: "",
  })
  const [error, setError] = useState("")
  const [guardando, setGuardando] = useState(false)

  async function cargarResumenes() {
    if (resumenes !== null) return
    setCargandoResumenes(true)
    const r = await fetch(`/api/tarjetas/${tarjeta.id}/resumenes`)
    const d = await r.json()
    setResumenes(Array.isArray(d) ? d : [])
    setCargandoResumenes(false)
  }

  async function cargarGastos() {
    if (gastos !== null) return
    setCargandoGastos(true)
    const r = await fetch(`/api/tarjetas/${tarjeta.id}/gastos`)
    const d = await r.json()
    setGastos(Array.isArray(d) ? d : [])
    setCargandoGastos(false)
  }

  async function recargarResumenes() {
    setCargandoResumenes(true)
    const r = await fetch(`/api/tarjetas/${tarjeta.id}/resumenes`)
    const d = await r.json()
    setResumenes(Array.isArray(d) ? d : [])
    setCargandoResumenes(false)
  }

  async function recargarGastos() {
    setCargandoGastos(true)
    const r = await fetch(`/api/tarjetas/${tarjeta.id}/gastos`)
    const d = await r.json()
    setGastos(Array.isArray(d) ? d : [])
    setCargandoGastos(false)
  }

  function abrirTab(t: "resumenes" | "gastos") {
    setTab(t)
    if (t === "resumenes") cargarResumenes()
    else cargarGastos()
  }

  // Cargar tab inicial
  useEffect(() => { cargarResumenes() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function crearResumen() {
    setError("")
    setGuardando(true)
    const res = await fetch(`/api/tarjetas/${tarjeta.id}/resumenes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        periodo: formResumen.periodo,
        fechaVtoPago: new Date(formResumen.fechaVtoPago + "T12:00:00Z").toISOString(),
        totalARS: parseFloat(formResumen.totalARS),
        totalUSD: formResumen.totalUSD ? parseFloat(formResumen.totalUSD) : null,
        s3Key: formResumen.s3Key || null,
        pagado: formResumen.pagado,
      }),
    })
    setGuardando(false)
    if (res.ok) {
      setModalResumen(false)
      setFormResumen({ periodo: new Date().toISOString().slice(0, 7), fechaVtoPago: "", totalARS: "", totalUSD: "", s3Key: "", pagado: false })
      await recargarResumenes()
      await onActualizar()
    } else {
      const d = await res.json()
      setError(d.error ?? "Error al crear resumen")
    }
  }

  async function marcarResumenPagado(resumenId: string, pagado: boolean) {
    await fetch(`/api/tarjetas/${tarjeta.id}/resumenes/${resumenId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pagado }),
    })
    await recargarResumenes()
  }

  async function crearGasto() {
    setError("")
    setGuardando(true)
    const res = await fetch(`/api/tarjetas/${tarjeta.id}/gastos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tipoGasto: formGasto.tipoGasto,
        monto: parseFloat(formGasto.monto),
        fecha: new Date(formGasto.fecha + "T12:00:00Z").toISOString(),
        descripcion: formGasto.descripcion || null,
        comprobanteS3Key: formGasto.comprobanteS3Key || null,
      }),
    })
    setGuardando(false)
    if (res.ok) {
      setModalGasto(false)
      setFormGasto({ tipoGasto: "COMBUSTIBLE", monto: "", fecha: new Date().toISOString().slice(0, 10), descripcion: "", comprobanteS3Key: "" })
      await recargarGastos()
    } else {
      const d = await res.json()
      setError(d.error ?? "Error al registrar gasto")
    }
  }

  async function eliminarGasto(gastoId: string) {
    if (!confirm("¿Eliminar este gasto?")) return
    await fetch(`/api/tarjetas/${tarjeta.id}/gastos/${gastoId}`, { method: "DELETE" })
    await recargarGastos()
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b px-4 py-3 bg-muted/20">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">{tarjeta.nombre}</h3>
            <p className="text-sm text-muted-foreground">
              {tarjeta.banco} •••• {tarjeta.ultimos4} — {tarjeta.tipo} — {tarjeta.titularNombre}
            </p>
            {tarjeta.cuenta && (
              <p className="text-xs text-muted-foreground mt-0.5">Cuenta: {tarjeta.cuenta.nombre}</p>
            )}
            {tarjeta.chofer && (
              <p className="text-xs text-muted-foreground mt-0.5">
                Chofer: {tarjeta.chofer.apellido}, {tarjeta.chofer.nombre}
              </p>
            )}
          </div>
          {tarjeta.limiteMensual && (
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Límite mensual</p>
              <p className="text-lg font-bold">{formatearMoneda(tarjeta.limiteMensual)}</p>
            </div>
          )}
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="border-b flex gap-0 px-2">
        {([
          { id: "resumenes", label: "Resúmenes" },
          { id: "gastos", label: "Gastos" },
        ] as const).map((t) => (
          <button
            key={t.id}
            onClick={() => abrirTab(t.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Contenido */}
      <div className="flex-1 overflow-auto p-4">
        {tab === "resumenes" && (
          <div className="space-y-3">
            <div className="flex justify-end">
              <Button size="sm" onClick={() => setModalResumen(true)}>
                <Plus className="h-4 w-4 mr-1" /> Cargar resumen
              </Button>
            </div>
            {cargandoResumenes ? (
              <p className="text-muted-foreground text-sm">Cargando...</p>
            ) : (
              <div className="border rounded overflow-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left px-3 py-2">Período</th>
                      <th className="text-right px-3 py-2">Total ARS</th>
                      <th className="text-right px-3 py-2">Total USD</th>
                      <th className="text-right px-3 py-2">Vto. Pago</th>
                      <th className="text-center px-3 py-2">PDF</th>
                      <th className="text-center px-3 py-2">Pagado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(resumenes ?? []).map((r) => (
                      <tr key={r.id} className="border-t">
                        <td className="px-3 py-2 font-medium">{r.periodo}</td>
                        <td className="px-3 py-2 text-right">{formatearMoneda(r.totalARS)}</td>
                        <td className="px-3 py-2 text-right">{r.totalUSD != null ? `USD ${r.totalUSD.toFixed(2)}` : "-"}</td>
                        <td className="px-3 py-2 text-right">{formatearFecha(r.fechaVtoPago)}</td>
                        <td className="px-3 py-2 text-center">
                          <ViewPDF s3Key={r.s3Key} size="sm" />
                        </td>
                        <td className="px-3 py-2 text-center">
                          <input
                            type="checkbox"
                            checked={r.pagado}
                            onChange={(e) => marcarResumenPagado(r.id, e.target.checked)}
                            className="cursor-pointer"
                          />
                        </td>
                      </tr>
                    ))}
                    {(resumenes ?? []).length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-3 py-4 text-center text-muted-foreground">Sin resúmenes cargados.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {tab === "gastos" && (
          <div className="space-y-3">
            <div className="flex justify-end">
              <Button size="sm" onClick={() => setModalGasto(true)}>
                <Plus className="h-4 w-4 mr-1" /> Registrar gasto
              </Button>
            </div>
            {cargandoGastos ? (
              <p className="text-muted-foreground text-sm">Cargando...</p>
            ) : (
              <div className="border rounded overflow-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left px-3 py-2">Fecha</th>
                      <th className="text-left px-3 py-2">Tipo</th>
                      <th className="text-right px-3 py-2">Monto</th>
                      <th className="text-left px-3 py-2">Descripción</th>
                      <th className="text-center px-3 py-2">Comprobante</th>
                      <th className="text-left px-3 py-2">Operador</th>
                      <th className="px-3 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {(gastos ?? []).map((g) => (
                      <tr key={g.id} className="border-t">
                        <td className="px-3 py-2 whitespace-nowrap">{formatearFecha(g.fecha)}</td>
                        <td className="px-3 py-2">{g.tipoGasto}</td>
                        <td className="px-3 py-2 text-right">{formatearMoneda(g.monto)}</td>
                        <td className="px-3 py-2 text-muted-foreground">{g.descripcion ?? "-"}</td>
                        <td className="px-3 py-2 text-center">
                          <ViewPDF s3Key={g.comprobanteS3Key} size="sm" label="Ver" />
                        </td>
                        <td className="px-3 py-2 text-xs text-muted-foreground">
                          {g.operador.apellido}, {g.operador.nombre}
                        </td>
                        <td className="px-3 py-2">
                          <button
                            onClick={() => eliminarGasto(g.id)}
                            className="text-destructive hover:opacity-70 text-xs"
                          >
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    ))}
                    {(gastos ?? []).length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-3 py-4 text-center text-muted-foreground">Sin gastos registrados.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal nuevo resumen */}
      <Dialog open={modalResumen} onOpenChange={setModalResumen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cargar resumen mensual</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Período (YYYY-MM)</Label>
                <Input
                  type="month"
                  value={formResumen.periodo}
                  onChange={(e) => setFormResumen(f => ({ ...f, periodo: e.target.value }))}
                />
              </div>
              <div>
                <Label>Vencimiento de pago</Label>
                <Input
                  type="date"
                  value={formResumen.fechaVtoPago}
                  onChange={(e) => setFormResumen(f => ({ ...f, fechaVtoPago: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Total ARS</Label>
                <Input type="number" value={formResumen.totalARS} onChange={(e) => setFormResumen(f => ({ ...f, totalARS: e.target.value }))} />
              </div>
              <div>
                <Label>Total USD (opcional)</Label>
                <Input type="number" value={formResumen.totalUSD} onChange={(e) => setFormResumen(f => ({ ...f, totalUSD: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>PDF del resumen</Label>
              <UploadPDF
                prefijo="resumenes-tarjeta"
                onUpload={(key) => setFormResumen(f => ({ ...f, s3Key: key }))}
                s3Key={formResumen.s3Key || undefined}
              />
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={formResumen.pagado}
                onChange={(e) => setFormResumen(f => ({ ...f, pagado: e.target.checked }))}
              />
              Marcar como pagado
            </label>
            {error && <FormError message={error} />}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setModalResumen(false)}>Cancelar</Button>
            <Button onClick={crearResumen} disabled={guardando || !formResumen.periodo || !formResumen.fechaVtoPago || !formResumen.totalARS}>
              {guardando ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal nuevo gasto */}
      <Dialog open={modalGasto} onOpenChange={setModalGasto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar gasto</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Tipo de gasto</Label>
                <Select value={formGasto.tipoGasto} onChange={(e) => setFormGasto(f => ({ ...f, tipoGasto: e.target.value }))}>
                  {TIPOS_GASTO.map((t) => <option key={t} value={t}>{t}</option>)}
                </Select>
              </div>
              <div>
                <Label>Fecha</Label>
                <Input type="date" value={formGasto.fecha} onChange={(e) => setFormGasto(f => ({ ...f, fecha: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>Monto</Label>
              <Input type="number" value={formGasto.monto} onChange={(e) => setFormGasto(f => ({ ...f, monto: e.target.value }))} />
            </div>
            <div>
              <Label>Descripción (opcional)</Label>
              <Input value={formGasto.descripcion} onChange={(e) => setFormGasto(f => ({ ...f, descripcion: e.target.value }))} />
            </div>
            <div>
              <Label>Comprobante (PDF, opcional)</Label>
              <UploadPDF
                prefijo="resumenes-tarjeta"
                onUpload={(key) => setFormGasto(f => ({ ...f, comprobanteS3Key: key }))}
                s3Key={formGasto.comprobanteS3Key || undefined}
              />
            </div>
            {error && <FormError message={error} />}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setModalGasto(false)}>Cancelar</Button>
            <Button onClick={crearGasto} disabled={guardando || !formGasto.monto}>
              {guardando ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

