"use client"

import { useState } from "react"
import { SearchCombobox } from "@/components/ui/search-combobox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { UploadPDF } from "@/components/upload-pdf"
import { formatearFecha } from "@/lib/utils"
import { parsearImporte, multiplicarImporte, calcularIva, sumarImportes, restarImportes, maxMonetario, formatearMoneda } from "@/lib/money"
import { Plus, Trash2 } from "lucide-react"
import { hoyLocalYmd } from "@/lib/date-local"

type Proveedor = { id: string; razonSocial: string; cuit: string }
type Cuenta = { id: string; nombre: string; tipo: string; tieneChequera: boolean }
type ChequeEnCartera = {
  id: string
  nroCheque: string
  bancoEmisor: string
  monto: number
  fechaCobro: string
  esElectronico: boolean
}

type FacturaProveedorIngresoClientProps = {
  proveedores: Proveedor[]
  cuentas: Cuenta[]
  chequesEnCartera: ChequeEnCartera[]
}

type AlicuotaValue = "EXENTO" | "0" | "10.5" | "21" | "27"

type ItemForm = {
  id: string
  descripcion: string
  cantidad: string
  precioUnitario: string
  alicuotaIva: AlicuotaValue
}

type ExitoData = {
  total: number
  estadoPago: string
  pagoRegistrado?: number | null
}

type PercepcionForm = {
  id: string
  tipo: string
  descripcion: string
  monto: string
}

const PERCEPCION_OPTIONS = [
  { group: "PERCEPCIONES", value: "PERCEPCION_IVA", label: "Percepcion IVA" },
  { group: "PERCEPCIONES", value: "PERCEPCION_IIBB", label: "Percepcion IIBB" },
  { group: "PERCEPCIONES", value: "PERCEPCION_GANANCIAS", label: "Percepcion Ganancias" },
  { group: "PERCEPCIONES", value: "PERCEPCION_SUSS", label: "Percepcion SUSS" },
  { group: "IMPUESTOS", value: "ICL", label: "ICL (Combustibles)" },
  { group: "IMPUESTOS", value: "CO2", label: "CO2" },
  { group: "IMPUESTOS", value: "IMPUESTO_INTERNO", label: "Impuesto Interno" },
  { group: "IMPUESTOS", value: "OTRO", label: "Otro" },
] as const

function categoriaPercepcion(tipo: string): string {
  const impuestos = new Set(["ICL", "CO2", "IMPUESTO_INTERNO", "OTRO"])
  return impuestos.has(tipo) ? "IMPUESTO_INTERNO" : "PERCEPCION"
}

function nuevaPercepcion(): PercepcionForm {
  return {
    id: Math.random().toString(36).slice(2),
    tipo: "PERCEPCION_IVA",
    descripcion: "",
    monto: "",
  }
}

const TIPOS_CBTE = ["A", "B", "C", "M", "X", "LIQ_PROD"] as const
const TIPOS_CON_IVA = new Set(["A", "M", "LIQ_PROD"])
const CONCEPTOS = [
  "COMBUSTIBLE",
  "PEAJES",
  "SEGUROS",
  "MANTENIMIENTO",
  "ALQUILERES",
  "SERVICIOS_PROFESIONALES",
  "IMPUESTOS_TASAS",
  "COMUNICACIONES",
  "MATERIALES",
  "GASTOS_ADMINISTRATIVOS",
  "OTROS",
] as const

const REQUIERE_CUENTA = new Set(["TRANSFERENCIA", "CHEQUE_PROPIO"])
const REQUIERE_CHEQUE_CARTERA = new Set(["CHEQUE_FISICO_TERCERO", "CHEQUE_ELECTRONICO_TERCERO"])
const REQUIERE_COMPROBANTE = new Set([
  "TRANSFERENCIA",
  "CHEQUE_PROPIO",
  "CHEQUE_FISICO_TERCERO",
  "CHEQUE_ELECTRONICO_TERCERO",
])

const SELECT_CLS =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"

function nuevoItem(): ItemForm {
  return {
    id: Math.random().toString(36).slice(2),
    descripcion: "",
    cantidad: "1",
    precioUnitario: "",
    alicuotaIva: "21",
  }
}

