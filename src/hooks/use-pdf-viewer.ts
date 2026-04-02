"use client"

import { useState, useCallback } from "react"

interface PDFViewerState {
  isOpen: boolean
  pdfUrl: string
  titulo: string
  emailsDisponibles: string[]
  onEnviarMail?: (email: string) => Promise<void>
}

type AbrirPDFParams = {
  titulo: string
  emailsDisponibles?: string[]
  onEnviarMail?: (email: string) => Promise<void>
} & (
  | { s3Key: string; url?: never; fetchUrl?: never }
  | { url: string; s3Key?: never; fetchUrl?: never }
  | { fetchUrl: string; s3Key?: never; url?: never }
)

export function usePDFViewer() {
  const [estado, setEstado] = useState<PDFViewerState>({
    isOpen: false,
    pdfUrl: "",
    titulo: "",
    emailsDisponibles: [],
  })

  const abrirPDF = useCallback(async (params: AbrirPDFParams) => {
    try {
      let pdfUrl: string

      if ("url" in params && params.url) {
        // Direct URL provided
        pdfUrl = params.url
      } else if ("fetchUrl" in params && params.fetchUrl) {
        // Fetch URL from an endpoint that returns { url }
        const res = await fetch(params.fetchUrl)
        const data = await res.json()
        if (!res.ok || !data.url) return
        pdfUrl = data.url as string
      } else {
        // s3Key — get signed URL
        const res = await fetch(`/api/storage/signed-url?key=${encodeURIComponent(params.s3Key!)}`)
        const data = await res.json()
        if (!res.ok || !data.url) return
        pdfUrl = data.url as string
      }

      setEstado({
        isOpen: true,
        pdfUrl,
        titulo: params.titulo,
        emailsDisponibles: params.emailsDisponibles ?? [],
        onEnviarMail: params.onEnviarMail,
      })
    } catch {
      // silently fail
    }
  }, [])

  const cerrarPDF = useCallback(() => setEstado((e) => ({ ...e, isOpen: false })), [])

  return { estado, abrirPDF, cerrarPDF }
}
