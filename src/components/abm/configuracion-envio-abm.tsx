"use client"

/**
 * ABM para la configuración de envío del sistema (Resend).
 * Muestra el remitente hardcodeado, estado de la API key, permite editar
 * el replyTo y enviar un mail de prueba.
 */

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FormError } from "@/components/ui/form-error"

export interface ConfiguracionEnvioData {
  replyTo: string | null
  resendConfigurado: boolean
  remitente: string
}

export function ConfiguracionEnvioAbm({ config }: { config: ConfiguracionEnvioData }) {
  const [replyTo, setReplyTo] = useState(config.replyTo ?? "")
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [okMsg, setOkMsg] = useState<string | null>(null)

  const [destinatarioPrueba, setDestinatarioPrueba] = useState("")
  const [probando, setProbando] = useState(false)
  const [resultadoPrueba, setResultadoPrueba] = useState<{ ok: boolean; msg: string } | null>(null)

  async function handleGuardar(e: React.FormEvent) {
    e.preventDefault()
    setGuardando(true); setError(null); setOkMsg(null)
    try {
      const body = { replyTo: replyTo.trim() || null }
      const res = await fetch("/api/configuracion-envio", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError((data as { error?: string }).error ?? "Error al guardar")
        return
      }
      setOkMsg("Guardado correctamente.")
    } catch {
      setError("Error de red")
    } finally {
      setGuardando(false)
    }
  }

  async function handleProbar() {
    setProbando(true); setResultadoPrueba(null)
    try {
      const res = await fetch("/api/configuracion-envio/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ destinatario: destinatarioPrueba.trim() }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        setResultadoPrueba({ ok: true, msg: "Envío exitoso. Revisá la casilla." })
      } else {
        setResultadoPrueba({ ok: false, msg: (data as { error?: string }).error ?? "Error al enviar" })
      }
    } catch {
      setResultadoPrueba({ ok: false, msg: "Error de red" })
    } finally {
      setProbando(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">Proveedor</p>
              <p className="font-medium">Resend</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">API Key</p>
              <p className="font-medium">
                {config.resendConfigurado ? (
                  <span className="text-green-700">✓ Configurada</span>
                ) : (
                  <span className="text-destructive">✗ Falta RESEND_API_KEY</span>
                )}
              </p>
            </div>
            <div className="md:col-span-2">
              <p className="text-muted-foreground text-xs">Remitente (From)</p>
              <p className="font-mono text-sm">{config.remitente}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleGuardar} className="space-y-3 max-w-lg">
            <div className="space-y-1">
              <Label htmlFor="replyTo">Responder a (opcional)</Label>
              <Input
                id="replyTo"
                type="email"
                value={replyTo}
                onChange={(e) => setReplyTo(e.target.value)}
                placeholder="contacto@transmagg.com.ar"
                disabled={guardando}
              />
            </div>
            <FormError message={error} />
            {okMsg && <p className="text-sm text-green-700">{okMsg}</p>}
            <Button type="submit" disabled={guardando}>
              {guardando ? "Guardando..." : "Guardar"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-3 max-w-lg">
            <div>
              <h3 className="font-semibold text-sm">Probar envío</h3>
              <p className="text-xs text-muted-foreground">Envía un mail de prueba vía Resend para validar la configuración.</p>
            </div>
            <div className="space-y-1">
              <Label htmlFor="destPrueba">Destinatario</Label>
              <Input
                id="destPrueba"
                type="email"
                value={destinatarioPrueba}
                onChange={(e) => setDestinatarioPrueba(e.target.value)}
                placeholder="tu@email.com"
                disabled={probando}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={handleProbar}
              disabled={probando || !destinatarioPrueba.trim() || !config.resendConfigurado}
            >
              {probando ? "Enviando..." : "Enviar prueba"}
            </Button>
            {resultadoPrueba && (
              <p className={`text-sm ${resultadoPrueba.ok ? "text-green-700" : "text-destructive"}`}>
                {resultadoPrueba.ok ? "✓ " : "✗ "}{resultadoPrueba.msg}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
