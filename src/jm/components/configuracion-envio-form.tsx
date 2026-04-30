"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FormError } from "@/components/ui/form-error"

export function ConfiguracionEnvioFormJm({ replyToInicial }: { replyToInicial: string | null }) {
  const router = useRouter()
  const [replyTo, setReplyTo] = useState(replyToInicial ?? "")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError(null); setSuccess(false)
    try {
      const res = await fetch("/api/jm/configuracion-envio", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ replyTo: replyTo.trim() || null }),
      })
      if (!res.ok) {
        const d = await res.json()
        setError(d.error ?? "Error al guardar")
      } else {
        setSuccess(true)
        router.refresh()
      }
    } finally { setLoading(false) }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <Label>Reply-to</Label>
        <Input type="email" value={replyTo} onChange={(e) => setReplyTo(e.target.value)} placeholder="ejemplo@dominio.com" />
      </div>
      {error && <FormError message={error} />}
      {success && <p className="text-sm text-green-600">Configuración guardada.</p>}
      <Button type="submit" disabled={loading}>{loading ? "Guardando..." : "Guardar"}</Button>
    </form>
  )
}
