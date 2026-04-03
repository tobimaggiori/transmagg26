"use client"

/**
 * Proposito: Componente cliente para generar y listar Libros de IIBB (Convenio Multilateral Art. 9).
 * Permite seleccionar mes/anio, confirmar generacion con modal, ver lista de libros generados
 * y abrir los PDFs generados en el visor global.
 */

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { PDFViewer } from "@/components/ui/pdf-viewer"
import { usePDFViewer } from "@/hooks/use-pdf-viewer"
import { formatearFecha } from "@/lib/utils"

type LibroIibb = {
  id: string
  mesAnio: string
  pdfS3Key: string | null
  generadoEn: string
  operador: { nombre: string; apellido: string }
}

type Props = {
  libros: LibroIibb[]
}

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

/**
 * LibroIibbClient: Props -> JSX.Element
 *
 * Dado la lista de libros IIBB previamente generados, renderiza la seccion
 * de generacion del Libro de IIBB con selector de periodo, modal de confirmacion,
 * lista de libros generados y visor PDF integrado.
 */
export function LibroIibbClient({ libros: librosIniciales }: Props) {
  const anioActual = new Date().getFullYear()
  const mesActual = String(new Date().getMonth() + 1).padStart(2, "0")

  const [mes, setMes] = useState(mesActual)
  const [anio, setAnio] = useState(String(anioActual))
  const [libros, setLibros] = useState<LibroIibb[]>(librosIniciales)

  const [confirmando, setConfirmando] = useState(false)
  const [generando, setGenerando] = useState(false)
  const [errorGenerar, setErrorGenerar] = useState<string | null>(null)

  // Cargar libros desde la API al montar (por si el server no los pasa)
  useEffect(() => {
    fetch("/api/iibb/libros")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setLibros(data as LibroIibb[])
      })
      .catch(() => {
        // API no disponible todavia — no hacer nada
      })
  }, [])

  const { estado: estadoPDF, abrirPDF, cerrarPDF } = usePDFViewer()

  const mesAnioSeleccionado = `${anio}-${mes}`
  const yaGenerado = libros.some((l) => l.mesAnio === mesAnioSeleccionado)

  async function handleGenerar() {
    setGenerando(true)
    setErrorGenerar(null)
    try {
      const res = await fetch("/api/iibb/generar", {
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
          titulo: `Libro IIBB — ${nombreMes(mesAnioSeleccionado)}`,
        })
      }

      // Recargar lista de libros
      const resLibros = await fetch("/api/iibb/libros")
      if (resLibros.ok) {
        const nuevosLibros = (await resLibros.json()) as LibroIibb[]
        setLibros(nuevosLibros)
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
            Libro de IIBB — Convenio Multilateral Art. 9°
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

          {/* Lista de libros generados */}
          {libros.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Libros generados</p>
              <div className="border rounded overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">
                        Periodo
                      </th>
                      <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">
                        Generado en
                      </th>
                      <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">
                        Operador
                      </th>
                      <th className="px-3 py-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {libros.map((l) => (
                      <tr key={l.id} className="border-t">
                        <td className="px-3 py-2 font-medium">
                          {nombreMes(l.mesAnio)}
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">
                          {formatearFecha(l.generadoEn)}
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">
                          {l.operador.nombre} {l.operador.apellido}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex gap-2 justify-end">
                            {l.pdfS3Key && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  abrirPDF({
                                    s3Key: l.pdfS3Key!,
                                    titulo: `Libro IIBB — ${nombreMes(l.mesAnio)}`,
                                  })
                                }
                              >
                                Ver PDF
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
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
              Generar Libro de IIBB — {nombreMes(mesAnioSeleccionado)}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <div className="bg-muted/30 border rounded p-3 space-y-1 text-xs">
              <p className="font-medium">Este libro incluira:</p>
              <ul className="list-disc ml-4 space-y-0.5 text-muted-foreground">
                <li>Viajes facturados a empresas en el periodo</li>
                <li>Agrupados por provincia de origen</li>
                <li>
                  Base imponible = diferencia de tarifa + comision del LP
                </li>
                <li>Percepciones y retenciones de IIBB sufridas</li>
              </ul>
            </div>

            {yaGenerado && (
              <p className="text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2 text-xs">
                Si ya existe un libro para este periodo, sera reemplazado.
              </p>
            )}

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
