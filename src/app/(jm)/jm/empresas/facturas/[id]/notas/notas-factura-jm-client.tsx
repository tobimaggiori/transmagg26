"use client"

/**
 * NC/ND sobre factura JM. UI simple para emitir + listar.
 */

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FormError } from "@/components/ui/form-error"
import { formatearFecha, formatearMoneda } from "@/lib/utils"
import { sumarImportes } from "@/lib/money"

type Factura = {
  id: string
  nroComprobante: string | null
  ptoVenta: number | null
  tipoCbte: number
  total: string | number
  neto: string | number
  ivaMonto: string | number
  ivaPct: number
  emitidaEn: string
  estadoCobro: string
  empresa: { id: string; razonSocial: string; cuit: string; condicionIva: string }
  cantViajes: number
}

type Nota = {
  id: string
  tipo: string
  subtipo: string | null
  nroComprobante: number | null
  ptoVenta: number | null
  tipoCbte: number | null
  montoNeto: string | number
  montoIva: string | number
  montoTotal: string | number
  montoDescontado: string | number
  estado: string
  arcaEstado: string | null
  descripcion: string | null
  creadoEn: string
  items: Array<{ orden: number; concepto: string; subtotal: string | number }>
}

interface Props { factura: Factura; notasIniciales: Nota[] }

function tipoCbteLabel(t: number): string {
  if (t === 1) return "Factura A"
  if (t === 6) return "Factura B"
  if (t === 201) return "Factura A MiPyME"
  if (t === 2) return "ND A"
  if (t === 3) return "NC A"
  if (t === 7) return "ND B"
  if (t === 8) return "NC B"
  if (t === 202) return "ND A MiPyME"
  if (t === 203) return "NC A MiPyME"
  return `Cbte ${t}`
}

