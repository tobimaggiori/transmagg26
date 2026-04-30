"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { formatearMoneda, parsearImporte } from "@/lib/money"
import { Lock, Unlock, CheckCircle2, Circle, Plus, Trash2 } from "lucide-react"

type Referencia = {
  tipo:
    | "CHEQUE_EMITIDO"
    | "CHEQUE_RECIBIDO"
    | "PAGO_A_FLETERO"
    | "PAGO_PROVEEDOR"
    | "PAGO_DE_EMPRESA"
    | "PAGO_IMPUESTO"
    | "MOVIMIENTO_FCI"
    | "INFRACCION"
    | "MANUAL"
  id: string | null
}

type Movimiento = {
  id: string
  cuentaId: string
  fecha: string
  orden: number
  tipo: "INGRESO" | "EGRESO"
  categoria: string
  monto: number
  descripcion: string
  esManual: boolean
  saldoCorrido: number
  referencia: Referencia
  conciliado: boolean
}

type EstadoMes = "SIN_MOVIMIENTOS" | "PENDIENTE" | "EN_CURSO" | "LISTO_PARA_CERRAR" | "CERRADO"

type LibroResp = {
  cuenta: { id: string; nombre: string; moneda: string; saldoInicial: number }
  movimientos: Movimiento[]
  saldoActual: number
  estadoMes: EstadoMes | null
}

type ResumenCuenta = {
  saldoContable: number
  saldoDisponible: number
  detalleFci: Array<{ id: string; nombre: string; saldoInformadoActual: number }>
  nombreCuenta: string
}

type ImpuestosCuenta = {
  debcred: { alicuota: number } | null
  iibbSircreb: { alicuota: number } | null
}

type Props = {
  cuentaId: string
  saldoInicial: number
  fechaSaldoInicial: string | null
  impuestos: ImpuestosCuenta
}

function mesAnioActual() {
  const now = new Date()
  return { mes: now.getUTCMonth() + 1, anio: now.getUTCFullYear() }
}

function primerDiaMes(mes: number, anio: number): string {
  return `${anio}-${String(mes).padStart(2, "0")}-01`
}

function ultimoDiaMes(mes: number, anio: number): string {
  const d = new Date(Date.UTC(anio, mes, 0))
  return d.toISOString().slice(0, 10)
}

