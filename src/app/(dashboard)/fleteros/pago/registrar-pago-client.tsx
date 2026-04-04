"use client"

/**
 * Propósito: Componente cliente para la página Orden de Pago (/fleteros/pago).
 * Flujo: combobox de fletero → tabla de LPs con checkboxes → seleccionar varios → formulario de pago.
 */

import { useState, useCallback } from "react"
import { SearchCombobox, type SearchComboboxItem } from "@/components/ui/search-combobox"
import { formatearMoneda, formatearFecha } from "@/lib/utils"
import { sumarImportes } from "@/lib/money"
import { RegistrarPagoFleteroModal } from "@/components/forms/registrar-pago-fletero-form"
import { SelectContactoEmail } from "@/components/forms/select-contacto-email"

// ─── Tipos ───────────────────────────────────────────────────────────────────

interface Fletero {
  id: string
  razonSocial: string
  cuit: string
  email: string | null
}

interface CuentaBancaria {
  id: string
  nombre: string
  bancoOEntidad: string
}

interface ChequeEnCartera {
  id: string
  nroCheque: string
  bancoEmisor: string
  monto: number
  fechaCobro: string
}

interface LiquidacionPendiente {
  id: string
  nroComprobante: number | null
  ptoVenta: number | null
  total: number
  totalPagado: number
  saldoPendiente: number
  grabadaEn: string
  estado: string
}

interface GastoPendiente {
  id: string
  tipo: string
  montoPagado: number
  montoDescontado: number
  estado: string
  facturaProveedor: {
    id: string
    tipoCbte: string
    nroComprobante: string | null
    fechaCbte: string
    proveedor: { razonSocial: string }
  }
}

interface RegistrarPagoClientProps {
  fleteros: Fletero[]
  cuentas: CuentaBancaria[]
  chequesEnCartera: ChequeEnCartera[]
  operadorEmail: string | null
  operadorSmtpActivo: boolean
}

interface ConfirmacionOP {
  opNro: number
  opId: string
  fleteroId: string
  fleteroNombre: string
  operadorEmail: string | null
  operadorSmtpActivo: boolean
}

function nroLP(ptoVenta: number | null, nro: number | null): string {
  if (ptoVenta == null || nro == null) return "s/n"
  return `${String(ptoVenta).padStart(4, "0")}-${String(nro).padStart(8, "0")}`
}

const estadoLabel: Record<string, string> = {
  EMITIDA: "Emitida",
  PARCIALMENTE_PAGADA: "Parcial",
}

// ─── Modal de confirmación post-OP ───────────────────────────────────────────

