"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { useState, useEffect, Suspense } from "react"

const TIPO_CONFIG: Record<string, { label: string; pdfUrl: (id: string) => string; emailUrl: (id: string) => string }> = {
  factura: {
    label: "Factura",
    pdfUrl: (id) => `/api/facturas/${id}/pdf`,
    emailUrl: (id) => `/api/facturas/${id}/enviar-email`,
  },
  liquidacion: {
    label: "Liquidacion",
    pdfUrl: (id) => `/api/liquidaciones/${id}/pdf`,
    emailUrl: (id) => `/api/liquidaciones/${id}/enviar-email`,
  },
  "nota-cd": {
    label: "Nota C/D",
    pdfUrl: (id) => `/api/notas-credito-debito/${id}/pdf`,
    emailUrl: (id) => `/api/notas-credito-debito/${id}/enviar-email`,
  },
}

function VisorContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const tipo = searchParams.get("tipo") ?? "factura"
  const id = searchParams.get("id") ?? ""
  const titulo = searchParams.get("titulo") ?? ""

  const config = TIPO_CONFIG[tipo]
  const [pdfSignedUrl, setPdfSignedUrl] = useState<string | null>(null)
  const [pdfError, setPdfError] = useState<string | null>(null)
  const [emailModalOpen, setEmailModalOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [enviando, setEnviando] = useState(false)
  const [emailMsg, setEmailMsg] = useState<{ ok: boolean; texto: string } | null>(null)

  // Fetch signed URL on mount
  useEffect(() => {
    if (!config || !id) return
    fetch(config.pdfUrl(id))
      .then(async (res) => {
        const data = await res.json()
        if (res.ok && data.url) {
          setPdfSignedUrl(data.url)
        } else {
          setPdfError(data.error ?? "No se pudo obtener el PDF")
        }
      })
      .catch(() => setPdfError("Error de red al obtener el PDF"))
  }, [config, id])

  if (!config || !id) {
    return (
      <div className="flex items-center justify-center h-[60vh] text-muted-foreground">
        Parametros invalidos. Se requiere ?tipo=factura&id=xxx
      </div>
    )
  }

  async function enviarPorEmail() {
    if (!email.trim()) return
    setEnviando(true)
    setEmailMsg(null)
    try {
      const res = await fetch(config!.emailUrl(id), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailDestino: email }),
      })
      const data = await res.json()
      if (!res.ok) {
        setEmailMsg({ ok: false, texto: data.error ?? "Error al enviar" })
        return
      }
      setEmailMsg({ ok: true, texto: `Email enviado a ${data.emailDestino}` })
      setEmail("")
    } catch {
      setEmailMsg({ ok: false, texto: "Error de red al enviar email" })
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Barra superior */}
      <div className="flex items-center gap-3 border-b px-4 py-2 bg-background shrink-0">
        <button
          onClick={() => router.back()}
          className="h-8 px-3 rounded-md border text-sm font-medium hover:bg-accent inline-flex items-center gap-1"
        >
          ← Volver
        </button>
        <h1 className="text-sm font-semibold truncate flex-1">
          {titulo || `${config.label} — ${id.slice(0, 8)}`}
        </h1>
        <div className="flex items-center gap-2">
          {pdfSignedUrl && (
            <>
              <button
                onClick={() => { window.location.href = pdfSignedUrl }}
                className="h-8 px-3 rounded-md border text-sm font-medium hover:bg-accent"
              >
                Ver PDF
              </button>
              <button
                onClick={() => setEmailModalOpen(!emailModalOpen)}
                className="h-8 px-3 rounded-md border text-sm font-medium hover:bg-accent"
              >
                Enviar por email
              </button>
              <a
                href={pdfSignedUrl}
                download
                className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 inline-flex items-center"
              >
                Descargar
              </a>
            </>
          )}
        </div>
      </div>

      {/* Form de email */}
      {emailModalOpen && (
        <div className="border-b px-4 py-3 bg-muted/30 shrink-0 space-y-2">
          <div className="flex gap-2 items-center max-w-md">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@ejemplo.com"
              className="flex-1 h-8 rounded-md border border-input bg-background px-3 text-sm"
              onKeyDown={(e) => e.key === "Enter" && enviarPorEmail()}
            />
            <button
              onClick={enviarPorEmail}
              disabled={enviando || !email.trim()}
              className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
            >
              {enviando ? "Enviando..." : "Enviar"}
            </button>
            <button
              onClick={() => { setEmailModalOpen(false); setEmailMsg(null) }}
              className="h-8 px-2 rounded-md border text-sm hover:bg-accent"
            >
              ✕
            </button>
          </div>
          {emailMsg && (
            <p className={`text-xs ${emailMsg.ok ? "text-green-700" : "text-destructive"}`}>
              {emailMsg.texto}
            </p>
          )}
        </div>
      )}

      {/* PDF inline */}
      <div className="flex-1 min-h-0">
        {pdfError && (
          <div className="flex items-center justify-center h-full text-destructive text-sm">
            {pdfError}
          </div>
        )}
        {!pdfSignedUrl && !pdfError && (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            Cargando PDF...
          </div>
        )}
        {pdfSignedUrl && (
          <iframe
            src={pdfSignedUrl}
            className="w-full h-full border-0"
            title={`PDF ${config.label}`}
          />
        )}
      </div>
    </div>
  )
}

export default function VisorPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-[60vh] text-muted-foreground">Cargando visor...</div>}>
      <VisorContent />
    </Suspense>
  )
}
