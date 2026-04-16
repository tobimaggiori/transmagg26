"use client"

/**
 * Propósito: Formulario para registrar un adelanto a un fletero.
 * Campos comunes: fletero, tipo, monto, fecha, descripción.
 * CHEQUE_PROPIO emite un cheque propio (impacta cartera de cheques propios).
 * CHEQUE_TERCERO endosa un cheque en cartera al fletero (lo saca de cartera).
 */

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { UploadPDF } from "@/components/upload-pdf"
import { formatearMoneda } from "@/lib/utils"
import { parsearImporte } from "@/lib/money"
import { hoyLocalYmd } from "@/lib/date-local"

interface Fletero {
  id: string
  razonSocial: string
  cuit: string
}

interface Chequera {
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
  empresa: { razonSocial: string } | null
}

const TIPOS = [
  { value: "EFECTIVO", label: "Efectivo" },
  { value: "TRANSFERENCIA", label: "Transferencia" },
  { value: "COMBUSTIBLE", label: "Combustible (Gas-Oil)" },
  { value: "CHEQUE_PROPIO", label: "Cheque propio" },
  { value: "CHEQUE_TERCERO", label: "Cheque de tercero" },
] as const

type ChequePropioState = {
  cuentaId: string
  nroCheque: string
  fechaEmision: string
  fechaPago: string
  clausula: "NO_A_LA_ORDEN" | "A_LA_ORDEN"
  descripcion1: string
  descripcion2: string
  mailBeneficiario: string
}

function defaultChequePropio(): ChequePropioState {
  return {
    cuentaId: "",
    nroCheque: "",
    fechaEmision: hoyLocalYmd(),
    fechaPago: "",
    clausula: "NO_A_LA_ORDEN",
    descripcion1: "",
    descripcion2: "",
    mailBeneficiario: "",
  }
}

