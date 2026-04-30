"use client"

/**
 * Detalle de un FCI: saldo actual, movimientos desde la última conciliación,
 * y tres acciones:
 *   - Conciliar: nuevo saldo informado → calcula interés del período.
 *   - Suscribir: aporta $ desde una cuenta.
 *   - Rescatar: retira $ hacia una cuenta.
 *
 * Para FCIs de banco/billetera, la cuenta origen/destino queda fija a la
 * cuenta asociada al FCI. Para FCIs de broker, se permite elegir cualquier
 * cuenta activa.
 */

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { formatearMoneda, formatearFecha } from "@/lib/utils"
import { hoyLocalYmd } from "@/lib/date-local"

type CuentaOpt = { id: string; nombre: string; tipo: string; moneda: string }

type DetalleResp = {
  fci: {
    id: string
    nombre: string
    moneda: string
    activo: boolean
    saldoActual: number
    saldoActualizadoEn: string | null
    cuenta: { id: string; nombre: string; tipo: string; moneda: string; activa: boolean }
    diasHabilesAlerta: number
  }
  saldoAnterior: {
    saldoInformado: number
    fechaActualizacion: string
    rendimientoPeriodo: number
    operador: { nombre: string; apellido: string }
  } | null
  movimientosPeriodo: Array<{
    id: string
    tipo: "SUSCRIPCION" | "RESCATE" | string
    monto: number
    fecha: string
    descripcion: string | null
    cuentaOrigenDestino: { id: string; nombre: string }
    operador: { nombre: string; apellido: string }
  }>
  totalesPeriodo: {
    suscripciones: number
    rescates: number
    baseEsperada: number
  }
  historialSaldos: Array<{
    id: string
    saldoInformado: number
    fechaActualizacion: string
    rendimientoPeriodo: number
    operador: { nombre: string; apellido: string }
  }>
  diasHabilesSinConciliar: number | null
}

