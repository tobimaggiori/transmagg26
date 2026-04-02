"use client"

/**
 * Componente ABM para configuración SMTP del servidor de OTP (singleton).
 * Solo visible para ADMIN_TRANSMAGG.
 */

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, CheckCircle2, XCircle, Loader2 } from "lucide-react"

export interface ConfiguracionOtpProps {
  config: {
    host: string | null
    puerto: number | null
    usuario: string | null
    tienePassword: boolean
    usarSsl: boolean
    emailRemitente: string | null
    nombreRemitente: string | null
    activo: boolean
  } | null
}

/**
 * ConfiguracionOtpAbm: ConfiguracionOtpProps -> JSX.Element
 *
 * Muestra el formulario de configuración SMTP para el envío de códigos OTP.
 * Es un singleton — guarda o actualiza siempre el mismo registro.
 */
export function ConfiguracionOtpAbm({ config }: ConfiguracionOtpProps) {
  const [form, setForm] = useState({
    host: config?.host ?? "",
    puerto: config?.puerto ? String(config.puerto) : "587",
    usuario: config?.usuario ?? "",
    password: "",
    usarSsl: config?.usarSsl ?? true,
    emailRemitente: config?.emailRemitente ?? "",
    nombreRemitente: config?.nombreRemitente ?? "",
    activo: config?.activo ?? true,
  })
  const [mostrarPassword, setMostrarPassword] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [testeando, setTesteando] = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null)
  const [savedOk, setSavedOk] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value, type, checked } = e.target
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }))
    setTestResult(null)
    setSavedOk(false)
  }

  async function handleTestear() {
    setTesteando(true)
    setTestResult(null)
    setError(null)
    try {
      const res = await fetch("/api/configuracion-otp/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          host: form.host,
          puerto: parseInt(form.puerto, 10),
          usuario: form.usuario,
          password: form.password || undefined,
          usarSsl: form.usarSsl,
        }),
      })
      const data = await res.json().catch(() => ({}))
      setTestResult({ ok: data.ok, msg: data.mensaje ?? (data.ok ? "Conexión exitosa" : "Conexión fallida") })
    } catch {
      setTestResult({ ok: false, msg: "Error de red" })
    } finally {
      setTesteando(false)
    }
  }

  async function handleGuardar(e: React.FormEvent) {
    e.preventDefault()
    setGuardando(true)
    setError(null)
    setSavedOk(false)
    try {
      const res = await fetch("/api/configuracion-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          host: form.host,
          puerto: parseInt(form.puerto, 10),
          usuario: form.usuario,
          password: form.password || undefined,
          usarSsl: form.usarSsl,
          emailRemitente: form.emailRemitente,
          nombreRemitente: form.nombreRemitente,
          activo: form.activo,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError((data as { error?: string }).error ?? `Error ${res.status} al guardar`)
        return
      }
      setSavedOk(true)
      setForm((prev) => ({ ...prev, password: "" }))
    } catch {
      setError("Error de red al guardar.")
    } finally {
      setGuardando(false)
    }
  }

  const tieneConfigActual = !!(config?.host)

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <div>
          <h3 className="font-semibold">Servidor de correo para códigos OTP</h3>
          <p className="text-sm text-muted-foreground">
            Configuración global del SMTP usado para enviar códigos de acceso al sistema.
          </p>
        </div>
        <span className={`ml-auto inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
          tieneConfigActual && config?.activo
            ? "bg-green-100 text-green-800"
            : "bg-gray-100 text-gray-600"
        }`}>
          {tieneConfigActual && config?.activo ? "● Activo" : "○ Sin configurar"}
        </span>
      </div>

      <form onSubmit={handleGuardar} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1 col-span-2 sm:col-span-1">
            <Label htmlFor="host">Host SMTP *</Label>
            <Input
              id="host" name="host" value={form.host}
              onChange={handleChange} placeholder="smtp.gmail.com"
              required disabled={guardando}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="puerto">Puerto *</Label>
            <Input
              id="puerto" name="puerto" type="number" value={form.puerto}
              onChange={handleChange} placeholder="587"
              required disabled={guardando}
            />
          </div>
        </div>

        <div className="space-y-1">
          <Label htmlFor="usuario">Usuario SMTP *</Label>
          <Input
            id="usuario" name="usuario" value={form.usuario}
            onChange={handleChange} placeholder="noreply@transmagg.com.ar"
            required disabled={guardando}
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="password">
            Contraseña SMTP
            {config?.tienePassword && (
              <span className="text-xs text-muted-foreground ml-2">(ya configurada — dejar vacío para no cambiar)</span>
            )}
          </Label>
          <div className="relative">
            <Input
              id="password" name="password"
              type={mostrarPassword ? "text" : "password"}
              value={form.password}
              onChange={handleChange}
              placeholder={config?.tienePassword ? "••••••••" : "Contraseña"}
              disabled={guardando}
              autoComplete="new-password"
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setMostrarPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {mostrarPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="flex gap-6">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="radio" name="cifrado" value="ssl"
              checked={form.usarSsl}
              onChange={() => setForm((p) => ({ ...p, usarSsl: true }))}
              disabled={guardando}
            />
            SSL/TLS (puerto 465)
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="radio" name="cifrado" value="starttls"
              checked={!form.usarSsl}
              onChange={() => setForm((p) => ({ ...p, usarSsl: false }))}
              disabled={guardando}
            />
            STARTTLS (puerto 587)
          </label>
        </div>

        <div className="border-t pt-4 grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="emailRemitente">Email remitente *</Label>
            <Input
              id="emailRemitente" name="emailRemitente" type="email" value={form.emailRemitente}
              onChange={handleChange} placeholder="noreply@transmagg.com.ar"
              required disabled={guardando}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="nombreRemitente">Nombre remitente *</Label>
            <Input
              id="nombreRemitente" name="nombreRemitente" value={form.nombreRemitente}
              onChange={handleChange} placeholder="Trans-Magg S.R.L."
              required disabled={guardando}
            />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox" name="activo" checked={form.activo}
            onChange={handleChange}
            className="h-4 w-4 rounded border-input"
            disabled={guardando}
          />
          Activo (usar este servidor para enviar OTPs)
        </label>

        {testResult && (
          <p className={`text-sm font-medium flex items-center gap-1.5 ${testResult.ok ? "text-green-600" : "text-destructive"}`}>
            {testResult.ok
              ? <CheckCircle2 className="h-4 w-4" />
              : <XCircle className="h-4 w-4" />
            }
            {testResult.msg}
          </p>
        )}

        {savedOk && (
          <p className="text-sm font-medium text-green-600 flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4" /> Configuración guardada correctamente.
          </p>
        )}

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleTestear}
            disabled={guardando || testeando || !form.host || (!form.password && !config?.tienePassword)}
          >
            {testeando ? <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> Testeando...</> : "Testear conexión"}
          </Button>
          <Button type="submit" disabled={guardando || testeando}>
            {guardando ? <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> Guardando...</> : "Guardar configuración"}
          </Button>
        </div>
      </form>
    </div>
  )
}
