"use client"

import { useState } from "react"
import { ShieldAlert } from "lucide-react"
import { formatearMoneda } from "@/lib/utils"
import { parsearImporte } from "@/lib/money"
import { calcularToneladas, calcularTotalViaje } from "@/lib/viajes"
import { SearchCombobox } from "@/components/ui/search-combobox"
import { CiudadArgentinaInput } from "@/components/ui/ciudad-argentina-input"
import { UploadPDF } from "@/components/upload-pdf"
import type { ViajeAPI, Fletero, Empresa, Camion, Chofer } from "./types"

/**
 * ModalViaje: props -> JSX.Element
 *
 * Dado los datos del formulario de viaje (nuevo o edición), renderiza un modal con
 * todos los campos y cálculo en tiempo real de toneladas y total.
 * Existe para ABM de viajes desde el panel.
 */
export function ModalViaje({
  modo,
  viaje,
  fleteros,
  empresas,
  camiones,
  choferes,
  onGuardar,
  onCerrar,
  cargando,
  error,
}: {
  modo: "nuevo" | "editar"
  viaje?: ViajeAPI
  fleteros: Fletero[]
  empresas: Empresa[]
  camiones: Camion[]
  choferes: Chofer[]
  onGuardar: (data: Record<string, unknown>) => void
  onCerrar: () => void
  cargando: boolean
  error: string | null
}) {
  const [esCamionPropio, setEsCamionPropio] = useState(viaje?.esCamionPropio ?? false)
  const [fleteroId, setFleteroId] = useState(viaje?.fleteroId ?? "")
  const [camionId, setCamionId] = useState(viaje?.camionId ?? "")
  const [choferId, setChoferId] = useState(viaje?.choferId ?? "")
  const [empresaId, setEmpresaId] = useState(viaje?.empresaId ?? "")
  const [fechaViaje, setFechaViaje] = useState(
    viaje ? viaje.fechaViaje.slice(0, 10) : new Date().toISOString().slice(0, 10)
  )
  const [remito, setRemito] = useState(viaje?.remito ?? "")
  const [tieneCupo, setTieneCupo] = useState(viaje?.tieneCupo ?? false)
  const [cupo, setCupo] = useState(viaje?.cupo ?? "")
  const [mercaderia, setMercaderia] = useState(viaje?.mercaderia ?? "")
  const [procedencia, setProcedencia] = useState(viaje?.procedencia ?? "")
  const [provinciaOrigen, setProvinciaOrigen] = useState(viaje?.provinciaOrigen ?? "")
  const [destino, setDestino] = useState(viaje?.destino ?? "")
  const [provinciaDestino, setProvinciaDestino] = useState(viaje?.provinciaDestino ?? "")
  const [kilos, setKilos] = useState(viaje?.kilos?.toString() ?? "")
  const [tarifaInput, setTarifaBase] = useState(viaje?.tarifaEmpresa?.toString() ?? "")
  const [nroCartaPorte, setNroCartaPorte] = useState(viaje?.nroCartaPorte ?? "")
  const [cartaPorteS3Key, setCartaPorteS3Key] = useState(viaje?.cartaPorteS3Key ?? "")

  const camionesDelFletero = esCamionPropio
    ? camiones.filter((c) => c.esPropio)
    : camiones.filter((c) => c.fleteroId === fleteroId)
  const choferesDelFletero = esCamionPropio
    ? choferes.filter((c) => !c.fleteroId)
    : fleteroId
    ? choferes.filter((c) => c.fleteroId === fleteroId)
    : choferes

  const fleteroItems = fleteros.map((f) => ({ id: f.id, label: f.razonSocial, sublabel: f.cuit }))
  const empresaItems = empresas.map((e) => ({ id: e.id, label: e.razonSocial, sublabel: e.cuit }))

  const kilosNum = parseFloat(kilos) || 0
  const tarifaNum = parsearImporte(tarifaInput)
  const toneladas = kilosNum > 0 ? calcularToneladas(kilosNum) : null
  const totalCalc = kilosNum > 0 && tarifaNum > 0 ? calcularTotalViaje(kilosNum, tarifaNum) : null

  const esNuevo = modo === "nuevo"
  const puedeGuardar =
    (esCamionPropio || fleteroId) && camionId && choferId && empresaId && fechaViaje &&
    provinciaOrigen && provinciaDestino && tarifaNum > 0 &&
    (!esNuevo || (nroCartaPorte.trim() !== "" && cartaPorteS3Key !== ""))

  const tooltipDeshabilitado = !puedeGuardar
    ? !cartaPorteS3Key && esNuevo
      ? "Debés subir el PDF de la carta de porte para continuar"
      : !nroCartaPorte.trim() && esNuevo
        ? "Ingresá el número de carta de porte"
        : "Completá todos los campos obligatorios"
    : undefined

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!puedeGuardar) return
    onGuardar({
      ...(esCamionPropio ? { esCamionPropio: true } : { fleteroId }),
      camionId,
      choferId,
      empresaId,
      fechaViaje,
      remito: remito || undefined,
      tieneCupo,
      cupo: tieneCupo ? (cupo || undefined) : null,
      mercaderia: mercaderia || undefined,
      procedencia: procedencia || undefined,
      provinciaOrigen: provinciaOrigen || undefined,
      destino: destino || undefined,
      provinciaDestino: provinciaDestino || undefined,
      kilos: kilosNum > 0 ? kilosNum : undefined,
      tarifa: tarifaNum > 0 ? tarifaNum : undefined,
      ...(esNuevo ? { nroCartaPorte: nroCartaPorte.trim(), cartaPorteS3Key } : {}),
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{modo === "nuevo" ? "Nuevo viaje" : "Editar viaje"}</h2>
          <button onClick={onCerrar} className="text-muted-foreground hover:text-foreground text-xl leading-none">&times;</button>
        </div>

        {modo === "editar" && (viaje?.estadoLiquidacion === "LIQUIDADO" || viaje?.estadoLiquidacion === "LIQUIDADO_AJUSTADO_PARCIAL") && (
          <div className="mb-3 p-3 bg-blue-50 text-blue-800 rounded-md text-sm">
            Este viaje ya fue incluido en una liquidación{viaje.estadoLiquidacion === "LIQUIDADO_AJUSTADO_PARCIAL" ? " (con ajuste parcial)" : ""}. Los datos de la liquidación no se actualizarán.
          </div>
        )}
        {modo === "editar" && (viaje?.estadoFactura === "FACTURADO" || viaje?.estadoFactura === "FACTURADO_AJUSTADO_PARCIAL") && (
          <div className="mb-3 p-3 bg-green-50 text-green-800 rounded-md text-sm">
            Este viaje ya fue incluido en una factura{viaje.estadoFactura === "FACTURADO_AJUSTADO_PARCIAL" ? " (con ajuste parcial)" : ""}. Los datos de la factura no se actualizarán.
          </div>
        )}

        {error && (
          <div className="mb-3 p-3 bg-red-50 text-red-700 rounded-md text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Toggle camión propio (solo al crear) */}
          {esNuevo && (
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Tipo de viaje</label>
              <div className="flex rounded-md border overflow-hidden h-9 w-fit">
                <button
                  type="button"
                  onClick={() => { setEsCamionPropio(false); setCamionId(""); setChoferId("") }}
                  className={`px-4 text-xs font-medium border-r ${!esCamionPropio ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"}`}
                >
                  Con fletero externo
                </button>
                <button
                  type="button"
                  onClick={() => { setEsCamionPropio(true); setFleteroId(""); setCamionId(""); setChoferId("") }}
                  className={`px-4 text-xs font-medium ${esCamionPropio ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"}`}
                >
                  Camión propio Transmagg
                </button>
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {!esCamionPropio && (
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Fletero *</label>
              <SearchCombobox
                items={fleteroItems}
                value={fleteroId}
                onChange={(id) => { setFleteroId(id); setCamionId("") }}
                placeholder="Buscar por nombre o CUIT..."
                required={!esCamionPropio}
                disabled={modo === "editar"}
              />
            </div>
            )}
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Empresa *</label>
              <SearchCombobox
                items={empresaItems}
                value={empresaId}
                onChange={setEmpresaId}
                placeholder="Buscar por nombre o CUIT..."
                required
                disabled={modo === "editar"}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Camión *</label>
              <select
                value={camionId}
                onChange={(e) => {
                  const id = e.target.value
                  setCamionId(id)
                  if (esCamionPropio && id) {
                    const c = camiones.find((x) => x.id === id)
                    if (c?.choferActualId) setChoferId(c.choferActualId)
                  }
                }}
                required
                className="w-full h-9 rounded-md border bg-background px-2 text-sm"
              >
                <option value="">Seleccionar...</option>
                {(esCamionPropio || fleteroId ? camionesDelFletero : camiones).map((c) => (
                  <option key={c.id} value={c.id}>{c.patenteChasis}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Chofer *</label>
              <select
                value={choferId}
                onChange={(e) => setChoferId(e.target.value)}
                required
                className="w-full h-9 rounded-md border bg-background px-2 text-sm"
              >
                <option value="">Seleccionar...</option>
                {choferesDelFletero.map((c) => <option key={c.id} value={c.id}>{c.apellido}, {c.nombre}</option>)}
              </select>
            </div>
          </div>

          {/* Aviso: camión propio sin cobertura vigente */}
          {esCamionPropio && camionId && (() => {
            const c = camiones.find((x) => x.id === camionId)
            return c && c.polizaVigente === false ? (
              <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-800">
                <ShieldAlert className="h-4 w-4 shrink-0" />
                Este camión no tiene seguro vigente. Verificá la cobertura antes de registrar el viaje.
              </div>
            ) : null
          })()}

          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Fecha de viaje *</label>
            <input
              type="date"
              value={fechaViaje}
              onChange={(e) => setFechaViaje(e.target.value)}
              required
              className="w-full h-9 rounded-md border bg-background px-2 text-sm"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Remito</label>
              <input type="text" value={remito} onChange={(e) => setRemito(e.target.value.toUpperCase())} style={{ textTransform: "uppercase" }} className="w-full h-9 rounded-md border bg-background px-2 text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">¿Lleva cupo?</label>
              <div className="flex rounded-md border overflow-hidden h-9">
                <button
                  type="button"
                  onClick={() => { setTieneCupo(false); setCupo("") }}
                  className={`flex-1 text-xs font-medium border-r ${!tieneCupo ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"}`}
                >
                  No
                </button>
                <button
                  type="button"
                  onClick={() => setTieneCupo(true)}
                  className={`flex-1 text-xs font-medium ${tieneCupo ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"}`}
                >
                  Sí
                </button>
              </div>
              {tieneCupo && (
                <input
                  type="text"
                  value={cupo}
                  onChange={(e) => setCupo(e.target.value.toUpperCase())}
                  placeholder="Nro. de cupo"
                  style={{ textTransform: "uppercase" }}
                  className="w-full h-9 rounded-md border bg-background px-2 text-sm mt-2"
                />
              )}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Mercadería</label>
            <input type="text" value={mercaderia} onChange={(e) => setMercaderia(e.target.value.toUpperCase())} style={{ textTransform: "uppercase" }} className="w-full h-9 rounded-md border bg-background px-2 text-sm" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <CiudadArgentinaInput
              label="Ciudad de origen"
              value={procedencia}
              provincia={provinciaOrigen}
              onSelect={(ciudad, prov) => { setProcedencia(ciudad); setProvinciaOrigen(prov) }}
              required
            />
            <CiudadArgentinaInput
              label="Ciudad de destino"
              value={destino}
              provincia={provinciaDestino}
              onSelect={(ciudad, prov) => { setDestino(ciudad); setProvinciaDestino(prov) }}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Kilos</label>
              <input
                type="number"
                value={kilos}
                onChange={(e) => setKilos(e.target.value)}
                min="0"
                step="1"
                className="w-full h-9 rounded-md border bg-background px-2 text-sm"
              />
              {toneladas != null && (
                <p className="text-xs text-muted-foreground mt-1">{toneladas} toneladas</p>
              )}
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Tarifa / ton *</label>
              <input
                type="number"
                value={tarifaInput}
                onChange={(e) => setTarifaBase(e.target.value)}
                min="0"
                step="0.01"
                required
                className="w-full h-9 rounded-md border bg-background px-2 text-sm"
              />
              {totalCalc != null && (
                <p className="text-xs text-muted-foreground mt-1">
                  Referencia inicial del viaje: {formatearMoneda(totalCalc)}
                </p>
              )}
            </div>
          </div>

          {/* Carta de Porte */}
          {modo === "nuevo" && (
            <div className="space-y-3 border-t pt-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Carta de Porte</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Nro. de carta de porte *</label>
                  <input
                    type="text"
                    value={nroCartaPorte}
                    onChange={(e) => setNroCartaPorte(e.target.value)}
                    placeholder="Ej: 12345678"
                    className="w-full h-9 rounded-md border bg-background px-2 text-sm"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">Debe ser único en el sistema.</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">PDF de la carta de porte *</label>
                  <UploadPDF
                    prefijo="cartas-de-porte"
                    onUpload={(key) => setCartaPorteS3Key(key)}
                    label="Subir PDF"
                    s3Key={cartaPorteS3Key || undefined}
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {modo === "editar" && (viaje?.nroCartaPorte || viaje?.cartaPorteS3Key) && (
            <div className="border-t pt-3 space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Carta de Porte</p>
              <p className="text-sm">Nro: <span className="font-medium">{viaje.nroCartaPorte ?? "-"}</span></p>
              {viaje.cartaPorteS3Key && (
                <UploadPDF
                  prefijo="cartas-de-porte"
                  onUpload={() => {}}
                  s3Key={viaje.cartaPorteS3Key}
                  disabled
                />
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onCerrar} className="h-9 px-4 rounded-md border text-sm font-medium hover:bg-accent">
              Cancelar
            </button>
            <span title={tooltipDeshabilitado}>
              <button
                type="submit"
                disabled={cargando || !puedeGuardar}
                className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
              >
                {cargando ? "Guardando..." : modo === "nuevo" ? "Crear viaje" : "Guardar cambios"}
              </button>
            </span>
          </div>
        </form>
      </div>
    </div>
  )
}
