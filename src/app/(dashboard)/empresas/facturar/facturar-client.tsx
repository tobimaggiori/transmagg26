"use client"

/**
 * Propósito: Componente cliente para creación de facturas a empresas (/empresas/facturar).
 * Flujo: seleccionar empresa -> ver viajes pendientes con checkboxes -> editar kilos/tarifa inline -> emitir factura.
 * Modelo: N viajes seleccionados = 1 Factura.
 */

import { useState, useCallback, useEffect, useMemo } from "react"
import { Pencil } from "lucide-react"
import { formatearMoneda, formatearFecha } from "@/lib/utils"
import { calcularFactura } from "@/lib/viajes"
import { facturasEmpresaDisponibles } from "@/lib/arca/catalogo"
import { SearchCombobox } from "@/components/ui/search-combobox"
import { hoyLocalYmd } from "@/lib/date-local"
import { ModalPreviewFactura } from "./_components/modal-preview-factura"
import { ModalDetalleViaje, type ViajeDetalleAPI } from "@/app/(dashboard)/fleteros/viajes/_components/modal-detalle-viaje"

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
  nroCtg: string | null
  cpe: string | null
  tieneCtg: boolean
  esCamionPropio: boolean
  fletero: { razonSocial: string } | null
  enLiquidaciones: Array<{
    liquidacion: { nroComprobante: number | null; ptoVenta: number | null; id: string }
  }>
}

// ---- Props ----

type FacturarEmpresaClientProps = {
  empresas: Array<{ id: string; razonSocial: string; cuit: string; condicionIva: string; padronFce: boolean; direccion?: string | null }>
  fleteros: Array<{ id: string; razonSocial: string; cuit: string }>
  camiones: Array<{ id: string; patenteChasis: string; fleteroId: string | null; esPropio?: boolean }>
  choferes: Array<{ id: string; nombre: string; apellido: string; email: string | null }>
  comprobantesHabilitados: number[]
  montoMinimoFce: number | null
}

