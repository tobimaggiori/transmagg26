"use client"

/**
 * Propósito: Componente de creación de Líquido Producto (flujo canónico).
 * Selector de fletero → viajes pendientes con checkboxes → preview fullscreen → confirmar.
 * Usa el ModalPreviewLiquidacion compartido que incluye fechaEmision, metodoPago y edición inline.
 */

import { useState, useCallback, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { formatearMoneda, formatearFecha } from "@/lib/utils"
import { formatearNroComprobante } from "@/lib/liquidacion-utils"
import { Pencil } from "lucide-react"
import { SearchCombobox } from "@/components/ui/search-combobox"
import { PDFViewer } from "@/components/ui/pdf-viewer"
import { usePDFViewer } from "@/hooks/use-pdf-viewer"
import { PROVINCIAS_ARGENTINA } from "@/lib/provincias"
import type { ProvinciaArgentina } from "@/lib/provincias"
import type { Rol } from "@/types"

import { ModalPreviewLiquidacion } from "@/app/(dashboard)/liquidaciones/_components/modal-preview-liquidacion"
import type { FleteroInfo, ViajeParaLiquidar } from "@/app/(dashboard)/liquidaciones/_components/types"
import { ModalDetalleViaje } from "@/app/(dashboard)/fleteros/viajes/_components/modal-detalle-viaje"
import type { ViajeDetalleAPI, Empresa, Camion, Chofer } from "@/app/(dashboard)/fleteros/viajes/_components/modal-detalle-viaje"

// ─── Tipos locales ───────────────────────────────────────────────────────────

type Fletero = { id: string; razonSocial: string; cuit: string; comisionDefault?: number }

type LiquidarClientProps = {
  rol: Rol
  fleteros: Fletero[]
  empresas: Empresa[]
  camiones: Camion[]
  choferes: Chofer[]
  fleteroIdPropio: string | null
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function LiquidarClient({ rol, fleteros, empresas, camiones, choferes, fleteroIdPropio }: LiquidarClientProps) {
  const esInterno = rol === "ADMIN_TRANSMAGG" || rol === "OPERADOR_TRANSMAGG"
  const searchParams = useSearchParams()
  const fleteroIdParam = searchParams.get("fleteroId")

  const [fleteroId, setFleteroId] = useState<string>(fleteroIdParam ?? fleteroIdPropio ?? "")
  const [viajesPendientes, setViajesPendientes] = useState<ViajeParaLiquidar[]>([])
  const [cargando, setCargando] = useState(false)
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set())
  const [enPreview, setEnPreview] = useState(false)
  const [comisionPct, setComisionPct] = useState<number>(10)
  const [ivaPct] = useState<number>(21)
  const [generando, setGenerando] = useState(false)
  const [errorGen, setErrorGen] = useState<string | null>(null)
  const [reintentableInfo, setReintentableInfo] = useState<{ documentoId: string; mensaje: string } | null>(null)
  const [reintentando, setReintentando] = useState(false)
  const [ultimaFechaLP, setUltimaFechaLP] = useState<string | null>(null)

  // Cargar última fecha de LP al montar
  useEffect(() => {
    fetch("/api/liquidaciones/ultima-fecha")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data?.fecha) setUltimaFechaLP(data.fecha) })
      .catch(() => {})
  }, [])
  const [fleteroInfo, setFleteroInfo] = useState<FleteroInfo | null>(null)
  const [exitoLiquidacion, setExitoLiquidacion] = useState<{ nroLP: string; id: string } | null>(null)
  const [viajeEditando, setViajeEditando] = useState<ViajeDetalleAPI | undefined>(undefined)
  const [modalEditarAbierto, setModalEditarAbierto] = useState(false)
  const { estado: estadoPDF, abrirPDF, cerrarPDF } = usePDFViewer()

  const cargarDatos = useCallback(async () => {
    setCargando(true)
    try {
      const url = fleteroId ? `/api/liquidaciones?fleteroId=${fleteroId}` : "/api/liquidaciones"
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json() as {
          viajesPendientes: Array<{
            id: string; fechaViaje: string; empresaId: string;
            empresa: { razonSocial: string }; camionId: string; camion: { patenteChasis: string };
            choferId: string; chofer: { nombre: string; apellido: string };
            remito: string | null; cupo: string | null; tieneCupo?: boolean | null;
            mercaderia: string | null; procedencia: string | null;
            provinciaOrigen: string | null; destino: string | null; provinciaDestino: string | null;
            kilos: number | null; tarifa: number; tarifaEmpresa: number; estadoFactura: string;
            nroCtg: string | null;
            cpe: string | null;
          }>
          fletero: { cuit: string; condicionIva: string; direccion?: string | null } | null
          nroProximoComprobante: number
        }
        // Mapear al tipo compartido ViajeParaLiquidar con campos de edición
        const viajesConEdit: ViajeParaLiquidar[] = (data.viajesPendientes ?? []).map((v) => ({
          id: v.id,
          fechaViaje: v.fechaViaje,
          empresaId: v.empresaId,
          empresa: v.empresa,
          camionId: v.camionId,
          camion: v.camion,
          choferId: v.choferId,
          chofer: v.chofer,
          remito: v.remito,
          tieneCupo: v.tieneCupo ?? (v.cupo ? true : null),
          cupo: v.cupo,
          mercaderia: v.mercaderia,
          procedencia: v.procedencia,
          provinciaOrigen: v.provinciaOrigen,
          destino: v.destino,
          provinciaDestino: v.provinciaDestino,
          kilos: v.kilos,
          tarifaFletero: v.tarifa,
          tarifaEmpresa: v.tarifaEmpresa,
          estadoFactura: v.estadoFactura,
          nroCtg: v.nroCtg,
          cpe: v.cpe,
          // Campos de edición inicializados
          kilosEdit: v.kilos ?? undefined,
          tarifaEdit: v.tarifa,
          tarifaEmpresaEdit: v.tarifaEmpresa,
          fechaEdit: v.fechaViaje.slice(0, 10),
          remitoEdit: v.remito ?? "",
          tieneCupoEdit: v.tieneCupo ?? (v.cupo ? true : false),
          cupoEdit: v.cupo ?? "",
          mercaderiaEdit: v.mercaderia ?? "",
          procedenciaEdit: v.procedencia ?? "",
          origenEdit: (PROVINCIAS_ARGENTINA as readonly string[]).includes(v.provinciaOrigen ?? "")
            ? v.provinciaOrigen as ProvinciaArgentina
            : undefined,
          destinoEdit: v.destino ?? "",
          provinciaDestinoEdit: (PROVINCIAS_ARGENTINA as readonly string[]).includes(v.provinciaDestino ?? "")
            ? v.provinciaDestino as ProvinciaArgentina
            : undefined,
          camionIdEdit: v.camionId,
          choferIdEdit: v.choferId,
        }))
        setViajesPendientes(viajesConEdit)
        const fleteroEncontrado = fleteros.find((f) => f.id === fleteroId)
        if (fleteroEncontrado) {
          if (esInterno && fleteroEncontrado.comisionDefault != null) setComisionPct(fleteroEncontrado.comisionDefault)
          setFleteroInfo({
            razonSocial: fleteroEncontrado.razonSocial,
            cuit: data.fletero?.cuit ?? "",
            condicionIva: data.fletero?.condicionIva ?? "",
            direccion: data.fletero?.direccion ?? null,
            nroProximoComprobante: data.nroProximoComprobante ?? 1,
          })
        }
      }
    } finally {
      setCargando(false)
    }
  }, [fleteroId, esInterno, fleteros])

  useEffect(() => { cargarDatos() }, [cargarDatos])

  // Notificación visible cuando autoseleccionamos hermanos por cupo.
  const [notifCupo, setNotifCupo] = useState<string | null>(null)

  // Toggle individual: si el viaje tiene cupo, arrastra a los hermanos
  // (mismo cupo, mismo fletero) — la LP debe contener al cupo completo.
  function toggleSeleccion(id: string) {
    const viaje = viajesPendientes.find((v) => v.id === id)
    const cupo = viaje?.cupo?.trim() || null
    const idsAfectados = cupo
      ? viajesPendientes.filter((v) => v.cupo?.trim() === cupo).map((v) => v.id)
      : [id]

    setSeleccionados((prev) => {
      const s = new Set(prev)
      const seleccionar = !s.has(id)
      if (seleccionar) {
        for (const aid of idsAfectados) s.add(aid)
      } else {
        for (const aid of idsAfectados) s.delete(aid)
      }
      return s
    })

    if (cupo && idsAfectados.length > 1) {
      setNotifCupo(`Se auto-seleccionaron ${idsAfectados.length} viajes con cupo ${cupo}.`)
      setTimeout(() => setNotifCupo(null), 4000)
    }
  }

  function toggleTodos() {
    if (seleccionados.size === viajesPendientes.length) setSeleccionados(new Set())
    else setSeleccionados(new Set(viajesPendientes.map((v) => v.id)))
  }

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

  const viajesSeleccionados = viajesPendientes.filter((v) => seleccionados.has(v.id))

  async function confirmarLiquidacion(viajesConfirmados: ViajeParaLiquidar[], comision: number, iva: number, metodoPago: string, fechaEmision: string) {
    if (!fleteroId || viajesConfirmados.length === 0) return
    setGenerando(true)
    setErrorGen(null)
    try {
      const body = {
        fleteroId,
        comisionPct: comision,
        ivaPct: iva,
        viajes: viajesConfirmados.map((v) => ({
          viajeId: v.id,
          camionId: v.camionIdEdit ?? v.camionId,
          choferId: v.choferIdEdit ?? v.choferId,
          fechaViaje: v.fechaEdit ?? v.fechaViaje.slice(0, 10),
          remito: v.remitoEdit || null,
          cupo: (v.tieneCupoEdit ?? v.tieneCupo) ? (v.cupoEdit || null) : null,
          mercaderia: v.mercaderiaEdit || null,
          procedencia: v.procedenciaEdit || null,
          provinciaOrigen: v.origenEdit || null,
          destino: v.destinoEdit || null,
          provinciaDestino: v.provinciaDestinoEdit || null,
          kilos: v.kilosEdit ?? v.kilos ?? 0,
          tarifaFletero: v.tarifaEdit ?? v.tarifaFletero,
          tarifaEmpresa: v.tarifaEmpresaEdit ?? v.tarifaEmpresa,
        })),
        metodoPago,
        fechaEmision,
        emisionArca: true,
        idempotencyKey: (crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`),
      }
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 45000)
      let res: Response
      try {
        res = await fetch("/api/liquidaciones", {
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
          throw fetchErr
        }
        return
      }
      clearTimeout(timeout)
      if (!res.ok) {
        const err = await res.json() as { error?: string; reintentable?: boolean; documentoId?: string }
        if (err.reintentable && err.documentoId) {
          setReintentableInfo({ documentoId: err.documentoId, mensaje: err.error ?? "ARCA no disponible" })
          setErrorGen(null)
          cargarDatos()
          return
        }
        setErrorGen(err.error ?? "Error al generar liquidación")
        return
      }
      const data = await res.json() as { ok: boolean; documento: { id: string; nroComprobante?: number; ptoVenta?: number }; arca: unknown }
      const liqCreada = data.documento
      const nroLP = liqCreada.nroComprobante
        ? `${String(liqCreada.ptoVenta ?? 1).padStart(4, "0")}-${formatearNroComprobante(liqCreada.nroComprobante)}`
        : "LP"
      setEnPreview(false)
      setSeleccionados(new Set())
      setExitoLiquidacion({ nroLP, id: liqCreada.id })
      cargarDatos()
      abrirPDF({
        fetchUrl: `/api/liquidaciones/${liqCreada.id}/pdf`,
        titulo: `LP ${nroLP} — ${fleteroInfo?.razonSocial ?? ""}`,
        onEnviarMail: async (email: string) => {
          const r = await fetch(`/api/liquidaciones/${liqCreada.id}/enviar-email`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ emailDestino: email }),
          })
          if (!r.ok) {
            const err = await r.json()
            throw new Error(err.error ?? "Error al enviar email")
          }
        },
      })
    } catch (e) {
      setErrorGen(e instanceof Error ? e.message : "Error de red al generar liquidación")
    } finally {
      setGenerando(false)
    }
  }

  async function reintentarArca() {
    if (!reintentableInfo) return
    setReintentando(true)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 45000)
    try {
      const res = await fetch(`/api/liquidaciones/${reintentableInfo.documentoId}/autorizar-arca`, {
        method: "POST",
        signal: controller.signal,
      })
      clearTimeout(timeoutId)
      if (!res.ok) {
        const err = await res.json()
        setReintentableInfo({ ...reintentableInfo, mensaje: err.error ?? "Error al reintentar" })
        return
      }
      setReintentableInfo(null)
      setEnPreview(false)
      setSeleccionados(new Set())
      setExitoLiquidacion({ nroLP: "LP", id: reintentableInfo.documentoId })
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Líquido Producto</h2>
        <p className="text-muted-foreground">Creación de liquidación al fletero</p>
      </div>

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
              El comprobante se creó correctamente pero ARCA no está disponible en este momento. Podés reintentar la autorización más tarde desde la lista de liquidaciones.
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
                href="/fleteros/liquidaciones"
                className="flex-1 h-9 rounded-md border border-amber-300 bg-white text-amber-800 text-sm font-medium hover:bg-amber-50 inline-flex items-center justify-center"
              >
                Ir a Liquidaciones
              </a>
            </div>
          </div>
        </div>
      )}

      {exitoLiquidacion && (
        <div className="flex items-center justify-center py-12">
          <div className="w-full max-w-md rounded-lg border bg-white shadow-sm p-6 space-y-5">
            <div className="flex flex-col items-center gap-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
              </div>
              <h3 className="text-lg font-semibold">Liquidación emitida exitosamente</h3>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <span className="text-muted-foreground">Comprobante</span>
              <span className="font-medium">LP {exitoLiquidacion.nroLP}</span>
            </div>
            <div className="flex flex-wrap gap-3 pt-2">
              <a
                href={`/comprobantes/visor?tipo=liquidacion&id=${exitoLiquidacion.id}&titulo=${encodeURIComponent(`LP ${exitoLiquidacion.nroLP}`)}`}
                className="flex-1 h-9 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 inline-flex items-center justify-center"
              >
                Ver PDF
              </a>
              <button
                type="button"
                onClick={() => { setExitoLiquidacion(null); setEnPreview(false); setSeleccionados(new Set()) }}
                className="flex-1 h-9 rounded-md border border-input bg-background text-sm font-medium hover:bg-accent"
              >
                Crear otra liquidación
              </button>
            </div>
          </div>
        </div>
      )}

      {esInterno && (
        <div className="flex flex-wrap gap-4 p-4 bg-muted/40 rounded-lg border">
          <div className="flex flex-col gap-1 min-w-[300px]">
            <label className="text-xs font-medium text-muted-foreground">Fletero</label>
            <SearchCombobox
              items={fleteros.map((f) => ({ id: f.id, label: f.razonSocial, sublabel: f.cuit }))}
              value={fleteroId}
              onChange={(id) => { setFleteroId(id); setSeleccionados(new Set()); setEnPreview(false); setExitoLiquidacion(null) }}
              placeholder="Buscar por razón social o CUIT..."
            />
          </div>
        </div>
      )}

      {fleteroId && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold">Viajes pendientes de liquidación</h3>
              <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800">
                {viajesPendientes.length}
              </span>
            </div>
            {seleccionados.size > 0 && (
              <button
                onClick={() => setEnPreview(true)}
                className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
              >
                Liquidar seleccionados ({seleccionados.size})
              </button>
            )}
          </div>

          {notifCupo && (
            <div className="rounded-md bg-blue-50 border border-blue-200 px-3 py-2 text-xs text-blue-800">
              {notifCupo}
            </div>
          )}

          {cargando ? (
            <div className="text-center py-6 text-muted-foreground">Cargando...</div>
          ) : viajesPendientes.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">Sin viajes pendientes de liquidación.</div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      <input type="checkbox" checked={seleccionados.size === viajesPendientes.length} onChange={toggleTodos} />
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
                  {viajesPendientes.map((v) => {
                    const sel = seleccionados.has(v.id)
                    return (
                      <tr key={v.id} className={`border-b last:border-0 hover:bg-gray-100 transition-colors ${sel ? "bg-blue-50" : ""}`}>
                        <td className="px-4 py-2">
                          <input type="checkbox" checked={sel} onChange={() => toggleSeleccion(v.id)} />
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">{formatearFecha(new Date(v.fechaViaje))}</td>
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
                        <td className="px-4 py-2 whitespace-nowrap text-right text-sm font-medium">{formatearMoneda(v.tarifaFletero)}</td>
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

      {enPreview && (
        <ModalPreviewLiquidacion
          fletero={fleteroInfo ?? { razonSocial: "", cuit: "", condicionIva: "", nroProximoComprobante: 1 }}
          viajesIniciales={viajesSeleccionados}
          comisionPctInicial={comisionPct}
          ivaPctInicial={ivaPct}
          generando={generando}
          error={errorGen}
          onCancelar={() => { setEnPreview(false); setErrorGen(null) }}
          onConfirmar={confirmarLiquidacion}
          fechaEmisionDefault={ultimaFechaLP ?? undefined}
        />
      )}

      {modalEditarAbierto && viajeEditando && (
        <ModalDetalleViaje
          viaje={viajeEditando}
          fleteros={fleteros}
          empresas={empresas}
          camiones={camiones}
          choferes={choferes}
          onGuardar={handleGuardarViaje}
          onCerrar={() => { setModalEditarAbierto(false); setViajeEditando(undefined) }}
        />
      )}

      <PDFViewer {...estadoPDF} onClose={cerrarPDF} />
    </div>
  )
}
