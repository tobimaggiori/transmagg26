"use client"

import { useState } from "react"
import { SelectContactoEmail } from "@/components/forms/select-contacto-email"

export function ModalEnviarEmailOP({
  opId,
  opNro,
  fleteroId,
  onCerrar,
}: {
  opId: string
  opNro: number | string
  fleteroId: string
  onCerrar: () => void
}) {
  const [email, setEmail] = useState("")
  const [enviando, setEnviando] = useState(false)
  const [resultado, setResultado] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function enviar() {
    setEnviando(true)
    setError(null)
    setResultado(null)
    try {
      const res = await fetch(`/api/ordenes-pago/${opId}/enviar-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(email ? { emailDestino: email } : {}),
      })
      if (!res.ok) {
        const err = await res.json()
        setError(err.error ?? "Error al enviar el email")
        return
      }
      setResultado(`Email enviado a ${email}`)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
      <div className="bg-background rounded-lg shadow-xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold">Enviar OP Nro {opNro}</h2>
          <button onClick={onCerrar} className="text-muted-foreground hover:text-foreground text-xl leading-none">&times;</button>
        </div>
        {resultado ? (
          <div className="space-y-4">
            <p className="text-sm text-green-700">{resultado}</p>
            <div className="flex justify-end">
              <button onClick={onCerrar} className="h-9 px-4 rounded-md border text-sm font-medium hover:bg-accent">Cerrar</button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Enviar a</label>
              <SelectContactoEmail
                parentId={fleteroId}
                parentType="fletero"
                value={email}
                onChange={setEmail}
                disabled={enviando}
              />
            </div>
            {error && <p className="text-xs text-red-600">{error}</p>}
            <div className="flex justify-end gap-2">
              <button onClick={onCerrar} className="h-9 px-4 rounded-md border text-sm font-medium hover:bg-accent">Cancelar</button>
              <button
                onClick={enviar}
                disabled={enviando || !email}
                className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
              >
                {enviando ? "Enviando..." : "Enviar"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