function ModalConfirmacionOP({
  confirmacion,
  onClose,
}: {
  confirmacion: ConfirmacionOP
  onClose: () => void
}) {
  const { opId, opNro, fleteroId, fleteroNombre, operadorEmail, operadorSmtpActivo } = confirmacion
  const [mostrarEmail, setMostrarEmail] = useState(false)
  const [emailDestino, setEmailDestino] = useState("")
  const [mensajeAdicional, setMensajeAdicional] = useState("")
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [errorEmail, setErrorEmail] = useState<string | null>(null)

  async function enviarEmail() {
    setEnviando(true)
    setErrorEmail(null)
    try {
      const res = await fetch(`/api/ordenes-pago/${opId}/enviar-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailDestino: emailDestino || undefined, mensajeAdicional: mensajeAdicional || undefined }),
      })
      const data = await res.json()
      if (!res.ok) { setErrorEmail(data.error ?? "Error al enviar"); return }
      setEnviado(true)
    } catch {
      setErrorEmail("Error de red al enviar el mail")
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-background rounded-xl shadow-lg w-full max-w-md space-y-5 p-6">
        {/* Encabezado */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Orden de Pago generada</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              OP Nro {opNro.toLocaleString("es-AR")} — {fleteroNombre}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground rounded-md p-1"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        {/* Acciones principales */}
        <div className="flex flex-wrap gap-2">
          <a
            href={`/api/ordenes-pago/${opId}/pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 inline-flex items-center gap-1.5"
          >
            Ver PDF
          </a>
          <a
            href={`/api/ordenes-pago/${opId}/pdf?print=true`}
            target="_blank"
            rel="noopener noreferrer"
            className="h-9 px-4 rounded-md border text-sm font-medium hover:bg-muted inline-flex items-center gap-1.5"
          >
            Imprimir
          </a>
          <button
            onClick={() => setMostrarEmail((v) => !v)}
            className="h-9 px-4 rounded-md border text-sm font-medium hover:bg-muted"
          >
            {mostrarEmail ? "Ocultar formulario" : "Enviar por mail"}
          </button>
        </div>

        {/* Sub-formulario de email */}
        {mostrarEmail && (
          <div className="space-y-3 border rounded-lg p-4">
            {enviado ? (
              <p className="text-sm text-green-700">
                Mail enviado exitosamente a {emailDestino || "destinatario"}.
              </p>
            ) : (
              <>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Remitente</label>
                  <p className="text-sm font-medium">{operadorEmail ?? "—"}</p>
                </div>
                {!operadorSmtpActivo && (
                  <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
                    No tenés SMTP configurado. Pedí al administrador que configure tu cuenta en ABM → Usuarios.
                  </p>
                )}
                <div className="space-y-1">
                  <label className="text-xs font-medium">Enviar a</label>
                  <SelectContactoEmail
                    parentId={fleteroId}
                    parentType="fletero"
                    value={emailDestino}
                    onChange={setEmailDestino}
                    disabled={!operadorSmtpActivo || enviando}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">Mensaje adicional (opcional)</label>
                  <textarea
                    value={mensajeAdicional}
                    onChange={(e) => setMensajeAdicional(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                    rows={2}
                    placeholder="Adjunto la Orden de Pago..."
                    disabled={!operadorSmtpActivo}
                  />
                </div>
                {errorEmail && <p className="text-sm text-destructive">{errorEmail}</p>}
                <button
                  onClick={enviarEmail}
                  disabled={enviando || !emailDestino || !operadorSmtpActivo}
                  className="h-8 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {enviando ? "Enviando…" : "Enviar"}
                </button>
              </>
            )}
          </div>
        )}

        {/* Botón cerrar */}
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="h-9 px-4 rounded-md border text-sm font-medium hover:bg-muted"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function RegistrarPagoClient({ fleteros, cuentas, chequesEnCartera, operadorEmail, operadorSmtpActivo }: RegistrarPagoClientProps) {
  const [fleteroId, setFleteroId] = useState("")
  const [liquidaciones, setLiquidaciones] = useState<LiquidacionPendiente[]>([])
  const [gastosPendientes, setGastosPendientes] = useState<GastoPendiente[]>([])
  const [saldoAFavorCC, setSaldoAFavorCC] = useState(0)
  const [loadingFletero, setLoadingFletero] = useState(false)

  // Checkboxes — IDs de LPs seleccionados
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set())

  // Paso actual: "select" (tabla con checkboxes) o "pay" (formulario de pago)
  const [pagando, setPagando] = useState(false)

  const [confirmacionOP, setConfirmacionOP] = useState<ConfirmacionOP | null>(null)

  const fletero = fleteros.find((f) => f.id === fleteroId) ?? null

  const onSelectFletero = useCallback(async (id: string) => {
    setFleteroId(id)
    setLiquidaciones([])
    setGastosPendientes([])
    setSaldoAFavorCC(0)
    setSeleccionados(new Set())
    if (!id) return

    setLoadingFletero(true)
    try {
      const [liqs, saldo, gastos] = await Promise.all([
        fetch(`/api/fleteros/${id}/liquidaciones-pendientes`).then((r) => r.ok ? r.json() : []),
        fetch(`/api/fleteros/${id}/saldo-cc`).then((r) => r.ok ? r.json() : { saldoAFavor: 0 }),
        fetch(`/api/liquidaciones?fleteroId=${id}`).then((r) => r.ok ? r.json() : { gastosPendientes: [] }),
      ])
      setLiquidaciones(liqs)
      setSaldoAFavorCC(saldo.saldoAFavor ?? 0)
      setGastosPendientes((gastos as { gastosPendientes?: GastoPendiente[] }).gastosPendientes ?? [])
    } finally {
      setLoadingFletero(false)
    }
  }, [])

  // ── Gestión de checkboxes ──────────────────────────────────────────────────
  const todosSeleccionados = liquidaciones.length > 0 && liquidaciones.every((l) => seleccionados.has(l.id))
  const algunoSeleccionado = liquidaciones.some((l) => seleccionados.has(l.id))

  function toggleLp(id: string) {
    setSeleccionados((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleTodos() {
    if (todosSeleccionados) {
      setSeleccionados(new Set())
    } else {
      setSeleccionados(new Set(liquidaciones.map((l) => l.id)))
    }
  }

  const lpsSeleccionados = liquidaciones.filter((l) => seleccionados.has(l.id))
  const saldoTotalSeleccionado = sumarImportes(lpsSeleccionados.map(l => l.saldoPendiente))

  // ── Abrir formulario de pago ───────────────────────────────────────────────
  async function abrirPago() {
    // Refrescar saldo CC antes de abrir
    try {
      const res = await fetch(`/api/fleteros/${fleteroId}/saldo-cc`)
      if (res.ok) setSaldoAFavorCC((await res.json()).saldoAFavor ?? 0)
    } catch { /* silencioso */ }
    setPagando(true)
  }

  function onSuccess(nroOP: number, opId: string) {
    setPagando(false)
    setSeleccionados(new Set())
    setConfirmacionOP({
      opNro: nroOP,
      opId,
      fleteroId,
      fleteroNombre: fletero?.razonSocial ?? "",
      operadorEmail,
      operadorSmtpActivo,
    })
    onSelectFletero(fleteroId)
  }

  function cerrarConfirmacion() {
    setConfirmacionOP(null)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Orden de Pago</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Seleccioná un fletero y los LPs que querés pagar con una misma Orden de Pago.
        </p>
      </div>

      {/* Selector de fletero */}
      <div className="max-w-sm">
        <label className="text-sm font-medium mb-1.5 block">Fletero</label>
        <SearchCombobox
          items={fleteros.map((f): SearchComboboxItem => ({ id: f.id, label: f.razonSocial }))}
          value={fleteroId}
          onChange={onSelectFletero}
          placeholder="Buscar fletero..."
        />
      </div>

      {/* Tabla de LPs pendientes con checkboxes */}
      {fleteroId && (
        <div className="space-y-3">
          <h2 className="text-base font-semibold">
            LPs pendientes de pago
            {fletero && <span className="text-muted-foreground font-normal ml-1">— {fletero.razonSocial}</span>}
          </h2>

          {loadingFletero ? (
            <p className="text-sm text-muted-foreground">Cargando...</p>
          ) : liquidaciones.length === 0 ? (
            <div className="rounded-lg border p-6 text-center text-sm text-muted-foreground">
              No hay liquidaciones pendientes de pago para este fletero.
            </div>
          ) : (
            <>
              <div className="rounded-lg border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-3 py-2.5 w-10">
                        <input
                          type="checkbox"
                          className="h-4 w-4 cursor-pointer"
                          checked={todosSeleccionados}
                          onChange={toggleTodos}
                          title={todosSeleccionados ? "Deseleccionar todos" : "Seleccionar todos"}
                        />
                      </th>
                      <th className="px-4 py-2.5 text-left font-medium">Nro LP</th>
                      <th className="px-4 py-2.5 text-left font-medium">Fecha</th>
                      <th className="px-4 py-2.5 text-right font-medium">Total</th>
                      <th className="px-4 py-2.5 text-right font-medium">Saldo pend.</th>
                      <th className="px-4 py-2.5 text-left font-medium">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {liquidaciones.map((liq) => {
                      const checked = seleccionados.has(liq.id)
                      return (
                        <tr
                          key={liq.id}
                          className={`cursor-pointer ${checked ? "bg-primary/5" : "hover:bg-muted/20"}`}
                          onClick={() => toggleLp(liq.id)}
                        >
                          <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              className="h-4 w-4 cursor-pointer"
                              checked={checked}
                              onChange={() => toggleLp(liq.id)}
                            />
                          </td>
                          <td className="px-4 py-3 font-mono text-xs">{nroLP(liq.ptoVenta, liq.nroComprobante)}</td>
                          <td className="px-4 py-3">{formatearFecha(new Date(liq.grabadaEn))}</td>
                          <td className="px-4 py-3 text-right">{formatearMoneda(liq.total)}</td>
                          <td className="px-4 py-3 text-right font-semibold">{formatearMoneda(liq.saldoPendiente)}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              liq.estado === "EMITIDA" ? "bg-blue-100 text-blue-800" : "bg-amber-100 text-amber-800"
                            }`}>
                              {estadoLabel[liq.estado] ?? liq.estado}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Footer de selección */}
              <div className="flex items-center justify-between px-1">
                <p className="text-sm text-muted-foreground">
                  {algunoSeleccionado
                    ? <>
                        <span className="font-medium text-foreground">{lpsSeleccionados.length} LP{lpsSeleccionados.length !== 1 ? "s" : ""}</span>
                        {" "}seleccionado{lpsSeleccionados.length !== 1 ? "s" : ""} · Saldo total:{" "}
                        <span className="font-semibold text-foreground">{formatearMoneda(saldoTotalSeleccionado)}</span>
                      </>
                    : "Seleccioná uno o más LPs para continuar"
                  }
                </p>
                <button
                  onClick={abrirPago}
                  disabled={!algunoSeleccionado}
                  className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Continuar con el pago &rarr;
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Formulario de pago multi-LP */}
      {pagando && fletero && lpsSeleccionados.length > 0 && (
        <RegistrarPagoFleteroModal
          liquidaciones={lpsSeleccionados.map((liq) => ({
            id: liq.id,
            nroComprobante: liq.nroComprobante,
            ptoVenta: liq.ptoVenta,
            total: liq.total,
            saldoPendiente: liq.saldoPendiente,
            grabadaEn: liq.grabadaEn,
          }))}
          fletero={{ id: fletero.id, razonSocial: fletero.razonSocial, cuit: fletero.cuit }}
          cuentasBancarias={cuentas}
          chequesEnCartera={chequesEnCartera}
          saldoAFavorCC={saldoAFavorCC}
          gastosPendientes={gastosPendientes.filter((g) => g.estado !== "DESCONTADO_TOTAL")}
          onSuccess={onSuccess}
          onClose={() => setPagando(false)}
        />
      )}

      {/* Modal de confirmación post-OP */}
      {confirmacionOP && (
        <ModalConfirmacionOP
          confirmacion={confirmacionOP}
          onClose={cerrarConfirmacion}
        />
      )}
    </div>
  )
}
