"use client"

/**
 * FacturarJmClient — versión simplificada para JM.
 * Permite seleccionar una empresa, ver viajes pendientes, editar
 * kilos/tarifaEmpresa, elegir tipoCbte/metodoPago y emitir la factura.
 *
 * Sin ARCA (numeración interna), sin generación de PDF (TODO),
 * sin sub-modal de detalle de viaje, sin envío email.
 */

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { SearchCombobox } from "@/components/ui/search-combobox"
import { FormError } from "@/components/ui/form-error"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { formatearFecha, formatearMoneda } from "@/lib/utils"
import { calcularTotalViaje, calcularFactura } from "@/lib/viajes"
import { hoyLocalYmd } from "@/lib/date-local"

type Empresa = { id: string; razonSocial: string; cuit: string; condicionIva: string; padronFce: boolean }

type ViajePendiente = {
  id: string
  fechaViaje: string
  remito: string | null
  cupo: string | null
  mercaderia: string | null
  procedencia: string | null
  destino: string | null
  kilos: number | null
  tarifaEmpresa: string | number
  camion: { patenteChasis: string } | null
  chofer: { nombre: string; apellido: string } | null
}

type FacturaListadoItem = {
  id: string
  nroComprobante: string | null
  ptoVenta: number | null
  tipoCbte: number
  total: string | number
  emitidaEn: string
}

interface Props {
  empresas: Empresa[]
}

const TIPOS_CBTE_RI = [
  { value: 1, label: "Factura A" },
  { value: 201, label: "Factura A MiPyME" },
]
const TIPOS_CBTE_NORI = [{ value: 6, label: "Factura B" }]

function tiposParaCondicion(condicion: string): { value: number; label: string }[] {
  return condicion === "RESPONSABLE_INSCRIPTO" ? TIPOS_CBTE_RI : TIPOS_CBTE_NORI
}

