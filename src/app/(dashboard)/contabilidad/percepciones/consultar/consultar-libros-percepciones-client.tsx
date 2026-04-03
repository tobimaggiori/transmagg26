"use client"

/**
 * Proposito: Componente cliente para consultar Libros de Percepciones generados.
 * Carga la lista desde la API, muestra tabla con periodo, fecha de generacion,
 * operador y boton para abrir el PDF en el visor global.
 */

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PDFViewer } from "@/components/ui/pdf-viewer"
import { usePDFViewer } from "@/hooks/use-pdf-viewer"
import { formatearFecha } from "@/lib/utils"

type LibroPercepcion = {
  id: string
  mesAnio: string
  pdfS3Key: string | null
  generadoEn: string
  operador: { nombre: string; apellido: string }
}

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
]

function nombreMes(mesAnio: string): string {
  const [anio, mes] = mesAnio.split("-")
  const idx = parseInt(mes, 10) - 1
  return `${MESES[idx] ?? mes} ${anio}`
}

export function ConsultarLibrosPercepcionesClient() {
  const [libros, setLibros] = useState<LibroPercepcion[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { estado: estadoPDF, abrirPDF, cerrarPDF } = usePDFViewer()

  useEffect(() => {
    fetch("/api/percepciones/libros")
      .then((res) => {
        if (!res.ok) throw new Error("Error al cargar libros")
        return res.json()
      })
      .then((data) => {
        setLibros(data as LibroPercepcion[])
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Error de conexion")
      })
      .finally(() => setCargando(false))
  }, [])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Libros generados</CardTitle>
        </CardHeader>
        <CardContent>
          {cargando && (
            <p className="text-sm text-muted-foreground">Cargando...</p>
          )}

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
              {error}
            </p>
          )}

          {!cargando && !error && libros.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No hay libros de percepciones generados.
            </p>
          )}

          {!cargando && libros.length > 0 && (
            <div className="border rounded overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">
                      Periodo
                    </th>
                    <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">
                      Generado
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
                                  titulo: `Libro Percepciones — ${nombreMes(l.mesAnio)}`,
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
          )}
        </CardContent>
      </Card>

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
