"use client"

/**
 * Propósito: Botón que abre un PDF almacenado en R2 en una nueva pestaña.
 * Obtiene una URL temporal firmada antes de abrir para no exponer credenciales.
 */

import { useState } from "react"
import { Button } from "@/components/ui/button"

interface ViewPDFProps {
  /** Key del archivo en R2 (ej: "liquidaciones/uuid.pdf") */
  s3Key: string | null | undefined
  /** Texto del botón (default: "Ver PDF") */
  label?: string
  /** Variante del botón shadcn */
  variant?: "default" | "outline" | "ghost" | "secondary" | "destructive" | "link"
  /** Tamaño del botón shadcn */
  size?: "default" | "sm" | "lg" | "icon"
}

/**
 * ViewPDF: ViewPDFProps -> JSX.Element | null
 *
 * Dado la key de un archivo en R2, renderiza un botón que al hacer click obtiene
 * una URL firmada y abre el PDF en una nueva pestaña.
 * Si la key es null o undefined, no renderiza nada.
 * Existe para mostrar un botón "Ver PDF" de forma consistente en toda la UI.
 *
 * Ejemplos:
 * <ViewPDF s3Key="liquidaciones/uuid.pdf" />
 * // => botón "Ver PDF", al clicar abre el PDF en nueva pestaña
 * <ViewPDF s3Key={null} />
 * // => null (no renderiza)
 * <ViewPDF s3Key="facturas-emitidas/uuid.pdf" label="Descargar" variant="outline" />
 * // => botón "Descargar" con estilo outline
 */
export function ViewPDF({
  s3Key,
  label = "Ver PDF",
  variant = "outline",
  size = "sm",
}: ViewPDFProps) {
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState("")

  if (!s3Key) return null

  async function abrir() {
    setError("")
    setCargando(true)
    try {
      const res = await fetch(`/api/storage/signed-url?key=${encodeURIComponent(s3Key!)}`)
      const data = await res.json()
      if (res.ok && data.url) {
        window.location.href = data.url as string
      } else {
        setError(data.error ?? "No se pudo obtener la URL del archivo")
      }
    } catch {
      setError("Error de red al obtener la URL")
    } finally {
      setCargando(false)
    }
  }

  return (
    <span className="inline-flex flex-col items-start gap-0.5">
      <Button
        type="button"
        variant={variant}
        size={size}
        onClick={abrir}
        disabled={cargando}
      >
        {cargando ? "Cargando..." : label}
      </Button>
      {error && <span className="text-xs text-destructive">{error}</span>}
    </span>
  )
}