export function FacturarJmClient({ empresas }: Props) {
  const router = useRouter()
  const [empresaId, setEmpresaId] = useState("")
  const [viajesPendientes, setViajesPendientes] = useState<ViajePendiente[]>([])
  const [facturasRecientes, setFacturasRecientes] = useState<FacturaListadoItem[]>([])
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set())
  const [ediciones, setEdiciones] = useState<Record<string, { kilos?: number; tarifaEmpresa?: number }>>({})
  const [tipoCbte, setTipoCbte] = useState<number>(1)
  const [modalidadMiPymes, setModalidadMiPymes] = useState<"SCA" | "ADC">("SCA")
  const [ivaPct, setIvaPct] = useState(21)
  const [metodoPago, setMetodoPago] = useState("Transferencia Bancaria")
  const [fechaEmision, setFechaEmision] = useState(hoyLocalYmd())
  const [cargando, setCargando] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [exito, setExito] = useState<string | null>(null)

  const empresa = empresas.find((e) => e.id === empresaId)
  const tiposDisponibles = empresa ? tiposParaCondicion(empresa.condicionIva) : []

  // Reset tipoCbte cuando cambia la empresa
  useEffect(() => {
    if (!empresa) return
    const opciones = tiposParaCondicion(empresa.condicionIva)
    if (!opciones.some((o) => o.value === tipoCbte)) {
      setTipoCbte(opciones[0]?.value ?? 1)
    }
  }, [empresaId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!empresaId) { setViajesPendientes([]); setFacturasRecientes([]); return }
    let cancelado = false
    setCargando(true); setError(null)
    fetch(`/api/jm/facturas?empresaId=${empresaId}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelado) return
        setViajesPendientes(data.viajesPendientes ?? [])
        setFacturasRecientes(data.facturas ?? [])
        setSeleccionados(new Set())
        setEdiciones({})
      })
      .catch(() => { if (!cancelado) setError("Error al cargar viajes pendientes") })
      .finally(() => { if (!cancelado) setCargando(false) })
    return () => { cancelado = true }
  }, [empresaId])

  function toggleSeleccion(id: string) {
    const next = new Set(seleccionados)
    if (next.has(id)) next.delete(id); else next.add(id)
    setSeleccionados(next)
  }

  function setEdicion(id: string, campo: "kilos" | "tarifaEmpresa", valor: string) {
    const num = Number(valor)
    setEdiciones((prev) => {
      const e = { ...(prev[id] ?? {}) }
      if (valor.trim() === "" || !Number.isFinite(num)) delete e[campo]
      else e[campo] = num
      return { ...prev, [id]: e }
    })
  }

  function valorEfectivo(v: ViajePendiente, campo: "kilos" | "tarifaEmpresa"): number {
    const e = ediciones[v.id]?.[campo]
    if (e !== undefined) return e
    if (campo === "kilos") return v.kilos ?? 0
    return Number(v.tarifaEmpresa)
  }

  const seleccionadosArr = Array.from(seleccionados)
  const viajesParaCalc = seleccionadosArr.map((id) => {
    const v = viajesPendientes.find((x) => x.id === id)!
    return {
      kilos: valorEfectivo(v, "kilos"),
      tarifaEmpresa: valorEfectivo(v, "tarifaEmpresa"),
    }
  })

  const { neto, ivaMonto, total } =
    viajesParaCalc.length > 0
      ? calcularFactura(viajesParaCalc, ivaPct)
      : { neto: 0, ivaMonto: 0, total: 0 }

  const puedeEmitir =
    empresaId &&
    seleccionadosArr.length > 0 &&
    Number(total) > 0 &&
    fechaEmision &&
    (tipoCbte !== 201 || modalidadMiPymes)

  async function handleEmitir() {
    setEnviando(true); setError(null); setExito(null)
    try {
      const ediEnviadas: Record<string, { kilos?: number; tarifaEmpresa?: number }> = {}
      for (const id of seleccionadosArr) {
        const e = ediciones[id]
        if (e && (e.kilos !== undefined || e.tarifaEmpresa !== undefined)) ediEnviadas[id] = e
      }
      const res = await fetch("/api/jm/facturas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          empresaId,
          viajeIds: seleccionadosArr,
          tipoCbte,
          modalidadMiPymes: tipoCbte === 201 ? modalidadMiPymes : undefined,
          ivaPct,
          metodoPago,
          fechaEmision,
          ediciones: ediEnviadas,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Error al emitir factura")
        return
      }
      setExito(`Factura ${data.tipoCbte === 1 ? "A" : data.tipoCbte === 6 ? "B" : "A MiPyME"} ${String(data.ptoVenta ?? 1).padStart(4, "0")}-${data.nroComprobante} emitida (total ${formatearMoneda(Number(data.total))})`)
      // Refrescar
      router.refresh()
      const refreshed = await fetch(`/api/jm/facturas?empresaId=${empresaId}`).then(r => r.json())
      setViajesPendientes(refreshed.viajesPendientes ?? [])
      setFacturasRecientes(refreshed.facturas ?? [])
      setSeleccionados(new Set())
      setEdiciones({})
    } catch {
      setError("Error de red")
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="space-y-5 max-w-6xl">
      <h1 className="text-2xl font-bold tracking-tight">Facturar Empresa</h1>

      <div className="bg-white rounded-lg border p-4 space-y-3">
        <Label>Empresa</Label>
        <SearchCombobox
          items={empresas.map((e) => ({ id: e.id, label: e.razonSocial, sublabel: e.cuit }))}
          value={empresaId}
          onChange={setEmpresaId}
          placeholder="Buscar empresa..."
        />
        {empresa && (
          <p className="text-xs text-muted-foreground">
            Condición IVA: {empresa.condicionIva.replace(/_/g, " ")}
            {empresa.padronFce && " · Padrón FCE"}
          </p>
        )}
      </div>

      {empresa && (
        <>
          <div className="bg-white rounded-lg border p-4 space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <Label>Tipo</Label>
                <Select value={String(tipoCbte)} onChange={(e) => setTipoCbte(Number(e.target.value))}>
                  {tiposDisponibles.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </Select>
              </div>
              {tipoCbte === 201 && (
                <div>
                  <Label>Modalidad MiPyME</Label>
                  <Select value={modalidadMiPymes} onChange={(e) => setModalidadMiPymes(e.target.value as "SCA" | "ADC")}>
                    <option value="SCA">SCA</option>
                    <option value="ADC">ADC</option>
                  </Select>
                </div>
              )}
              <div>
                <Label>IVA %</Label>
                <Select value={String(ivaPct)} onChange={(e) => setIvaPct(Number(e.target.value))}>
                  <option value="21">21%</option>
                  <option value="10.5">10.5%</option>
                  <option value="0">0% (exento)</option>
                </Select>
              </div>
              <div>
                <Label>Método de pago</Label>
                <Input value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)} />
              </div>
              <div>
                <Label>Fecha emisión</Label>
                <Input type="date" value={fechaEmision} onChange={(e) => setFechaEmision(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border overflow-hidden">
            <div className="px-4 py-3 border-b flex items-center justify-between">
              <h2 className="font-semibold">Viajes pendientes ({viajesPendientes.length})</h2>
              <span className="text-sm text-muted-foreground">{seleccionadosArr.length} seleccionado(s)</span>
            </div>
            {cargando ? (
              <p className="text-center py-8 text-muted-foreground">Cargando...</p>
            ) : viajesPendientes.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">Sin viajes pendientes para esta empresa.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="px-3 py-2"></th>
                    <th className="px-3 py-2 text-left">Fecha</th>
                    <th className="px-3 py-2 text-left">Doc</th>
                    <th className="px-3 py-2 text-left">Mercadería</th>
                    <th className="px-3 py-2 text-right">Kilos</th>
                    <th className="px-3 py-2 text-right">Tarifa/ton</th>
                    <th className="px-3 py-2 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {viajesPendientes.map((v) => {
                    const sel = seleccionados.has(v.id)
                    const k = valorEfectivo(v, "kilos")
                    const t = valorEfectivo(v, "tarifaEmpresa")
                    return (
                      <tr key={v.id} className={`border-t ${sel ? "bg-blue-50/50" : ""}`}>
                        <td className="px-3 py-2 text-center">
                          <input type="checkbox" checked={sel} onChange={() => toggleSeleccion(v.id)} />
                        </td>
                        <td className="px-3 py-2">{formatearFecha(new Date(v.fechaViaje))}</td>
                        <td className="px-3 py-2">{v.remito ?? "—"}{v.cupo ? <span className="text-xs text-muted-foreground"> · {v.cupo}</span> : null}</td>
                        <td className="px-3 py-2 max-w-[180px] truncate">{v.mercaderia ?? "—"}</td>
                        <td className="px-3 py-2 text-right">
                          <Input
                            type="number"
                            value={ediciones[v.id]?.kilos ?? v.kilos ?? ""}
                            onChange={(e) => setEdicion(v.id, "kilos", e.target.value)}
                            className="h-7 w-24 text-right text-sm"
                          />
                        </td>
                        <td className="px-3 py-2 text-right">
                          <Input
                            type="number"
                            step="0.01"
                            value={ediciones[v.id]?.tarifaEmpresa ?? v.tarifaEmpresa}
                            onChange={(e) => setEdicion(v.id, "tarifaEmpresa", e.target.value)}
                            className="h-7 w-24 text-right text-sm"
                          />
                        </td>
                        <td className="px-3 py-2 text-right font-medium">{formatearMoneda(calcularTotalViaje(k, Number(t)))}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>

          <div className="bg-white rounded-lg border p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Neto</span>
              <span className="font-medium">{formatearMoneda(Number(neto))}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">IVA ({ivaPct}%)</span>
              <span className="font-medium">{formatearMoneda(Number(ivaMonto))}</span>
            </div>
            <div className="flex justify-between text-base pt-2 border-t">
              <span className="font-semibold">Total</span>
              <span className="font-bold">{formatearMoneda(Number(total))}</span>
            </div>
          </div>

          {error && <FormError message={error} />}
          {exito && <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2">{exito}</p>}

          <div className="flex justify-end">
            <Button onClick={handleEmitir} disabled={!puedeEmitir || enviando} className="h-10 px-6">
              {enviando ? "Emitiendo..." : "Emitir factura"}
            </Button>
          </div>

          {facturasRecientes.length > 0 && (
            <div className="bg-white rounded-lg border overflow-hidden">
              <div className="px-4 py-3 border-b">
                <h2 className="font-semibold">Últimas facturas de esta empresa</h2>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="px-3 py-2 text-left">Tipo</th>
                    <th className="px-3 py-2 text-left">Nro</th>
                    <th className="px-3 py-2 text-left">Emitida</th>
                    <th className="px-3 py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {facturasRecientes.map((f) => (
                    <tr key={f.id} className="border-t">
                      <td className="px-3 py-2">{f.tipoCbte === 1 ? "A" : f.tipoCbte === 6 ? "B" : "A MiPyME"}</td>
                      <td className="px-3 py-2 font-mono">{String(f.ptoVenta ?? 1).padStart(4, "0")}-{f.nroComprobante ?? "—"}</td>
                      <td className="px-3 py-2">{formatearFecha(new Date(f.emitidaEn))}</td>
                      <td className="px-3 py-2 text-right font-medium">{formatearMoneda(Number(f.total))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}