export function NotasFacturaJmClient({ factura, notasIniciales }: Props) {
  const router = useRouter()
  const [notas, setNotas] = useState<Nota[]>(notasIniciales)
  const [tipo, setTipo] = useState<"NC_EMITIDA" | "ND_EMITIDA">("NC_EMITIDA")
  const [items, setItems] = useState<{ concepto: string; subtotal: string }[]>([{ concepto: "", subtotal: "" }])
  const [ivaPct, setIvaPct] = useState(factura.ivaPct)
  const [liberarViajes, setLiberarViajes] = useState(false)
  const [descripcion, setDescripcion] = useState("")
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const subtotalNeto = sumarImportes(items.map((it) => Number(it.subtotal) || 0))
  const ivaMonto = Math.round((subtotalNeto * ivaPct / 100) * 100) / 100
  const total = sumarImportes([subtotalNeto, ivaMonto])

  function actualizarItem(i: number, campo: "concepto" | "subtotal", valor: string) {
    setItems(items.map((it, idx) => idx === i ? { ...it, [campo]: valor } : it))
  }
  function agregarItem() { setItems([...items, { concepto: "", subtotal: "" }]) }
  function quitarItem(i: number) { setItems(items.filter((_, idx) => idx !== i)) }

  const itemsValidos = items.every((it) => it.concepto.trim() && Number(it.subtotal) > 0)
  const puedeEmitir = itemsValidos && total > 0

  async function handleEmitir() {
    setCargando(true); setError(null)
    try {
      const body = {
        facturaId: factura.id,
        tipo,
        ivaPct,
        liberarViajes: tipo === "NC_EMITIDA" ? liberarViajes : false,
        descripcion: descripcion.trim() || undefined,
        items: items.map((it) => ({ concepto: it.concepto.trim(), subtotal: Number(it.subtotal) })),
      }
      const res = await fetch("/api/jm/notas-credito-debito", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Error al emitir")
        return
      }
      // Refrescar listado
      const refreshed = await fetch(`/api/jm/facturas/${factura.id}/notas`).then(r => r.json())
      setNotas(Array.isArray(refreshed) ? refreshed.map((n) => ({
        ...n,
        montoNeto: String(n.montoNeto),
        montoIva: String(n.montoIva),
        montoTotal: String(n.montoTotal),
        montoDescontado: String(n.montoDescontado),
        creadoEn: typeof n.creadoEn === "string" ? n.creadoEn : new Date(n.creadoEn).toISOString(),
        items: n.items?.map((it: {orden: number; concepto: string; subtotal: unknown}) => ({ orden: it.orden, concepto: it.concepto, subtotal: String(it.subtotal) })) ?? [],
      })) : [])
      setItems([{ concepto: "", subtotal: "" }])
      setDescripcion("")
      router.refresh()
    } catch {
      setError("Error de red")
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">NC / ND sobre factura</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {tipoCbteLabel(factura.tipoCbte)} {factura.nroComprobante} · {factura.empresa.razonSocial} · Total {formatearMoneda(Number(factura.total))} · Emitida {formatearFecha(new Date(factura.emitidaEn))}
        </p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Emitir nueva nota</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label>Tipo</Label>
              <Select value={tipo} onChange={(e) => setTipo(e.target.value as "NC_EMITIDA" | "ND_EMITIDA")}>
                <option value="NC_EMITIDA">Nota de Crédito</option>
                <option value="ND_EMITIDA">Nota de Débito</option>
              </Select>
            </div>
            <div>
              <Label>IVA %</Label>
              <Select value={String(ivaPct)} onChange={(e) => setIvaPct(Number(e.target.value))}>
                <option value="21">21%</option>
                <option value="10.5">10.5%</option>
                <option value="0">0%</option>
              </Select>
            </div>
            {tipo === "NC_EMITIDA" && (
              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <input type="checkbox" checked={liberarViajes} onChange={(e) => setLiberarViajes(e.target.checked)} />
                  Liberar viajes (volver a pendiente facturar)
                </label>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label>Items</Label>
              <Button variant="outline" size="sm" onClick={agregarItem}>+ Item</Button>
            </div>
            {items.map((it, i) => (
              <div key={i} className="grid grid-cols-12 gap-2">
                <Input className="col-span-8" placeholder="Concepto" value={it.concepto} onChange={(e) => actualizarItem(i, "concepto", e.target.value)} />
                <Input className="col-span-3" type="number" step="0.01" placeholder="Subtotal" value={it.subtotal} onChange={(e) => actualizarItem(i, "subtotal", e.target.value)} />
                <Button variant="outline" size="sm" className="col-span-1" onClick={() => quitarItem(i)} disabled={items.length === 1}>×</Button>
              </div>
            ))}
          </div>

          <div>
            <Label>Descripción</Label>
            <Input value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Motivo / observación" />
          </div>

          <div className="bg-muted/40 rounded p-3 space-y-1 text-sm">
            <div className="flex justify-between"><span>Neto</span><span>{formatearMoneda(subtotalNeto)}</span></div>
            <div className="flex justify-between"><span>IVA ({ivaPct}%)</span><span>{formatearMoneda(ivaMonto)}</span></div>
            <div className="flex justify-between text-base font-bold pt-1 border-t"><span>Total nota</span><span>{formatearMoneda(total)}</span></div>
          </div>

          {error && <FormError message={error} />}

          <div className="flex justify-end">
            <Button onClick={handleEmitir} disabled={!puedeEmitir || cargando}>{cargando ? "Emitiendo..." : `Emitir ${tipo === "NC_EMITIDA" ? "NC" : "ND"}`}</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Notas emitidas sobre esta factura ({notas.length})</CardTitle></CardHeader>
        <CardContent>
          {notas.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Sin notas emitidas.</p>
          ) : (
            <div className="space-y-3">
              {notas.map((n) => (
                <div key={n.id} className="border rounded p-3 text-sm space-y-1">
                  <div className="flex justify-between">
                    <p className="font-medium">{n.tipoCbte ? tipoCbteLabel(n.tipoCbte) : n.tipo} {String(n.ptoVenta ?? 1).padStart(4, "0")}-{String(n.nroComprobante ?? 0).padStart(8, "0")}</p>
                    <p className="font-semibold">{formatearMoneda(Number(n.montoTotal))}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">{formatearFecha(new Date(n.creadoEn))} · Estado {n.estado} · ARCA {n.arcaEstado ?? "—"} · Aplicado {formatearMoneda(Number(n.montoDescontado))}</p>
                  {n.descripcion && <p className="text-xs text-muted-foreground">{n.descripcion}</p>}
                  {n.items.length > 0 && (
                    <ul className="text-xs ml-2 mt-1 list-disc list-inside">
                      {n.items.map((it) => <li key={it.orden}>{it.concepto} — {formatearMoneda(Number(it.subtotal))}</li>)}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
