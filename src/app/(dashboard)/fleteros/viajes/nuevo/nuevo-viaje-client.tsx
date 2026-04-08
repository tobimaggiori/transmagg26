"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ShieldAlert } from "lucide-react"
import { formatearMoneda } from "@/lib/utils"
import { parsearImporte } from "@/lib/money"
import { FormError } from "@/components/ui/form-error"
import { calcularToneladas, calcularTotalViaje } from "@/lib/viajes"
import { SearchCombobox } from "@/components/ui/search-combobox"
import { PROVINCIAS_ARGENTINA } from "@/lib/provincias"
import { UploadPDF } from "@/components/upload-pdf"

type Fletero = { id: string; razonSocial: string; cuit: string; comisionDefault: number }
type Empresa = { id: string; razonSocial: string; cuit: string }
type Camion = { id: string; patenteChasis: string; fleteroId: string | null; esPropio?: boolean; choferActualId?: string | null; polizaVigente?: boolean }
type Chofer = { id: string; nombre: string; apellido: string; fleteroId?: string | null }

interface NuevoViajeClientProps {
  fleteros: Fletero[]
  empresas: Empresa[]
  camiones: Camion[]
  choferes: Chofer[]
}

function capitalizarPalabras(texto: string): string {
  return texto.replace(/\b\w/g, (c) => c.toUpperCase())
}