// ---- Helpers ----

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
export function FacturarEmpresaClient({ empresas, fleteros, camiones, choferes, comprobantesHabilitados, montoMinimoFce }: FacturarEmpresaClientProps) {
  const [empresaId, setEmpresaId] = useState("")
  const [viajes, setViajes] = useState<ViajeParaFacturar[]>([])
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set())
  const [tipoCbteNum, setTipoCbteNum] = useState<number | null>(null)
  const [modalidadMiPymes, setModalidadMiPymes] = useState<"SCA" | "ADC" | null>(null)
  const [ivaPct, setIvaPct] = useState<number>(21)
  const [metodoPago, setMetodoPago] = useState<string>("Transferencia Bancaria")
  const [fechaEmision, setFechaEmision] = useState(() => hoyLocalYmd())
  const [cargando, setCargando] = useState(false)
  const [generando, setGenerando] = useState(false)
  const [errorGen, setErrorGen] = useState<string | null>(null)
  const [facturaEmitida, setFacturaEmitida] = useState<{
    id: string; tipoCbte: number; ptoVenta: number; nroComprobante: string;
    cae: string; caeVto: string; neto: number; ivaMonto: number; total: number; emitidaEn: string;
    observaciones: string | null;
  } | null>(null)
  const [reintentableInfo, setReintentableInfo] = useState<{ documentoId: string; mensaje: string } | null>(null)
  const [reintentando, setReintentando] = useState(false)
  const [avisoFce, setAvisoFce] = useState<string | null>(null)
  const [enPreview, setEnPreview] = useState(false)
  const [viajeEditando, setViajeEditando] = useState<ViajeDetalleAPI | undefined>(undefined)
  const [modalEditarAbierto, setModalEditarAbierto] = useState(false)

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

  // Códigos disponibles según condición fiscal + config ARCA + padrón FCE
  const codigosDisponibles = useMemo(
    () => {
      if (!empresaSeleccionada) return []
      const codigos = facturasEmpresaDisponibles(empresaSeleccionada.condicionIva, comprobantesHabilitados)
      if (!empresaSeleccionada.padronFce) return codigos.filter((c) => c !== 201)
      return codigos
    },
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

  // Determinar el tipo de origen de los viajes ya seleccionados
  const origenSeleccionado: "propio" | "fletero" | null = useMemo(() => {
    if (seleccionados.size === 0) return null
    const primerSeleccionado = viajes.find((v) => seleccionados.has(v.id))
    return primerSeleccionado?.esCamionPropio ? "propio" : "fletero"
  }, [seleccionados, viajes])

  // Un viaje es seleccionable si no hay selección o si coincide el origen
  function esSeleccionable(v: ViajeParaFacturar): boolean {
    if (seleccionados.size === 0) return true
    return origenSeleccionado === (v.esCamionPropio ? "propio" : "fletero")
  }

  // Notificación visible cuando autoseleccionamos hermanos por cupo.
  const [notifCupo, setNotifCupo] = useState<string | null>(null)

  // Toggle individual viaje. Si el viaje tiene cupo, arrastra (selecciona/
  // deselecciona) a todos los viajes pendientes de la misma empresa con
  // ese mismo cupo — la factura debe contener al cupo completo.
  function toggleViaje(id: string) {
    const viaje = viajes.find((v) => v.id === id)
    const cupo = viaje?.cupo?.trim() || null
    const idsAfectados = cupo
      ? viajes.filter((v) => v.cupo?.trim() === cupo).map((v) => v.id)
      : [id]

    setSeleccionados((prev) => {
      const next = new Set(prev)
      const seleccionar = !next.has(id)
      if (seleccionar) {
        for (const aid of idsAfectados) next.add(aid)
      } else {
        for (const aid of idsAfectados) next.delete(aid)
      }
      return next
    })

    if (cupo && idsAfectados.length > 1) {
      setNotifCupo(`Se ${idsAfectados.length === 1 ? "seleccionó" : "auto-seleccionaron"} ${idsAfectados.length} viajes con cupo ${cupo}.`)
      setTimeout(() => setNotifCupo(null), 4000)
    }
  }

  // Toggle todos: si no hay mezcla, selecciona/deselecciona todos.
  // Si hay mezcla y no hay selección previa, no hace nada (el usuario debe elegir uno primero).
  function toggleTodos() {
    if (seleccionados.size > 0) {
      setSeleccionados(new Set())
    } else {
      // Si hay mezcla, no seleccionar todos (forzar selección individual primero)
      if (hayMezclaEnViajes) return
      setSeleccionados(new Set(viajes.map((v) => v.id)))
    }
  }

  // Advertencia si hay mezcla posible
  const hayMezclaEnViajes = useMemo(() => {
    const tienePropios = viajes.some((v) => v.esCamionPropio)
    const tieneAjenos = viajes.some((v) => !v.esCamionPropio)
    return tienePropios && tieneAjenos
  }, [viajes])

  // Viajes seleccionados (la edición de cada viaje se hace vía ModalDetalleViaje,
  // los valores vienen directos del backend, sin ediciones in-memory).
  const viajesSeleccionados = viajes.filter((v) => seleccionados.has(v.id))
  const viajesParaCalc = viajesSeleccionados.map((v) => ({
    kilos: v.kilos ?? 0,
    tarifaEmpresa: v.tarifaEmpresa,
  }))

  async function abrirEdicionViaje(viajeId: string) {
    try {
      const res = await fetch(`/api/viajes/${viajeId}`)
      if (!res.ok) return
      setViajeEditando(await res.json() as ViajeDetalleAPI)
      setModalEditarAbierto(true)
    } catch { /* ignore */ }
  }

  function handleGuardarViaje() {
    setModalEditarAbierto(false)
    setViajeEditando(undefined)
    cargarDatos()
  }

  async function confirmarFactura(ivaPctFinal?: number, metodoPagoFinal?: string, fechaEmisionFinal?: string) {
    if (!empresaId || seleccionados.size === 0 || !tipoCbteEfectivo) return

    const ivaEfectivo = ivaPctFinal ?? ivaPct
    const metodoEfectivo = metodoPagoFinal ?? metodoPago
    const fechaEfectiva = fechaEmisionFinal ?? fechaEmision

    // Recalcular preview con el IVA final (puede haberse editado en el modal)
    const previewFinal = viajesParaCalc.length > 0 ? calcularFactura(viajesParaCalc, ivaEfectivo) : null

    // Validar monto mínimo FCE: solo para empresas con padrón FCE
    if (empresaSeleccionada?.padronFce && montoMinimoFce != null && montoMinimoFce > 0 && previewFinal) {
      // Factura A común con monto >= mínimo → debe emitir MiPyME
      if (tipoCbteEfectivo === 1 && previewFinal.total >= montoMinimoFce) {
        setAvisoFce("Por el monto a facturar debe emitir Factura A MiPyME.")
        return
      }
      // FCE MiPyME con monto < mínimo → debe emitir Factura A común
      if (tipoCbteEfectivo === 201 && previewFinal.total < montoMinimoFce) {
        setAvisoFce("Por el monto a facturar corresponde emitir Factura A.")
        return
      }
    }

    // Sincronizar state con los valores finales del modal
    setIvaPct(ivaEfectivo)
    setMetodoPago(metodoEfectivo)
    setFechaEmision(fechaEfectiva)

    setGenerando(true)
    setErrorGen(null)
    try {
      const body = {
        empresaId,
        viajeIds: Array.from(seleccionados),
        tipoCbte: tipoCbteEfectivo,
        modalidadMiPymes: modalidadMiPymes ?? undefined,
        ivaPct: ivaEfectivo,
        metodoPago: metodoEfectivo,
        fechaEmision: fechaEfectiva,
        emisionArca: true,
        idempotencyKey: (crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`),
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
      setReintentableInfo(null)
      setEnPreview(false)
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
        observaciones: data.arca?.observaciones ?? null,
      })
      cargarDatos()
    } finally {
      setGenerando(false)
    }
  }

  function resetearFormulario() {
    setFacturaEmitida(null)
    setSeleccionados(new Set())
    setTipoCbteNum(null)
    setModalidadMiPymes(null)
    setIvaPct(21)
    setMetodoPago("Transferencia Bancaria")
    setFechaEmision(hoyLocalYmd())
    setErrorGen(null)
    setReintentableInfo(null)
  }

  async function reintentarArca() {
    if (!reintentableInfo) return
    setReintentando(true)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 45000)
    try {
      const res = await fetch(`/api/facturas/${reintentableInfo.documentoId}/autorizar-arca`, {
        method: "POST",
        signal: controller.signal,
      })
      clearTimeout(timeoutId)
      if (!res.ok) {
        const err = await res.json()
        setReintentableInfo({ ...reintentableInfo, mensaje: err.error ?? "Error al reintentar" })
        return
      }
      const data = await res.json()
      const doc = data.documento
      setReintentableInfo(null)
      setSeleccionados(new Set())
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
        observaciones: data.arca?.observaciones ?? null,
      })
      cargarDatos()
    } catch (err) {
      clearTimeout(timeoutId)
      if (err instanceof DOMException && err.name === "AbortError") {
        setReintentableInfo({ ...reintentableInfo, mensaje: "ARCA no respondió a tiempo. Podés reintentar en unos minutos." })
      } else {
        setReintentableInfo({ ...reintentableInfo, mensaje: "Error de red al reintentar. Intentá de nuevo." })
      }
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
            {facturaEmitida.observaciones && (
              <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2">
                <p className="text-xs font-medium text-amber-800">Observaciones ARCA</p>
                <p className="text-xs text-amber-700 mt-0.5">{facturaEmitida.observaciones}</p>
              </div>
            )}
            <div className="flex gap-3 pt-2">
              <a
                href={`/comprobantes/visor?tipo=factura&id=${facturaEmitida.id}&titulo=${encodeURIComponent(`Factura ${facturaEmitida.tipoCbte === 1 ? "A" : facturaEmitida.tipoCbte === 6 ? "B" : "A MiPyme"} ${String(facturaEmitida.ptoVenta).padStart(4, "0")}-${String(parseInt(facturaEmitida.nroComprobante) || 0).padStart(8, "0")}`)}`}
                className="flex-1 h-9 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 inline-flex items-center justify-center"
              >
                Ver PDF
              </a>
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

      {/* Warning ARCA no disponible — comprobante conservado */}
      {reintentableInfo && (
        <div className="flex items-center justify-center py-12">
          <div className="w-full max-w-md rounded-lg border border-amber-200 bg-amber-50 shadow-sm p-6 space-y-4">
            <div className="flex flex-col items-center gap-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 15.75h.007v.008H12v-.008z" /></svg>
              </div>
              <h3 className="text-lg font-semibold text-amber-900">ARCA no disponible</h3>
            </div>
            <p className="text-sm text-amber-800 text-center">
              El comprobante se creó correctamente pero ARCA no está disponible en este momento. Podés reintentar la autorización más tarde desde la lista de facturas.
            </p>
            <div className="flex gap-3">
              <button
                onClick={reintentarArca}
                disabled={reintentando}
                className="flex-1 h-9 rounded-md bg-amber-600 text-white text-sm font-medium hover:bg-amber-700 disabled:opacity-50"
              >
                {reintentando ? "Reintentando..." : "Reintentar ahora"}
              </button>
              <a
                href="/empresas/facturas"
                className="flex-1 h-9 rounded-md border border-amber-300 bg-white text-amber-800 text-sm font-medium hover:bg-amber-50 inline-flex items-center justify-center"
              >
                Ir a Facturas
              </a>
            </div>
          </div>
        </div>
      )}

      {empresaId && !facturaEmitida && !reintentableInfo && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold">Viajes pendientes de facturar</h3>
              <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800">
                {viajes.length}
              </span>
            </div>
            {seleccionados.size > 0 && (
              <button
                onClick={() => { setErrorGen(null); setEnPreview(true) }}
                disabled={!tipoCbteValido}
                className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
              >
                Facturar seleccionados ({seleccionados.size})
              </button>
            )}
          </div>

          {hayMezclaEnViajes && origenSeleccionado && (
            <div className="rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800">
              Solo se pueden seleccionar viajes del mismo tipo ({origenSeleccionado === "propio" ? "camión propio" : "fletero"}).
              Los viajes del otro tipo están deshabilitados.
            </div>
          )}

          {notifCupo && (
            <div className="rounded-md bg-blue-50 border border-blue-200 px-3 py-2 text-xs text-blue-800">
              {notifCupo}
            </div>
          )}

          {cargando ? (
            <div className="text-center py-6 text-muted-foreground">Cargando...</div>
          ) : viajes.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">Sin viajes pendientes de facturación para esta empresa.</div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      <input
                        type="checkbox"
                        checked={seleccionados.size === viajes.length && viajes.length > 0}
                        onChange={toggleTodos}
                      />
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Fecha</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Remito</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Mercadería</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Origen</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Destino</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Kilos</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Tarifa</th>
                    <th className="px-4 py-2 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                      <Pencil className="inline h-3.5 w-3.5" />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {viajes.map((v) => {
                    const sel = seleccionados.has(v.id)
                    const deshabilitado = !sel && !esSeleccionable(v)
                    return (
                      <tr key={v.id} className={`border-b last:border-0 hover:bg-gray-100 transition-colors ${sel ? "bg-blue-50" : ""}`}>
                        <td className="px-4 py-2">
                          <input
                            type="checkbox"
                            checked={sel}
                            disabled={deshabilitado}
                            onChange={() => toggleViaje(v.id)}
                            className="accent-primary disabled:opacity-30"
                          />
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">{formatearFecha(v.fechaViaje)}</td>
                        <td className="px-4 py-2 whitespace-nowrap">{v.remito || "—"}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm max-w-[120px] truncate">{v.mercaderia || "—"}</td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          <div>
                            <p className="text-sm">{v.procedencia || "—"}</p>
                            {v.provinciaOrigen && <p className="text-xs text-gray-500">{v.provinciaOrigen}</p>}
                          </div>
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          <div>
                            <p className="text-sm">{v.destino || "—"}</p>
                            {v.provinciaDestino && <p className="text-xs text-gray-500">{v.provinciaDestino}</p>}
                          </div>
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-right text-sm">{v.kilos != null ? v.kilos.toLocaleString("es-AR") : "—"}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-right text-sm font-medium">{formatearMoneda(v.tarifaEmpresa)}</td>
                        <td className="px-4 py-2 text-center">
                          <button
                            type="button"
                            onClick={() => abrirEdicionViaje(v.id)}
                            className="inline-flex items-center justify-center h-7 w-7 rounded-md border hover:bg-gray-100 text-sm transition-colors"
                            title="Editar viaje"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal preview factura */}
      {enPreview && empresaSeleccionada && tipoCbteEfectivo && (
        <ModalPreviewFactura
          empresa={empresaSeleccionada}
          viajes={viajesSeleccionados.map((v) => ({
            id: v.id,
            fechaViaje: v.fechaViaje,
            remito: v.remito,
            cupo: v.cupo,
            mercaderia: v.mercaderia,
            procedencia: v.procedencia,
            provinciaOrigen: v.provinciaOrigen,
            destino: v.destino,
            provinciaDestino: v.provinciaDestino,
            kilos: v.kilos ?? 0,
            tarifa: v.tarifaEmpresa,
            nroCtg: v.nroCtg,
            cpe: v.cpe,
          }))}
          tipoCbte={tipoCbteEfectivo}
          modalidadMiPymes={modalidadMiPymes}
          ivaPctInicial={ivaPct}
          metodoPagoInicial={metodoPago}
          fechaEmisionDefault={fechaEmision}
          generando={generando}
          error={errorGen}
          onCancelar={() => { if (!generando) { setEnPreview(false); setErrorGen(null) } }}
          onConfirmar={(iva, metodo, fecha) => confirmarFactura(iva, metodo, fecha)}
        />
      )}

      {/* Modal aviso monto mínimo FCE */}
      {avisoFce && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background rounded-lg border shadow-lg max-w-md w-full mx-4 p-6 space-y-4">
            <div className="flex items-center gap-2 text-amber-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86l-8.4 14.31A1.75 1.75 0 003.38 21h17.24a1.75 1.75 0 001.49-2.83l-8.4-14.31a1.75 1.75 0 00-2.98 0z" />
              </svg>
              <p className="text-base font-semibold">Atención</p>
            </div>
            <p className="text-sm">{avisoFce}</p>
            <p className="text-xs text-muted-foreground">
              Cambiá el tipo de comprobante y volvé a emitir.
            </p>
            <div className="flex justify-end">
              <button
                onClick={() => setAvisoFce(null)}
                className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal edición de viaje (mismo que en LP y resto del sistema) */}
      {modalEditarAbierto && viajeEditando && (
        <ModalDetalleViaje
          viaje={viajeEditando}
          empresas={empresas}
          fleteros={fleteros}
          camiones={camiones}
          choferes={choferes}
          onGuardar={handleGuardarViaje}
          onCerrar={() => { setModalEditarAbierto(false); setViajeEditando(undefined) }}
        />
      )}
    </div>
  )
}
