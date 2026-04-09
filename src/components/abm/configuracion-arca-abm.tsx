/**
 * Propósito: Panel de administración ARCA completo con 7 secciones:
 * General, Certificado, Puntos de Venta, Comprobantes, MiPyME, Diagnóstico, Auditoría.
 * Panel resumen superior con indicadores de estado.
 * Los datos sensibles (cert, password, token) nunca se muestran.
 */

"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Upload,
  Loader2,
  RefreshCw,
  Activity,
  Clock,
  FileText,
  Zap,
  Key,
  Settings,
  TestTube,
  History,
  Image,
  Trash2,
} from "lucide-react"

// ─── Types ───────────────────────────────────────────────────────────────────

interface ConfigProp {
  id: string
  cuit: string
  razonSocial: string
  tieneCertificado: boolean
  modo: string
  puntosVenta: Record<string, string>
  comprobantesHabilitados: number[]
  cbuMiPymes: string | null
  activa: boolean
  tieneLogoComprobante: boolean
  tieneLogoArca: boolean
  actualizadoEn: string
  actualizadoPor: string | null
}

interface DiagnosticoData {
  config: {
    activa: boolean
    modo: string
    tieneCertificado: boolean
    cuit: string
    razonSocial: string
    puntosVentaCount: number
    actualizadoEn: string | null
    actualizadoPor: string | null
  }
  ticket: { vigente: boolean; expiresAt: string; obtainedAt: string } | null
  ultimaEmision: { tipo: string; nro: number | string | null; fecha: string | null; cae: string | null } | null
  ultimoError: { observaciones: string | null; fecha: string | null } | null
  urls: { wsaaUrl: string; wsfev1Url: string }
  emisionesRecientes: { tipo: string; nro: number | string | null; fecha: string | null; cae: string | null }[]
}

interface CertInfo {
  cargado: boolean
  valido?: boolean
  estado?: "valido" | "proximo_a_vencer" | "vencido"
  fingerprint?: string
  subject?: { cn: string | null; o: string | null; serialNumber: string | null }
  issuer?: { cn: string | null; o: string | null }
  notBefore?: string
  notAfter?: string
  diasParaVencer?: number
  error?: string
}

const TABS = [
  { id: "general", label: "General", icon: Settings },
  { id: "logos", label: "Logos", icon: Image },
  { id: "certificado", label: "Certificado", icon: Key },
  { id: "puntos-venta", label: "Puntos de venta", icon: FileText },
  { id: "mipyme", label: "MiPyME", icon: FileText },
  { id: "diagnostico", label: "Diagnóstico", icon: TestTube },
  { id: "auditoria", label: "Auditoría", icon: History },
] as const

type TabId = (typeof TABS)[number]["id"]

/** Claves de puntos de venta alineadas con catálogo ARCA cerrado */
const CLAVES_PTO_VENTA = [
  { clave: "FACTURA_A", label: "Factura A (1) / FCE (201/202/203)" },
  { clave: "FACTURA_B", label: "Factura B (6)" },
  { clave: "FACTURA_A_CAMION_PROPIO", label: "Factura A Camión Propio (1/201)" },
  { clave: "FACTURA_B_CAMION_PROPIO", label: "Factura B Camión Propio (6)" },
  { clave: "NOTA_CREDITO_A", label: "NC A (3)" },
  { clave: "NOTA_DEBITO_A", label: "ND A (2)" },
  { clave: "NOTA_CREDITO_B", label: "NC B (8)" },
  { clave: "NOTA_DEBITO_B", label: "ND B (7)" },
  { clave: "NOTA_CREDITO_FCE_A", label: "NC FCE A (203)" },
  { clave: "NOTA_DEBITO_FCE_A", label: "ND FCE A (202)" },
  { clave: "LP_A", label: "CVLP A (60)" },
  { clave: "LP_B", label: "CVLP B (61)" },
]

/** Comprobantes configurables por código ARCA — catálogo cerrado */
const COMPROBANTES_CONFIGURABLES = [
  { codigo: 1, nombre: "Factura A", circuito: "Empresa" },
  { codigo: 6, nombre: "Factura B", circuito: "Empresa" },
  { codigo: 201, nombre: "FCE MiPyMEs A", circuito: "Empresa" },
  { codigo: 2, nombre: "Nota de Débito A", circuito: "Empresa" },
  { codigo: 3, nombre: "Nota de Crédito A", circuito: "Empresa" },
  { codigo: 7, nombre: "Nota de Débito B", circuito: "Empresa" },
  { codigo: 8, nombre: "Nota de Crédito B", circuito: "Empresa" },
  { codigo: 202, nombre: "ND FCE MiPyMEs A", circuito: "Empresa" },
  { codigo: 203, nombre: "NC FCE MiPyMEs A", circuito: "Empresa" },
  { codigo: 60, nombre: "CVLP A", circuito: "Fletero" },
  { codigo: 61, nombre: "CVLP B", circuito: "Fletero" },
  { codigo: 65, nombre: "NC CVLP A (reservado)", circuito: "Fletero" },
]