export function FciDetalleClient({
  fciId,
  cuentasTodas,
}: {
  fciId: string
  cuentasTodas: CuentaOpt[]
}) {
  const [data, setData] = useState<DetalleResp | null>(null)
  const [cargando, setCargando] = useState(true)
  const [accion, setAccion] = useState<"conciliar" | "suscribir" | "rescatar" | null>(null)
  const [error, setError] = useState<string | null>(null)

  const cargar = useCallback(async () => {
    setCargando(true)
    try {
      const res = await fetch(`/api/fci/${fciId}/detalle`)
      if (res.ok) setData(await res.json())
    } finally {
      setCargando(false)
    }
  }, [fciId])

  useEffect(() => { cargar() }, [cargar])

  if (cargando || !data) {
    return <p className="text-sm text-muted-foreground">Cargando...</p>
  }

  const { fci, saldoAnterior, movimientosPeriodo, totalesPeriodo, historialSaldos, diasHabilesSinConciliar } = data
  const esBroker = fci.cuenta.tipo === "BROKER"
  const alerta = diasHabilesSinConciliar != null && diasHabilesSinConciliar > fci.diasHabilesAlerta

  async function onAccionOk() {
    setAccion(null)
    setError(null)
    await cargar()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/contabilidad/fci" className="text-sm text-muted-foreground hover:text-foreground">
            ← FCIs
          </Link>
          <h2 className="text-2xl font-bold tracking-tight mt-1">{fci.nombre}</h2>
          <p className="text-sm text-muted-foreground">
            {fci.cuenta.nombre} · {fci.cuenta.tipo.toLowerCase()} · {fci.moneda}
          </p>
        </div>
        {alerta && (
          <span className="rounded-full bg-amber-100 text-amber-800 text-xs px-2.5 py-1 font-medium">
            {diasHabilesSinConciliar} día(s) hábil(es) sin conciliar
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground">Saldo contable</p>
            <p className="text-xl font-bold">{formatearMoneda(fci.saldoActual)}</p>
            <p className="text-[11px] text-muted-foreground mt-1">
              Derivado de suscripciones y rescates. No refleja intereses.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground">Último saldo informado</p>
            <p className="text-xl font-bold">
              {saldoAnterior ? formatearMoneda(saldoAnterior.saldoInformado) : "—"}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">
              {saldoAnterior ? `al ${formatearFecha(saldoAnterior.fechaActualizacion)}` : "Sin conciliar nunca"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground">Último rendimiento registrado</p>
            <p className={`text-xl font-bold ${saldoAnterior && saldoAnterior.rendimientoPeriodo < 0 ? "text-destructive" : "text-green-700"}`}>
              {saldoAnterior ? formatearMoneda(saldoAnterior.rendimientoPeriodo) : "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Button onClick={() => { setError(null); setAccion("conciliar") }}>Conciliar saldo</Button>
        <Button variant="outline" onClick={() => { setError(null); setAccion("suscribir") }}>Suscribir</Button>
        <Button variant="outline" onClick={() => { setError(null); setAccion("rescatar") }}>Rescatar</Button>
      </div>

      <Card>
        <CardContent className="pt-5">
          <h3 className="font-semibold mb-3">Movimientos desde última conciliación</h3>
          {movimientosPeriodo.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin movimientos en el período.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-xs text-muted-foreground text-left">
                  <th className="py-1.5">Fecha</th>
                  <th className="py-1.5">Tipo</th>
                  <th className="py-1.5">Cuenta</th>
                  <th className="py-1.5 text-right">Monto</th>
                </tr>
              </thead>
              <tbody>
                {movimientosPeriodo.map((m) => (
                  <tr key={m.id} className="border-b last:border-0">
                    <td className="py-1.5">{formatearFecha(m.fecha)}</td>
                    <td className="py-1.5">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        m.tipo === "SUSCRIPCION" ? "bg-blue-100 text-blue-800" : "bg-orange-100 text-orange-800"
                      }`}>
                        {m.tipo === "SUSCRIPCION" ? "Suscripción" : "Rescate"}
                      </span>
                    </td>
                    <td className="py-1.5">{m.cuentaOrigenDestino.nombre}</td>
                    <td className="py-1.5 text-right font-medium">{formatearMoneda(m.monto)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 font-semibold">
                  <td colSpan={2} className="py-2">Totales</td>
                  <td className="py-2 text-right text-blue-800">+ {formatearMoneda(totalesPeriodo.suscripciones)}</td>
                  <td className="py-2 text-right text-orange-800">− {formatearMoneda(totalesPeriodo.rescates)}</td>
                </tr>
              </tfoot>
            </table>
          )}
        </CardContent>
      </Card>

      {historialSaldos.length > 0 && (
        <Card>
          <CardContent className="pt-5">
            <h3 className="font-semibold mb-3">Historial de conciliaciones (últimas 30)</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-xs text-muted-foreground text-left">
                  <th className="py-1.5">Fecha</th>
                  <th className="py-1.5 text-right">Saldo informado</th>
                  <th className="py-1.5 text-right">Rendimiento período</th>
                  <th className="py-1.5">Operador</th>
                </tr>
              </thead>
              <tbody>
                {historialSaldos.map((s) => (
                  <tr key={s.id} className="border-b last:border-0">
                    <td className="py-1.5">{formatearFecha(s.fechaActualizacion)}</td>
                    <td className="py-1.5 text-right">{formatearMoneda(s.saldoInformado)}</td>
                    <td className={`py-1.5 text-right ${s.rendimientoPeriodo < 0 ? "text-destructive" : "text-green-700"}`}>
                      {formatearMoneda(s.rendimientoPeriodo)}
                    </td>
                    <td className="py-1.5">{s.operador.apellido}, {s.operador.nombre}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {accion === "conciliar" && (
        <ModalConciliar
          saldoAnterior={saldoAnterior}
          totalesPeriodo={totalesPeriodo}
          fciId={fciId}
          onClose={() => setAccion(null)}
          onOk={onAccionOk}
          error={error}
          setError={setError}
        />
      )}
      {accion === "suscribir" && (
        <ModalMovimiento
          fciId={fciId}
          tipo="suscribir"
          cuentaFija={esBroker ? null : fci.cuenta}
          cuentasDisponibles={esBroker ? cuentasTodas : [fci.cuenta]}
          onClose={() => setAccion(null)}
          onOk={onAccionOk}
          error={error}
          setError={setError}
        />
      )}
      {accion === "rescatar" && (
        <ModalMovimiento
          fciId={fciId}
          tipo="rescatar"
          cuentaFija={esBroker ? null : fci.cuenta}
          cuentasDisponibles={esBroker ? cuentasTodas : [fci.cuenta]}
          saldoMaximo={fci.saldoActual}
          onClose={() => setAccion(null)}
          onOk={onAccionOk}
          error={error}
          setError={setError}
        />
      )}
    </div>
  )
}

function ModalConciliar({
  saldoAnterior, totalesPeriodo, fciId, onClose, onOk, error, setError,
}: {
  saldoAnterior: DetalleResp["saldoAnterior"]
  totalesPeriodo: DetalleResp["totalesPeriodo"]
  fciId: string
  onClose: () => void
  onOk: () => void
  error: string | null
  setError: (e: string | null) => void
}) {
  const [fecha, setFecha] = useState(hoyLocalYmd())
  const [saldoInformado, setSaldoInformado] = useState("")
  const [enviando, setEnviando] = useState(false)

  const nuevoSaldo = parseFloat(saldoInformado)
  const rendimiento = !Number.isNaN(nuevoSaldo) ? nuevoSaldo - totalesPeriodo.baseEsperada : null

  async function confirmar() {
    if (Number.isNaN(nuevoSaldo) || nuevoSaldo < 0) { setError("Ingresá un saldo válido"); return }
    setEnviando(true); setError(null)
    try {
      const res = await fetch(`/api/fci/${fciId}/conciliar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fecha, saldoInformado: nuevoSaldo }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        setError(d.error ?? "Error al conciliar")
        return
      }
      onOk()
    } catch {
      setError("Error de red")
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Overlay onClose={onClose}>
      <h2 className="text-lg font-bold">Conciliar saldo</h2>
      <div className="rounded bg-muted/40 p-3 space-y-1 text-sm">
        <Row label="Saldo anterior informado" value={saldoAnterior ? formatearMoneda(saldoAnterior.saldoInformado) : formatearMoneda(0)} hint={saldoAnterior ? `al ${formatearFecha(saldoAnterior.fechaActualizacion)}` : "Sin conciliar nunca"} />
        <Row label="+ Suscripciones del período" value={formatearMoneda(totalesPeriodo.suscripciones)} />
        <Row label="− Rescates del período" value={formatearMoneda(totalesPeriodo.rescates)} />
        <Row label="= Base esperada" value={formatearMoneda(totalesPeriodo.baseEsperada)} bold />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Fecha</Label>
          <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} max={hoyLocalYmd()} />
        </div>
        <div>
          <Label>Saldo actual del FCI</Label>
          <Input type="number" step="0.01" min="0" value={saldoInformado} onChange={(e) => setSaldoInformado(e.target.value)} autoFocus />
        </div>
      </div>

      {rendimiento != null && (
        <div className={`rounded p-3 text-sm space-y-1 ${rendimiento < 0 ? "bg-amber-50 border border-amber-200" : "bg-green-50 border border-green-200"}`}>
          <p className="font-semibold">
            Rendimiento del período: {formatearMoneda(rendimiento)}
          </p>
          {rendimiento < 0 && (
            <p className="text-xs text-amber-800">
              ⚠ Rendimiento negativo. Confirmá que el saldo ingresado es correcto antes de guardar.
            </p>
          )}
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose} disabled={enviando}>Cancelar</Button>
        <Button onClick={confirmar} disabled={enviando || saldoInformado.trim() === ""}>
          {enviando ? "Guardando..." : "Confirmar conciliación"}
        </Button>
      </div>
    </Overlay>
  )
}

function ModalMovimiento({
  fciId, tipo, cuentaFija, cuentasDisponibles, saldoMaximo, onClose, onOk, error, setError,
}: {
  fciId: string
  tipo: "suscribir" | "rescatar"
  cuentaFija: CuentaOpt | null
  cuentasDisponibles: CuentaOpt[]
  saldoMaximo?: number
  onClose: () => void
  onOk: () => void
  error: string | null
  setError: (e: string | null) => void
}) {
  const [cuentaId, setCuentaId] = useState(cuentaFija?.id ?? cuentasDisponibles[0]?.id ?? "")
  const [monto, setMonto] = useState("")
  const [fecha, setFecha] = useState(hoyLocalYmd())
  const [enviando, setEnviando] = useState(false)

  async function confirmar() {
    const n = parseFloat(monto)
    if (Number.isNaN(n) || n <= 0) { setError("Monto inválido"); return }
    if (saldoMaximo != null && n > saldoMaximo) { setError("El monto excede el saldo contable del FCI"); return }
    setEnviando(true); setError(null)
    try {
      const endpoint = tipo === "suscribir" ? "suscribir" : "rescatar"
      const res = await fetch(`/api/fci/${fciId}/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cuentaId, monto: n, fecha }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        setError(d.error ?? "Error al guardar")
        return
      }
      onOk()
    } catch {
      setError("Error de red")
    } finally {
      setEnviando(false)
    }
  }

  const title = tipo === "suscribir" ? "Suscribir al FCI" : "Rescatar del FCI"
  const accionNombre = tipo === "suscribir" ? "Cuenta origen" : "Cuenta destino"

  return (
    <Overlay onClose={onClose}>
      <h2 className="text-lg font-bold">{title}</h2>
      <div>
        <Label>{accionNombre}</Label>
        {cuentaFija ? (
          <p className="h-9 flex items-center rounded-md border bg-muted/40 px-3 text-sm">{cuentaFija.nombre}</p>
        ) : (
          <Select value={cuentaId} onChange={(e) => setCuentaId(e.target.value)}>
            {cuentasDisponibles.map((c) => (
              <option key={c.id} value={c.id}>{c.nombre} ({c.tipo.toLowerCase()})</option>
            ))}
          </Select>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Monto</Label>
          <Input type="number" step="0.01" min="0" value={monto} onChange={(e) => setMonto(e.target.value)} autoFocus />
        </div>
        <div>
          <Label>Fecha</Label>
          <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} max={hoyLocalYmd()} />
        </div>
      </div>
      {saldoMaximo != null && (
        <p className="text-xs text-muted-foreground">Saldo contable disponible: {formatearMoneda(saldoMaximo)}</p>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose} disabled={enviando}>Cancelar</Button>
        <Button onClick={confirmar} disabled={enviando || !cuentaId || monto.trim() === ""}>
          {enviando ? "Guardando..." : tipo === "suscribir" ? "Suscribir" : "Rescatar"}
        </Button>
      </div>
    </Overlay>
  )
}

function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-background rounded-lg shadow-xl w-full max-w-lg p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  )
}

function Row({ label, value, hint, bold }: { label: string; value: string; hint?: string; bold?: boolean }) {
  return (
    <div className="flex justify-between gap-3">
      <div>
        <span className={bold ? "font-semibold" : ""}>{label}</span>
        {hint && <span className="text-xs text-muted-foreground ml-2">{hint}</span>}
      </div>
      <span className={bold ? "font-semibold" : ""}>{value}</span>
    </div>
  )
}
