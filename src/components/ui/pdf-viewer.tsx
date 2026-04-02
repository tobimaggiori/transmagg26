"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Printer, Download, Mail, X } from "lucide-react"

interface PDFViewerProps {
  isOpen: boolean
  onClose: () => void
  pdfUrl: string
  titulo: string
  emailsDisponibles?: string[]
  onEnviarMail?: (email: string) => Promise<void>
}

export function PDFViewer({
  isOpen,
  onClose,
  pdfUrl,
  titulo,
  emailsDisponibles,
  onEnviarMail,
}: PDFViewerProps) {
  const [mostrandoMail, setMostrandoMail] = useState(false)
  const [emailDestino, setEmailDestino] = useState("")
  const [enviando, setEnviando] = useState(false)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex flex-col">
      {/* Barra superior */}
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between shrink-0">
        <h2 className="font-semibold text-sm truncate max-w-[50%]">{titulo}</h2>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const iframe = document.getElementById("pdf-iframe") as HTMLIFrameElement
              iframe?.contentWindow?.print()
            }}
          >
            <Printer className="h-4 w-4 mr-1" />
            Imprimir
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const a = document.createElement("a")
              a.href = pdfUrl
              a.download = `${titulo}.pdf`
              a.click()
            }}
          >
            <Download className="h-4 w-4 mr-1" />
            Descargar
          </Button>

          {onEnviarMail && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMostrandoMail(!mostrandoMail)}
            >
              <Mail className="h-4 w-4 mr-1" />
              Enviar por mail
            </Button>
          )}

          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Panel de envio de mail */}
      {mostrandoMail && (
        <div className="bg-gray-50 border-b px-4 py-3 flex items-center gap-3 shrink-0">
          {emailsDisponibles && emailsDisponibles.length > 0 ? (
            <select
              className="border rounded px-3 py-1.5 text-sm flex-1 max-w-xs"
              value={emailDestino}
              onChange={(e) => setEmailDestino(e.target.value)}
            >
              <option value="">Seleccionar un mail...</option>
              {emailsDisponibles.map((email) => (
                <option key={email} value={email}>
                  {email}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="email"
              placeholder="Ingresá un email..."
              className="border rounded px-3 py-1.5 text-sm flex-1 max-w-xs"
              value={emailDestino}
              onChange={(e) => setEmailDestino(e.target.value)}
            />
          )}
          <Button
            size="sm"
            disabled={!emailDestino || enviando}
            onClick={async () => {
              setEnviando(true)
              await onEnviarMail?.(emailDestino)
              setEnviando(false)
              setMostrandoMail(false)
              setEmailDestino("")
            }}
          >
            {enviando ? "Enviando..." : "Enviar"}
          </Button>
        </div>
      )}

      {/* Visor del PDF */}
      <div className="flex-1 bg-gray-200">
        <iframe
          id="pdf-iframe"
          src={`${pdfUrl}#toolbar=0`}
          className="w-full h-full border-0"
          title={titulo}
        />
      </div>
    </div>
  )
}