function calcularItem(item: ItemForm, discriminaIVA: boolean) {
  const cantidad = parsearImporte(item.cantidad)
  const precioUnitario = parsearImporte(item.precioUnitario)
  const subtotalNeto = multiplicarImporte(cantidad, precioUnitario)
  const esExento = discriminaIVA && item.alicuotaIva === "EXENTO"
  const alicuota = discriminaIVA && !esExento ? parsearImporte(item.alicuotaIva) : 0
  const montoIva = alicuota > 0 ? calcularIva(subtotalNeto, alicuota) : 0
  return { subtotalNeto, montoIva, subtotalTotal: sumarImportes([subtotalNeto, montoIva]), esExento, alicuota }
}

const todayStr = () => hoyLocalYmd()

/**
 * FacturaProveedorIngresoClient: FacturaProveedorIngresoClientProps -> JSX.Element
 *
 * Dado proveedores, cuentas y cheques en cartera, renderiza el formulario
 * completo para ingresar una factura de proveedor con ítems, alícuotas IVA por ítem,
 * percepciones, PDF obligatorio y pago opcional inline en la misma transacción atómica.
 * Para tipos B/C/X no se discrimina IVA. Hace POST a /api/facturas-proveedor.
 *
 * Ejemplos:
 * <FacturaProveedorIngresoClient proveedores={[...]} cuentas={[...]} chequesEnCartera={[...]} />
 */