// ─── Component ───────────────────────────────────────────────────────────────

export function ConfiguracionArcaAbm({ config: initialConfig }: { config: ConfigProp | null }) {
  const [config, setConfig] = useState(initialConfig)
  const [tab, setTab] = useState<TabId>("general")
  const [saving, setSaving] = useState<string | null>(null)

  // General
  const [cuit, setCuit] = useState(config?.cuit ?? "")
  const [razonSocial, setRazonSocial] = useState(config?.razonSocial ?? "")
  const [modoSel, setModoSel] = useState(config?.modo ?? "homologacion")

  // Certificado
  const [certPass, setCertPass] = useState("")
  const fileRef = useRef<HTMLInputElement>(null)
  const [certInfo, setCertInfo] = useState<CertInfo | null>(null)
  const [loadingCert, setLoadingCert] = useState(false)

  // Puntos de venta
  const [puntosVenta, setPuntosVenta] = useState<Record<string, string>>(config?.puntosVenta ?? {})

  // Comprobantes habilitados
  const [comprobantesHab, setComprobantesHab] = useState<Set<number>>(
    new Set(config?.comprobantesHabilitados ?? [])
  )

  function toggleComprobante(codigo: number) {
    setComprobantesHab((prev) => {
      const next = new Set(prev)
      if (next.has(codigo)) next.delete(codigo)
      else next.add(codigo)
      return next
    })
  }

  // MiPyME
  const [cbuMiPymes, setCbuMiPymes] = useState(config?.cbuMiPymes ?? "")

  // Diagnóstico
  const [diag, setDiag] = useState<DiagnosticoData | null>(null)
  const [loadingDiag, setLoadingDiag] = useState(false)
  const [testResult, setTestResult] = useState<{ area: string; ok: boolean; mensaje: string; tiempoMs?: number } | null>(null)
  const [testing, setTesting] = useState<string | null>(null)

  // Verificación
  const [verificando, setVerificando] = useState(false)
  const [verificResult, setVerificResult] = useState<{ ok: boolean; errores?: string[]; mensaje?: string } | null>(null)

  // Consulta manual último autorizado
  const [consultaPV, setConsultaPV] = useState("")
  const [consultaTipo, setConsultaTipo] = useState("")
  const [consultando, setConsultando] = useState(false)
  const [consultaResult, setConsultaResult] = useState<{ ok: boolean; mensaje: string; tiempoMs?: number; resultado?: { ptoVenta: number; tipoCbte: number; ultimoNro: number } } | null>(null)

  // Logos
  const [logoComprobantePreview, setLogoComprobantePreview] = useState<string | null>(null)
  const [logoArcaPreview, setLogoArcaPreview] = useState<string | null>(null)
  const logoComprobanteRef = useRef<HTMLInputElement>(null)
  const logoArcaRef = useRef<HTMLInputElement>(null)

  async function handleLogoFile(
    file: File,
    setPreview: (v: string | null) => void,
    tipo: "comprobante" | "arca"
  ) {
    setPreview(URL.createObjectURL(file))
    const section = tipo === "comprobante" ? "logoComprobante" : "logoArca"
    setSaving(section)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("tipo", tipo)
      const res = await fetch("/api/configuracion-arca/logos", { method: "POST", body: formData })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        alert(data.error ?? "Error al subir logo")
        setPreview(null)
        return
      }
      // Recargar config para actualizar badges
      const configRes = await fetch("/api/configuracion-arca")
      if (configRes.ok) setConfig(await configRes.json())
    } catch { alert("Error de red al subir logo"); setPreview(null) }
    finally { setSaving(null) }
  }

  async function eliminarLogo(tipo: "comprobante" | "arca", setPreview: (v: string | null) => void) {
    const section = tipo === "comprobante" ? "logoComprobante" : "logoArca"
    setSaving(section)
    try {
      const res = await fetch(`/api/configuracion-arca/logos?tipo=${tipo}`, { method: "DELETE" })
      if (!res.ok) { alert("Error al eliminar logo"); return }
      setPreview(null)
      const configRes = await fetch("/api/configuracion-arca")
      if (configRes.ok) setConfig(await configRes.json())
    } catch { alert("Error de red") }
    finally { setSaving(null) }
  }

  // Confirmación producción
  const [confirmProduccion, setConfirmProduccion] = useState(false)

  // ─── Helpers ─────────────────────────────────────────────────────────────

  async function patch(data: Record<string, unknown>, section: string) {
    setSaving(section)
    try {
      const res = await fetch("/api/configuracion-arca", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        alert(data.error ?? "Error al guardar")
        return
      }
      const updated = await res.json()
      setConfig(updated)
    } catch (e) { alert(`Error de red: ${e instanceof Error ? e.message : "desconocido"}`) }
    finally { setSaving(null) }
  }

  const cargarDiagnostico = useCallback(async () => {
    setLoadingDiag(true)
    try {
      const res = await fetch("/api/configuracion-arca/diagnostico")
      if (res.ok) setDiag(await res.json())
    } catch { /* ignore */ }
    finally { setLoadingDiag(false) }
  }, [])

  const cargarCertInfo = useCallback(async () => {
    setLoadingCert(true)
    try {
      const res = await fetch("/api/configuracion-arca/cert-info")
      if (res.ok) setCertInfo(await res.json())
    } catch { /* ignore */ }
    finally { setLoadingCert(false) }
  }, [])

  useEffect(() => { cargarDiagnostico() }, [cargarDiagnostico])
  useEffect(() => { if (config?.tieneCertificado) cargarCertInfo() }, [config?.tieneCertificado, cargarCertInfo])

  async function handleVerificar() {
    setVerificando(true)
    try {
      const res = await fetch("/api/configuracion-arca/verificar", { method: "POST" })
      setVerificResult(await res.json())
    } catch { setVerificResult({ ok: false, errores: ["Error de red"] }) }
    finally { setVerificando(false) }
  }

  async function handleCertFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setSaving("certificado")
    try {
      const b64 = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onload = () => {
          const result = reader.result as string
          resolve(result.includes(",") ? result.split(",")[1] : result)
        }
        reader.readAsDataURL(file)
      })
      await patch({ certificadoB64: b64, ...(certPass ? { certificadoPass: certPass } : {}) }, "certificado")
      setCertPass("")
      cargarCertInfo()
    } finally { setSaving(null) }
  }

  async function runTest(area: string, url: string) {
    setTesting(area)
    setTestResult(null)
    try {
      const res = await fetch(url, { method: "POST" })
      const data = await res.json()
      setTestResult({ area, ok: data.ok, mensaje: data.mensaje, tiempoMs: data.tiempoMs })
    } catch { setTestResult({ area, ok: false, mensaje: "Error de red" }) }
    finally { setTesting(null) }
  }

  async function consultarUltimoAutorizado() {
    const pv = parseInt(consultaPV, 10)
    const tc = parseInt(consultaTipo, 10)
    if (!pv || pv <= 0 || !tc || tc <= 0) {
      setConsultaResult({ ok: false, mensaje: "Punto de venta y tipo de comprobante deben ser enteros positivos" })
      return
    }
    setConsultando(true)
    setConsultaResult(null)
    try {
      const res = await fetch("/api/configuracion-arca/consultar-ultimo-autorizado", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ptoVenta: pv, tipoCbte: tc }),
      })
      const data = await res.json()
      setConsultaResult({ ok: data.ok, mensaje: data.mensaje, tiempoMs: data.tiempoMs, resultado: data.resultado })
    } catch {
      setConsultaResult({ ok: false, mensaje: "Error de red" })
    } finally {
      setConsultando(false)
    }
  }

  async function confirmarProduccion() {
    setConfirmProduccion(false)
    await patch({ modo: "produccion", activa: true }, "ambiente")
    setModoSel("produccion")
    cargarDiagnostico()
  }

  const fmtFecha = (iso: string | null) => {
    if (!iso) return "—"
    try { return new Date(iso).toLocaleString("es-AR") } catch { return "—" }
  }

  // ─── Panel Resumen Superior ──────────────────────────────────────────────

  function PanelResumen() {
    const esProduccion = config?.modo === "produccion"
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
        <Indicador
          label="Integración"
          valor={config?.activa ? "Activa" : "Inactiva"}
          color={config?.activa ? "green" : "red"}
          icon={config?.activa ? <ShieldCheck className="h-4 w-4" /> : <ShieldX className="h-4 w-4" />}
        />
        <Indicador
          label="Ambiente"
          valor={esProduccion ? "Producción" : "Homologación"}
          color={esProduccion ? "red" : "amber"}
          icon={esProduccion ? <AlertTriangle className="h-4 w-4" /> : <Activity className="h-4 w-4" />}
        />
        <Indicador
          label="Certificado"
          valor={certInfo?.estado === "valido" ? "Válido" : certInfo?.estado === "proximo_a_vencer" ? "Por vencer" : certInfo?.estado === "vencido" ? "Vencido" : config?.tieneCertificado ? "Cargado" : "Sin cargar"}
          color={certInfo?.estado === "valido" ? "green" : certInfo?.estado === "proximo_a_vencer" ? "amber" : certInfo?.estado === "vencido" ? "red" : config?.tieneCertificado ? "blue" : "red"}
          icon={<Key className="h-4 w-4" />}
        />
        <Indicador
          label="Ticket WSAA"
          valor={diag?.ticket?.vigente ? "Vigente" : diag?.ticket ? "Expirado" : "No disponible"}
          color={diag?.ticket?.vigente ? "green" : "gray"}
          icon={<Clock className="h-4 w-4" />}
        />
        <Indicador
          label="Puntos de venta"
          valor={String(diag?.config?.puntosVentaCount ?? 0)}
          color={diag?.config?.puntosVentaCount ? "green" : "gray"}
          icon={<FileText className="h-4 w-4" />}
        />
        <Indicador
          label="Última emisión"
          valor={diag?.ultimaEmision ? fmtFecha(diag.ultimaEmision.fecha).split(",")[0] : "Ninguna"}
          color={diag?.ultimaEmision ? "green" : "gray"}
          icon={<Zap className="h-4 w-4" />}
        />
        <Indicador
          label="Último error"
          valor={diag?.ultimoError ? fmtFecha(diag.ultimoError.fecha).split(",")[0] : "Ninguno"}
          color={diag?.ultimoError ? "amber" : "green"}
          icon={diag?.ultimoError ? <AlertTriangle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
        />
      </div>
    )
  }

  // ─── Tabs ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          {config?.activa
            ? <ShieldCheck className="h-6 w-6 text-green-600" />
            : config?.tieneCertificado
            ? <ShieldAlert className="h-6 w-6 text-amber-500" />
            : <ShieldX className="h-6 w-6 text-red-500" />}
          <div>
            <h2 className="text-lg font-semibold">Configuración ARCA</h2>
            <p className="text-xs text-muted-foreground">Facturación electrónica — {config?.modo === "produccion" ? "PRODUCCIÓN" : "Homologación"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={handleVerificar} disabled={verificando}>
            {verificando ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <CheckCircle2 className="h-3 w-3 mr-1" />}
            Verificar
          </Button>
          {verificResult && (
            <span className={`text-xs flex items-center gap-1 ${verificResult.ok ? "text-green-600" : "text-red-600"}`}>
              {verificResult.ok ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
              {verificResult.ok ? verificResult.mensaje : verificResult.errores?.[0]}
            </span>
          )}
        </div>
      </div>

      <PanelResumen />

      {/* Tabs */}
      <div className="flex gap-1 border-b overflow-x-auto pb-px">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id); if (t.id === "diagnostico") cargarDiagnostico() }}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium whitespace-nowrap border-b-2 transition-colors ${
              tab === t.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <t.icon className="h-3.5 w-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="space-y-4">
        {tab === "general" && (
          <div className="grid md:grid-cols-2 gap-4">
            {/* Datos del emisor */}
            <div className="rounded-lg border p-5 space-y-3">
              <p className="text-sm font-semibold">Datos del emisor</p>
              <div className="space-y-2">
                <div>
                  <Label className="text-xs">CUIT (11 dígitos) *</Label>
                  <Input value={cuit} onChange={(e) => setCuit(e.target.value.replace(/\D/g, "").slice(0, 11))} className="h-8 text-sm mt-0.5" placeholder="30709381683" />
                </div>
                <div>
                  <Label className="text-xs">Razón social *</Label>
                  <Input value={razonSocial} onChange={(e) => setRazonSocial(e.target.value)} className="h-8 text-sm mt-0.5" />
                </div>
              </div>
              <Button size="sm" onClick={() => patch({ cuit, razonSocial }, "emisor")} disabled={saving === "emisor"}>
                {saving === "emisor" ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                Guardar
              </Button>
            </div>

            {/* Ambiente */}
            <div className="rounded-lg border p-5 space-y-3">
              <p className="text-sm font-semibold">Ambiente</p>
              {config?.modo === "produccion" && (
                <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-800 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                  Producción activa — los comprobantes tienen efecto fiscal real
                </div>
              )}
              {modoSel === "simulacion" && (
                <div className="rounded-md bg-blue-50 border border-blue-200 px-3 py-2 text-xs text-blue-800">
                  Modo simulación: no se conecta a ARCA. Genera CAE, nro de comprobante y QR ficticios para probar el flujo completo (emisión, PDF, cuenta corriente) sin certificado ni conexión real.
                </div>
              )}
              <div className="space-y-2">
                {(["simulacion", "homologacion", "produccion"] as const).map((m) => (
                  <label key={m} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="modo" value={m} checked={modoSel === m} onChange={() => setModoSel(m)} className="h-3.5 w-3.5" />
                    <span className="text-sm">{m === "simulacion" ? "Simulación (sin ARCA, datos ficticios)" : m === "homologacion" ? "Homologación (pruebas)" : "Producción"}</span>
                    {m === "produccion" && <Badge variant="destructive" className="text-[10px] px-1.5">REAL</Badge>}
                    {m === "simulacion" && <Badge variant="outline" className="text-[10px] px-1.5">SIN ARCA</Badge>}
                  </label>
                ))}
              </div>

              {/* URLs resueltas */}
              {diag?.urls && (
                <div className="text-[10px] text-muted-foreground space-y-0.5 pt-1 border-t">
                  <p>WSAA: {diag.urls.wsaaUrl}</p>
                  <p>WSFEv1: {diag.urls.wsfev1Url}</p>
                </div>
              )}

              <Button
                size="sm"
                variant={modoSel === "produccion" ? "destructive" : "default"}
                onClick={() => {
                  if (modoSel === "produccion" && config?.modo !== "produccion") { setConfirmProduccion(true); return }
                  patch({ modo: modoSel, activa: true }, "ambiente").then(() => cargarDiagnostico())
                }}
                disabled={saving === "ambiente"}
              >
                {saving === "ambiente" ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                Guardar ambiente
              </Button>
            </div>
          </div>
        )}

        {tab === "logos" && (
          <div className="grid md:grid-cols-2 gap-4">
            {/* Logo Comprobantes */}
            <div className="rounded-lg border p-5 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Logo Comprobantes</p>
                <Badge variant={config?.tieneLogoComprobante ? "default" : "secondary"} className="text-[10px]">
                  {config?.tieneLogoComprobante ? "Cargado" : "Sin logo"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">Se muestra arriba a la izquierda en todos los comprobantes PDF.</p>
              {logoComprobantePreview && (
                <img src={logoComprobantePreview} alt="Preview logo comprobante" className="max-h-20 rounded border" />
              )}
              <div className="flex gap-2">
                <input
                  ref={logoComprobanteRef}
                  type="file"
                  accept="image/png,image/jpeg"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleLogoFile(file, setLogoComprobantePreview, "comprobante")
                  }}
                />
                <Button size="sm" variant="outline" onClick={() => logoComprobanteRef.current?.click()} disabled={saving === "logoComprobante"}>
                  {saving === "logoComprobante" ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Upload className="h-3 w-3 mr-1" />}
                  Subir imagen
                </Button>
                {config?.tieneLogoComprobante && (
                  <Button size="sm" variant="ghost" onClick={() => eliminarLogo("comprobante", setLogoComprobantePreview)}>
                    <Trash2 className="h-3 w-3 mr-1" /> Eliminar
                  </Button>
                )}
              </div>
            </div>

            {/* Logo ARCA */}
            <div className="rounded-lg border p-5 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Logo ARCA</p>
                <Badge variant={config?.tieneLogoArca ? "default" : "secondary"} className="text-[10px]">
                  {config?.tieneLogoArca ? "Cargado" : "Sin logo"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">Se muestra junto al QR fiscal en el pie de los comprobantes PDF.</p>
              {logoArcaPreview && (
                <img src={logoArcaPreview} alt="Preview logo ARCA" className="max-h-20 rounded border" />
              )}
              <div className="flex gap-2">
                <input
                  ref={logoArcaRef}
                  type="file"
                  accept="image/png,image/jpeg"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleLogoFile(file, setLogoArcaPreview, "arca")
                  }}
                />
                <Button size="sm" variant="outline" onClick={() => logoArcaRef.current?.click()} disabled={saving === "logoArca"}>
                  {saving === "logoArca" ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Upload className="h-3 w-3 mr-1" />}
                  Subir imagen
                </Button>
                {config?.tieneLogoArca && (
                  <Button size="sm" variant="ghost" onClick={() => eliminarLogo("arca", setLogoArcaPreview)}>
                    <Trash2 className="h-3 w-3 mr-1" /> Eliminar
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {tab === "certificado" && (
          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-lg border p-5 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Certificado digital</p>
                <Badge variant={config?.tieneCertificado ? "default" : "destructive"} className="text-[10px]">
                  {config?.tieneCertificado ? "Cargado" : "Sin certificado"}
                </Badge>
              </div>

              <div className="space-y-2">
                <div>
                  <Label className="text-xs">Contraseña del certificado *</Label>
                  <Input type="password" value={certPass} onChange={(e) => setCertPass(e.target.value)} className="h-8 text-sm mt-0.5" placeholder="Opcional — dejar vacío si no tiene" />
                </div>
                <input ref={fileRef} type="file" accept=".pfx,.p12,.pem,.crt" onChange={handleCertFile} className="hidden" />
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()} disabled={saving === "certificado"}>
                    {saving === "certificado" ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Upload className="h-3 w-3 mr-1" />}
                    {config?.tieneCertificado ? "Reemplazar certificado" : "Cargar certificado"}
                  </Button>
                  {config?.tieneCertificado && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      disabled={saving === "certificado"}
                      onClick={async () => {
                        if (!confirm("¿Eliminar el certificado cargado? ARCA no podrá emitir comprobantes sin certificado.")) return
                        await patch({ certificadoB64: "", certificadoPass: "" }, "certificado")
                        setCertInfo(null)
                      }}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Eliminar
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Cert info */}
            <div className="rounded-lg border p-5 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Información del certificado</p>
                <Button size="sm" variant="ghost" onClick={cargarCertInfo} disabled={loadingCert}>
                  <RefreshCw className={`h-3 w-3 ${loadingCert ? "animate-spin" : ""}`} />
                </Button>
              </div>

              {!certInfo || !certInfo.cargado ? (
                <p className="text-xs text-muted-foreground">Sin certificado cargado</p>
              ) : certInfo.error ? (
                <p className="text-xs text-red-600">{certInfo.error}</p>
              ) : (
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Estado</span>
                    <Badge variant={certInfo.estado === "valido" ? "default" : certInfo.estado === "proximo_a_vencer" ? "secondary" : "destructive"} className="text-[10px]">
                      {certInfo.estado === "valido" ? "Válido" : certInfo.estado === "proximo_a_vencer" ? "Próximo a vencer" : "Vencido"}
                    </Badge>
                  </div>
                  {certInfo.subject?.cn && <div className="flex justify-between"><span className="text-muted-foreground">Sujeto</span><span className="font-mono text-[10px] truncate max-w-[200px]">{certInfo.subject.cn}</span></div>}
                  {certInfo.issuer?.cn && <div className="flex justify-between"><span className="text-muted-foreground">Emisor</span><span className="font-mono text-[10px] truncate max-w-[200px]">{certInfo.issuer.cn}</span></div>}
                  {certInfo.notAfter && <div className="flex justify-between"><span className="text-muted-foreground">Vence</span><span>{fmtFecha(certInfo.notAfter)}</span></div>}
                  {certInfo.diasParaVencer !== undefined && <div className="flex justify-between"><span className="text-muted-foreground">Días restantes</span><span className={certInfo.diasParaVencer < 30 ? "text-red-600 font-semibold" : ""}>{certInfo.diasParaVencer}</span></div>}
                  {certInfo.fingerprint && (
                    <div>
                      <span className="text-muted-foreground">Fingerprint SHA-256</span>
                      <p className="font-mono text-[9px] break-all mt-0.5">{certInfo.fingerprint}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {tab === "puntos-venta" && (
          <div className="rounded-lg border p-5 space-y-5">
            {/* Puntos de venta */}
            <div className="space-y-3">
              <p className="text-sm font-semibold">Puntos de venta</p>
              <p className="text-xs text-muted-foreground">Número de punto de venta habilitado en ARCA para cada grupo de comprobantes.</p>
              <div className="grid md:grid-cols-2 gap-2">
                {CLAVES_PTO_VENTA.map(({ clave, label }) => (
                  <div key={clave} className="flex items-center gap-2">
                    <Label className="text-xs w-48 truncate" title={clave}>{label}</Label>
                    <Input
                      value={puntosVenta[clave] ?? ""}
                      onChange={(e) => setPuntosVenta((prev) => ({ ...prev, [clave]: e.target.value.replace(/\D/g, "") }))}
                      className="h-7 text-xs w-20"
                      placeholder="N°"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Comprobantes habilitados */}
            <div className="space-y-3 border-t pt-4">
              <p className="text-sm font-semibold">Comprobantes habilitados</p>
              <p className="text-xs text-muted-foreground">Marcá los tipos de comprobante ARCA que la empresa puede emitir. Solo los habilitados aparecerán en la UI y serán aceptados por el backend.</p>
              <div className="grid md:grid-cols-2 gap-1.5">
                {COMPROBANTES_CONFIGURABLES.map(({ codigo, nombre, circuito }) => (
                  <label key={codigo} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted/50 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={comprobantesHab.has(codigo)}
                      onChange={() => toggleComprobante(codigo)}
                      className="rounded"
                    />
                    <span className="font-mono text-muted-foreground w-8">{codigo}</span>
                    <span>{nombre}</span>
                    <span className="text-muted-foreground ml-auto">{circuito}</span>
                  </label>
                ))}
              </div>
            </div>
            <Button size="sm" onClick={() => patch({ puntosVenta, comprobantesHabilitados: Array.from(comprobantesHab) }, "puntos_venta").then(() => cargarDiagnostico())} disabled={saving === "puntos_venta"}>
              {saving === "puntos_venta" ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
              Guardar configuración de comprobantes
            </Button>
          </div>
        )}

        {tab === "mipyme" && (
          <div className="rounded-lg border p-5 space-y-3 max-w-lg">
            <p className="text-sm font-semibold">Configuración MiPyMEs</p>
            <p className="text-xs text-muted-foreground">CBU de Transmagg donde se acreditan los pagos de FCE MiPyME (tipo 201). Solo requerido si se emiten facturas MiPyME.</p>
            <div>
              <Label className="text-xs">CBU (22 dígitos)</Label>
              <Input value={cbuMiPymes} onChange={(e) => setCbuMiPymes(e.target.value.replace(/\D/g, "").slice(0, 22))} className="h-8 text-sm mt-0.5" placeholder="0000000000000000000000" />
            </div>
            <Button size="sm" onClick={() => patch({ cbuMiPymes: cbuMiPymes || null }, "mipymes")} disabled={saving === "mipymes"}>
              {saving === "mipymes" ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
              Guardar
            </Button>
          </div>
        )}

        {tab === "diagnostico" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Pruebas y diagnóstico</p>
              <Button size="sm" variant="ghost" onClick={cargarDiagnostico} disabled={loadingDiag}>
                <RefreshCw className={`h-3 w-3 mr-1 ${loadingDiag ? "animate-spin" : ""}`} />
                Actualizar
              </Button>
            </div>

            {/* Estado del ticket */}
            <div className="rounded-lg border p-4 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Ticket WSAA</p>
              {diag?.ticket ? (
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div><span className="text-muted-foreground">Estado</span><br /><Badge variant={diag.ticket.vigente ? "default" : "destructive"} className="text-[10px] mt-0.5">{diag.ticket.vigente ? "Vigente" : "Expirado"}</Badge></div>
                  <div><span className="text-muted-foreground">Obtenido</span><br />{fmtFecha(diag.ticket.obtainedAt)}</div>
                  <div><span className="text-muted-foreground">Expira</span><br />{fmtFecha(diag.ticket.expiresAt)}</div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No hay ticket WSAA cacheado</p>
              )}
            </div>

            {/* Emisiones recientes */}
            {diag?.emisionesRecientes && diag.emisionesRecientes.length > 0 && (
              <div className="rounded-lg border p-4 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Últimas emisiones ARCA</p>
                <div className="space-y-1">
                  {diag.emisionesRecientes.map((em, i) => (
                    <div key={i} className="flex justify-between text-xs py-1 border-b last:border-0">
                      <span>{em.tipo} Nro {em.nro ?? "—"}</span>
                      <span className="text-muted-foreground">{fmtFecha(em.fecha)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Último error */}
            {diag?.ultimoError && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 space-y-1">
                <p className="text-xs font-semibold text-amber-800">Último rechazo ARCA</p>
                <p className="text-xs text-amber-700">{diag.ultimoError.observaciones ?? "Sin detalle"}</p>
                <p className="text-[10px] text-amber-600">{fmtFecha(diag.ultimoError.fecha)}</p>
              </div>
            )}

            {/* Botones de prueba */}
            <div className="rounded-lg border p-4 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Pruebas de conexión</p>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => runTest("wsaa", "/api/configuracion-arca/probar-wsaa")} disabled={testing === "wsaa"}>
                  {testing === "wsaa" ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Zap className="h-3 w-3 mr-1" />}
                  Probar WSAA
                </Button>
                <Button size="sm" variant="outline" onClick={() => runTest("wsfev1", "/api/configuracion-arca/probar-wsfev1")} disabled={testing === "wsfev1"}>
                  {testing === "wsfev1" ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Zap className="h-3 w-3 mr-1" />}
                  Probar WSFEv1
                </Button>
                <Button size="sm" variant="outline" onClick={handleVerificar} disabled={verificando}>
                  {verificando ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <CheckCircle2 className="h-3 w-3 mr-1" />}
                  Validar configuración
                </Button>
              </div>

              {testResult && (
                <div className={`rounded-md px-3 py-2 text-xs flex items-start gap-2 ${testResult.ok ? "bg-green-50 border border-green-200 text-green-800" : "bg-red-50 border border-red-200 text-red-800"}`}>
                  {testResult.ok ? <CheckCircle2 className="h-4 w-4 flex-shrink-0 mt-0.5" /> : <XCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />}
                  <div>
                    <p className="font-medium">{testResult.ok ? "Exitoso" : "Error"} — {testResult.area.toUpperCase()}</p>
                    <p>{testResult.mensaje}</p>
                    {testResult.tiempoMs !== undefined && <p className="text-[10px] mt-0.5">{testResult.tiempoMs}ms</p>}
                  </div>
                </div>
              )}

              {verificResult && !verificResult.ok && verificResult.errores && verificResult.errores.length > 1 && (
                <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-800 space-y-1">
                  {verificResult.errores.map((e, i) => (
                    <p key={i} className="flex items-center gap-1"><XCircle className="h-3 w-3 flex-shrink-0" />{e}</p>
                  ))}
                </div>
              )}
            </div>

            {/* Consulta manual: último comprobante autorizado */}
            <div className="rounded-lg border p-4 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Consultar último comprobante autorizado</p>
              <p className="text-xs text-muted-foreground">Consulta de solo lectura a WSFEv1. No emite ni altera numeración.</p>
              <div className="flex flex-wrap items-end gap-3">
                <div>
                  <Label className="text-xs">Punto de venta</Label>
                  <Input
                    type="number"
                    min="1"
                    value={consultaPV}
                    onChange={(e) => setConsultaPV(e.target.value)}
                    placeholder="Ej: 4"
                    className="w-28"
                  />
                </div>
                <div>
                  <Label className="text-xs">Tipo comprobante</Label>
                  <Input
                    type="number"
                    min="1"
                    value={consultaTipo}
                    onChange={(e) => setConsultaTipo(e.target.value)}
                    placeholder="Ej: 1"
                    className="w-28"
                  />
                </div>
                <Button size="sm" variant="outline" onClick={consultarUltimoAutorizado} disabled={consultando || !consultaPV || !consultaTipo}>
                  {consultando ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Activity className="h-3 w-3 mr-1" />}
                  Consultar
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground">Códigos comunes: 1=Fact.A, 6=Fact.B, 201=MiPyme, 2=ND A, 3=NC A, 60=LP A, 61=LP B</p>

              {consultaResult && (
                <div className={`rounded-md px-3 py-2 text-xs flex items-start gap-2 ${consultaResult.ok ? "bg-green-50 border border-green-200 text-green-800" : "bg-red-50 border border-red-200 text-red-800"}`}>
                  {consultaResult.ok ? <CheckCircle2 className="h-4 w-4 flex-shrink-0 mt-0.5" /> : <XCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />}
                  <div>
                    <p className="font-medium">{consultaResult.ok ? "Exitoso" : "Error"}</p>
                    <p>{consultaResult.mensaje}</p>
                    {consultaResult.ok && consultaResult.resultado && (
                      <div className="mt-1 font-mono text-[11px] space-y-0.5">
                        <p>PV: {consultaResult.resultado.ptoVenta} — Tipo: {consultaResult.resultado.tipoCbte} — Último Nro: <span className="font-bold">{consultaResult.resultado.ultimoNro}</span></p>
                      </div>
                    )}
                    {consultaResult.tiempoMs !== undefined && <p className="text-[10px] mt-0.5">{consultaResult.tiempoMs}ms</p>}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {tab === "auditoria" && (
          <div className="space-y-4">
            <p className="text-sm font-semibold">Auditoría de configuración</p>
            <div className="rounded-lg border p-4 space-y-3">
              <div className="grid md:grid-cols-2 gap-4 text-xs">
                <div className="space-y-2">
                  <p className="font-semibold text-muted-foreground uppercase tracking-wide text-[10px]">Configuración</p>
                  <div className="flex justify-between"><span className="text-muted-foreground">Última modificación</span><span>{fmtFecha(config?.actualizadoEn ?? null)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Modificado por</span><span>{config?.actualizadoPor ?? "—"}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Ambiente actual</span><span><Badge variant={config?.modo === "produccion" ? "destructive" : "secondary"} className="text-[10px]">{config?.modo === "produccion" ? "Producción" : "Homologación"}</Badge></span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Estado</span><span><Badge variant={config?.activa ? "default" : "secondary"} className="text-[10px]">{config?.activa ? "Activa" : "Inactiva"}</Badge></span></div>
                </div>
                <div className="space-y-2">
                  <p className="font-semibold text-muted-foreground uppercase tracking-wide text-[10px]">Certificado</p>
                  <div className="flex justify-between"><span className="text-muted-foreground">Estado</span><span>{certInfo?.estado === "valido" ? "Válido" : certInfo?.estado === "proximo_a_vencer" ? "Próximo a vencer" : certInfo?.estado === "vencido" ? "Vencido" : "—"}</span></div>
                  {certInfo?.notAfter && <div className="flex justify-between"><span className="text-muted-foreground">Vencimiento</span><span>{fmtFecha(certInfo.notAfter)}</span></div>}
                  {certInfo?.fingerprint && <div><span className="text-muted-foreground">Fingerprint</span><p className="font-mono text-[9px] break-all mt-0.5">{certInfo.fingerprint.slice(0, 50)}...</p></div>}
                </div>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              La auditoría detallada de cada emisión ARCA (request/response) se persiste en los campos requestArcaJson y responseArcaJson de cada documento autorizado.
            </p>
          </div>
        )}
      </div>

      {/* Diálogo confirmación producción */}
      {confirmProduccion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-background rounded-lg shadow-xl p-6 max-w-md space-y-4">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              <p className="font-semibold">Cambiar a Producción</p>
            </div>
            <p className="text-sm text-muted-foreground">
              Este cambio hará que todos los comprobantes generados sean enviados a ARCA con efecto legal real. Esta acción no se puede deshacer fácilmente.
            </p>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setConfirmProduccion(false)}>Cancelar</Button>
              <Button variant="destructive" onClick={confirmarProduccion}>Confirmar — cambiar a Producción</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Indicador del panel resumen ─────────────────────────────────────────────

function Indicador({ label, valor, color, icon }: { label: string; valor: string; color: string; icon: React.ReactNode }) {
  const bg: Record<string, string> = {
    green: "bg-green-50 border-green-200 text-green-800",
    red: "bg-red-50 border-red-200 text-red-800",
    amber: "bg-amber-50 border-amber-200 text-amber-800",
    blue: "bg-blue-50 border-blue-200 text-blue-800",
    gray: "bg-gray-50 border-gray-200 text-gray-600",
  }
  return (
    <div className={`rounded-lg border px-3 py-2 ${bg[color] ?? bg.gray}`}>
      <div className="flex items-center gap-1.5 mb-0.5">{icon}<span className="text-[10px] uppercase tracking-wide font-medium">{label}</span></div>
      <p className="text-sm font-semibold">{valor}</p>
    </div>
  )
}
