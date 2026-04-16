"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ShieldAlert, Check, MapPin, FileText, Users, Package } from "lucide-react"
import { formatearMoneda } from "@/lib/utils"
import { parsearImporte } from "@/lib/money"
import { FormError } from "@/components/ui/form-error"
import { calcularToneladas, calcularTotalViaje } from "@/lib/viajes"
import { SearchCombobox } from "@/components/ui/search-combobox"
import { PROVINCIAS_ARGENTINA } from "@/lib/provincias"
import { UploadPDF } from "@/components/upload-pdf"
import { hoyLocalYmd } from "@/lib/date-local"

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
  return texto.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
}

function capitalizarPrimera(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase()
}

// ─── Sección visual reutilizable ─────────────────────────────────────────────

function FormSection({ icon: Icon, title, children }: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      <div className="flex items-center gap-2.5 px-5 py-3 border-b border-border">
        <Icon className="h-[18px] w-[18px] text-primary" />
        <h3 className="text-[18px] font-semibold text-foreground">{title}</h3>
      </div>
      <div className="px-5 py-4">
        {children}
      </div>
    </div>
  )
}

// ─── Toggle compacto ─────────────────────────────────────────────────────────

function SegmentedToggle({ options, value, onChange }: {
  options: { value: string; label: string }[]
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="inline-flex rounded-lg border border-border overflow-hidden h-9">
      {options.map((opt, i) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`px-4 text-sm font-medium transition-colors ${
            i < options.length - 1 ? "border-r border-border" : ""
          } ${
            value === opt.value
              ? "bg-primary text-primary-foreground"
              : "bg-card text-muted-foreground hover:bg-accent hover:text-foreground"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

// ─── Componente principal ────────────────────────────────────────────────────

export function NuevoViajeClient({ fleteros, empresas, camiones, choferes }: NuevoViajeClientProps) {
  const router = useRouter()

  const [esCamionPropio, setEsCamionPropio] = useState(false)
  const [fleteroId, setFleteroId] = useState("")
  const [comisionPct, setComisionPct] = useState("")
  const [camionId, setCamionId] = useState("")
  const [choferId, setChoferId] = useState("")
  const [empresaId, setEmpresaId] = useState("")
  const [fechaViaje, setFechaViaje] = useState(hoyLocalYmd())
  const [remito, setRemito] = useState("")
  const [remitoS3Key, setRemitoS3Key] = useState("")
  const [cupo, setCupo] = useState("")
  const [mercaderia, setMercaderia] = useState("")
  const [procedencia, setProcedencia] = useState("")
  const [provinciaOrigen, setProvinciaOrigen] = useState("")
  const [destino, setDestino] = useState("")
  const [provinciaDestino, setProvinciaDestino] = useState("")
  const [kilos, setKilos] = useState("")
  const [tarifaInput, setTarifaBase] = useState("")
  const [nroCartaPorte, setNroCartaPorte] = useState("")
  const [cartaPorteS3Key, setCartaPorteS3Key] = useState("")
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [intentoEnviar, setIntentoEnviar] = useState(false)
  const [viajeCreado, setViajeCreado] = useState(false)

  // Inferir cupo y carta de porte por valor del campo
  const tieneCupo = cupo.trim().length > 0
  const tieneCpe = nroCartaPorte.trim().length > 0

  // Lookup de cupo: si la empresa + cupo matchean un viaje pendiente, los
  // campos lockeados se autocompletan y se deshabilitan. Solo `kilos`,
  // `remito`/`nroCartaPorte` y `fechaViaje` siguen editables.
  const [cupoLocked, setCupoLocked] = useState(false)

  useEffect(() => {
    const cupoTrim = cupo.trim()
    if (!empresaId || !cupoTrim) {
      setCupoLocked(false)
      return
    }
    let cancelado = false
    const handle = setTimeout(async () => {
      try {
        const res = await fetch(`/api/empresas/${empresaId}/viajes-cupo?cupo=${encodeURIComponent(cupoTrim)}`)
        if (!res.ok || cancelado) return
        const data = await res.json() as
          | { existe: false }
          | { existe: true; fuente: { mercaderia: string | null; procedencia: string | null; provinciaOrigen: string | null; destino: string | null; provinciaDestino: string | null; tarifa: number; comisionPct: number | null; fleteroId: string | null; camionId: string; choferId: string; esCamionPropio: boolean; tieneCpe: boolean } }
        if (!data.existe) {
          setCupoLocked(false)
          return
        }
        const f = data.fuente
        setEsCamionPropio(f.esCamionPropio)
        setFleteroId(f.fleteroId ?? "")
        setCamionId(f.camionId)
        setChoferId(f.choferId)
        setMercaderia(f.mercaderia ?? "")
        setProcedencia(f.procedencia ?? "")
        setProvinciaOrigen(f.provinciaOrigen ?? "")
        setDestino(f.destino ?? "")
        setProvinciaDestino(f.provinciaDestino ?? "")
        setTarifaBase(String(f.tarifa))
        setComisionPct(f.comisionPct != null ? String(f.comisionPct) : "")
        setCupoLocked(true)
      } catch {
        if (!cancelado) setCupoLocked(false)
      }
    }, 350)
    return () => {
      cancelado = true
      clearTimeout(handle)
    }
  }, [empresaId, cupo])

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
  const provinciaItems = PROVINCIAS_ARGENTINA.map((p) => ({ id: p, label: p }))
  const camionItems = (esCamionPropio || fleteroId ? camionesDelFletero : camiones).map((c) => ({ id: c.id, label: c.patenteChasis }))
  const choferItems = choferesDelFletero.map((c) => ({ id: c.id, label: `${c.apellido}, ${c.nombre}` }))

  const kilosNum = parsearImporte(kilos) || 0
  const tarifaNum = parsearImporte(tarifaInput)
  const toneladas = kilosNum > 0 ? calcularToneladas(kilosNum) : null
  const totalCalc = kilosNum > 0 && tarifaNum > 0 ? calcularTotalViaje(kilosNum, tarifaNum) : null

  // Al menos remito (con PDF) o CDP (con PDF)
  const tieneRemito = remito.trim() !== "" && remitoS3Key !== ""
  const tieneCDP = nroCartaPorte.trim() !== "" && cartaPorteS3Key !== ""
  const tieneRemitoSinPDF = remito.trim() !== "" && remitoS3Key === ""
  const tieneCDPSinPDF = nroCartaPorte.trim() !== "" && cartaPorteS3Key === ""

  const puedeGuardar =
    (esCamionPropio || fleteroId) && camionId && choferId && empresaId && fechaViaje &&
    (tieneRemito || tieneCDP) && !tieneRemitoSinPDF && !tieneCDPSinPDF &&
    provinciaOrigen && provinciaDestino && tarifaNum > 0 && kilosNum > 0 &&
    mercaderia.trim() !== ""

  const fieldErrors = intentoEnviar ? {
    fleteroId: !esCamionPropio && !fleteroId ? "Campo requerido" : null,
    empresaId: !empresaId ? "Campo requerido" : null,
    camionId: !camionId ? "Campo requerido" : null,
    choferId: !choferId ? "Campo requerido" : null,
    fechaViaje: !fechaViaje ? "Campo requerido" : null,
    remito: !tieneRemito && !tieneCDP ? "Debe cargar al menos Remito o CDP" : tieneRemitoSinPDF ? "Falta PDF del remito" : null,
    mercaderia: !mercaderia.trim() ? "Campo requerido" : null,
    kilos: kilosNum <= 0 ? "Campo requerido" : null,
    provinciaOrigen: !provinciaOrigen ? "Campo requerido" : null,
    provinciaDestino: !provinciaDestino ? "Campo requerido" : null,
    tarifa: tarifaNum <= 0 ? "Campo requerido" : null,
    cartaPorteS3Key: tieneCpe && !cartaPorteS3Key ? "Debés subir el PDF de la carta de porte" : null,
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
          remito: remito.trim() || undefined,
          remitoS3Key: remitoS3Key || undefined,
          tieneCupo,
          cupo: tieneCupo ? cupo.trim() : null,
          mercaderia: capitalizarPrimera(mercaderia.trim()),
          procedencia: procedencia.trim() ? capitalizarPalabras(procedencia.trim()) : undefined,
          provinciaOrigen,
          destino: destino.trim() ? capitalizarPalabras(destino.trim()) : undefined,
          provinciaDestino,
          kilos: kilosNum > 0 ? kilosNum : undefined,
          tarifa: tarifaNum,
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
      setViajeCreado(true)
    } catch {
      setError("Error de red")
    } finally {
      setCargando(false)
    }
  }

  const labelCls = "text-[15px] font-medium text-foreground block mb-1"
  const inputCls = "w-full h-10 rounded-lg border border-input bg-background px-3 text-base focus:border-ring focus:ring-2 focus:ring-ring/20 transition-colors outline-none"

  const hoy = hoyLocalYmd()

  if (viajeCreado) {
    return (
      <div className="space-y-4">
        <h2 className="text-[34px] font-bold tracking-tight text-foreground leading-tight">Nuevo viaje</h2>
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <div className="rounded-full bg-success-soft p-3">
            <Check className="h-8 w-8 text-success" />
          </div>
          <h2 className="text-xl font-semibold text-foreground">Viaje cargado con éxito</h2>
          <button
            type="button"
            onClick={() => {
              setViajeCreado(false)
              setFleteroId("")
              setCamionId("")
              setChoferId("")
              setEmpresaId("")
              setFechaViaje(hoy)
              setRemito("")
              setCupo("")
              setMercaderia("")
              setProcedencia("")
              setProvinciaOrigen("")
              setDestino("")
              setProvinciaDestino("")
              setKilos("")
              setTarifaBase("")
              setComisionPct("")
              setNroCartaPorte("")
              setCartaPorteS3Key("")
              setError(null)
              setIntentoEnviar(false)
            }}
            className="h-10 px-5 rounded-lg bg-primary text-primary-foreground text-[15px] font-medium hover:bg-primary/90 transition-colors"
          >
            Cargar otro viaje
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5 max-w-6xl">
      {/* ════════ Header ════════ */}
      <div className="flex flex-wrap items-center gap-4">
        <h2 className="text-[34px] font-bold tracking-tight text-foreground leading-tight">Nuevo viaje</h2>
        <SegmentedToggle
          options={[
            { value: "externo", label: "Fletero externo" },
            { value: "propio", label: "Camión propio" },
          ]}
          value={esCamionPropio ? "propio" : "externo"}
          onChange={(v) => {
            const propio = v === "propio"
            setEsCamionPropio(propio)
            if (propio) { setFleteroId(""); setComisionPct("") }
            setCamionId("")
            setChoferId("")
          }}
        />
        <div className="flex items-center gap-2">
          <label className="text-[15px] font-medium text-muted-foreground">Fecha</label>
          <input
            type="date"
            value={fechaViaje}
            onChange={(e) => setFechaViaje(e.target.value)}
            className="h-10 rounded-lg border border-input bg-card px-3 text-base font-medium focus:border-ring focus:ring-2 focus:ring-ring/20 transition-colors outline-none"
          />
          <FormError message={fieldErrors.fechaViaje} className="text-xs" />
        </div>
      </div>

      {error && (
        <div className="p-3 bg-error-soft text-error rounded-lg text-[15px] border border-error/20">{error}</div>
      )}

      <form id="nuevo-viaje-form" onSubmit={handleSubmit} noValidate className="space-y-5">
        {/* ════════ Fila 1: Participantes + Recorrido + Carga ════════ */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          {/* ── Participantes ── */}
          <FormSection icon={Users} title="Participantes">
            <div className="space-y-3">
              {!esCamionPropio && (
                <div>
                  <div className="flex items-baseline justify-between mb-1">
                    <label className="text-[15px] font-medium text-foreground">Fletero <span className="text-error">*</span></label>
                    {fleteroId && (
                      <span className="flex items-center gap-1 text-sm text-muted-foreground">
                        Com.
                        <input
                          type="number" min="0" max="100" step="0.01"
                          value={comisionPct}
                          onChange={(e) => setComisionPct(e.target.value)}
                          className="w-14 h-6 rounded border border-input bg-background px-1.5 text-sm text-right disabled:opacity-50"
                          disabled={cupoLocked}
                        />
                        <span>%</span>
                      </span>
                    )}
                  </div>
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
                    disabled={cupoLocked}
                  />
                  <FormError message={fieldErrors.fleteroId} className="text-xs mt-1" />
                </div>
              )}

              <div>
                <label className={labelCls}>Empresa <span className="text-error">*</span></label>
                <SearchCombobox items={empresaItems} value={empresaId} onChange={setEmpresaId} placeholder="Buscar por nombre o CUIT..." />
                <FormError message={fieldErrors.empresaId} className="text-xs mt-1" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Camión <span className="text-error">*</span></label>
                  <SearchCombobox items={camionItems} value={camionId}
                    onChange={(id) => {
                      setCamionId(id)
                      if (esCamionPropio && id) {
                        const c = camiones.find((x) => x.id === id)
                        if (c?.choferActualId) setChoferId(c.choferActualId)
                      }
                    }}
                    placeholder="Patente..."
                    disabled={cupoLocked}
                  />
                  <FormError message={fieldErrors.camionId} className="text-xs mt-1" />
                </div>
                <div>
                  <label className={labelCls}>Chofer <span className="text-error">*</span></label>
                  <SearchCombobox items={choferItems} value={choferId} onChange={setChoferId} placeholder="Nombre..." disabled={cupoLocked} />
                  <FormError message={fieldErrors.choferId} className="text-xs mt-1" />
                </div>
              </div>

              {esCamionPropio && camionId && (() => {
                const c = camiones.find((x) => x.id === camionId)
                return c && c.polizaVigente === false ? (
                  <div className="flex items-center gap-2 p-2.5 bg-warning-soft border border-warning/20 rounded-lg text-sm text-warning-foreground">
                    <ShieldAlert className="h-4 w-4 text-warning shrink-0" />
                    Este camión no tiene seguro vigente.
                  </div>
                ) : null
              })()}
            </div>
          </FormSection>

          {/* ── Recorrido ── */}
          <FormSection icon={MapPin} title="Recorrido">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-primary">Origen</p>
                <div>
                  <label className={labelCls}>Ciudad</label>
                  <input type="text" value={procedencia} onChange={(e) => setProcedencia(e.target.value)} onBlur={() => procedencia && setProcedencia(capitalizarPalabras(procedencia))} className={inputCls} placeholder="Ej: Rosario" disabled={cupoLocked} />
                </div>
                <div>
                  <label className={labelCls}>Provincia <span className="text-error">*</span></label>
                  <SearchCombobox items={provinciaItems} value={provinciaOrigen} onChange={setProvinciaOrigen} placeholder="Buscar..." disabled={cupoLocked} />
                  <FormError message={fieldErrors.provinciaOrigen} className="text-xs mt-1" />
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-primary">Destino</p>
                <div>
                  <label className={labelCls}>Ciudad</label>
                  <input type="text" value={destino} onChange={(e) => setDestino(e.target.value)} onBlur={() => destino && setDestino(capitalizarPalabras(destino))} className={inputCls} placeholder="Ej: Buenos Aires" disabled={cupoLocked} />
                </div>
                <div>
                  <label className={labelCls}>Provincia <span className="text-error">*</span></label>
                  <SearchCombobox items={provinciaItems} value={provinciaDestino} onChange={setProvinciaDestino} placeholder="Buscar..." disabled={cupoLocked} />
                  <FormError message={fieldErrors.provinciaDestino} className="text-xs mt-1" />
                </div>
              </div>
            </div>
          </FormSection>

          {/* ── Carga ── */}
          <FormSection icon={Package} title="Carga">
            <div className="space-y-3">
              <div>
                <label className={labelCls}>Mercadería <span className="text-error">*</span></label>
                <input type="text" value={mercaderia} onChange={(e) => setMercaderia(e.target.value)} onBlur={() => mercaderia && setMercaderia(capitalizarPrimera(mercaderia))} className={inputCls} placeholder="Tipo de carga" disabled={cupoLocked} />
                <FormError message={fieldErrors.mercaderia} className="text-xs mt-1" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Kilos <span className="text-error">*</span></label>
                  <input type="number" value={kilos} onChange={(e) => setKilos(e.target.value)} min="0" step="1" className={inputCls} placeholder="0" />
                  <FormError message={fieldErrors.kilos} className="text-xs mt-1" />
                  {toneladas != null && <p className="text-sm text-muted-foreground mt-1">{toneladas} ton</p>}
                </div>
                <div>
                  <label className={labelCls}>Tarifa / ton <span className="text-error">*</span></label>
                  <input type="number" value={tarifaInput} onChange={(e) => setTarifaBase(e.target.value)} min="0" step="0.01" className={inputCls} placeholder="0,00" disabled={cupoLocked} />
                  <FormError message={fieldErrors.tarifa} className="text-xs mt-1" />
                </div>
              </div>

              {totalCalc != null && (
                <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-accent/50 text-[15px]">
                  <span className="text-muted-foreground">Referencia</span>
                  <span className="font-semibold text-foreground">{formatearMoneda(totalCalc)}</span>
                </div>
              )}
            </div>
          </FormSection>
        </div>

        {/* ════════ Fila 2: Documentación ════════ */}
        <FormSection icon={FileText} title="Documentación">
          <p className="text-xs text-muted-foreground mb-3">Debe cargar al menos Remito o Carta de Porte (con su PDF).</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
            {/* Remito */}
            <div>
              <label className={labelCls}>Remito</label>
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  <input type="text" value={remito} onChange={(e) => setRemito(e.target.value.toUpperCase())} style={{ textTransform: "uppercase" }} className={inputCls} placeholder="Nro. remito" />
                </div>
                <div className="shrink-0 pt-0.5">
                  <UploadPDF prefijo="remitos" onUpload={(key) => setRemitoS3Key(key)} label="Subir" s3Key={remitoS3Key || undefined} />
                </div>
              </div>
              <FormError message={fieldErrors.remito} className="text-xs mt-1" />
            </div>

            {/* Cupo */}
            <div>
              <label className={labelCls}>Cupo <span className="text-muted-foreground font-normal">(opcional)</span></label>
              <input type="text" value={cupo} onChange={(e) => setCupo(e.target.value.toUpperCase())} style={{ textTransform: "uppercase" }} className={inputCls} placeholder="Nro. de cupo" />
            </div>

            {/* Carta de Porte */}
            <div>
              <label className={labelCls}>Carta de Porte</label>
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  <input type="text" value={nroCartaPorte} onChange={(e) => setNroCartaPorte(e.target.value)} className={inputCls} placeholder="Nro. carta de porte" />
                </div>
                <div className="shrink-0 pt-0.5">
                  <UploadPDF prefijo="cartas-de-porte" onUpload={(key) => setCartaPorteS3Key(key)} label="Subir" s3Key={cartaPorteS3Key || undefined} />
                </div>
              </div>
            </div>
          </div>
        </FormSection>

        {/* Spacer para que el contenido no quede tapado por la barra sticky */}
        <div className="h-16" />
      </form>

      {/* ════════ Barra de acciones sticky ════════ */}
      <div className="sticky bottom-0 -mx-4 md:-mx-8 px-4 md:px-8 py-3 bg-card border-t border-border flex items-center justify-end gap-3 z-10">
        <button
          type="button"
          onClick={() => router.back()}
          className="h-10 px-5 rounded-lg border border-border text-[15px] font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          form="nuevo-viaje-form"
          disabled={cargando}
          className="h-10 px-6 rounded-lg bg-primary text-primary-foreground text-[15px] font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {cargando ? "Guardando..." : "Cargar Viaje"}
        </button>
      </div>
    </div>
  )
}
