"use client"

import { useState, useCallback } from "react"

interface PDFViewerState {
  isOpen: boolean
  pdfUrl: string
  titulo: string
  emailsDisponibles: string[]
  onEnviarMail?: (email: string) => Promise<void>
}

export function usePDFViewer() {
  const [estado, setEstado] = useState<PDFViewerState>({
    isOpen: false,
    pdfUrl: "",
    titulo: "",
    emailsDisponibles: [],
  })

  const abrirPDF = useCallback(
    async (params: {
      s3Key: string
      titulo: string
      emailsDisponibles?: string[]
      onEnviarMail?: (email: string) => Promise<void>
    }) => {
      try {
        const res = await fetch(`/api/storage/signed-url?key=${encodeURIComponent(params.s3Key)}`)
        const data = await res.json()
        if (res.ok && data.url) {
          setEstado({
            isOpen: true,
            pdfUrl: data.url as string,
            titulo: params.titulo,
            emailsDisponibles: params.emailsDisponibles ?? [],
            onEnviarMail: params.onEnviarMail,
          })
        }
      } catch {
        // silently fail — PDF cannot be opened
      }
    },
    []
  )

  const cerrarPDF = useCallback(() => setEstado((e) => ({ ...e, isOpen: false })), [])

  return { estado, abrirPDF, cerrarPDF }
}
