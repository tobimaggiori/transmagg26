"use client"

/**
 * Propósito: Componente para subir un PDF a Cloudflare R2 desde formularios.
 * Muestra estado de subida, errores, y enlace para ver el PDF ya subido.
 */

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import type { StoragePrefijo } from "@/lib/storage"

interface UploadPDFProps {
  /** Carpeta de destino en el bucket R2 */
  prefijo: StoragePrefijo
  /** Callback invocado con la key al terminar la subida exitosamente */
  onUpload: (key: string) => void
  /** Texto del botón principal (default: "Subir PDF") */
  label?: string
  disabled?: boolean
  /** Si ya hay un archivo subido, mostrar "Ver PDF" + opción de reemplazar */
  s3Key?: string
  /** Indica visualmente que el campo es obligatorio */
  required?: boolean
  /** Si true, sube el PDF inmediatamente al seleccionarlo (sin botón "Subir") */
  autoUpload?: boolean
}

/**
 * UploadPDF: UploadPDFProps -> JSX.Element
 *
 * Dado un prefijo de destino y un callback onUpload, renderiza un input de archivo
 * con flujo de subida a R2. Muestra estados: vacío, archivo seleccionado, subiendo,
 * subido con botón "Ver", y error.
 * Existe para reutilizar la lógica de subida en cualquier formulario del sistema.
 *
 * Ejemplos:
 * <UploadPDF prefijo="liquidaciones" onUpload={(key) => setLiqPdfKey(key)} />
 * <UploadPDF prefijo="facturas-proveedor" s3Key="facturas-proveedor/uuid.pdf" onUpload={...} />
 */
export function UploadPDF({
  prefijo,
  onUpload,
  label = "Subir PDF",
  disabled = false,
  s3Key,
  required = false,
  autoUpload = false,
}: UploadPDFProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [archivoSeleccionado, setArchivoSeleccionado] = useState<File | null>(null)
  const [subiendo, setSubiendo] = useState(false)
  const [keySubida, setKeySubida] = useState<string | null>(s3Key ?? null)
  const [nombreSubido, setNombreSubido] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [reemplazando, setReemplazando] = useState(false)
  const [cargandoUrl, setCargandoUrl] = useState(false)

  // Sincronizar estado interno con el prop s3Key: si el padre lo cambia (p.ej.
  // al resetear el formulario tras cargar un viaje), limpiamos la vista.
  useEffect(() => {
    setKeySubida(s3Key ?? null)
    if (!s3Key) {
      setArchivoSeleccionado(null)
      setNombreSubido(null)
      setReemplazando(false)
      setError("")
      if (inputRef.current) inputRef.current.value = ""
    }
  }, [s3Key])

  function alSeleccionarArchivo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    setError("")
    if (file && file.type !== "application/pdf") {
      setError("Solo se aceptan archivos PDF")
      setArchivoSeleccionado(null)
      return
    }
    if (file && file.size > 10 * 1024 * 1024) {
      setError("El archivo supera el límite de 10 MB")
      setArchivoSeleccionado(null)
      return
    }
    setArchivoSeleccionado(file)
    if (autoUpload && file) {
      void subir(file)
    }
  }

  async function subir(archivo?: File) {
    const target = archivo ?? archivoSeleccionado
    if (!target) return
    setError("")
    setSubiendo(true)
    try {
      const formData = new FormData()
      formData.append("file", target)
      formData.append("prefijo", prefijo)
      const res = await fetch("/api/storage/upload", { method: "POST", body: formData })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Error al subir el archivo")
      } else {
        setKeySubida(data.key as string)
        setNombreSubido(target.name)
        setArchivoSeleccionado(null)
        setReemplazando(false)
        onUpload(data.key as string)
      }
    } catch {
      setError("Error de red al subir el archivo")
    } finally {
      setSubiendo(false)
    }
  }

  async function verPDF(key: string) {
    setCargandoUrl(true)
    try {
      const res = await fetch(`/api/storage/signed-url?key=${encodeURIComponent(key)}`)
      const data = await res.json()
      if (res.ok && data.url) {
        window.open(data.url as string, "_blank", "noopener,noreferrer")
      } else {
        setError(data.error ?? "No se pudo obtener la URL del archivo")
      }
    } catch {
      setError("Error de red al obtener la URL")
    } finally {
      setCargandoUrl(false)
    }
  }

  // Estado: ya hay PDF subido y no está reemplazando
  if (keySubida && !reemplazando) {
    const nombreVisible = nombreSubido ?? keySubida.split("/").pop() ?? "documento.pdf"
    return (
      <div className="flex items-center gap-3 flex-wrap text-sm">
        <button
          type="button"
          onClick={() => verPDF(keySubida)}
          disabled={cargandoUrl}
          className="text-primary hover:underline font-medium truncate max-w-[260px] disabled:opacity-50"
          title={nombreVisible}
        >
          {cargandoUrl ? "Cargando..." : nombreVisible}
        </button>
        {!disabled && (
          <button
            type="button"
            onClick={() => { setReemplazando(true); setArchivoSeleccionado(null); setError("") }}
            className="text-xs text-muted-foreground hover:text-foreground underline"
          >
            Reemplazar
          </button>
        )}
        {error && <p className="w-full text-xs text-destructive">{error}</p>}
      </div>
    )
  }

  // Estado: seleccionar archivo / subiendo
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={alSeleccionarArchivo}
          disabled={disabled || subiendo}
          required={required && !keySubida}
          className="hidden"
          id={`upload-pdf-${prefijo}`}
        />
        {!archivoSeleccionado ? (
          <label htmlFor={`upload-pdf-${prefijo}`}>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={disabled || subiendo}
              onClick={() => inputRef.current?.click()}
            >
              {label}{required && <span className="text-destructive ml-0.5">*</span>}
            </Button>
          </label>
        ) : (
          <>
            <span className="text-sm text-muted-foreground truncate max-w-[200px]">
              {archivoSeleccionado.name}
            </span>
            {autoUpload ? (
              <span className="text-sm text-muted-foreground">
                {subiendo ? "Subiendo..." : ""}
              </span>
            ) : (
              <>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => subir()}
                  disabled={subiendo}
                >
                  {subiendo ? "Subiendo..." : "Subir"}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => { setArchivoSeleccionado(null); setError(""); if (inputRef.current) inputRef.current.value = "" }}
                  disabled={subiendo}
                  className="text-muted-foreground"
                >
                  Cancelar
                </Button>
              </>
            )}
          </>
        )}
        {reemplazando && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => { setReemplazando(false); setError("") }}
            className="text-muted-foreground"
          >
            ← Volver
          </Button>
        )}
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
