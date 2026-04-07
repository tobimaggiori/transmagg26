"use client"

/**
 * Propósito: Componente cliente para creación de facturas a empresas (/empresas/facturar).
 * Flujo: seleccionar empresa -> ver viajes pendientes con checkboxes -> editar kilos/tarifa inline -> emitir factura.
 * Modelo: N viajes seleccionados = 1 Factura.
 */

import { useState, useCallback, useEffect, useMemo } from "react"
import { formatearMoneda, formatearFecha } from "@/lib/utils"
import { calcularTotalViaje, calcularFactura } from "@/lib/viajes"
import { facturasEmpresaDisponibles } from "@/lib/arca/catalogo"
import { SearchCombobox } from "@/components/ui/search-combobox"
import { CeldaEditable } from "@/components/ui/celda-editable"

// ---- Tipos ----

type ViajeParaFacturar = {
  id: string
  empresaId: string
  kilos: number | null
  tarifaEmpresa: number
  procedencia: string | null
  provinciaOrigen: string | null
  destino: string | null
  provinciaDestino: string | null
  mercaderia: string | null
  remito: string | null
  cupo: string | null
  fechaViaje: string
  nroCartaPorte: string | null
  tieneCpe: boolean
  fletero: { razonSocial: string } | null
  enLiquidaciones: Array<{
    liquidacion: { nroComprobante: number | null; ptoVenta: number | null; id: string }
  }>
}

// ---- Props ----

type FacturarEmpresaClientProps = {
  empresas: Array<{ id: string; razonSocial: string; cuit: string; condicionIva: string }>
  comprobantesHabilitados: number[]
}

// ---- Helpers ----

function formatNroLP(ptoVenta: number | null, nroComprobante: number | null): string {
  const pv = (ptoVenta ?? 1).toString().padStart(4, "0")
  const nc = (nroComprobante ?? 0).toString().padStart(8, "0")
  return `${pv}-${nc}`
}

// ---- TipoCbteBadge ----

export function TipoCbteBadge({ tipoCbte, modalidad }: { tipoCbte: number; modalidad?: string }) {
  if (tipoCbte === 1)
    return <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">Fact. A</span>
  if (tipoCbte === 201)
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-medium text-violet-800">
        MiPyme{modalidad ? ` · ${modalidad}` : ""}
      </span>
    )
  if (tipoCbte === 6)
    return <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">Fact. B</span>
  return <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">Cbte {tipoCbte}</span>
}

/**
 * FacturarEmpresaClient: FacturarEmpresaClientProps -> JSX.Element
 *
 * Dado el listado de empresas, renderiza el flujo de creación de facturas:
 * selector de empresa con SearchCombobox, tabla de viajes pendientes con checkboxes,
 * edición inline de kilos y tarifa empresa, preview con neto/IVA/total, y confirmación.
 */
