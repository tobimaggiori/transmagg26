/**
 * Propósito: Componente ABM para configuración ARCA (singleton).
 * Muestra 5 tarjetas: Datos emisor, Certificado digital, Puntos de venta,
 * Config MiPyMEs, Ambiente.
 * Los datos son sensibles: certificadoB64 nunca se muestra, solo se indica si existe.
 */

"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Upload,
  Loader2,
} from "lucide-react"

interface ConfiguracionArcaProps {
  config: {
    id: string
    cuit: string
    razonSocial: string
    tieneCertificado: boolean
    modo: string
    puntosVenta: Record<string, string>
    cbuMiPymes: string | null
    activa: boolean
    actualizadoEn: string
    actualizadoPor: string | null
  } | null
}

const TIPOS_COMPROBANTE = [
  "FACTURA_A",
  "FACTURA_B",
  "FACTURA_C",
  "FACTURA_M",
  "NOTA_CREDITO_A",
  "NOTA_CREDITO_B",
  "NOTA_CREDITO_C",
  "NOTA_DEBITO_A",
  "NOTA_DEBITO_B",
  "NOTA_DEBITO_C",
]

export function ConfiguracionArcaAbm({ config: initialConfig }: ConfiguracionArcaProps) {
  const [config, setConfig] = useState(
    initialConfig ?? {
      id: "unico",
      cuit: "30709381683",
      razonSocial: "",
      tieneCertificado: false,
      modo: "homologacion",
      puntosVenta: {} as Record<string, string>,
      cbuMiPymes: null,
      activa: false,
      actualizadoEn: new Date().toISOString(),
      actualizadoPor: null,
    }
  )

  // Form state for each card
  const [cuit, setCuit] = useState(config.cuit)
  const [razonSocial, setRazonSocial] = useState(config.razonSocial)
  const [certPass, setCertPass] = useState("")
  const [puntosVenta, setPuntosVenta] = useState<Record<string, string>>(config.puntosVenta)
  const [cbuMiPymes, setCbuMiPymes] = useState(config.cbuMiPymes ?? "")
  const [modoSel, setModoSel] = useState(config.modo)

  const [saving, setSaving] = useState<string | null>(null)
  const [verificando, setVerificando] = useState(false)
  const [verificResult, setVerificResult] = useState<{ ok: boolean; errores?: string[]; mensaje?: string } | null>(null)
  const [confirmProduccion, setConfirmProduccion] = useState(false)

  const fileRef = useRef<HTMLInputElement>(null)

  async function patch(data: Record<string, unknown>, section: string) {
    setSaving(section)
    try {
      const res = await fetch("/api/configuracion-arca", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error("Error al guardar")
      const updated = await res.json() as typeof config
      setConfig(updated)
    } catch {
      alert("Error al guardar la configuración.")
    } finally {
      setSaving(null)
    }
  }

  async function handleCertFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (ev) => {
      const b64 = (ev.target?.result as string).split(",")[1] ?? ""
      await patch({ certificadoB64: b64, certificadoPass: certPass || undefined }, "certificado")
    }
    reader.readAsDataURL(file)
  }

  async function handleVerificar() {
    setVerificando(true)
    setVerificResult(null)
    try {
      const res = await fetch("/api/configuracion-arca/verificar", { method: "POST" })
      const data = await res.json() as { ok: boolean; errores?: string[]; mensaje?: string }
      setVerificResult(data)
    } catch {
      setVerificResult({ ok: false, errores: ["Error de red al verificar."] })
    } finally {
      setVerificando(false)
    }
  }

  async function handleGuardarAmbiente() {
    if (modoSel === "produccion" && config.modo !== "produccion") {
      setConfirmProduccion(true)
      return
    }
    await patch({ modo: modoSel }, "ambiente")
  }

  async function confirmarProduccion() {
    setConfirmProduccion(false)
    await patch({ modo: "produccion", activa: true }, "ambiente")
  }

  const estadoIcon = config.activa
    ? <ShieldCheck className="h-5 w-5 text-green-500" />
    : config.tieneCertificado
    ? <ShieldAlert className="h-5 w-5 text-yellow-500" />
    : <ShieldX className="h-5 w-5 text-red-500" />

  const estadoLabel = config.activa ? "Activa" : "Inactiva"
  const estadoVariant = config.activa ? "default" : "secondary"

  return (
    <div className="space-y-6">
      {/* Header con estado global */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {estadoIcon}
          <span className="text-sm text-muted-foreground">Estado ARCA:</span>
          <Badge variant={estadoVariant}>{estadoLabel}</Badge>
          <span className="text-xs text-muted-foreground">
            · Modo: <span className="font-medium capitalize">{config.modo}</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          {verificResult && (
            <span className={`text-xs flex items-center gap-1 ${verificResult.ok ? "text-green-600" : "text-red-600"}`}>
              {verificResult.ok
                ? <><CheckCircle2 className="h-3.5 w-3.5" /> {verificResult.mensaje}</>
                : <><XCircle className="h-3.5 w-3.5" /> {verificResult.errores?.[0]}</>
              }
            </span>
          )}
          <Button variant="outline" size="sm" onClick={handleVerificar} disabled={verificando}>
            {verificando ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
            Verificar configuración
          </Button>
        </div>
      </div>

      {verificResult && !verificResult.ok && verificResult.errores && verificResult.errores.length > 1 && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 space-y-1">
          {verificResult.errores.map((e, i) => (
            <p key={i} className="text-xs text-red-700 flex items-start gap-1.5">
              <XCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" /> {e}
            </p>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Datos del emisor */}
        <div className="rounded-lg border p-5 space-y-4">
          <h3 className="font-semibold text-sm">Datos del emisor</h3>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">CUIT (sin guiones)</Label>
              <Input
                value={cuit}
                onChange={(e) => setCuit(e.target.value.replace(/\D/g, "").slice(0, 11))}
                placeholder="30709381683"
                maxLength={11}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Razón social</Label>
              <Input
                value={razonSocial}
                onChange={(e) => setRazonSocial(e.target.value)}
                placeholder="TRANSMAGG S.R.L."
              />
            </div>
          </div>
          <Button
            size="sm"
            disabled={saving === "emisor"}
            onClick={() => patch({ cuit, razonSocial }, "emisor")}
          >
            {saving === "emisor" ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
            Guardar
          </Button>
        </div>

        {/* Card 2: Certificado digital */}
        <div className="rounded-lg border p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">Certificado digital</h3>
            <Badge variant={config.tieneCertificado ? "default" : "secondary"}>
              {config.tieneCertificado ? "Cargado" : "Sin certificado"}
            </Badge>
          </div>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Archivo .pfx / .p12</Label>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileRef.current?.click()}
                  disabled={saving === "certificado"}
                  className="flex items-center gap-1.5"
                >
                  <Upload className="h-3.5 w-3.5" />
                  {config.tieneCertificado ? "Reemplazar" : "Cargar"}
                </Button>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pfx,.p12,.pem,.crt"
                  className="hidden"
                  onChange={handleCertFile}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                El certificado se almacena cifrado. Nunca se muestra en pantalla.
              </p>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Contraseña del certificado</Label>
              <Input
                type="password"
                value={certPass}
                onChange={(e) => setCertPass(e.target.value)}
                placeholder="••••••••"
              />
            </div>
          </div>
          <Button
            size="sm"
            disabled={saving === "certificado" || !certPass}
            onClick={() => patch({ certificadoPass: certPass }, "certificado")}
          >
            {saving === "certificado" ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
            Guardar contraseña
          </Button>
        </div>

        {/* Card 3: Puntos de venta */}
        <div className="rounded-lg border p-5 space-y-4">
          <h3 className="font-semibold text-sm">Puntos de venta por tipo de comprobante</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {TIPOS_COMPROBANTE.map((tipo) => (
              <div key={tipo} className="flex items-center gap-3">
                <span className="text-xs font-mono w-36 shrink-0 text-muted-foreground">{tipo}</span>
                <Input
                  className="h-7 text-xs"
                  value={puntosVenta[tipo] ?? ""}
                  onChange={(e) =>
                    setPuntosVenta((prev) => ({
                      ...prev,
                      [tipo]: e.target.value,
                    }))
                  }
                  placeholder="Nro. punto de venta"
                />
              </div>
            ))}
          </div>
          <Button
            size="sm"
            disabled={saving === "puntos_venta"}
            onClick={() => patch({ puntosVenta }, "puntos_venta")}
          >
            {saving === "puntos_venta" ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
            Guardar puntos de venta
          </Button>
        </div>

        {/* Card 4: Config MiPyMEs */}
        <div className="rounded-lg border p-5 space-y-4">
          <h3 className="font-semibold text-sm">Configuración MiPyMEs</h3>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">CBU para acreditación</Label>
              <Input
                value={cbuMiPymes}
                onChange={(e) => setCbuMiPymes(e.target.value.replace(/\D/g, "").slice(0, 22))}
                placeholder="CBU de 22 dígitos"
                maxLength={22}
              />
              <p className="text-xs text-muted-foreground">
                CBU de Transmagg donde se acreditan los pagos de FCE MiPyME
              </p>
            </div>
          </div>
          <Button
            size="sm"
            disabled={saving === "mipymes"}
            onClick={() => patch({ cbuMiPymes: cbuMiPymes || null }, "mipymes")}
          >
            {saving === "mipymes" ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
            Guardar
          </Button>
        </div>

        {/* Card 5: Ambiente */}
        <div className="rounded-lg border p-5 space-y-4 lg:col-span-2">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm">Ambiente</h3>
            {modoSel === "produccion" && (
              <Badge variant="destructive" className="text-xs">
                <AlertTriangle className="h-3 w-3 mr-1" /> Producción
              </Badge>
            )}
          </div>
          <div className="flex gap-4">
            {(["homologacion", "produccion"] as const).map((m) => (
              <label
                key={m}
                className={`flex items-center gap-2 rounded-lg border p-4 cursor-pointer transition-colors flex-1 ${
                  modoSel === m ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                }`}
              >
                <input
                  type="radio"
                  name="modo"
                  value={m}
                  checked={modoSel === m}
                  onChange={() => setModoSel(m)}
                  className="accent-primary"
                />
                <div>
                  <p className="text-sm font-medium capitalize">{m}</p>
                  <p className="text-xs text-muted-foreground">
                    {m === "homologacion"
                      ? "Pruebas sin efecto real. Recomendado para desarrollo."
                      : "Comprobantes reales ante ARCA. No se puede deshacer fácilmente."}
                  </p>
                </div>
              </label>
            ))}
          </div>
          <Button
            size="sm"
            variant={modoSel === "produccion" ? "destructive" : "default"}
            disabled={saving === "ambiente"}
            onClick={handleGuardarAmbiente}
          >
            {saving === "ambiente" ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
            Guardar ambiente
          </Button>
        </div>
      </div>

      {config.actualizadoPor && (
        <p className="text-xs text-muted-foreground text-right">
          Última actualización:{" "}
          {new Date(config.actualizadoEn).toLocaleString("es-AR")} por {config.actualizadoPor}
        </p>
      )}

      {/* Confirm producción dialog */}
      {confirmProduccion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background rounded-lg border shadow-lg p-6 max-w-md w-full mx-4 space-y-4">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">¿Cambiar a modo PRODUCCIÓN?</h3>
              <p className="text-sm text-muted-foreground">
                Este cambio hará que todos los comprobantes generados sean enviados a ARCA con efecto legal real.
                Asegurate de haber completado y verificado toda la configuración antes de continuar.
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setConfirmProduccion(false)}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={confirmarProduccion}>
                Confirmar — cambiar a Producción
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