export function FacturaProveedorIngresoClient({
  proveedores,
  cuentas,
  chequesEnCartera,
}: FacturaProveedorIngresoClientProps) {
  // ── Cabecera ──────────────────────────────────────────────────────────────
  const [proveedorId, setProveedorId] = useState("")
  const [tipoCbte, setTipoCbte] = useState<string>("A")
  const [ptoVenta, setPtoVenta] = useState("")
  const [nroComprobante, setNroComprobante] = useState("")
  const [fechaComprobante, setFechaComprobante] = useState("")
  const [concepto, setConcepto] = useState("")
  const [percepcionIIBB, setPercepcionIIBB] = useState("")
  const [percepcionIVA, setPercepcionIVA] = useState("")
  const [percepcionGanancias, setPercepcionGanancias] = useState("")

  // ── Ítems ─────────────────────────────────────────────────────────────────
  const [items, setItems] = useState<ItemForm[]>([nuevoItem()])

  // ── PDF factura ───────────────────────────────────────────────────────────
  const [pdfS3Key, setPdfS3Key] = useState("")

  // ── Percepciones e Impuestos ─────────────────────────────────────────────
  const [percepcionesExtra, setPercepcionesExtra] = useState<PercepcionForm[]>([])

  // ── Pago opcional ─────────────────────────────────────────────────────────
  const [registrarPago, setRegistrarPago] = useState(false)
  const [pagoFecha, setPagoFecha] = useState(todayStr())
  const [pagoMonto, setPagoMonto] = useState("")
  const [pagoTipo, setPagoTipo] = useState("")
  const [pagoObservaciones, setPagoObservaciones] = useState("")
  const [pagoComprobantePdfS3Key, setPagoComprobantePdfS3Key] = useState("")
  const [pagoCuentaId, setPagoCuentaId] = useState("")
  const [pagoChequeRecibidoId, setPagoChequeRecibidoId] = useState("")
  const [pagoChequeNro, setPagoChequeNro] = useState("")
  const [pagoChequeFechaEmision, setPagoChequeFechaEmision] = useState(todayStr())
  const [pagoChequeFechaPago, setPagoChequeFechaPago] = useState("")
  const [pagoChequeClausula, setPagoChequeClausula] = useState("NO_A_LA_ORDEN")

  // ── Estado UI ─────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(false)
  const [exitoData, setExitoData] = useState<ExitoData | null>(null)
  const [error, setError] = useState<string | null>(null)

  // ── Cálculos ──────────────────────────────────────────────────────────────
  const discriminaIVA = TIPOS_CON_IVA.has(tipoCbte)
  const proveedor = proveedores.find((p) => p.id === proveedorId)
  const itemsCalc = items.map((item) => calcularItem(item, discriminaIVA))
  const totalNeto = sumarImportes(itemsCalc.map(i => i.subtotalNeto))
  const totalIva = sumarImportes(itemsCalc.map(i => i.montoIva))
  const percIIBBNum = parsearImporte(percepcionIIBB)
  const percIVANum = parsearImporte(percepcionIVA)
  const percGananciasNum = parsearImporte(percepcionGanancias)
  const totalPercepcionesLegacy = sumarImportes([percIIBBNum, percIVANum, percGananciasNum])
  const totalPercepcionesExtra = sumarImportes(percepcionesExtra.map(p => parsearImporte(p.monto)))
  const totalPercepciones = sumarImportes([totalPercepcionesLegacy, totalPercepcionesExtra])
  const totalFinal = sumarImportes([totalNeto, totalIva, totalPercepciones])

  const pagoMontoNum = parsearImporte(pagoMonto)
  const saldoTrasPago = maxMonetario(0, restarImportes(totalFinal, pagoMontoNum))

  // ── Validación ────────────────────────────────────────────────────────────
  const cabeceraCompleta = !!(
    proveedorId &&
    tipoCbte &&
    ptoVenta.trim() &&
    nroComprobante.trim() &&
    fechaComprobante
  )
  const tieneItemValido = items.some(
    (i) => i.descripcion.trim() && parsearImporte(i.precioUnitario) > 0
  )
  const tienePdf = pdfS3Key !== ""

  const pagoValido =
    !registrarPago ||
    (pagoMontoNum > 0 &&
      pagoTipo !== "" &&
      (!REQUIERE_CUENTA.has(pagoTipo) || pagoCuentaId !== "") &&
      (!REQUIERE_CHEQUE_CARTERA.has(pagoTipo) || pagoChequeRecibidoId !== "") &&
      (!REQUIERE_COMPROBANTE.has(pagoTipo) || pagoComprobantePdfS3Key !== ""))

  const puedeRegistrar = cabeceraCompleta && tieneItemValido && tienePdf && pagoValido

  // ── Handlers ──────────────────────────────────────────────────────────────
  const agregarItem = () => setItems((prev) => [...prev, nuevoItem()])
  const eliminarItem = (id: string) => setItems((prev) => prev.filter((i) => i.id !== id))
  const actualizarItem = (id: string, campo: keyof ItemForm, valor: string) =>
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, [campo]: valor } : i)))

  const agregarPercepcion = () => setPercepcionesExtra((prev) => [...prev, nuevaPercepcion()])
  const eliminarPercepcion = (id: string) => setPercepcionesExtra((prev) => prev.filter((p) => p.id !== id))
  const actualizarPercepcion = (id: string, campo: keyof PercepcionForm, valor: string) =>
    setPercepcionesExtra((prev) => prev.map((p) => (p.id === id ? { ...p, [campo]: valor } : p)))

  const handleTipoPagoChange = (tipo: string) => {
    setPagoTipo(tipo)
    setPagoCuentaId("")
    setPagoChequeRecibidoId("")
    setPagoComprobantePdfS3Key("")
  }

  const handleRegistrarPagoChange = (checked: boolean) => {
    setRegistrarPago(checked)
    if (checked && !pagoMonto) {
      setPagoMonto(totalFinal.toFixed(2))
    }
    if (!checked) {
      setPagoFecha(todayStr())
      setPagoMonto("")
      setPagoTipo("")
      setPagoObservaciones("")
      setPagoComprobantePdfS3Key("")
      setPagoCuentaId("")
      setPagoChequeRecibidoId("")
      setPagoChequeNro("")
      setPagoChequeFechaPago("")
    }
  }

  const resetForm = () => {
    setProveedorId("")
    setTipoCbte("A")
    setPtoVenta("")
    setNroComprobante("")
    setFechaComprobante("")
    setConcepto("")
    setPercepcionIIBB("")
    setPercepcionIVA("")
    setPercepcionGanancias("")
    setItems([nuevoItem()])
    setPercepcionesExtra([])
    setPdfS3Key("")
    handleRegistrarPagoChange(false)
    setRegistrarPago(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setExitoData(null)

    if (!puedeRegistrar) {
      setError("Completá todos los campos obligatorios, al menos un ítem válido y el PDF.")
      return
    }

    const itemsPayload = items
      .filter((i) => i.descripcion.trim() && parsearImporte(i.precioUnitario) > 0)
      .map((item) => {
        const calc = calcularItem(item, discriminaIVA)
        return {
          descripcion: item.descripcion.trim(),
          cantidad: parseFloat(item.cantidad) || 1,
          precioUnitario: parsearImporte(item.precioUnitario),
          alicuotaIva: calc.alicuota,
          esExento: calc.esExento,
        }
      })

    const pagoPayload = registrarPago
      ? {
          fecha: pagoFecha,
          monto: pagoMontoNum,
          tipo: pagoTipo,
          observaciones: pagoObservaciones || undefined,
          comprobantePdfS3Key: pagoComprobantePdfS3Key || undefined,
          cuentaId: pagoCuentaId || undefined,
          chequeRecibidoId: pagoChequeRecibidoId || undefined,
          tarjetaId: undefined,
          chequePropio: pagoTipo === "CHEQUE_PROPIO" ? {
            nroCheque: pagoChequeNro || null,
            tipoDocBeneficiario: "CUIT",
            nroDocBeneficiario: proveedor?.cuit ?? "",
            mailBeneficiario: null,
            fechaEmision: pagoChequeFechaEmision,
            fechaPago: pagoChequeFechaPago,
            clausula: pagoChequeClausula,
            descripcion1: null,
            descripcion2: null,
          } : undefined,
        }
      : undefined

    setLoading(true)
    try {
      const res = await fetch("/api/facturas-proveedor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proveedorId,
          tipoCbte,
          ptoVenta: ptoVenta.trim(),
          nroComprobante: nroComprobante.trim(),
          fechaComprobante,
          concepto: concepto || undefined,
          percepcionIIBB: percIIBBNum > 0 ? percIIBBNum : undefined,
          percepcionIVA: percIVANum > 0 ? percIVANum : undefined,
          percepcionGanancias: percGananciasNum > 0 ? percGananciasNum : undefined,
          pdfS3Key,
          items: itemsPayload,
          percepciones: percepcionesExtra
            .filter((p) => parsearImporte(p.monto) > 0)
            .map((p) => ({
              tipo: p.tipo,
              categoria: categoriaPercepcion(p.tipo),
              descripcion: p.tipo === "OTRO" ? p.descripcion || null : null,
              monto: parsearImporte(p.monto),
            })),
          pago: pagoPayload,
        }),
      })

      if (!res.ok) {
        const data = (await res.json()) as { error?: string }
        setError(data.error ?? "Error al guardar la factura")
        return
      }

      const data = (await res.json()) as {
        total: number
        estadoPago: string
        pagoRegistrado?: number | null
      }
      setExitoData(data)
      resetForm()
    } catch {
      setError("Error de conexión")
    } finally {
      setLoading(false)
    }
  }

  // ── Cheques filtrados por tipo ─────────────────────────────────────────────
  const chequesFisicos = chequesEnCartera.filter((c) => !c.esElectronico)
  const chequesEcheq = chequesEnCartera.filter((c) => c.esElectronico)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Ingresar Factura de Proveedor</h2>
        <p className="text-muted-foreground">Cargá una factura recibida de un proveedor con sus ítems y PDF.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ── Cabecera ─────────────────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle>Cabecera del comprobante</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Proveedor *</Label>
              <SearchCombobox
                items={proveedores.map((p) => ({ id: p.id, label: p.razonSocial, sublabel: p.cuit }))}
                value={proveedorId}
                onChange={setProveedorId}
                placeholder="Buscar proveedor..."
              />
              {proveedor && (
                <p className="text-xs text-muted-foreground">CUIT: {proveedor.cuit}</p>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="tipoCbte">Tipo *</Label>
                <select
                  id="tipoCbte"
                  value={tipoCbte}
                  onChange={(e) => setTipoCbte(e.target.value)}
                  className={SELECT_CLS}
                >
                  {TIPOS_CBTE.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                {!discriminaIVA && (
                  <p className="text-xs text-amber-600">Tipo {tipoCbte}: no discrimina IVA</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ptoVenta">Pto. Venta *</Label>
                <Input
                  id="ptoVenta"
                  value={ptoVenta}
                  onChange={(e) => setPtoVenta(e.target.value)}
                  placeholder="0001"
                  maxLength={5}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="nroComprobante">Nro. Comprobante *</Label>
                <Input
                  id="nroComprobante"
                  value={nroComprobante}
                  onChange={(e) => setNroComprobante(e.target.value)}
                  placeholder="00000123"
                  maxLength={8}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="fechaComprobante">Fecha del comprobante *</Label>
                <Input
                  id="fechaComprobante"
                  type="date"
                  value={fechaComprobante}
                  onChange={(e) => setFechaComprobante(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="concepto">Concepto / Rubro de gasto</Label>
                <select
                  id="concepto"
                  value={concepto}
                  onChange={(e) => setConcepto(e.target.value)}
                  className={SELECT_CLS}
                >
                  <option value="">— Sin clasificar —</option>
                  {CONCEPTOS.map((c) => (
                    <option key={c} value={c}>{c.replace(/_/g, " ")}</option>
                  ))}
                </select>
              </div>
            </div>

            {discriminaIVA && (
              <div>
                <p className="text-sm font-medium mb-2">Percepciones (opcional)</p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="percIIBB">Perc. IIBB</Label>
                    <Input
                      id="percIIBB"
                      type="number"
                      step="0.01"
                      min="0"
                      value={percepcionIIBB}
                      onChange={(e) => setPercepcionIIBB(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="percIVA">Perc. IVA</Label>
                    <Input
                      id="percIVA"
                      type="number"
                      step="0.01"
                      min="0"
                      value={percepcionIVA}
                      onChange={(e) => setPercepcionIVA(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="percGanancias">Perc. Ganancias</Label>
                    <Input
                      id="percGanancias"
                      type="number"
                      step="0.01"
                      min="0"
                      value={percepcionGanancias}
                      onChange={(e) => setPercepcionGanancias(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Ítems ────────────────────────────────────────────────────────── */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Ítems de la factura</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={agregarItem}>
              <Plus className="h-4 w-4 mr-1" /> Agregar ítem
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            <div
              className={`grid gap-2 text-xs font-medium text-muted-foreground ${
                discriminaIVA
                  ? "grid-cols-[2fr_0.6fr_0.9fr_0.8fr_0.8fr_0.8fr_0.8fr_auto]"
                  : "grid-cols-[2fr_0.6fr_0.9fr_0.9fr_auto]"
              }`}
            >
              <span>Descripción</span>
              <span>Cant.</span>
              <span>P. Unitario</span>
              {discriminaIVA && <span>Alíc. IVA</span>}
              <span>Subtotal</span>
              {discriminaIVA && <span>IVA</span>}
              {discriminaIVA && <span>Total</span>}
              <span />
            </div>

            {items.map((item, idx) => {
              const calc = calcularItem(item, discriminaIVA)
              return (
                <div
                  key={item.id}
                  className={`grid gap-2 items-center ${
                    discriminaIVA
                      ? "grid-cols-[2fr_0.6fr_0.9fr_0.8fr_0.8fr_0.8fr_0.8fr_auto]"
                      : "grid-cols-[2fr_0.6fr_0.9fr_0.9fr_auto]"
                  }`}
                >
                  <Input
                    value={item.descripcion}
                    onChange={(e) => actualizarItem(item.id, "descripcion", e.target.value)}
                    placeholder={`Ítem ${idx + 1}`}
                  />
                  <Input
                    type="number"
                    step="0.001"
                    min="0.001"
                    value={item.cantidad}
                    onChange={(e) => actualizarItem(item.id, "cantidad", e.target.value)}
                  />
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={item.precioUnitario}
                    onChange={(e) => actualizarItem(item.id, "precioUnitario", e.target.value)}
                    placeholder="0.00"
                  />
                  {discriminaIVA && (
                    <select
                      value={item.alicuotaIva}
                      onChange={(e) => actualizarItem(item.id, "alicuotaIva", e.target.value)}
                      className={SELECT_CLS}
                    >
                      <option value="EXENTO">Exento</option>
                      <option value="0">0%</option>
                      <option value="10.5">10.5%</option>
                      <option value="21">21%</option>
                      <option value="27">27%</option>
                    </select>
                  )}
                  <span className="text-sm text-right">{formatearMoneda(calc.subtotalNeto)}</span>
                  {discriminaIVA && (
                    <span className="text-sm text-right text-muted-foreground">
                      {formatearMoneda(calc.montoIva)}
                    </span>
                  )}
                  {discriminaIVA && (
                    <span className="text-sm text-right font-medium">
                      {formatearMoneda(calc.subtotalTotal)}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => eliminarItem(item.id)}
                    disabled={items.length === 1}
                    className="text-muted-foreground hover:text-destructive disabled:opacity-30"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )
            })}

            {/* Totales */}
            <div className="mt-4 border-t pt-3 space-y-1 text-sm">
              <div className="flex justify-end gap-8">
                <span className="text-muted-foreground">Neto</span>
                <span className="w-28 text-right">{formatearMoneda(totalNeto)}</span>
              </div>
              {discriminaIVA && totalIva > 0 && (
                <div className="flex justify-end gap-8">
                  <span className="text-muted-foreground">IVA</span>
                  <span className="w-28 text-right">{formatearMoneda(totalIva)}</span>
                </div>
              )}
              {totalPercepciones > 0 && (
                <div className="flex justify-end gap-8">
                  <span className="text-muted-foreground">Percepciones</span>
                  <span className="w-28 text-right">{formatearMoneda(totalPercepciones)}</span>
                </div>
              )}
              <div className="flex justify-end gap-8 font-semibold text-base border-t pt-1">
                <span>TOTAL</span>
                <span className="w-28 text-right">{formatearMoneda(totalFinal)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Percepciones e Impuestos adicionales ──────────────────────── */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Percepciones e Impuestos adicionales</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={agregarPercepcion}>
              <Plus className="h-4 w-4 mr-1" /> Agregar percepcion/impuesto
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {percepcionesExtra.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Sin percepciones ni impuestos adicionales. Usa el boton para agregar.
              </p>
            )}
            {percepcionesExtra.map((p) => (
              <div key={p.id} className="grid grid-cols-[1.5fr_1fr_0.8fr_auto] gap-2 items-center">
                <select
                  value={p.tipo}
                  onChange={(e) => actualizarPercepcion(p.id, "tipo", e.target.value)}
                  className={SELECT_CLS}
                >
                  <optgroup label="Percepciones">
                    {PERCEPCION_OPTIONS.filter((o) => o.group === "PERCEPCIONES").map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Impuestos">
                    {PERCEPCION_OPTIONS.filter((o) => o.group === "IMPUESTOS").map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </optgroup>
                </select>
                {p.tipo === "OTRO" ? (
                  <Input
                    value={p.descripcion}
                    onChange={(e) => actualizarPercepcion(p.id, "descripcion", e.target.value)}
                    placeholder="Descripcion..."
                  />
                ) : (
                  <span className="text-sm text-muted-foreground">—</span>
                )}
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={p.monto}
                  onChange={(e) => actualizarPercepcion(p.id, "monto", e.target.value)}
                  placeholder="0.00"
                />
                <button
                  type="button"
                  onClick={() => eliminarPercepcion(p.id)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            {totalPercepcionesExtra > 0 && (
              <div className="flex justify-end gap-8 text-sm font-medium border-t pt-2">
                <span>Total percepciones/impuestos adicionales</span>
                <span className="w-28 text-right">{formatearMoneda(totalPercepcionesExtra)}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── PDF ──────────────────────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle>PDF de la factura *</CardTitle>
          </CardHeader>
          <CardContent>
            <UploadPDF
              prefijo="facturas-proveedor"
              onUpload={(key: string) => setPdfS3Key(key)}
              label="Subir PDF de la factura"
            />
            {pdfS3Key && (
              <p className="text-xs text-green-600 mt-2">PDF subido correctamente.</p>
            )}
          </CardContent>
        </Card>

        {/* ── Pago opcional ────────────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <label
              htmlFor="registrarPago"
              className="flex items-center gap-3 cursor-pointer"
            >
              <input
                type="checkbox"
                id="registrarPago"
                checked={registrarPago}
                onChange={(e) => handleRegistrarPagoChange(e.target.checked)}
                className="h-4 w-4 rounded border-input accent-primary"
              />
              <div>
                <p className="text-base font-semibold leading-none">
                  Registrar pago ahora{" "}
                  <span className="text-sm font-normal text-muted-foreground">(opcional)</span>
                </p>
                {!registrarPago && (
                  <p className="text-xs text-muted-foreground mt-1">
                    La factura quedará en estado Pendiente de pago.
                  </p>
                )}
              </div>
            </label>
          </CardHeader>

          {registrarPago && (
            <CardContent className="space-y-4">
              {/* Fecha + Monto */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="pagoFecha">Fecha de pago</Label>
                  <Input
                    id="pagoFecha"
                    type="date"
                    value={pagoFecha}
                    onChange={(e) => setPagoFecha(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pagoMonto">Monto a pagar</Label>
                  <Input
                    id="pagoMonto"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={pagoMonto}
                    onChange={(e) => setPagoMonto(e.target.value)}
                    placeholder="0.00"
                  />
                  {pagoMontoNum > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Saldo pendiente tras este pago:{" "}
                      <span className={saldoTrasPago > 0.01 ? "text-destructive font-medium" : "text-green-600 font-medium"}>
                        {formatearMoneda(saldoTrasPago)}
                      </span>
                    </p>
                  )}
                </div>
              </div>

              {/* Método */}
              <div className="space-y-1.5">
                <Label htmlFor="pagoTipo">Método de pago</Label>
                <select
                  id="pagoTipo"
                  value={pagoTipo}
                  onChange={(e) => handleTipoPagoChange(e.target.value)}
                  className={SELECT_CLS}
                >
                  <option value="">— Seleccionar —</option>
                  <option value="TRANSFERENCIA">Transferencia</option>
                  <option value="CHEQUE_PROPIO">Cheque propio (ECheq)</option>
                  <option value="CHEQUE_FISICO_TERCERO">Cheque físico de tercero</option>
                  <option value="CHEQUE_ELECTRONICO_TERCERO">ECheq de tercero</option>
                  <option value="TARJETA">Tarjeta</option>
                  <option value="EFECTIVO">Efectivo</option>
                </select>
              </div>

              {/* TRANSFERENCIA — select de cuenta */}
              {pagoTipo === "TRANSFERENCIA" && (
                <div className="space-y-1.5">
                  <Label htmlFor="pagoCuentaTransf">Cuenta de origen *</Label>
                  <select
                    id="pagoCuentaTransf"
                    value={pagoCuentaId}
                    onChange={(e) => setPagoCuentaId(e.target.value)}
                    className={SELECT_CLS}
                  >
                    <option value="">— Seleccionar cuenta —</option>
                    {cuentas.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre} ({c.tipo})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* CHEQUE_PROPIO — cuenta chequera + datos cheque simplificados */}
              {pagoTipo === "CHEQUE_PROPIO" && (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="pagoCuentaCheq">Cuenta chequera *</Label>
                    <select
                      id="pagoCuentaCheq"
                      value={pagoCuentaId}
                      onChange={(e) => setPagoCuentaId(e.target.value)}
                      className={SELECT_CLS}
                    >
                      <option value="">— Seleccionar cuenta —</option>
                      {cuentas
                        .filter((c) => c.tieneChequera)
                        .map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.nombre}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="pagoChequeNro">Nro. de cheque *</Label>
                      <Input
                        id="pagoChequeNro"
                        value={pagoChequeNro}
                        onChange={(e) => setPagoChequeNro(e.target.value)}
                        placeholder="Número de cheque"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="pagoChequeClausula">Cláusula</Label>
                      <select
                        id="pagoChequeClausula"
                        value={pagoChequeClausula}
                        onChange={(e) => setPagoChequeClausula(e.target.value)}
                        className={SELECT_CLS}
                      >
                        <option value="NO_A_LA_ORDEN">No a la orden</option>
                        <option value="AL_DIA">Al día</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="pagoChequeFechaEmision">Fecha emisión</Label>
                      <Input
                        id="pagoChequeFechaEmision"
                        type="date"
                        value={pagoChequeFechaEmision}
                        onChange={(e) => setPagoChequeFechaEmision(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="pagoChequeFechaPago">Fecha de pago del cheque</Label>
                      <Input
                        id="pagoChequeFechaPago"
                        type="date"
                        value={pagoChequeFechaPago}
                        onChange={(e) => setPagoChequeFechaPago(e.target.value)}
                      />
                    </div>
                  </div>
                  {/* Beneficiario: datos del proveedor (solo lectura) */}
                  <div className="rounded-md border bg-muted/30 px-4 py-3 space-y-1 text-sm">
                    <p><span className="text-muted-foreground">Tipo beneficiario:</span> <strong>Proveedor</strong></p>
                    <p><span className="text-muted-foreground">Nombre:</span> <strong>{proveedor?.razonSocial ?? "—"}</strong></p>
                    <p><span className="text-muted-foreground">CUIT:</span> <strong>{proveedor?.cuit ?? "—"}</strong></p>
                  </div>
                </>
              )}

              {/* CHEQUE_FISICO_TERCERO */}
              {pagoTipo === "CHEQUE_FISICO_TERCERO" && (
                <div className="space-y-1.5">
                  <Label htmlFor="pagoChequeCartera">Cheque físico en cartera *</Label>
                  <select
                    id="pagoChequeCartera"
                    value={pagoChequeRecibidoId}
                    onChange={(e) => setPagoChequeRecibidoId(e.target.value)}
                    className={SELECT_CLS}
                  >
                    <option value="">— Seleccionar cheque —</option>
                    {chequesFisicos.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nroCheque} — {c.bancoEmisor} — {formatearMoneda(c.monto)} — vto{" "}
                        {formatearFecha(c.fechaCobro)}
                      </option>
                    ))}
                  </select>
                  {chequesFisicos.length === 0 && (
                    <p className="text-xs text-muted-foreground">No hay cheques físicos en cartera.</p>
                  )}
                </div>
              )}

              {/* CHEQUE_ELECTRONICO_TERCERO */}
              {pagoTipo === "CHEQUE_ELECTRONICO_TERCERO" && (
                <div className="space-y-1.5">
                  <Label htmlFor="pagoChequeEcheq">ECheq en cartera *</Label>
                  <select
                    id="pagoChequeEcheq"
                    value={pagoChequeRecibidoId}
                    onChange={(e) => setPagoChequeRecibidoId(e.target.value)}
                    className={SELECT_CLS}
                  >
                    <option value="">— Seleccionar ECheq —</option>
                    {chequesEcheq.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nroCheque} — {c.bancoEmisor} — {formatearMoneda(c.monto)} — vto{" "}
                        {formatearFecha(c.fechaCobro)}
                      </option>
                    ))}
                  </select>
                  {chequesEcheq.length === 0 && (
                    <p className="text-xs text-muted-foreground">No hay ECheq en cartera.</p>
                  )}
                </div>
              )}

              {/* TARJETA */}
              {pagoTipo === "TARJETA" && (
                <div className="rounded-md border border-amber-200 bg-amber-50 p-3">
                  <p className="text-sm text-amber-800">
                    El gasto quedará pendiente de asignación a una tarjeta.
                    Podés asignarlo luego desde Contabilidad → Tarjetas al cerrar el resumen.
                  </p>
                </div>
              )}

              {/* Observaciones */}
              <div className="space-y-1.5">
                <Label htmlFor="pagoObservaciones">Observaciones</Label>
                <Input
                  id="pagoObservaciones"
                  value={pagoObservaciones}
                  onChange={(e) => setPagoObservaciones(e.target.value)}
                  placeholder="Opcional..."
                />
              </div>

              {/* Comprobante PDF del pago */}
              {REQUIERE_COMPROBANTE.has(pagoTipo) && (
                <div className="space-y-1.5">
                  <Label>Comprobante de pago *</Label>
                  <UploadPDF
                    prefijo="comprobantes-pago-proveedor"
                    onUpload={(key: string) => setPagoComprobantePdfS3Key(key)}
                    label="Subir comprobante"
                  />
                  {pagoComprobantePdfS3Key && (
                    <p className="text-xs text-green-600">Comprobante subido correctamente.</p>
                  )}
                </div>
              )}
            </CardContent>
          )}
        </Card>

        {/* ── Submit ───────────────────────────────────────────────────────── */}
        <div className="space-y-3">
          {/* Indicadores de completitud */}
          <div className="flex flex-wrap gap-4 text-sm">
            <span className={cabeceraCompleta ? "text-green-600" : "text-muted-foreground"}>
              {cabeceraCompleta ? "✓" : "○"} Cabecera completa
            </span>
            <span className={tieneItemValido ? "text-green-600" : "text-muted-foreground"}>
              {tieneItemValido ? "✓" : "○"} Ítems válidos
            </span>
            <span className={tienePdf ? "text-green-600" : "text-muted-foreground"}>
              {tienePdf ? "✓" : "○"} PDF adjunto
            </span>
            {registrarPago && (
              <span className={pagoValido ? "text-green-600" : "text-muted-foreground"}>
                {pagoValido ? "✓" : "○"} Pago completo
              </span>
            )}
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          {exitoData && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 space-y-1 text-sm">
              <p className="text-green-700 font-medium">✓ Factura registrada correctamente</p>
              {exitoData.estadoPago === "PAGADA" && exitoData.pagoRegistrado && (
                <p className="text-green-700">
                  ✓ Pago de {formatearMoneda(exitoData.pagoRegistrado)} registrado — Factura: PAGADA
                </p>
              )}
              {exitoData.estadoPago === "PARCIALMENTE_PAGADA" && exitoData.pagoRegistrado && (
                <p className="text-green-700">
                  ✓ Pago parcial de {formatearMoneda(exitoData.pagoRegistrado)} registrado — Saldo
                  pendiente:{" "}
                  {formatearMoneda(Math.max(0, exitoData.total - exitoData.pagoRegistrado))}
                </p>
              )}
              {exitoData.estadoPago === "PENDIENTE" && (
                <p className="text-muted-foreground text-xs">
                  Estado: PENDIENTE DE PAGO — podés registrar el pago desde Proveedores →
                  Registrar Pago
                </p>
              )}
            </div>
          )}

          <Button type="submit" disabled={loading || !puedeRegistrar} className="w-full">
            {loading ? "Guardando..." : "Registrar Factura"}
          </Button>
        </div>
      </form>
    </div>
  )
}