export function FacturarEmpresaClient({ empresas, comprobantesHabilitados }: FacturarEmpresaClientProps) {
  const [empresaId, setEmpresaId] = useState("")
  const [viajes, setViajes] = useState<ViajeParaFacturar[]>([])
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set())
  const [ediciones, setEdiciones] = useState<Record<string, { kilos?: number; tarifaEmpresa?: number }>>({})
  const [tipoCbteNum, setTipoCbteNum] = useState<number | null>(null)
  const [modalidadMiPymes, setModalidadMiPymes] = useState<"SCA" | "ADC" | null>(null)
  const [ivaPct, setIvaPct] = useState<number>(21)
  const [cargando, setCargando] = useState(false)
  const [generando, setGenerando] = useState(false)
  const [errorGen, setErrorGen] = useState<string | null>(null)
  const [facturaEmitida, setFacturaEmitida] = useState<{
    id: string; tipoCbte: number; ptoVenta: number; nroComprobante: string;
    cae: string; caeVto: string; neto: number; ivaMonto: number; total: number; emitidaEn: string;
  } | null>(null)
  const [reintentableInfo, setReintentableInfo] = useState<{ documentoId: string; mensaje: string } | null>(null)
  const [reintentando, setReintentando] = useState(false)

  const cargarDatos = useCallback(async () => {
    if (!empresaId) return
    setCargando(true)
    try {
      const res = await fetch(`/api/facturas?empresaId=${empresaId}`)
      if (res.ok) {
        const data = await res.json()
        setViajes(data.viajesPendientes ?? [])
      }
    } finally {
      setCargando(false)
    }
  }, [empresaId])

  useEffect(() => {
    cargarDatos()
  }, [cargarDatos])

  const empresaSeleccionada = empresas.find((e) => e.id === empresaId)

  // Códigos disponibles según condición fiscal + config ARCA
  const codigosDisponibles = useMemo(
    () => empresaSeleccionada
      ? facturasEmpresaDisponibles(empresaSeleccionada.condicionIva, comprobantesHabilitados)
      : [],
    [empresaSeleccionada, comprobantesHabilitados]
  )

  // Auto-seleccionar si solo hay una opción, o resetear si la selección ya no es válida
  useEffect(() => {
    if (codigosDisponibles.length === 1 && tipoCbteNum !== codigosDisponibles[0]) {
      setTipoCbteNum(codigosDisponibles[0])
      if (codigosDisponibles[0] !== 201) setModalidadMiPymes(null)
    } else if (tipoCbteNum !== null && !codigosDisponibles.includes(tipoCbteNum)) {
      setTipoCbteNum(null)
      setModalidadMiPymes(null)
    }
  }, [codigosDisponibles, tipoCbteNum])

  const tipoCbteEfectivo = tipoCbteNum
  const tipoCbteValido =
    !empresaId ||
    (tipoCbteNum !== null && codigosDisponibles.includes(tipoCbteNum) &&
      (tipoCbteNum !== 201 || modalidadMiPymes !== null))

  // Toggle individual viaje
  function toggleViaje(id: string) {
    setSeleccionados((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Toggle todos
  function toggleTodos() {
    if (seleccionados.size === viajes.length) {
      setSeleccionados(new Set())
    } else {
      setSeleccionados(new Set(viajes.map((v) => v.id)))
    }
  }

  // Obtener valor efectivo de kilos/tarifa (con ediciones)
  function getKilos(v: ViajeParaFacturar): number {
    return ediciones[v.id]?.kilos ?? v.kilos ?? 0
  }

  function getTarifa(v: ViajeParaFacturar): number {
    return ediciones[v.id]?.tarifaEmpresa ?? v.tarifaEmpresa
  }

  // Calcular preview solo para viajes seleccionados
  const viajesSeleccionados = viajes.filter((v) => seleccionados.has(v.id))
  const viajesParaCalc = viajesSeleccionados.map((v) => ({
    kilos: getKilos(v),
    tarifaEmpresa: getTarifa(v),
  }))
  const preview = viajesParaCalc.length > 0 ? calcularFactura(viajesParaCalc, ivaPct) : null

  async function confirmarFactura() {
    if (!empresaId || seleccionados.size === 0 || !tipoCbteEfectivo) return
    setGenerando(true)
    setErrorGen(null)
    try {
      // Solo enviar ediciones de viajes seleccionados que realmente fueron editados
      const edicionesAEnviar: Record<string, { kilos?: number; tarifaEmpresa?: number }> = {}
      for (const id of Array.from(seleccionados)) {
        if (ediciones[id]) edicionesAEnviar[id] = ediciones[id]
      }

      const body = {
        empresaId,
        viajeIds: Array.from(seleccionados),
        tipoCbte: tipoCbteEfectivo,
        modalidadMiPymes: modalidadMiPymes ?? undefined,
        ivaPct,
        ediciones: Object.keys(edicionesAEnviar).length > 0 ? edicionesAEnviar : undefined,
        emisionArca: true,
        idempotencyKey: crypto.randomUUID(),
      }
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 45000)
      let res: Response
      try {
        res = await fetch("/api/facturas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: controller.signal,
        })
      } catch (fetchErr) {
        clearTimeout(timeout)
        if (fetchErr instanceof DOMException && fetchErr.name === "AbortError") {
          setErrorGen("La solicitud tardó demasiado. El comprobante puede haberse creado — recargá la página para verificar.")
        } else {
          setErrorGen("Error de red al generar factura. Verificá tu conexión.")
        }
        return
      }
      clearTimeout(timeout)
      if (!res.ok) {
        const err = await res.json()
        if (err.reintentable && err.documentoId) {
          setReintentableInfo({ documentoId: err.documentoId, mensaje: err.error })
          setErrorGen(null)
          cargarDatos()
          return
        }
        setErrorGen(err.error ?? "Error al generar factura")
        return
      }
      const data = await res.json()
      const doc = data.documento
      setSeleccionados(new Set())
      setEdiciones({})
      setReintentableInfo(null)
      setFacturaEmitida({
        id: doc.id,
        tipoCbte: doc.tipoCbte,
        ptoVenta: doc.ptoVenta ?? 1,
        nroComprobante: doc.nroComprobante ?? "",
        cae: doc.cae ?? data.arca?.cae ?? "",
        caeVto: doc.caeVto ?? data.arca?.caeVto ?? "",
        neto: Number(doc.neto),
        ivaMonto: Number(doc.ivaMonto),
        total: Number(doc.total),
        emitidaEn: doc.emitidaEn,
      })
      cargarDatos()
    } finally {
      setGenerando(false)
    }
  }

  function resetearFormulario() {
    setFacturaEmitida(null)
    setSeleccionados(new Set())
    setEdiciones({})
    setTipoCbteNum(null)
    setModalidadMiPymes(null)
    setIvaPct(21)
    setErrorGen(null)
    setReintentableInfo(null)
  }

  async function reintentarArca() {
    if (!reintentableInfo) return
    setReintentando(true)
    try {
      const res = await fetch(`/api/facturas/${reintentableInfo.documentoId}/reintentar-arca`, { method: "PATCH" })
      if (!res.ok) {
        const err = await res.json()
        setReintentableInfo({ ...reintentableInfo, mensaje: err.error ?? "Error al reintentar" })
        return
      }
      const data = await res.json()
      const doc = data.documento
      setReintentableInfo(null)
      setSeleccionados(new Set())
      setEdiciones({})
      setFacturaEmitida({
        id: doc.id,
        tipoCbte: doc.tipoCbte,
        ptoVenta: doc.ptoVenta ?? 1,
        nroComprobante: doc.nroComprobante ?? "",
        cae: doc.cae ?? data.arca?.cae ?? "",
        caeVto: doc.caeVto ?? "",
        neto: Number(doc.neto),
        ivaMonto: Number(doc.ivaMonto),
        total: Number(doc.total),
        emitidaEn: doc.emitidaEn,
      })
      cargarDatos()
    } catch {
      setReintentableInfo({ ...reintentableInfo, mensaje: "Error de red al reintentar. Intentá de nuevo." })
    } finally {
      setReintentando(false)
    }
  }

  const empresasItems = empresas.map((e) => ({ id: e.id, label: e.razonSocial }))

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Facturar a Empresa</h1>
        <p className="text-muted-foreground">
          Selecciona una empresa para ver sus viajes pendientes de facturación.
        </p>
      </div>

      {/* Selector de Empresa + Tipo Comprobante */}
      <div className="flex flex-wrap gap-4 p-4 bg-muted/40 rounded-lg border">
        <div className="flex flex-col gap-1 min-w-[300px]">
          <label className="text-xs font-medium text-muted-foreground">Empresa</label>
          <SearchCombobox
            items={empresasItems}
            value={empresaId}
            onChange={(id) => {
              setEmpresaId(id)
              setSeleccionados(new Set())
              setEdiciones({})
              setFacturaEmitida(null)
              setTipoCbteNum(null)
              setModalidadMiPymes(null)
            }}
            placeholder="Selecciona una empresa..."
          />
        </div>

        {/* Tipo de comprobante — gobernado por condición fiscal + config ARCA */}
        {empresaId && (
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-muted-foreground">Tipo de comprobante</label>
            {codigosDisponibles.length === 0 ? (
              <div className="rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800">
                No hay comprobantes habilitados para {empresaSeleccionada?.condicionIva?.replace(/_/g, " ").toLowerCase()}.
                Verifique la configuración ARCA.
              </div>
            ) : codigosDisponibles.length === 1 ? (
              <div className="flex items-center gap-2">
                <TipoCbteBadge tipoCbte={codigosDisponibles[0]} />
                <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">automático</span>
                <span className="text-xs text-muted-foreground">
                  ({empresaSeleccionada?.condicionIva?.replace(/_/g, " ").toLowerCase()})
                </span>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-4">
                  {codigosDisponibles.includes(1) && (
                    <label className="flex items-center gap-2 cursor-pointer text-sm">
                      <input
                        type="radio"
                        name="tipoCbte"
                        value="1"
                        checked={tipoCbteNum === 1}
                        onChange={() => { setTipoCbteNum(1); setModalidadMiPymes(null) }}
                        className="accent-primary"
                      />
                      Factura A <span className="text-xs text-muted-foreground">(cód. 1)</span>
                    </label>
                  )}
                  {codigosDisponibles.includes(201) && (
                    <label className="flex items-center gap-2 cursor-pointer text-sm">
                      <input
                        type="radio"
                        name="tipoCbte"
                        value="201"
                        checked={tipoCbteNum === 201}
                        onChange={() => { setTipoCbteNum(201); setModalidadMiPymes("SCA") }}
                        className="accent-primary"
                      />
                      Factura A MiPyme <span className="text-xs text-muted-foreground">(cód. 201)</span>
                    </label>
                  )}
                  {codigosDisponibles.includes(6) && (
                    <label className="flex items-center gap-2 cursor-pointer text-sm">
                      <input
                        type="radio"
                        name="tipoCbte"
                        value="6"
                        checked={tipoCbteNum === 6}
                        onChange={() => { setTipoCbteNum(6); setModalidadMiPymes(null) }}
                        className="accent-primary"
                      />
                      Factura B <span className="text-xs text-muted-foreground">(cód. 6)</span>
                    </label>
                  )}
                </div>
                {tipoCbteNum === 201 && (
                  <div className="flex gap-4 pl-1 border-l-2 border-primary/30">
                    <label className="text-xs font-medium text-muted-foreground mr-1 self-center">Modalidad:</label>
                    <label className="flex items-center gap-1.5 cursor-pointer text-sm">
                      <input
                        type="radio"
                        name="modalidadMiPymes"
                        value="SCA"
                        checked={modalidadMiPymes === "SCA"}
                        onChange={() => setModalidadMiPymes("SCA")}
                        className="accent-primary"
                      />
                      SCA <span className="text-xs text-muted-foreground">-- Circulación Abierta</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer text-sm">
                      <input
                        type="radio"
                        name="modalidadMiPymes"
                        value="ADC"
                        checked={modalidadMiPymes === "ADC"}
                        onChange={() => setModalidadMiPymes("ADC")}
                        className="accent-primary"
                      />
                      ADC <span className="text-xs text-muted-foreground">-- Depósito Colectivo</span>
                    </label>
                  </div>
                )}
                {!tipoCbteValido && empresaId && (
                  <p className="text-xs text-amber-600">
                    {tipoCbteNum === null
                      ? "Selecciona el tipo de comprobante para continuar."
                      : tipoCbteNum === 201 && !modalidadMiPymes
                      ? "Selecciona la modalidad MiPyme para continuar."
                      : ""}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {!empresaId && (
        <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
          <p className="text-lg">Selecciona una empresa para ver sus viajes pendientes</p>
        </div>
      )}

      {/* Card de éxito */}
      {facturaEmitida && (
        <div className="flex items-center justify-center py-12">
          <div className="w-full max-w-md rounded-lg border bg-white shadow-sm p-6 space-y-5">
            <div className="flex flex-col items-center gap-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
              </div>
              <h3 className="text-lg font-semibold">Factura emitida exitosamente</h3>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <span className="text-muted-foreground">Comprobante</span>
              <span className="font-medium">
                Factura {facturaEmitida.tipoCbte === 1 ? "A" : facturaEmitida.tipoCbte === 6 ? "B" : "A MiPyme"}{" "}
                {String(facturaEmitida.ptoVenta).padStart(4, "0")}-{String(parseInt(facturaEmitida.nroComprobante) || 0).padStart(8, "0")}
              </span>
              <span className="text-muted-foreground">CAE</span>
              <span className="font-mono text-xs">{facturaEmitida.cae || "—"}</span>
              <span className="text-muted-foreground">Fecha</span>
              <span>{new Date(facturaEmitida.emitidaEn).toLocaleDateString("es-AR")}</span>
              <span className="text-muted-foreground">Total</span>
              <span className="font-semibold">{Number(facturaEmitida.total).toLocaleString("es-AR", { style: "currency", currency: "ARS" })}</span>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => window.open(`/api/facturas/${facturaEmitida.id}/pdf`, "_blank")}
                className="flex-1 h-9 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
              >
                Ver PDF
              </button>
              <button
                onClick={resetearFormulario}
                className="flex-1 h-9 rounded-md border border-input bg-background text-sm font-medium hover:bg-accent"
              >
                Crear otra factura
              </button>
            </div>
          </div>
        </div>
      )}

      {empresaId && !facturaEmitida && (
        <>
          {/* Tabla de viajes pendientes con checkboxes */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold">Viajes pendientes de facturar</h3>
              <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800">
                {viajes.length}
              </span>
              {seleccionados.size > 0 && (
                <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-800">
                  {seleccionados.size} seleccionado(s)
                </span>
              )}
            </div>

            {cargando ? (
              <div className="text-center py-6 text-muted-foreground">Cargando...</div>
            ) : viajes.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">Sin viajes pendientes de facturación para esta empresa.</div>
            ) : (
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-3 py-2 text-center w-10">
                        <input
                          type="checkbox"
                          checked={seleccionados.size === viajes.length && viajes.length > 0}
                          onChange={toggleTodos}
                          className="accent-primary"
                        />
                      </th>
                      <th className="px-3 py-2 text-left">Fecha</th>
                      <th className="px-3 py-2 text-left">CPE</th>
                      <th className="px-3 py-2 text-left">Fletero</th>
                      <th className="px-3 py-2 text-left">Mercadería</th>
                      <th className="px-3 py-2 text-left">Origen</th>
                      <th className="px-3 py-2 text-left">Destino</th>
                      <th className="px-3 py-2 text-right">Kilos</th>
                      <th className="px-3 py-2 text-right">Tarifa Emp/ton</th>
                      <th className="px-3 py-2 text-right">Subtotal</th>
                      <th className="px-3 py-2 text-left">Nro LP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {viajes.map((v) => {
                      const kilos = getKilos(v)
                      const tarifa = getTarifa(v)
                      const subtotal = kilos > 0 ? calcularTotalViaje(kilos, tarifa) : null
                      const isSelected = seleccionados.has(v.id)
                      const lp = v.enLiquidaciones?.[0]?.liquidacion
                      return (
                        <tr
                          key={v.id}
                          className={isSelected ? "bg-blue-50" : "hover:bg-muted/30"}
                        >
                          <td className="px-3 py-2 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleViaje(v.id)}
                              className="accent-primary"
                            />
                          </td>
                          <td className="px-3 py-2">{formatearFecha(v.fechaViaje)}</td>
                          <td className="px-3 py-2">
                            {v.tieneCpe
                              ? v.nroCartaPorte ?? "Si"
                              : <span className="text-muted-foreground">No</span>}
                          </td>
                          <td className="px-3 py-2">{v.fletero?.razonSocial ?? "-"}</td>
                          <td className="px-3 py-2">{v.mercaderia ?? "-"}</td>
                          <td className="px-3 py-2">{v.provinciaOrigen ?? v.procedencia ?? "-"}</td>
                          <td className="px-3 py-2">{v.destino ?? v.provinciaDestino ?? "-"}</td>
                          <td className="px-3 py-1.5 text-right">
                            <CeldaEditable
                              valor={kilos}
                              tipo="number"
                              onGuardar={(val) =>
                                setEdiciones((prev) => ({
                                  ...prev,
                                  [v.id]: { ...prev[v.id], kilos: Number(val) },
                                }))
                              }
                              formatear={(val) => Number(val).toLocaleString("es-AR")}
                              className="text-right"
                            />
                          </td>
                          <td className="px-3 py-1.5 text-right">
                            <CeldaEditable
                              valor={tarifa}
                              tipo="number"
                              onGuardar={(val) =>
                                setEdiciones((prev) => ({
                                  ...prev,
                                  [v.id]: { ...prev[v.id], tarifaEmpresa: Number(val) },
                                }))
                              }
                              formatear={(val) => formatearMoneda(Number(val))}
                              className="text-right"
                            />
                          </td>
                          <td className="px-3 py-2 text-right font-medium">
                            {subtotal != null ? formatearMoneda(subtotal) : "-"}
                          </td>
                          <td className="px-3 py-2 font-mono text-xs">
                            {lp ? formatNroLP(lp.ptoVenta, lp.nroComprobante) : <span className="text-muted-foreground">-</span>}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Preview de factura (solo si hay viajes seleccionados) */}
          {preview && (
            <div className="p-4 bg-muted/40 rounded-lg border space-y-3">
              <h3 className="font-semibold">Preview de factura</h3>
              {reintentableInfo && (
                <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded text-sm space-y-2">
                  <p>{reintentableInfo.mensaje}</p>
                  <button
                    onClick={reintentarArca}
                    disabled={reintentando}
                    className="px-3 py-1.5 bg-amber-600 text-white text-xs font-medium rounded hover:bg-amber-700 disabled:opacity-50"
                  >
                    {reintentando ? "Reintentando..." : "Reintentar autorización ARCA"}
                  </button>
                </div>
              )}
              {errorGen && <div className="p-3 bg-red-50 text-red-700 rounded text-sm">{errorGen}</div>}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Tipo de comprobante</label>
                  <div className="flex items-center gap-2 h-8">
                    <TipoCbteBadge tipoCbte={tipoCbteEfectivo ?? 1} modalidad={modalidadMiPymes ?? undefined} />
                    <span className="text-xs text-muted-foreground">(código ARCA: {tipoCbteEfectivo})</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">IVA %</label>
                  <input
                    type="number"
                    value={ivaPct}
                    onChange={(e) => setIvaPct(parseFloat(e.target.value) || 0)}
                    min="0"
                    max="100"
                    step="0.01"
                    className="h-8 w-28 rounded border bg-background px-2 text-sm"
                  />
                </div>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between font-medium">
                  <span>Neto ({viajesSeleccionados.length} viaje(s)):</span>
                  <span>{formatearMoneda(preview.neto)}</span>
                </div>
                <div className="flex justify-between">
                  <span>IVA ({ivaPct}%):</span>
                  <span>+ {formatearMoneda(preview.ivaMonto)}</span>
                </div>
                <div className="flex justify-between font-bold text-base border-t pt-2">
                  <span>TOTAL:</span>
                  <span>{formatearMoneda(preview.total)}</span>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => { setSeleccionados(new Set()); setEdiciones({}) }}
                  className="h-9 px-4 rounded-md border text-sm font-medium hover:bg-accent"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmarFactura}
                  disabled={generando || !tipoCbteValido}
                  className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
                >
                  {generando ? "Generando..." : "Emitir factura"}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