function formatearFechaLarga(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString("es-AR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  })
}

function etiquetaReferencia(r: Referencia): string {
  switch (r.tipo) {
    case "CHEQUE_EMITIDO":
      return "Cheque emitido"
    case "CHEQUE_RECIBIDO":
      return "Cheque recibido"
    case "PAGO_A_FLETERO":
      return "Pago a fletero"
    case "PAGO_PROVEEDOR":
      return "Pago a proveedor"
    case "PAGO_DE_EMPRESA":
      return "Cobro de empresa"
    case "PAGO_IMPUESTO":
      return "Pago de impuesto"
    case "MOVIMIENTO_FCI":
      return "Movimiento FCI"
    case "INFRACCION":
      return "Infracción"
    default:
      return "Manual"
  }
}

export function LibroCuentaDetalle({ cuentaId, saldoInicial, fechaSaldoInicial, impuestos }: Props) {
  const { mes: mesActual, anio: anioActual } = mesAnioActual()
  const [mes, setMes] = useState(mesActual)
  const [anio, setAnio] = useState(anioActual)
  const [data, setData] = useState<LibroResp | null>(null)
  const [resumenCuenta, setResumenCuenta] = useState<ResumenCuenta | null>(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [filtroTipo, setFiltroTipo] = useState<"" | "INGRESO" | "EGRESO">("")
  const [soloNoConciliados, setSoloNoConciliados] = useState(false)

  const cargar = useCallback(async () => {
    setLoading(true)
    setErr(null)
    try {
      const params = new URLSearchParams({
        desde: primerDiaMes(mes, anio),
        hasta: ultimoDiaMes(mes, anio),
        mes: String(mes),
        anio: String(anio),
      })
      if (filtroTipo) params.set("tipo", filtroTipo)
      if (soloNoConciliados) params.set("soloNoConciliados", "true")
      const [rLibro, rCuenta] = await Promise.all([
        fetch(`/api/cuentas/${cuentaId}/movimientos?${params.toString()}`),
        fetch(`/api/cuentas/${cuentaId}`),
      ])
      if (!rLibro.ok) throw new Error((await rLibro.json()).error ?? "Error cargando libro")
      const json = (await rLibro.json()) as LibroResp
      setData(json)
      if (rCuenta.ok) {
        const c = (await rCuenta.json()) as {
          nombre: string
          saldoContable: number
          saldoDisponible: number
          detalleFci?: Array<{ id: string; nombre: string; saldoInformadoActual: number }>
        }
        setResumenCuenta({
          saldoContable: c.saldoContable,
          saldoDisponible: c.saldoDisponible,
          detalleFci: c.detalleFci ?? [],
          nombreCuenta: c.nombre,
        })
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error desconocido")
    } finally {
      setLoading(false)
    }
  }, [cuentaId, mes, anio, filtroTipo, soloNoConciliados])

  useEffect(() => {
    cargar()
  }, [cargar])

  // Agrupar movimientos por día (ISO date)
  const porDia = useMemo(() => {
    const map = new Map<string, { movs: Movimiento[]; conciliado: boolean; saldoFinalDia: number }>()
    if (!data) return map
    for (const m of data.movimientos) {
      const key = m.fecha.slice(0, 10)
      const entry = map.get(key) ?? { movs: [], conciliado: m.conciliado, saldoFinalDia: 0 }
      entry.movs.push(m)
      entry.conciliado = m.conciliado
      entry.saldoFinalDia = m.saldoCorrido
      map.set(key, entry)
    }
    return map
  }, [data])

  const diasOrdenados = useMemo(() => Array.from(porDia.keys()).sort(), [porDia])

  return (
    <div className="space-y-4">
      {/* Header: saldo + estado del mes */}
      <HeaderLibro
        saldoActual={data?.saldoActual}
        saldoInicial={saldoInicial}
        fechaSaldoInicial={fechaSaldoInicial}
        estadoMes={data?.estadoMes}
        mes={mes}
        anio={anio}
        onReload={cargar}
        cuentaId={cuentaId}
        resumen={resumenCuenta}
      />

      {/* Filtros */}
      <div className="flex flex-wrap items-end gap-3 border rounded-md p-3">
        <div>
          <Label htmlFor="mes">Mes</Label>
          <select
            id="mes"
            value={mes}
            onChange={(e) => setMes(parseInt(e.target.value, 10))}
            className="h-9 rounded-md border border-input bg-background px-2 text-sm"
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {new Date(2000, i, 1).toLocaleDateString("es-AR", { month: "long" })}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="anio">Año</Label>
          <Input
            id="anio"
            type="number"
            value={anio}
            onChange={(e) => setAnio(parseInt(e.target.value, 10) || anioActual)}
            className="w-24"
          />
        </div>
        <div>
          <Label htmlFor="tipo">Tipo</Label>
          <select
            id="tipo"
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value as "" | "INGRESO" | "EGRESO")}
            className="h-9 rounded-md border border-input bg-background px-2 text-sm"
          >
            <option value="">Todos</option>
            <option value="INGRESO">Ingresos</option>
            <option value="EGRESO">Egresos</option>
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm mb-2">
          <input
            type="checkbox"
            checked={soloNoConciliados}
            onChange={(e) => setSoloNoConciliados(e.target.checked)}
          />
          Solo días no conciliados
        </label>
        <div className="ml-auto">
          <NuevoManualForm cuentaId={cuentaId} impuestos={impuestos} onCreado={cargar} />
        </div>
      </div>

      {err && <div className="text-sm text-destructive">{err}</div>}
      {loading && <div className="text-sm text-muted-foreground">Cargando libro...</div>}

      {!loading && diasOrdenados.length === 0 && (
        <div className="text-sm text-muted-foreground py-6 text-center border rounded-md">
          No hay movimientos en el período seleccionado.
        </div>
      )}

      {/* Bloques por día */}
      <div className="space-y-3">
        {diasOrdenados.map((fechaIso) => {
          const entry = porDia.get(fechaIso)!
          return (
            <DiaBloque
              key={fechaIso}
              cuentaId={cuentaId}
              fechaIso={fechaIso}
              movimientos={entry.movs}
              conciliado={entry.conciliado}
              saldoFinalDia={entry.saldoFinalDia}
              onCambio={cargar}
            />
          )
        })}
      </div>
    </div>
  )
}

// ─── Header ─────────────────────────────────────────────────────────────────

function HeaderLibro({
  saldoActual,
  saldoInicial,
  fechaSaldoInicial,
  estadoMes,
  mes,
  anio,
  onReload,
  cuentaId,
  resumen,
}: {
  saldoActual?: number
  saldoInicial: number
  fechaSaldoInicial: string | null
  estadoMes: EstadoMes | null | undefined
  mes: number
  anio: number
  onReload: () => void
  cuentaId: string
  resumen: ResumenCuenta | null
}) {
  // Si tenemos resumen (con FCIs y saldo disponible), desglosamos como en el
  // dashboard: saldo líquido en cuenta + FCIs + total. Si no llegó, fallback
  // al saldoActual simple.
  const saldoLiquido = resumen?.saldoDisponible
  const fcis = resumen?.detalleFci ?? []
  const saldoTotal = resumen?.saldoContable ?? saldoActual
  const tieneFcis = fcis.length > 0

  return (
    <div className="flex flex-wrap items-start gap-4 border rounded-md p-4 bg-accent/30">
      <div className="min-w-[260px] space-y-1">
        {resumen && tieneFcis ? (
          <>
            {/* 1. Saldo en cuenta (líquido) */}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Saldo en cuenta</span>
              <span className={`font-medium ${saldoLiquido != null && saldoLiquido < 0 ? "text-destructive" : ""}`}>
                {saldoLiquido != null ? formatearMoneda(saldoLiquido) : "—"}
              </span>
            </div>
            {/* 2. FCIs */}
            <div className="border-t pt-1 space-y-0.5">
              {fcis.map((fci) => (
                <div key={fci.id} className="flex justify-between text-sm">
                  <span className="text-muted-foreground truncate">{fci.nombre}</span>
                  <span className="font-medium text-blue-600">{formatearMoneda(fci.saldoInformadoActual)}</span>
                </div>
              ))}
            </div>
            {/* 3. Total en la cuenta */}
            <div className="flex justify-between text-sm border-t pt-1">
              <span className="font-semibold">Total en {resumen.nombreCuenta}</span>
              <span className={`font-bold text-lg ${saldoTotal != null && saldoTotal < 0 ? "text-destructive" : ""}`}>
                {saldoTotal != null ? formatearMoneda(saldoTotal) : "—"}
              </span>
            </div>
          </>
        ) : (
          <>
            <div className="text-xs uppercase text-muted-foreground">Saldo en cuenta</div>
            <div className="text-2xl font-bold">
              {saldoTotal !== undefined ? formatearMoneda(saldoTotal) : "—"}
            </div>
          </>
        )}
      </div>
      <div className="text-sm text-muted-foreground">
        Saldo inicial: <strong>{formatearMoneda(saldoInicial)}</strong>
        {fechaSaldoInicial ? (
          <> al {new Date(fechaSaldoInicial).toLocaleDateString("es-AR", { timeZone: "UTC" })}</>
        ) : (
          <span className="text-amber-700"> · sin fecha cargada</span>
        )}
      </div>
      <div className="ml-auto flex items-center gap-2">
        <EstadoMesBadge estado={estadoMes ?? null} />
        {estadoMes === "LISTO_PARA_CERRAR" && (
          <CerrarMesBoton cuentaId={cuentaId} mes={mes} anio={anio} onDone={onReload} />
        )}
        {estadoMes === "CERRADO" && (
          <ReabrirMesBoton cuentaId={cuentaId} mes={mes} anio={anio} onDone={onReload} />
        )}
      </div>
    </div>
  )
}

function EstadoMesBadge({ estado }: { estado: EstadoMes | null }) {
  if (!estado) return null
  const map: Record<EstadoMes, { label: string; cls: string }> = {
    SIN_MOVIMIENTOS: { label: "Sin movimientos", cls: "bg-muted text-muted-foreground" },
    PENDIENTE: { label: "Sin conciliar", cls: "bg-blue-100 text-blue-800" },
    EN_CURSO: { label: "En curso", cls: "bg-amber-100 text-amber-800" },
    LISTO_PARA_CERRAR: { label: "Listo para cerrar", cls: "bg-emerald-100 text-emerald-800" },
    CERRADO: { label: "Mes cerrado", cls: "bg-zinc-200 text-zinc-800" },
  }
  const m = map[estado]
  return <span className={`rounded-full px-3 py-1 text-xs font-medium ${m.cls}`}>{m.label}</span>
}

// ─── Bloque por día ──────────────────────────────────────────────────────────

function DiaBloque({
  cuentaId,
  fechaIso,
  movimientos,
  conciliado,
  saldoFinalDia,
  onCambio,
}: {
  cuentaId: string
  fechaIso: string
  movimientos: Movimiento[]
  conciliado: boolean
  saldoFinalDia: number
  onCambio: () => void
}) {
  const [saldoExtracto, setSaldoExtracto] = useState<string>("")
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const sellar = async () => {
    if (saldoExtracto.trim() === "") {
      setErr("Ingresá un saldo válido.")
      return
    }
    const monto = parsearImporte(saldoExtracto)
    setBusy(true)
    setErr(null)
    try {
      const r = await fetch(`/api/cuentas/${cuentaId}/conciliacion/dia`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fecha: fechaIso, saldoExtracto: monto }),
      })
      if (!r.ok) throw new Error((await r.json()).error ?? "Error al sellar")
      setSaldoExtracto("")
      onCambio()
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error desconocido")
    } finally {
      setBusy(false)
    }
  }

  const desellar = async () => {
    if (!confirm("¿Desconciliar este día?")) return
    setBusy(true)
    setErr(null)
    try {
      const r = await fetch(
        `/api/cuentas/${cuentaId}/conciliacion/dia?fecha=${fechaIso}`,
        { method: "DELETE" }
      )
      if (!r.ok) throw new Error((await r.json()).error ?? "Error al desconciliar")
      onCambio()
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error desconocido")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={`border rounded-md ${conciliado ? "border-emerald-300 bg-emerald-50/30" : ""}`}>
      <div className="flex flex-wrap items-center gap-3 px-4 py-2 border-b bg-muted/30">
        <div className="flex items-center gap-2 font-semibold">
          {conciliado ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-700" />
          ) : (
            <Circle className="h-4 w-4 text-muted-foreground" />
          )}
          {formatearFechaLarga(fechaIso)}
        </div>
        <div className="text-sm text-muted-foreground">
          Saldo fin de día: <strong>{formatearMoneda(saldoFinalDia)}</strong>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {conciliado ? (
            <Button size="sm" variant="outline" disabled={busy} onClick={desellar}>
              <Unlock className="h-3 w-3 mr-1" /> Desconciliar
            </Button>
          ) : (
            <>
              <Input
                type="number"
                step="0.01"
                placeholder="Saldo extracto"
                value={saldoExtracto}
                onChange={(e) => setSaldoExtracto(e.target.value)}
                className="w-40 h-8"
              />
              <Button size="sm" disabled={busy} onClick={sellar}>
                <Lock className="h-3 w-3 mr-1" /> Conciliar día
              </Button>
            </>
          )}
        </div>
      </div>
      {err && <div className="px-4 py-2 text-sm text-destructive">{err}</div>}
      <table className="w-full text-sm">
        <thead className="text-xs uppercase text-muted-foreground">
          <tr className="border-b">
            <th className="text-left px-4 py-2 w-16">Orden</th>
            <th className="text-left px-4 py-2">Descripción</th>
            <th className="text-left px-4 py-2">Origen</th>
            <th className="text-left px-4 py-2">Categoría</th>
            <th className="text-right px-4 py-2">Monto</th>
            <th className="text-right px-4 py-2">Saldo</th>
            <th className="w-12"></th>
          </tr>
        </thead>
        <tbody>
          {movimientos.map((m) => (
            <FilaMov key={m.id} mov={m} cuentaId={cuentaId} onCambio={onCambio} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function FilaMov({
  mov,
  cuentaId,
  onCambio,
}: {
  mov: Movimiento
  cuentaId: string
  onCambio: () => void
}) {
  const borrar = async () => {
    if (!confirm("¿Borrar este movimiento manual?")) return
    const r = await fetch(`/api/cuentas/${cuentaId}/movimientos/${mov.id}`, { method: "DELETE" })
    if (!r.ok) {
      alert((await r.json()).error ?? "Error al borrar")
      return
    }
    onCambio()
  }
  return (
    <tr className="border-b hover:bg-accent/30">
      <td className="px-4 py-2 text-xs text-muted-foreground">{mov.orden}</td>
      <td className="px-4 py-2">{mov.descripcion}</td>
      <td className="px-4 py-2 text-xs">{etiquetaReferencia(mov.referencia)}</td>
      <td className="px-4 py-2 text-xs text-muted-foreground">{mov.categoria}</td>
      <td
        className={`px-4 py-2 text-right tabular-nums ${mov.tipo === "INGRESO" ? "text-emerald-700" : "text-red-700"}`}
      >
        {mov.tipo === "INGRESO" ? "+" : "−"}
        {formatearMoneda(mov.monto)}
      </td>
      <td className="px-4 py-2 text-right tabular-nums font-medium">
        {formatearMoneda(mov.saldoCorrido)}
      </td>
      <td className="px-4 py-2">
        {mov.esManual && !mov.conciliado && (
          <Button size="icon" variant="ghost" onClick={borrar} aria-label="Borrar">
            <Trash2 className="h-3 w-3" />
          </Button>
        )}
      </td>
    </tr>
  )
}

// ─── Cerrar / reabrir mes ────────────────────────────────────────────────────

function CerrarMesBoton({
  cuentaId,
  mes,
  anio,
  onDone,
}: {
  cuentaId: string
  mes: number
  anio: number
  onDone: () => void
}) {
  const [busy, setBusy] = useState(false)
  const cerrar = async () => {
    if (!confirm("¿Cerrar el mes? Quedará bloqueado hasta reabrirlo.")) return
    setBusy(true)
    try {
      const r = await fetch(`/api/cuentas/${cuentaId}/conciliacion/cierre`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mes, anio }),
      })
      if (!r.ok) {
        alert((await r.json()).error ?? "Error al cerrar mes")
        return
      }
      onDone()
    } finally {
      setBusy(false)
    }
  }
  return (
    <Button size="sm" disabled={busy} onClick={cerrar}>
      <Lock className="h-3 w-3 mr-1" /> Cerrar mes
    </Button>
  )
}

function ReabrirMesBoton({
  cuentaId,
  mes,
  anio,
  onDone,
}: {
  cuentaId: string
  mes: number
  anio: number
  onDone: () => void
}) {
  const [busy, setBusy] = useState(false)
  const reabrir = async () => {
    if (!confirm("¿Reabrir el mes? Bloqueará reportes que requieran el mes cerrado.")) return
    setBusy(true)
    try {
      const r = await fetch(
        `/api/cuentas/${cuentaId}/conciliacion/cierre?mes=${mes}&anio=${anio}`,
        { method: "DELETE" }
      )
      if (!r.ok) {
        alert((await r.json()).error ?? "Error al reabrir")
        return
      }
      onDone()
    } finally {
      setBusy(false)
    }
  }
  return (
    <Button size="sm" variant="outline" disabled={busy} onClick={reabrir}>
      <Unlock className="h-3 w-3 mr-1" /> Reabrir mes
    </Button>
  )
}

// ─── Nuevo movimiento manual ─────────────────────────────────────────────────

function NuevoManualForm({
  cuentaId,
  impuestos,
  onCreado,
}: {
  cuentaId: string
  impuestos: ImpuestosCuenta
  onCreado: () => void
}) {
  const [open, setOpen] = useState(false)
  const [tipo, setTipo] = useState<"INGRESO" | "EGRESO">("EGRESO")
  const [categoria, setCategoria] = useState("AJUSTE_MANUAL")
  const [monto, setMonto] = useState("")
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10))
  const [descripcion, setDescripcion] = useState("")
  const [aplicarDebcred, setAplicarDebcred] = useState(false)
  const [aplicarIibb, setAplicarIibb] = useState(false)
  const [busy, setBusy] = useState(false)

  if (!open) {
    return (
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        <Plus className="h-3 w-3 mr-1" /> Movimiento manual
      </Button>
    )
  }

  const enviar = async () => {
    const montoNum = parsearImporte(monto)
    if (montoNum <= 0) {
      alert("Monto inválido")
      return
    }
    if (!descripcion.trim()) {
      alert("Descripción obligatoria")
      return
    }
    setBusy(true)
    try {
      const r = await fetch(`/api/cuentas/${cuentaId}/movimientos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo,
          categoria,
          monto: montoNum,
          fecha,
          descripcion,
          aplicarImpuestoDebcred: aplicarDebcred,
          aplicarIibbSircreb: aplicarIibb,
        }),
      })
      if (!r.ok) {
        alert((await r.json()).error ?? "Error al crear movimiento")
        return
      }
      setOpen(false)
      setMonto("")
      setDescripcion("")
      setAplicarDebcred(false)
      setAplicarIibb(false)
      onCreado()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="absolute right-6 z-10 mt-2 border rounded-md bg-background shadow-md p-4 w-80 space-y-2">
      <div className="flex items-center gap-2">
        <select
          value={tipo}
          onChange={(e) => setTipo(e.target.value as "INGRESO" | "EGRESO")}
          className="h-9 rounded-md border border-input bg-background px-2 text-sm flex-1"
        >
          <option value="EGRESO">Egreso</option>
          <option value="INGRESO">Ingreso</option>
        </select>
        <Input
          type="number"
          step="0.01"
          placeholder="Monto"
          value={monto}
          onChange={(e) => setMonto(e.target.value)}
          className="w-32"
        />
      </div>
      <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
      <select
        value={categoria}
        onChange={(e) => setCategoria(e.target.value)}
        className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
      >
        <option value="AJUSTE_MANUAL">Ajuste manual</option>
        <option value="MANTENIMIENTO_CUENTA">Mantenimiento / comisión</option>
        <option value="INTERES_CUENTA_REMUNERADA">Interés</option>
        <option value="TRANSFERENCIA_ENVIADA">Transferencia enviada</option>
        <option value="TRANSFERENCIA_RECIBIDA">Transferencia recibida</option>
        <option value="PAGO_SUELDO">Pago sueldo</option>
        <option value="PAGO_SERVICIO">Pago servicio</option>
        <option value="OTRO">Otro</option>
      </select>
      <Input
        placeholder="Descripción"
        value={descripcion}
        onChange={(e) => setDescripcion(e.target.value)}
      />
      {(impuestos.debcred || impuestos.iibbSircreb) && (
        <div className="space-y-1 pt-1 border-t">
          {impuestos.debcred && (
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={aplicarDebcred}
                onChange={(e) => setAplicarDebcred(e.target.checked)}
              />
              Generar impuesto deb/cred ({(impuestos.debcred.alicuota * 100).toFixed(3)}%)
            </label>
          )}
          {impuestos.iibbSircreb && (
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={aplicarIibb}
                onChange={(e) => setAplicarIibb(e.target.checked)}
              />
              Generar IIBB SIRCREB Tucumán ({(impuestos.iibbSircreb.alicuota * 100).toFixed(3)}%)
            </label>
          )}
        </div>
      )}
      <div className="flex gap-2 justify-end">
        <Button size="sm" variant="outline" onClick={() => setOpen(false)} disabled={busy}>
          Cancelar
        </Button>
        <Button size="sm" onClick={enviar} disabled={busy}>
          Crear
        </Button>
      </div>
    </div>
  )
}