export function IngresarAdelantoClient({
  fleteros,
  chequeras,
}: {
  fleteros: Fletero[]
  chequeras: Chequera[]
}) {
  const [fleteroId, setFleteroId] = useState("")
  const [tipo, setTipo] = useState<typeof TIPOS[number]["value"]>("EFECTIVO")
  const [monto, setMonto] = useState("")
  const [fecha, setFecha] = useState(hoyLocalYmd())
  const [descripcion, setDescripcion] = useState("")
  const [comprobanteS3Key, setComprobanteS3Key] = useState<string | null>(null)
  const [chequePropio, setChequePropio] = useState<ChequePropioState>(defaultChequePropio())
  const [chequesEnCartera, setChequesEnCartera] = useState<ChequeEnCartera[]>([])
  const [chequeRecibidoId, setChequeRecibidoId] = useState("")
  const [cargandoCheques, setCargandoCheques] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [exito, setExito] = useState<{ monto: number; fletero: string; tipo: string } | null>(null)

  const fleteroSeleccionado = fleteros.find((f) => f.id === fleteroId) ?? null

  // Cargar cheques en cartera cuando se elige CHEQUE_TERCERO
  useEffect(() => {
    if (tipo !== "CHEQUE_TERCERO") return
    let cancelado = false
    setCargandoCheques(true)
    fetch("/api/cheques-recibidos/en-cartera")
      .then((r) => r.json())
      .then((data: ChequeEnCartera[]) => {
        if (!cancelado) setChequesEnCartera(Array.isArray(data) ? data : [])
      })
      .catch(() => {
        if (!cancelado) setChequesEnCartera([])
      })
      .finally(() => {
        if (!cancelado) setCargandoCheques(false)
      })
    return () => {
      cancelado = true
    }
  }, [tipo])

  // Reset campos específicos al cambiar de tipo
  function cambiarTipo(nuevoTipo: typeof TIPOS[number]["value"]) {
    setTipo(nuevoTipo)
    setError(null)
    setComprobanteS3Key(null)
    setChequePropio(defaultChequePropio())
    setChequeRecibidoId("")
    if (nuevoTipo !== "CHEQUE_TERCERO") {
      // Permitir editar el monto manualmente para tipos no-cheque-tercero
      // (en cheque-tercero el monto se fuerza al del cheque elegido)
    } else {
      setMonto("")
    }
  }

  function seleccionarChequeTercero(id: string) {
    setChequeRecibidoId(id)
    const ch = chequesEnCartera.find((c) => c.id === id)
    setMonto(ch ? String(ch.monto) : "")
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!fleteroId) { setError("Seleccioná un fletero"); return }
    const montoNum = parsearImporte(monto)
    if (montoNum <= 0) { setError("El monto debe ser mayor a 0"); return }

    if (tipo === "CHEQUE_PROPIO") {
      if (!chequePropio.cuentaId) { setError("Seleccioná la cuenta (chequera)"); return }
      if (!chequePropio.nroCheque.trim()) { setError("Ingresá el número de cheque"); return }
      if (!chequePropio.fechaEmision) { setError("Ingresá la fecha de emisión"); return }
      if (!chequePropio.fechaPago) { setError("Ingresá la fecha de pago"); return }
      if (!comprobanteS3Key) { setError("Subí el comprobante de emisión del cheque"); return }
    }
    if (tipo === "CHEQUE_TERCERO") {
      if (!chequeRecibidoId) { setError("Seleccioná un cheque en cartera"); return }
      if (!comprobanteS3Key) { setError("Subí el comprobante de endoso"); return }
    }

    setError(null)
    setLoading(true)
    try {
      const body: Record<string, unknown> = {
        fleteroId,
        tipo,
        monto: montoNum,
        fecha: new Date(fecha + "T12:00:00"),
        descripcion: descripcion.trim() || null,
        comprobanteS3Key: comprobanteS3Key ?? null,
      }
      if (tipo === "CHEQUE_PROPIO") {
        body.chequePropio = {
          cuentaId: chequePropio.cuentaId,
          nroCheque: chequePropio.nroCheque.trim(),
          fechaEmision: chequePropio.fechaEmision,
          fechaPago: chequePropio.fechaPago,
          clausula: chequePropio.clausula,
          descripcion1: chequePropio.descripcion1.trim() || null,
          descripcion2: chequePropio.descripcion2.trim() || null,
          mailBeneficiario: chequePropio.mailBeneficiario.trim() || null,
        }
      }
      if (tipo === "CHEQUE_TERCERO") {
        body.chequeRecibidoId = chequeRecibidoId
      }

      const res = await fetch("/api/adelantos-fleteros", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? "Error al registrar el adelanto")
        return
      }
      const tipoLabel = TIPOS.find((t) => t.value === tipo)?.label ?? tipo
      setExito({
        monto: montoNum,
        fletero: fleteroSeleccionado?.razonSocial ?? "",
        tipo: tipoLabel,
      })
      setFleteroId("")
      cambiarTipo("EFECTIVO")
      setMonto("")
      setFecha(hoyLocalYmd())
      setDescripcion("")
    } catch {
      setError("Error de red al registrar el adelanto")
    } finally {
      setLoading(false)
    }
  }

  const montoBloqueado = tipo === "CHEQUE_TERCERO"

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Ingresar Adelanto</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Registrá un anticipo entregado a un fletero, a descontar en futuras liquidaciones.
        </p>
      </div>

      {exito && (
        <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          Adelanto de {formatearMoneda(exito.monto)} ({exito.tipo}) registrado para {exito.fletero}.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label>Fletero <span className="text-destructive">*</span></Label>
          <Select
            value={fleteroId}
            onChange={(e) => setFleteroId(e.target.value)}
            className="mt-1"
          >
            <option value="">Seleccionar fletero...</option>
            {fleteros.map((f) => (
              <option key={f.id} value={f.id}>{f.razonSocial}</option>
            ))}
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Tipo <span className="text-destructive">*</span></Label>
            <Select
              value={tipo}
              onChange={(e) => cambiarTipo(e.target.value as typeof TIPOS[number]["value"])}
              className="mt-1"
            >
              {TIPOS.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Fecha <span className="text-destructive">*</span></Label>
            <Input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="mt-1"
              required
            />
          </div>
        </div>

        <div>
          <Label>
            Monto <span className="text-destructive">*</span>
            {montoBloqueado && (
              <span className="text-muted-foreground text-xs ml-1">
                (forzado al monto del cheque)
              </span>
            )}
          </Label>
          <Input
            type="number"
            min="0.01"
            step="0.01"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            placeholder="0,00"
            className="mt-1"
            disabled={montoBloqueado}
            required
          />
        </div>

        <div>
          <Label>Descripción <span className="text-muted-foreground text-xs">(opcional)</span></Label>
          <Input
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Ej: Adelanto para viaje del 05/04"
            className="mt-1"
          />
        </div>

        {/* ── Bloque CHEQUE_PROPIO ──────────────────────────────────────────── */}
        {tipo === "CHEQUE_PROPIO" && (
          <div className="rounded-md border p-4 space-y-3 bg-muted/20">
            <p className="text-sm font-semibold">Datos del cheque propio</p>
            {fleteroSeleccionado ? (
              <p className="text-xs text-muted-foreground">
                Beneficiario: {fleteroSeleccionado.razonSocial} — CUIT {fleteroSeleccionado.cuit}
              </p>
            ) : (
              <p className="text-xs text-orange-600">Seleccioná un fletero para definir el beneficiario.</p>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Cuenta (chequera) <span className="text-destructive">*</span></Label>
                <Select
                  value={chequePropio.cuentaId}
                  onChange={(e) => setChequePropio((p) => ({ ...p, cuentaId: e.target.value }))}
                  className="mt-1"
                >
                  <option value="">Seleccionar...</option>
                  {chequeras.map((c) => (
                    <option key={c.id} value={c.id}>{c.nombre} — {c.bancoOEntidad}</option>
                  ))}
                </Select>
                {chequeras.length === 0 && (
                  <p className="text-xs text-orange-600 mt-1">
                    No hay cuentas con chequera habilitada.
                  </p>
                )}
              </div>
              <div>
                <Label className="text-xs">Nº de cheque <span className="text-destructive">*</span></Label>
                <Input
                  value={chequePropio.nroCheque}
                  onChange={(e) => setChequePropio((p) => ({ ...p, nroCheque: e.target.value }))}
                  className="mt-1"
                  placeholder="Ej: 12345678"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">Fecha emisión <span className="text-destructive">*</span></Label>
                <Input
                  type="date"
                  value={chequePropio.fechaEmision}
                  onChange={(e) => setChequePropio((p) => ({ ...p, fechaEmision: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Fecha pago <span className="text-destructive">*</span></Label>
                <Input
                  type="date"
                  value={chequePropio.fechaPago}
                  onChange={(e) => setChequePropio((p) => ({ ...p, fechaPago: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Cláusula</Label>
                <Select
                  value={chequePropio.clausula}
                  onChange={(e) => setChequePropio((p) => ({ ...p, clausula: e.target.value as ChequePropioState["clausula"] }))}
                  className="mt-1"
                >
                  <option value="NO_A_LA_ORDEN">No a la orden</option>
                  <option value="A_LA_ORDEN">A la orden</option>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Descripción 1 <span className="text-muted-foreground">(opcional)</span></Label>
                <Input
                  value={chequePropio.descripcion1}
                  onChange={(e) => setChequePropio((p) => ({ ...p, descripcion1: e.target.value }))}
                  className="mt-1"
                  maxLength={100}
                />
              </div>
              <div>
                <Label className="text-xs">Mail beneficiario <span className="text-muted-foreground">(opcional)</span></Label>
                <Input
                  type="email"
                  value={chequePropio.mailBeneficiario}
                  onChange={(e) => setChequePropio((p) => ({ ...p, mailBeneficiario: e.target.value }))}
                  className="mt-1"
                  placeholder="email@ejemplo.com"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs mb-1 block">
                Comprobante de emisión (PDF) <span className="text-destructive">*</span>
              </Label>
              <UploadPDF
                prefijo="comprobantes-pago-fletero"
                required
                label="Subir comprobante"
                s3Key={comprobanteS3Key ?? undefined}
                onUpload={(key) => setComprobanteS3Key(key)}
              />
            </div>
          </div>
        )}

        {/* ── Bloque CHEQUE_TERCERO ─────────────────────────────────────────── */}
        {tipo === "CHEQUE_TERCERO" && (
          <div className="rounded-md border p-4 space-y-3 bg-muted/20">
            <p className="text-sm font-semibold">Cheque de tercero a endosar</p>
            <div>
              <Label className="text-xs">Cheque en cartera <span className="text-destructive">*</span></Label>
              <Select
                value={chequeRecibidoId}
                onChange={(e) => seleccionarChequeTercero(e.target.value)}
                className="mt-1"
                disabled={cargandoCheques || chequesEnCartera.length === 0}
              >
                <option value="">
                  {cargandoCheques
                    ? "Cargando cheques..."
                    : chequesEnCartera.length === 0
                      ? "No hay cheques en cartera"
                      : "Seleccionar cheque..."}
                </option>
                {chequesEnCartera.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.bancoEmisor} — Nº {c.nroCheque} — {formatearMoneda(c.monto)} — vto {c.fechaCobro?.slice(0, 10)}
                    {c.empresa ? ` · ${c.empresa.razonSocial}` : ""}
                  </option>
                ))}
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                El monto del adelanto se fuerza al monto del cheque seleccionado.
              </p>
            </div>

            <div>
              <Label className="text-xs mb-1 block">
                Comprobante de endoso (PDF) <span className="text-destructive">*</span>
              </Label>
              <UploadPDF
                prefijo="comprobantes-pago-fletero"
                required
                label="Subir comprobante"
                s3Key={comprobanteS3Key ?? undefined}
                onUpload={(key) => setComprobanteS3Key(key)}
              />
            </div>
          </div>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Registrando..." : "Registrar adelanto"}
        </Button>
      </form>
    </div>
  )
}
