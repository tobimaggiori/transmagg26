"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { MapPin, FileText, Users, Package } from "lucide-react"
import { formatearMoneda } from "@/lib/utils"
import { FormError } from "@/components/ui/form-error"
import { calcularToneladas, calcularTotalViaje } from "@/lib/viajes"
import { SearchCombobox } from "@/components/ui/search-combobox"
import { PROVINCIAS_ARGENTINA } from "@/lib/provincias"
import { UploadPDF } from "@/components/upload-pdf"

type Empresa = { id: string; razonSocial: string; cuit: string }
type Camion = { id: string; patenteChasis: string }
type Chofer = { id: string; nombre: string; apellido: string }

interface NuevoViajeJmClientProps {
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

function FormSection({ icon: Icon, title, headerRight, children }: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  headerRight?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-border">
        <div className="flex items-center gap-2.5">
          <Icon className="h-[18px] w-[18px] text-primary" />
          <h3 className="text-[18px] font-semibold text-foreground">{title}</h3>
        </div>
        {headerRight}
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  )
}

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

export function NuevoViajeJmClient({ empresas, camiones, choferes }: NuevoViajeJmClientProps) {
  const router = useRouter()

  const [empresaId, setEmpresaId] = useState("")
  const [camionId, setCamionId] = useState("")
  const [choferId, setChoferId] = useState("")
  const [fechaViaje, setFechaViaje] = useState("")
  const [remito, setRemito] = useState("")
  const [remitoS3Key, setRemitoS3Key] = useState("")
  const [cupo, setCupo] = useState("")
  const [mercaderia, setMercaderia] = useState("")
  const [procedencia, setProcedencia] = useState("")
  const [provinciaOrigen, setProvinciaOrigen] = useState("")
  const [destino, setDestino] = useState("")
  const [provinciaDestino, setProvinciaDestino] = useState("")
  const [kilos, setKilos] = useState("")
  const [tarifaInput, setTarifaInput] = useState("")
  const [nroCtg, setNroCtg] = useState("")
  const [ctgS3Key, setCtgS3Key] = useState("")
  const [cpe, setCpe] = useState("")
  const [docTipo, setDocTipo] = useState<"" | "REMITO" | "CTG">("")
  const tieneRemitoFlag = docTipo === "REMITO"
  const tieneCtgFlag = docTipo === "CTG"

  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [intentoEnviar, setIntentoEnviar] = useState(false)
  const [viajeCreado, setViajeCreado] = useState(false)

  const empresaItems = empresas.map((e) => ({ id: e.id, label: e.razonSocial, sublabel: e.cuit }))
  const camionItems = camiones.map((c) => ({ id: c.id, label: c.patenteChasis }))
  const choferItems = choferes.map((c) => ({ id: c.id, label: `${c.apellido}, ${c.nombre}` }))
  const provinciaItems = PROVINCIAS_ARGENTINA.map((p) => ({ id: p, label: p }))

  const tarifaNum = tarifaInput.trim() === "" ? 0 : Number(tarifaInput) || 0
  const kilosNum = kilos.trim() === "" ? 0 : Number(kilos)
  const toneladas = kilosNum > 0 ? calcularToneladas(kilosNum) : null
  const totalCalc = kilosNum > 0 && tarifaNum > 0 ? calcularTotalViaje(kilosNum, tarifaNum) : null

  const tieneRemito = tieneRemitoFlag && remito.trim() !== "" && remitoS3Key !== ""
  const tieneCTG = tieneCtgFlag && nroCtg.trim() !== "" && ctgS3Key !== ""
  const tieneRemitoSinPDF = tieneRemitoFlag && remito.trim() !== "" && remitoS3Key === ""
  const tieneCTGSinPDF = tieneCtgFlag && nroCtg.trim() !== "" && ctgS3Key === ""

  const puedeGuardar =
    empresaId && camionId && choferId && fechaViaje &&
    (tieneRemito || tieneCTG) && !tieneRemitoSinPDF && !tieneCTGSinPDF &&
    provinciaOrigen && provinciaDestino && tarifaNum > 0 && kilosNum > 0 &&
    mercaderia.trim() !== ""

  const fieldErrors = intentoEnviar ? {
    empresaId: !empresaId ? "Campo requerido" : null,
    camionId: !camionId ? "Campo requerido" : null,
    choferId: !choferId ? "Campo requerido" : null,
    fechaViaje: !fechaViaje ? "Campo requerido" : null,
    documentacion: !tieneRemitoFlag && !tieneCtgFlag ? "Seleccioná remito o CTG" : null,
    remito: tieneRemitoFlag && remito.trim() === "" ? "Campo requerido" : tieneRemitoSinPDF ? "Debe cargar PDF de remito" : null,
    ctg: tieneCtgFlag && nroCtg.trim() === "" ? "Campo requerido" : tieneCTGSinPDF ? "Debe cargar PDF de CTG" : null,
    mercaderia: !mercaderia.trim() ? "Campo requerido" : null,
    kilos: kilosNum <= 0 ? "Campo requerido" : null,
    provinciaOrigen: !provinciaOrigen ? "Campo requerido" : null,
    provinciaDestino: !provinciaDestino ? "Campo requerido" : null,
    tarifa: tarifaNum <= 0 ? "Campo requerido" : null,
  } : {} as Record<string, string | null>

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIntentoEnviar(true)
    if (!puedeGuardar) return
    setCargando(true); setError(null)
    try {
      const res = await fetch("/api/jm/viajes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          empresaId, camionId, choferId, fechaViaje,
          remito: tieneRemitoFlag && remito.trim() ? remito.trim() : null,
          remitoS3Key: tieneRemitoFlag && remitoS3Key ? remitoS3Key : null,
          cupo: cupo.trim() || null,
          tieneCupo: cupo.trim().length > 0,
          mercaderia: mercaderia.trim(),
          procedencia: procedencia.trim() || null,
          provinciaOrigen,
          destino: destino.trim() || null,
          provinciaDestino,
          kilos: kilosNum > 0 ? kilosNum : undefined,
          tarifaEmpresa: tarifaNum,
          tieneCtg: tieneCtgFlag,
          nroCtg: tieneCtgFlag && nroCtg.trim() ? nroCtg.trim() : null,
          ctgS3Key: tieneCtgFlag && ctgS3Key ? ctgS3Key : null,
          cpe: tieneCtgFlag && cpe.trim() ? cpe.trim() : null,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? "Error al guardar")
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

  if (viajeCreado) {
    return (
      <div className="space-y-4 max-w-6xl">
        <div className="rounded-xl border border-success/30 bg-success-soft p-6 text-center space-y-3">
          <h2 className="text-lg font-semibold text-success-foreground">Viaje cargado</h2>
          <div className="flex items-center justify-center gap-2">
            <button type="button" onClick={() => router.push("/jm/viajes/consultar")}
              className="h-10 px-5 rounded-lg border border-border text-[15px] font-medium hover:bg-accent">
              Ir a consultar
            </button>
            <button type="button" onClick={() => {
              setEmpresaId(""); setCamionId(""); setChoferId(""); setFechaViaje("")
              setRemito(""); setRemitoS3Key(""); setCupo("")
              setMercaderia(""); setProcedencia(""); setProvinciaOrigen("")
              setDestino(""); setProvinciaDestino("")
              setKilos(""); setTarifaInput("")
              setNroCtg(""); setCtgS3Key(""); setCpe("")
              setDocTipo(""); setError(null); setIntentoEnviar(false); setViajeCreado(false)
            }}
              className="h-10 px-5 rounded-lg bg-primary text-primary-foreground text-[15px] font-medium hover:bg-primary/90">
              Cargar otro viaje
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5 max-w-6xl">
      {/* ════════ Header ════════ */}
      <div className="flex flex-wrap items-center gap-4">
        <h2 className="text-[34px] font-bold tracking-tight text-foreground leading-tight">Nuevo viaje</h2>
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

      <form id="nuevo-viaje-jm-form" onSubmit={handleSubmit} noValidate className="space-y-5">
        {/* ════════ Fila 1: Participantes + Recorrido + Carga ════════ */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          {/* ── Participantes ── */}
          <FormSection icon={Users} title="Participantes">
            <div className="space-y-3">
              <div>
                <label className={labelCls}>Empresa <span className="text-error">*</span></label>
                <SearchCombobox items={empresaItems} value={empresaId} onChange={setEmpresaId} placeholder="Buscar por nombre o CUIT..." />
                <FormError message={fieldErrors.empresaId} className="text-xs mt-1" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Camión <span className="text-error">*</span></label>
                  <SearchCombobox items={camionItems} value={camionId} onChange={setCamionId} placeholder="Patente..." />
                  <FormError message={fieldErrors.camionId} className="text-xs mt-1" />
                </div>
                <div>
                  <label className={labelCls}>Chofer <span className="text-error">*</span></label>
                  <SearchCombobox items={choferItems} value={choferId} onChange={setChoferId} placeholder="Nombre..." />
                  <FormError message={fieldErrors.choferId} className="text-xs mt-1" />
                </div>
              </div>
            </div>
          </FormSection>

          {/* ── Recorrido ── */}
          <FormSection icon={MapPin} title="Recorrido">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-primary">Origen</p>
                <div>
                  <label className={labelCls}>Ciudad</label>
                  <input type="text" value={procedencia} onChange={(e) => setProcedencia(e.target.value)} onBlur={() => procedencia && setProcedencia(capitalizarPalabras(procedencia))} className={inputCls} placeholder="Ej: Rosario" />
                </div>
                <div>
                  <label className={labelCls}>Provincia <span className="text-error">*</span></label>
                  <SearchCombobox items={provinciaItems} value={provinciaOrigen} onChange={setProvinciaOrigen} placeholder="Buscar..." />
                  <FormError message={fieldErrors.provinciaOrigen} className="text-xs mt-1" />
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-primary">Destino</p>
                <div>
                  <label className={labelCls}>Ciudad</label>
                  <input type="text" value={destino} onChange={(e) => setDestino(e.target.value)} onBlur={() => destino && setDestino(capitalizarPalabras(destino))} className={inputCls} placeholder="Ej: Buenos Aires" />
                </div>
                <div>
                  <label className={labelCls}>Provincia <span className="text-error">*</span></label>
                  <SearchCombobox items={provinciaItems} value={provinciaDestino} onChange={setProvinciaDestino} placeholder="Buscar..." />
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
                <input type="text" value={mercaderia} onChange={(e) => setMercaderia(e.target.value)} onBlur={() => mercaderia && setMercaderia(capitalizarPrimera(mercaderia))} className={inputCls} placeholder="Tipo de carga" />
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
                  <input type="number" value={tarifaInput} onChange={(e) => setTarifaInput(e.target.value)} min="0" step="0.01" className={inputCls} placeholder="0,00" />
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
        <FormSection
          icon={FileText}
          title="Documentación"
          headerRight={
            <SegmentedToggle
              options={[
                { value: "REMITO", label: "Remito" },
                { value: "CTG", label: "CPE" },
              ]}
              value={docTipo}
              onChange={(v) => {
                setDocTipo(v as "REMITO" | "CTG")
                if (v === "REMITO") { setNroCtg(""); setCtgS3Key(""); setCpe("") }
                else { setRemito(""); setRemitoS3Key("") }
              }}
            />
          }
        >
          {fieldErrors.documentacion && (
            <FormError message={fieldErrors.documentacion} className="text-xs mb-3" />
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
            {tieneRemitoFlag && (
              <div>
                <label className={labelCls}>Remito</label>
                <input type="text" value={remito} onChange={(e) => setRemito(e.target.value.toUpperCase())} style={{ textTransform: "uppercase" }} className={inputCls} placeholder="Nro. remito" />
                <div className="mt-1.5">
                  <UploadPDF prefijo="remitos" onUpload={(key) => setRemitoS3Key(key)} label="Subir" s3Key={remitoS3Key || undefined} autoUpload />
                </div>
                <FormError message={fieldErrors.remito} className="text-xs mt-1" />
              </div>
            )}

            <div>
              <label className={labelCls}>Cupo <span className="text-muted-foreground font-normal">(opcional)</span></label>
              <input type="text" value={cupo} onChange={(e) => setCupo(e.target.value.toUpperCase())} style={{ textTransform: "uppercase" }} className={inputCls} placeholder="Nro. de cupo" />
            </div>

            {tieneCtgFlag && (
              <>
                <div>
                  <label className={labelCls}>CTG</label>
                  <input type="text" value={nroCtg} onChange={(e) => setNroCtg(e.target.value)} className={inputCls} placeholder="Nro. CTG" />
                  <div className="mt-1.5">
                    <UploadPDF prefijo="ctg" onUpload={(key) => setCtgS3Key(key)} label="Subir" s3Key={ctgS3Key || undefined} autoUpload />
                  </div>
                  <FormError message={fieldErrors.ctg} className="text-xs mt-1" />
                </div>
                <div>
                  <label className={labelCls}>CPE <span className="text-muted-foreground font-normal">(opcional)</span></label>
                  <input type="text" value={cpe} onChange={(e) => setCpe(e.target.value)} className={inputCls} placeholder="Nro. CPE" />
                </div>
              </>
            )}
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
          form="nuevo-viaje-jm-form"
          disabled={cargando}
          className="h-10 px-6 rounded-lg bg-primary text-primary-foreground text-[15px] font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {cargando ? "Guardando..." : "Cargar Viaje"}
        </button>
      </div>
    </div>
  )
}
