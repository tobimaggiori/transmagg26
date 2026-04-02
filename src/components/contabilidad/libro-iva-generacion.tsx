"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ViewPDF } from "@/components/view-pdf"
import { formatearFecha } from "@/lib/utils"

type LibroIva = {
  id: string
  mesAnio: string
  pdfS3Key: string | null
  generadoEn: string
  operador: { nombre: string; apellido: string }
}

type Props = {
  libros: LibroIva[]
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
 * LibroIvaGeneracion: Props -> JSX.Element
 *
 * Dado la lista de libros IVA generados, muestra la sección de generación mensual
 * con selector de período, modal de confirmación y lista de libros previos.
 */
export function LibroIvaGeneracion({ libros: librosIniciales }: Props) {
  const anioActual = new Date().getFullYear()
  const mesActual = String(new Date().getMonth() + 1).padStart(2, "0")

  const [mes, setMes] = useState(mesActual)
  const [anio, setAnio] = useState(String(anioActual))
  const [libros, setLibros] = useState<LibroIva[]>(librosIniciales)

  const [confirmando, setConfirmando] = useState(false)
  const [generando, setGenerando] = useState(false)
  const [errorGenerar, setErrorGenerar] = useState<string | null>(null)

  // Post-generación
  const [libroGenerado, setLibroGenerado] = useState<{ mesAnio: string; s3Key: string } | null>(null)
  const [mostrandoEnvioMail, setMostrandoEnvioMail] = useState(false)
  const [emailDestino, setEmailDestino] = useState("")
  const [enviandoMail, setEnviandoMail] = useState(false)
  const [errorMail, setErrorMail] = useState<string | null>(null)
  const [mailEnviado, setMailEnviado] = useState(false)

  const mesAnioSeleccionado = `${anio}-${mes}`
  const yaGenerado = libros.some((l) => l.mesAnio === mesAnioSeleccionado)

  async function handleGenerar() {
    setGenerando(true)
    setErrorGenerar(null)
    try {
      const res = await fetch("/api/iva/generar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mesAnio: mesAnioSeleccionado }),
      })
      const data = await res.json() as { ok?: boolean; s3Key?: string; error?: string }
      if (!res.ok) {
        setErrorGenerar(data.error ?? "Error al generar el libro")
        return
      }
      setConfirmando(false)
      setLibroGenerado({ mesAnio: mesAnioSeleccionado, s3Key: data.s3Key ?? "" })
      // Recargar lista de libros
      const resLibros = await fetch("/api/iva/libros")
      if (resLibros.ok) {
        const nuevosLibros = await resLibros.json() as LibroIva[]
        setLibros(nuevosLibros)
      }
    } catch {
      setErrorGenerar("Error de conexión")
    } finally {
      setGenerando(false)
    }
  }

  async function handleEnviarMail() {
    if (!libroGenerado) return
    setEnviandoMail(true)
    setErrorMail(null)
    setMailEnviado(false)
    try {
      const res = await fetch(`/api/iva/${libroGenerado.mesAnio}/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailDestino }),
      })
      const data = await res.json() as { error?: string }
      if (!res.ok) {
        setErrorMail(data.error ?? "No se pudo enviar el email")
        return
      }
      setMailEnviado(true)
    } catch {
      setErrorMail("Error de conexión")
    } finally {
      setEnviandoMail(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Generación del libro</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-end gap-3">
            <div className="space-y-1.5">
              <Label>Mes</Label>
              <Select value={mes} onChange={(e) => setMes(e.target.value)} className="w-36">
                {MESES.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Año</Label>
              <Select value={anio} onChange={(e) => setAnio(e.target.value)} className="w-24">
                {[anioActual + 1, anioActual, anioActual - 1, anioActual - 2].map((a) => (
                  <option key={a} value={String(a)}>{a}</option>
                ))}
              </Select>
            </div>
            <Button onClick={() => setConfirmando(true)}>
              Generar libro
            </Button>
          </div>

          {libros.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Libros generados</p>
              <div className="border rounded overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Período</th>
                      <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Generado</th>
                      <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Por</th>
                      <th className="px-3 py-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {libros.map((l) => (
                      <tr key={l.id} className="border-t">
                        <td className="px-3 py-2 font-medium">{nombreMes(l.mesAnio)}</td>
                        <td className="px-3 py-2 text-muted-foreground">{formatearFecha(l.generadoEn)}</td>
                        <td className="px-3 py-2 text-muted-foreground">{l.operador.nombre} {l.operador.apellido}</td>
                        <td className="px-3 py-2">
                          <div className="flex gap-2 justify-end">
                            <ViewPDF s3Key={l.pdfS3Key} size="sm" label="Ver PDF" />
                            <button
                              onClick={() => {
                                setLibroGenerado({ mesAnio: l.mesAnio, s3Key: l.pdfS3Key ?? "" })
                                setMostrandoEnvioMail(false)
                                setMailEnviado(false)
                              }}
                              className="h-7 px-2 rounded border text-xs font-medium hover:bg-accent"
                            >
                              Reimprimir
                            </button>
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

      {/* Modal confirmación generación */}
      <Dialog open={confirmando} onOpenChange={(open) => !open && setConfirmando(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Generar Libro de IVA</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <p>
              <span className="font-medium">Período: </span>
              {nombreMes(mesAnioSeleccionado)}
            </p>
            <div className="bg-muted/30 border rounded p-3 space-y-1 text-xs">
              <p className="font-medium">Este libro incluirá:</p>
              <ul className="list-disc ml-4 space-y-0.5 text-muted-foreground">
                <li>IVA Ventas: facturas emitidas a empresas, LPs emitidos</li>
                <li>IVA Compras: facturas de proveedores, facturas de seguros</li>
              </ul>
            </div>
            {yaGenerado && (
              <p className="text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2 text-xs">
                Ya existe un libro generado para este período. Será reemplazado por este nuevo.
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Una vez generado, las facturas de proveedores de este período no podrán eliminarse.
            </p>
            {errorGenerar && (
              <p className="text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{errorGenerar}</p>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setConfirmando(false)} disabled={generando}>
                Cancelar
              </Button>
              <Button onClick={handleGenerar} disabled={generando}>
                {generando ? "Generando..." : "Confirmar y generar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal post-generación */}
      {libroGenerado && (
        <Dialog open onOpenChange={(open) => { if (!open) { setLibroGenerado(null); setMostrandoEnvioMail(false); setMailEnviado(false) } }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Libro de IVA generado</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 text-sm">
              <p className="text-green-700">
                Libro de IVA — {nombreMes(libroGenerado.mesAnio)} generado correctamente.
              </p>
              <div className="flex gap-2">
                <ViewPDF s3Key={libroGenerado.s3Key} label="Ver PDF" />
                <Button
                  variant="outline"
                  onClick={() => { setMostrandoEnvioMail(true); setMailEnviado(false); setErrorMail(null) }}
                >
                  Enviar por mail
                </Button>
              </div>

              {mostrandoEnvioMail && (
                <div className="space-y-2 border rounded p-3">
                  <Label htmlFor="emailLibro">Enviar a:</Label>
                  <Input
                    id="emailLibro"
                    type="email"
                    placeholder="correo@ejemplo.com"
                    value={emailDestino}
                    onChange={(e) => setEmailDestino(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Podés ingresar cualquier dirección de email (ej: tu contador)
                  </p>
                  {errorMail && (
                    <p className="text-xs text-red-600">{errorMail}</p>
                  )}
                  {mailEnviado && (
                    <p className="text-xs text-green-600">Email enviado correctamente.</p>
                  )}
                  <Button
                    onClick={handleEnviarMail}
                    disabled={!emailDestino || enviandoMail}
                    size="sm"
                  >
                    {enviandoMail ? "Enviando..." : "Enviar"}
                  </Button>
                </div>
              )}

              <div className="flex justify-end">
                <Button variant="outline" onClick={() => { setLibroGenerado(null); setMostrandoEnvioMail(false); setMailEnviado(false) }}>
                  Cerrar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
