"use client"

/**
 * Modal de 2 pasos para registrar una ND recibida de una empresa por faltante de mercadería.
 *
 * Paso 1: Encabezado (fecha, nro ND) + selección de viajes con faltantes
 * Paso 2: Detalle del faltante (descripción, kilos, neto, %IVA) con preview en tiempo real
 */

import { useState, useMemo } from "react"
import { formatearMoneda } from "@/lib/utils"
import { calcularNetoMasIva } from "@/lib/money"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { UploadPDF } from "@/components/upload-pdf"

// ─── Tipos ──────────────────────────────────────────────────────────────────���──

export type ViajeParaFaltante = {
  id: string
  viajeId: string
  remito: string | null
  mercaderia: string | null
  procedencia: string | null
  destino: string | null
  kilos: number | null
  subtotal: number
  viaje: {
    fletero: { id: string; razonSocial: string } | null
  }
}

type Paso = "encabezado" | "detalle"

const ALICUOTAS_IVA = [
  { value: 0, label: "0%" },
  { value: 10.5, label: "10.5%" },
  { value: 21, label: "21%" },
  { value: 27, label: "27%" },
]

// ─── Componente ────────────────────────────────────────────────────────────────

export function ModalIngresarNDFaltante({
  facturaId,
  viajes,
  onClose,
  onRegistrada,
}: {
  facturaId: string
  viajes: ViajeParaFaltante[]
  onClose: () => void
  onRegistrada: () => void
}) {
  const [paso, setPaso] = useState<Paso>("encabezado")

  // Paso 1
  const [fecha, setFecha] = useState("")
  const [nroND, setNroND] = useState("")
  const [viajesSeleccionados, setViajesSeleccionados] = useState<Set<string>>(new Set())

  // PDF obligatorio
  const [pdfS3Key, setPdfS3Key] = useState<string | null>(null)

  // Paso 2
  const [descripcion, setDescripcion] = useState("")
  const [kilosFaltante, setKilosFaltante] = useState("")
  const [montoNeto, setMontoNeto] = useState("")
  const [ivaPct, setIvaPct] = useState(21)

  const [registrando, setRegistrando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [exito, setExito] = useState(false)

  // Preview en tiempo real
  const preview = useMemo(() => {
    const neto = parseFloat(montoNeto) || 0
    if (neto <= 0) return null
    const result = calcularNetoMasIva(neto, ivaPct)
    return { neto: result.neto, iva: result.iva, total: result.total }
  }, [montoNeto, ivaPct])

  function toggleViaje(viajeId: string) {
    setViajesSeleccionados((prev) => {
      const next = new Set(prev)
      if (next.has(viajeId)) next.delete(viajeId)
      else next.add(viajeId)
      return next
    })
  }

  function puedeContinuar(): boolean {
    return fecha.trim() !== "" && nroND.trim() !== "" && viajesSeleccionados.size > 0 && pdfS3Key !== null
  }

  function continuar() {
    if (!puedeContinuar()) return
    setPaso("detalle")
  }

  async function registrar() {
    setError(null)
    const neto = parseFloat(montoNeto) || 0
    if (neto <= 0) { setError("El monto neto debe ser mayor a 0"); return }
    if (!descripcion.trim()) { setError("La descripción es obligatoria"); return }

    setRegistrando(true)
    try {
      const res = await fetch("/api/notas-credito-debito", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          facturaId,
          nroComprobanteExterno: nroND.trim(),
          fechaComprobanteExterno: fecha,
          viajesIds: Array.from(viajesSeleccionados),
          descripcion: descripcion.trim(),
          kilosFaltante: parseFloat(kilosFaltante) || 0,
          montoNeto: neto,
          ivaPct,
          pdfS3Key,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? "Error al registrar la nota")
        return
      }

      setExito(true)
    } catch {
      setError("Error de red al registrar")
    } finally {
      setRegistrando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-background rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header fijo */}
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-lg font-bold">Ingresar Nota de Débito Recibida</h2>
            <p className="text-sm text-muted-foreground">Faltante de mercadería</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xl leading-none">&times;</button>
        </div>

        {/* Encabezado siempre visible */}
        <div className="grid grid-cols-2 gap-3 bg-muted/40 rounded-lg p-3">
          <div>
            <Label className="text-xs text-muted-foreground">Fecha ND</Label>
            {paso === "encabezado" ? (
              <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
            ) : (
              <p className="text-sm font-medium">{fecha}</p>
            )}
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Nro ND</Label>
            {paso === "encabezado" ? (
              <Input value={nroND} onChange={(e) => setNroND(e.target.value)} placeholder="0001-00000001" />
            ) : (
              <p className="text-sm font-medium">{nroND}</p>
            )}
          </div>
          <div className="col-span-2">
            <Label className="text-xs text-muted-foreground">PDF del comprobante <span className="text-red-500">*</span></Label>
            {paso === "encabezado" ? (
              <UploadPDF
                prefijo="facturas-emitidas"
                onUpload={(key) => setPdfS3Key(key)}
                label="Subir PDF de la ND"
                s3Key={pdfS3Key ?? undefined}
                required
              />
            ) : (
              <p className="text-sm font-medium text-green-700">PDF cargado</p>
            )}
          </div>
        </div>

        {exito ? (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4 space-y-2">
            <p className="font-semibold text-green-800">Nota de Débito registrada exitosamente</p>
            <Button size="sm" onClick={onRegistrada}>Cerrar</Button>
          </div>
        ) : paso === "encabezado" ? (
          <>
            {/* Selección de viajes */}
            <div className="space-y-2">
              <Label>Seleccione el o los viajes con faltantes:</Label>
              <div className="rounded-lg border max-h-56 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="bg-muted/60 sticky top-0">
                    <tr>
                      <th className="p-2 w-8"></th>
                      <th className="p-2 text-left">Remito</th>
                      <th className="p-2 text-left">Mercadería</th>
                      <th className="p-2 text-left">Origen - Destino</th>
                      <th className="p-2 text-right">Kg</th>
                      <th className="p-2 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viajes.map((v) => (
                      <tr
                        key={v.viajeId}
                        className={`cursor-pointer hover:bg-muted/40 ${viajesSeleccionados.has(v.viajeId) ? "bg-primary/5" : ""}`}
                        onClick={() => toggleViaje(v.viajeId)}
                      >
                        <td className="p-2 text-center">
                          <input type="checkbox" checked={viajesSeleccionados.has(v.viajeId)} onChange={() => toggleViaje(v.viajeId)} className="accent-primary" />
                        </td>
                        <td className="p-2">{v.remito ?? "—"}</td>
                        <td className="p-2">{v.mercaderia ?? "—"}</td>
                        <td className="p-2">{v.procedencia ?? "?"} - {v.destino ?? "?"}</td>
                        <td className="p-2 text-right">{v.kilos?.toLocaleString("es-AR") ?? "-"}</td>
                        <td className="p-2 text-right">{formatearMoneda(v.subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {viajesSeleccionados.size > 0 && (
                <p className="text-xs text-muted-foreground">
                  {viajesSeleccionados.size} viaje{viajesSeleccionados.size > 1 ? "s" : ""} seleccionado{viajesSeleccionados.size > 1 ? "s" : ""}
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={onClose}>Cancelar</Button>
              <Button onClick={continuar} disabled={!puedeContinuar()}>Continuar</Button>
            </div>
          </>
        ) : (
          <>
            {/* Paso 2: Detalle del faltante */}
            <div className="space-y-3">
              <div>
                <Label>Descripción</Label>
                <textarea
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Ej: Faltante de 500 kg de soja en viaje a Rosario"
                  className="w-full h-20 rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>Cantidad (kg) <span className="text-muted-foreground font-normal text-xs">informativo</span></Label>
                  <Input type="number" value={kilosFaltante} onChange={(e) => setKilosFaltante(e.target.value)} placeholder="0" min="0" step="0.01" />
                </div>
                <div>
                  <Label>Neto</Label>
                  <Input type="number" value={montoNeto} onChange={(e) => setMontoNeto(e.target.value)} placeholder="0.00" min="0.01" step="0.01" className="text-right" />
                </div>
                <div>
                  <Label>% IVA</Label>
                  <select
                    value={ivaPct}
                    onChange={(e) => setIvaPct(parseFloat(e.target.value))}
                    className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
                  >
                    {ALICUOTAS_IVA.map((a) => (
                      <option key={a.value} value={a.value}>{a.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Preview en tiempo real */}
              {preview && (
                <div className="bg-muted/40 rounded-lg p-3 space-y-1 text-sm">
                  <div className="flex justify-between"><span>Neto</span><span>{formatearMoneda(preview.neto)}</span></div>
                  <div className="flex justify-between"><span>IVA ({ivaPct}%)</span><span>+ {formatearMoneda(preview.iva)}</span></div>
                  <div className="flex justify-between font-bold text-base border-t pt-1"><span>Total</span><span>{formatearMoneda(preview.total)}</span></div>
                </div>
              )}
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setPaso("encabezado")} disabled={registrando}>Cancelar</Button>
              <Button onClick={registrar} disabled={registrando || !preview}>
                {registrando ? "Registrando..." : "Registrar"}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