function capitalizarPrimera(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

export function NuevoViajeClient({ fleteros, empresas, camiones, choferes }: NuevoViajeClientProps) {
  const router = useRouter()

  const [esCamionPropio, setEsCamionPropio] = useState(false)
  const [fleteroId, setFleteroId] = useState("")
  const [comisionPct, setComisionPct] = useState("")
  const [camionId, setCamionId] = useState("")
  const [choferId, setChoferId] = useState("")
  const [empresaId, setEmpresaId] = useState("")
  const [fechaViaje, setFechaViaje] = useState(new Date().toISOString().slice(0, 10))
  const [remito, setRemito] = useState("")
  const [tieneCupo, setTieneCupo] = useState(false)
  const [cupo, setCupo] = useState("")
  const [mercaderia, setMercaderia] = useState("")
  const [procedencia, setProcedencia] = useState("")
  const [provinciaOrigen, setProvinciaOrigen] = useState("")
  const [destino, setDestino] = useState("")
  const [provinciaDestino, setProvinciaDestino] = useState("")
  const [kilos, setKilos] = useState("")
  const [tarifaInput, setTarifaBase] = useState("")
  const [tieneCpe, setTieneCpe] = useState(true)
  const [nroCartaPorte, setNroCartaPorte] = useState("")
  const [cartaPorteS3Key, setCartaPorteS3Key] = useState("")
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [intentoEnviar, setIntentoEnviar] = useState(false)

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

  const kilosNum = parsearImporte(kilos) || 0
  const tarifaNum = parsearImporte(tarifaInput)
  const toneladas = kilosNum > 0 ? calcularToneladas(kilosNum) : null
  const totalCalc = kilosNum > 0 && tarifaNum > 0 ? calcularTotalViaje(kilosNum, tarifaNum) : null

  const puedeGuardar =
    (esCamionPropio || fleteroId) && camionId && choferId && empresaId && fechaViaje &&
    provinciaOrigen && provinciaDestino && tarifaNum > 0 &&
    (!tieneCpe || (nroCartaPorte.trim() !== "" && cartaPorteS3Key !== ""))

  const fieldErrors = intentoEnviar ? {
    fleteroId: !esCamionPropio && !fleteroId ? "Campo requerido" : null,
    empresaId: !empresaId ? "Campo requerido" : null,
    camionId: !camionId ? "Campo requerido" : null,
    choferId: !choferId ? "Campo requerido" : null,
    fechaViaje: !fechaViaje ? "Campo requerido" : null,
    provinciaOrigen: !provinciaOrigen ? "Campo requerido" : null,
    provinciaDestino: !provinciaDestino ? "Campo requerido" : null,
    tarifa: tarifaNum <= 0 ? "Campo requerido" : null,
    nroCartaPorte: tieneCpe && !nroCartaPorte.trim() ? "Campo requerido" : null,
    cartaPorteS3Key: tieneCpe && !cartaPorteS3Key ? "Debés subir el PDF" : null,
  } : {} as Record<string, string | null>

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIntentoEnviar(true)
    if (!puedeGuardar) return
    setCargando(true)
    setError(null)
    try {
      const res = await fetch("/api/viajes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(esCamionPropio ? { esCamionPropio: true } : { fleteroId, ...(comisionPct ? { comisionPct: parsearImporte(comisionPct) } : {}) }),
          camionId,
          choferId,
          empresaId,
          fechaViaje,
          remito: remito || undefined,
          tieneCupo,
          cupo: tieneCupo ? (cupo || undefined) : null,
          mercaderia: mercaderia ? capitalizarPrimera(mercaderia) : undefined,
          procedencia: procedencia ? capitalizarPalabras(procedencia) : undefined,
          provinciaOrigen: provinciaOrigen || undefined,
          destino: destino ? capitalizarPalabras(destino) : undefined,
          provinciaDestino: provinciaDestino || undefined,
          kilos: kilosNum > 0 ? kilosNum : undefined,
          tarifa: tarifaNum > 0 ? tarifaNum : undefined,
          tieneCpe,
          nroCartaPorte: tieneCpe ? nroCartaPorte.trim() : null,
          cartaPorteS3Key: tieneCpe ? cartaPorteS3Key : null,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        if (json.detalles?.fieldErrors) {
          const fields = json.detalles.fieldErrors as Record<string, string[]>
          const msgs = Object.entries(fields)
            .filter(([, errs]) => errs.length > 0)
            .map(([campo, errs]) => `${campo}: ${errs.join(", ")}`)
          setError(msgs.length > 0 ? msgs.join(" | ") : (json.error ?? "Error al crear el viaje"))
        } else {
          setError(json.error ?? "Error al crear el viaje")
        }
        return
      }
      router.push("/fleteros/viajes/consultar")
    } catch {
      setError("Error de red")
    } finally {
      setCargando(false)
    }
  }

  const labelCls = "text-xs font-medium text-muted-foreground block mb-1"
  const inputCls = "w-full h-9 rounded-md border bg-background px-2 text-sm"
  const selectCls = "w-full h-9 rounded-md border bg-background px-2 text-sm"

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Nuevo viaje</h2>
        <p className="text-muted-foreground">Cargá los datos del viaje</p>
      </div>

      <div className="bg-background rounded-lg border shadow-sm w-full max-w-7xl p-6">
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-8 gap-y-4">

            {/* ────── Columna 1: Entidades ────── */}
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground border-b pb-1">Entidades</p>

              <div>
                <label className={labelCls}>Tipo de viaje</label>
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
                    onClick={() => { setEsCamionPropio(true); setFleteroId(""); setCamionId(""); setChoferId(""); setComisionPct("") }}
                    className={`px-4 text-xs font-medium ${esCamionPropio ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"}`}
                  >
                    Camión propio Transmagg
                  </button>
                </div>
              </div>

              {!esCamionPropio && (
                <div>
                  <label className={labelCls}>Fletero *</label>
                  <SearchCombobox
                    items={fleteroItems}
                    value={fleteroId}
                    onChange={(id) => {
                      setFleteroId(id)
                      setCamionId("")
                      const f = fleteros.find((x) => x.id === id)
                      setComisionPct(f ? String(f.comisionDefault) : "")
                    }}
                    placeholder="Buscar por nombre o CUIT..."
                  />
                  <FormError message={fieldErrors.fleteroId} className="text-xs mt-1" />
                  {fleteroId && (
                    <div className="flex items-center gap-2 mt-1.5">
                      <label className="text-xs text-muted-foreground whitespace-nowrap">Comisión %</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={comisionPct}
                        onChange={(e) => setComisionPct(e.target.value)}
                        className="w-20 h-7 rounded-md border bg-background px-2 text-xs"
                      />
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className={labelCls}>Empresa *</label>
                <SearchCombobox
                  items={empresaItems}
                  value={empresaId}
                  onChange={setEmpresaId}
                  placeholder="Buscar por nombre o CUIT..."
                />
                <FormError message={fieldErrors.empresaId} className="text-xs mt-1" />
              </div>

              <div>
                <label className={labelCls}>Camión *</label>
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
                  className={inputCls}
                >
                  <option value="">Seleccionar...</option>
                  {(esCamionPropio || fleteroId ? camionesDelFletero : camiones).map((c) => (
                    <option key={c.id} value={c.id}>{c.patenteChasis}</option>
                  ))}
                </select>
                <FormError message={fieldErrors.camionId} className="text-xs mt-1" />
              </div>

              <div>
                <label className={labelCls}>Chofer *</label>
                <select
                  value={choferId}
                  onChange={(e) => setChoferId(e.target.value)}
                  className={inputCls}
                >
                  <option value="">Seleccionar...</option>
                  {choferesDelFletero.map((c) => <option key={c.id} value={c.id}>{c.apellido}, {c.nombre}</option>)}
                </select>
                <FormError message={fieldErrors.choferId} className="text-xs mt-1" />
              </div>

              {esCamionPropio && camionId && (() => {
                const c = camiones.find((x) => x.id === camionId)
                return c && c.polizaVigente === false ? (
                  <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-800">
                    <ShieldAlert className="h-4 w-4 shrink-0" />
                    Este camión no tiene seguro vigente. Verificá la cobertura antes de registrar el viaje.
                  </div>
                ) : null
              })()}
            </div>

            {/* ────── Columna 2: Datos del viaje ────── */}
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground border-b pb-1">Datos del viaje</p>

              <div>
                <label className={labelCls}>Fecha de viaje *</label>
                <input type="date" value={fechaViaje} onChange={(e) => setFechaViaje(e.target.value)} className={inputCls} />
                <FormError message={fieldErrors.fechaViaje} className="text-xs mt-1" />
              </div>

              <div>
                <label className={labelCls}>Remito</label>
                <input type="text" value={remito} onChange={(e) => setRemito(e.target.value.toUpperCase())} style={{ textTransform: "uppercase" }} className={inputCls} />
              </div>

              <div>
                <label className={labelCls}>¿Lleva cupo?</label>
                <div className="flex rounded-md border overflow-hidden h-9">
                  <button type="button" onClick={() => { setTieneCupo(false); setCupo("") }} className={`flex-1 text-xs font-medium border-r ${!tieneCupo ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"}`}>No</button>
                  <button type="button" onClick={() => setTieneCupo(true)} className={`flex-1 text-xs font-medium ${tieneCupo ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"}`}>Sí</button>
                </div>
                {tieneCupo && (
                  <input type="text" value={cupo} onChange={(e) => setCupo(e.target.value.toUpperCase())} placeholder="Nro. de cupo" style={{ textTransform: "uppercase" }} className={`${inputCls} mt-2`} />
                )}
              </div>

              <div>
                <label className={labelCls}>Mercadería</label>
                <input type="text" value={mercaderia} onChange={(e) => setMercaderia(e.target.value)} onBlur={() => mercaderia && setMercaderia(capitalizarPrimera(mercaderia))} className={inputCls} />
              </div>

              {/* Origen */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={labelCls}>Ciudad de origen</label>
                  <input type="text" value={procedencia} onChange={(e) => setProcedencia(e.target.value)} onBlur={() => procedencia && setProcedencia(capitalizarPalabras(procedencia))} className={inputCls} placeholder="Ciudad" />
                </div>
                <div>
                  <label className={labelCls}>Provincia *</label>
                  <select value={provinciaOrigen} onChange={(e) => setProvinciaOrigen(e.target.value)} className={selectCls}>
                    <option value="">Seleccionar...</option>
                    {PROVINCIAS_ARGENTINA.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                  <FormError message={fieldErrors.provinciaOrigen} className="text-xs mt-1" />
                </div>
              </div>

              {/* Destino */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={labelCls}>Ciudad de destino</label>
                  <input type="text" value={destino} onChange={(e) => setDestino(e.target.value)} onBlur={() => destino && setDestino(capitalizarPalabras(destino))} className={inputCls} placeholder="Ciudad" />
                </div>
                <div>
                  <label className={labelCls}>Provincia *</label>
                  <select value={provinciaDestino} onChange={(e) => setProvinciaDestino(e.target.value)} className={selectCls}>
                    <option value="">Seleccionar...</option>
                    {PROVINCIAS_ARGENTINA.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                  <FormError message={fieldErrors.provinciaDestino} className="text-xs mt-1" />
                </div>
              </div>
            </div>

            {/* ────── Columna 3: Económico y CPE ────── */}
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground border-b pb-1">Económico y CPE</p>

              <div>
                <label className={labelCls}>Kilos</label>
                <input type="number" value={kilos} onChange={(e) => setKilos(e.target.value)} min="0" step="1" className={inputCls} />
                {toneladas != null && <p className="text-xs text-muted-foreground mt-1">{toneladas} toneladas</p>}
              </div>

              <div>
                <label className={labelCls}>Tarifa / ton *</label>
                <input type="number" value={tarifaInput} onChange={(e) => setTarifaBase(e.target.value)} min="0" step="0.01" className={inputCls} />
                <FormError message={fieldErrors.tarifa} className="text-xs mt-1" />
                {totalCalc != null && <p className="text-xs text-muted-foreground mt-1">Referencia inicial del viaje: {formatearMoneda(totalCalc)}</p>}
              </div>

              <div className="space-y-3 border-t pt-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Carta de Porte</p>
                  <div className="flex rounded-md border overflow-hidden h-8 w-fit">
                    <button type="button" onClick={() => setTieneCpe(true)} className={`px-3 text-xs font-medium border-r ${tieneCpe ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"}`}>Sí</button>
                    <button type="button" onClick={() => { setTieneCpe(false); setNroCartaPorte(""); setCartaPorteS3Key("") }} className={`px-3 text-xs font-medium ${!tieneCpe ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"}`}>No</button>
                  </div>
                </div>
                {tieneCpe ? (
                  <div className="space-y-3">
                    <div>
                      <label className={labelCls}>Nro. de carta de porte *</label>
                      <input type="text" value={nroCartaPorte} onChange={(e) => setNroCartaPorte(e.target.value)} placeholder="Ej: 12345678" className={inputCls} />
                      <FormError message={fieldErrors.nroCartaPorte} className="text-xs mt-1" />
                      {!fieldErrors.nroCartaPorte && <p className="text-[11px] text-muted-foreground mt-1">Debe ser único en el sistema.</p>}
                    </div>
                    <div>
                      <label className={labelCls}>PDF de la carta de porte *</label>
                      <UploadPDF prefijo="cartas-de-porte" onUpload={(key) => setCartaPorteS3Key(key)} label="Subir PDF" s3Key={cartaPorteS3Key || undefined} />
                      <FormError message={fieldErrors.cartaPorteS3Key} className="text-xs mt-1" />
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">El viaje se creará sin carta de porte.</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-6 border-t mt-6">
            <button type="button" onClick={() => router.back()} className="h-9 px-4 rounded-md border text-sm font-medium hover:bg-accent">Cancelar</button>
            <button type="submit" disabled={cargando} className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
              {cargando ? "Guardando..." : "Crear viaje"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
