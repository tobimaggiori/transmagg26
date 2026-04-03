"use client"

/**
 * Proposito: Componente cliente para generar Libros de Percepciones.
 * Permite seleccionar mes/anio, confirmar generacion con modal
 * y abrir el PDF generado en el visor global.
 */

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { PDFViewer } from "@/components/ui/pdf-viewer"
import { usePDFViewer } from "@/hooks/use-pdf-viewer"

const MESES = [
  { value: "01", label: "Enero" },
  { value: "02", label: "Febrero" },
  { value: "03", label: "Marzo" },
  { value: "04", label: "Abril" },
  { value: "05", label: "Mayo" },
  { value: "06", label: "Junio" },
  { value: "07", label: "Julio" },
  { value: "08", label: "Agosto" },
  { value: "09", label: "Septiembre" },
  { value: "10", label: "Octubre" },
  { value: "11", label: "Noviembre" },
  { value: "12", label: "Diciembre" },
]

function nombreMes(mesAnio: string): string {
  const [anio, mes] = mesAnio.split("-")
  return `${MESES.find((m) => m.value === mes)?.label ?? mes} ${anio}`
}

export function GenerarLibroPercepcionesClient() {
  const anioActual = new Date().getFullYear()
  const mesActual = String(new Date().getMonth() + 1).padStart(2, "0")

  const [mes, setMes] = useState(mesActual)
  const [anio, setAnio] = useState(String(anioActual))

  const [confirmando, setConfirmando] = useState(false)
  const [generando, setGenerando] = useState(false)
  const [errorGenerar, setErrorGenerar] = useState<string | null>(null)

  const { estado: estadoPDF, abrirPDF, cerrarPDF } = usePDFViewer()

  const mesAnioSeleccionado = `${anio}-${mes}`

  async function handleGenerar() {
    setGenerando(true)
    setErrorGenerar(null)
    try {
      const res = await fetch("/api/percepciones/generar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mesAnio: mesAnioSeleccionado }),
      })
      const data = (await res.json()) as {
        ok?: boolean
        pdfS3Key?: string
        error?: string
      }
      if (!res.ok) {
        setErrorGenerar(data.error ?? "Error al generar el libro")
        return
      }
      setConfirmando(false)

      // Abrir PDF automaticamente
      if (data.pdfS3Key) {
        abrirPDF({
          s3Key: data.pdfS3Key,
          titulo: `Libro Percepciones — ${nombreMes(mesAnioSeleccionado)}`,
        })
      }
    } catch {
      setErrorGenerar("Error de conexion")
    } finally {
      setGenerando(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Libro de Percepciones — Generacion Mensual
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Selector de periodo + boton generar */}
          <div className="flex items-end gap-3">
            <div className="space-y-1.5">
              <Label>Mes</Label>
              <Select
                value={mes}
                onChange={(e) => setMes(e.target.value)}
                className="w-36"
              >
                {MESES.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Anio</Label>
              <Select
                value={anio}
                onChange={(e) => setAnio(e.target.value)}
                className="w-24"
              >
                {[anioActual + 1, anioActual, anioActual - 1, anioActual - 2].map(
                  (a) => (
                    <option key={a} value={String(a)}>
                      {a}
                    </option>
                  )
                )}
              </Select>
            </div>
            <Button onClick={() => setConfirmando(true)}>Generar libro</Button>
          </div>
        </CardContent>
      </Card>

      {/* Modal de confirmacion */}
      <Dialog
        open={confirmando}
        onOpenChange={(open) => !open && setConfirmando(false)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Generar Libro de Percepciones — {nombreMes(mesAnioSeleccionado)}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <div className="bg-muted/30 border rounded p-3 space-y-1 text-xs">
              <p className="font-medium">Este libro incluira:</p>
              <ul className="list-disc ml-4 space-y-0.5 text-muted-foreground">
                <li>Percepciones aplicadas en facturas del periodo</li>
                <li>Detalle por comprobante, empresa y monto percibido</li>
              </ul>
            </div>

            {errorGenerar && (
              <p className="text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
                {errorGenerar}
              </p>
            )}

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setConfirmando(false)}
                disabled={generando}
              >
                Cancelar
              </Button>
              <Button onClick={handleGenerar} disabled={generando}>
                {generando ? "Generando..." : "Confirmar y generar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Visor PDF global */}
      <PDFViewer
        isOpen={estadoPDF.isOpen}
        onClose={cerrarPDF}
        pdfUrl={estadoPDF.pdfUrl}
        titulo={estadoPDF.titulo}
      />
    </div>
  )
}
