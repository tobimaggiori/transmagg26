"use client"

/**
 * Botón "Buscar" para autocompletar razonSocial y direccion
 * desde el servicio AFIP `ws_sr_padron_a13`. Reusable en ABMs.
 */

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Search, Loader2 } from "lucide-react"

type Props = {
  cuit: string
  /** Callback al recibir resultado: actualizá los inputs del form. */
  onResultado: (data: {
    razonSocial: string
    direccion: string
    condicionIva: string | null
  }) => void
  disabled?: boolean
}

export function BotonBuscarPadron({ cuit, onResultado, disabled }: Props) {
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  const cuitLimpio = cuit.replace(/\D/g, "")
  const cuitValido = cuitLimpio.length === 11

  async function buscar() {
    setMsg(null)
    setLoading(true)
    try {
      const r = await fetch(`/api/padron/${cuitLimpio}`)
      const data = await r.json()
      if (!r.ok) {
        setMsg(data.error ?? "Error consultando padrón")
        return
      }
      onResultado({
        razonSocial: data.razonSocial ?? "",
        direccion: data.direccion ?? "",
        condicionIva: data.condicionIva ?? null,
      })
      setMsg(`✓ ${data.razonSocial || "Encontrado"}`)
    } catch {
      setMsg("Error de red")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-1">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={buscar}
        disabled={disabled || loading || !cuitValido}
        title={cuitValido ? "Consultar AFIP padrón A13" : "Ingresá un CUIT de 11 dígitos"}
      >
        {loading ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Search className="h-3 w-3 mr-1" />}
        Buscar
      </Button>
      {msg && <p className="text-xs text-muted-foreground">{msg}</p>}
    </div>
  )
}
