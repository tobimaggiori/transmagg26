"use client"

import { useState } from "react"
import { SearchCombobox } from "@/components/ui/search-combobox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { UploadPDF } from "@/components/upload-pdf"
import { formatearMoneda, formatearFecha } from "@/lib/utils"
import { Plus, Trash2 } from "lucide-react"

type Proveedor = { id: string; razonSocial: string; cuit: string }
type Fletero = { id: string; razonSocial: string; cuit: string }
type Cuenta = { id: string; nombre: string; tipo: string; tieneChequera: boolean }
type Tarjeta = { id: string; nombre: string; tipo: string; banco: string; ultimos4: string }
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
  fleteros: Fletero[]
  cuentas: Cuenta[]
  tarjetas: Tarjeta[]
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
const REQUIERE_TARJETA = new Set(["TARJETA_CREDITO", "TARJETA_DEBITO", "TARJETA_PREPAGA"])
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
  const cantidad = parseFloat(item.cantidad) || 0
  const precioUnitario = parseFloat(item.precioUnitario) || 0
  const subtotalNeto = cantidad * precioUnitario
  const esExento = discriminaIVA && item.alicuotaIva === "EXENTO"
  const alicuota = discriminaIVA && !esExento ? parseFloat(item.alicuotaIva) : 0
  const montoIva = alicuota > 0 ? (subtotalNeto * alicuota) / 100 : 0
  return { subtotalNeto, montoIva, subtotalTotal: subtotalNeto + montoIva, esExento, alicuota }
}

const todayStr = () => new Date().toISOString().slice(0, 10)

/**
 * FacturaProveedorIngresoClient: FacturaProveedorIngresoClientProps -> JSX.Element
 *
 * Dado proveedores, cuentas, tarjetas y cheques en cartera, renderiza el formulario
 * completo para ingresar una factura de proveedor con ítems, alícuotas IVA por ítem,
 * percepciones, PDF obligatorio y pago opcional inline en la misma transacción atómica.
 * Para tipos B/C/X no se discrimina IVA. Hace POST a /api/facturas-proveedor.
 *
 * Ejemplos:
 * <FacturaProveedorIngresoClient proveedores={[...]} cuentas={[...]} tarjetas={[...]} chequesEnCartera={[...]} />
 */
export function FacturaProveedorIngresoClient({
  proveedores,
  fleteros,
  cuentas,
  tarjetas,
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

  // ── Gasto por cuenta de fletero ───────────────────────────────────────────
  const [esPorCuentaDeFletero, setEsPorCuentaDeFletero] = useState(false)
  const [gastoFleteroId, setGastoFleteroId] = useState("")
  const [gastoFleteroTipo, setGastoFleteroTipo] = useState("COMBUSTIBLE")

  // ── Ítems ─────────────────────────────────────────────────────────────────
  const [items, setItems] = useState<ItemForm[]>([nuevoItem()])

  // ── PDF factura ───────────────────────────────────────────────────────────
  const [pdfS3Key, setPdfS3Key] = useState("")

  // ── Pago opcional ─────────────────────────────────────────────────────────
  const [registrarPago, setRegistrarPago] = useState(false)
  const [pagoFecha, setPagoFecha] = useState(todayStr())
  const [pagoMonto, setPagoMonto] = useState("")
  const [pagoTipo, setPagoTipo] = useState("")
  const [pagoObservaciones, setPagoObservaciones] = useState("")
  const [pagoComprobantePdfS3Key, setPagoComprobantePdfS3Key] = useState("")
  const [pagoCuentaId, setPagoCuentaId] = useState("")
  const [pagoChequeRecibidoId, setPagoChequeRecibidoId] = useState("")
  const [pagoTarjetaId, setPagoTarjetaId] = useState("")
  const [pagoChequeNro, setPagoChequeNro] = useState("")
  const [pagoChequeFechaEmision, setPagoChequeFechaEmision] = useState(todayStr())
  const [pagoChequeFechaPago, setPagoChequeFechaPago] = useState("")
  const [pagoChequeClausula, setPagoChequeClausula] = useState("NO_A_LA_ORDEN")
  const [pagoChequeTipoDoc, setPagoChequeTipoDoc] = useState("CUIT")
  const [pagoChequeDocBeneficiario, setPagoChequeDocBeneficiario] = useState("")
  const [pagoChequeMailBeneficiario, setPagoChequeMailBeneficiario] = useState("")
  const [pagoChequeDescripcion1, setPagoChequeDescripcion1] = useState("")
  const [pagoChequeDescripcion2, setPagoChequeDescripcion2] = useState("")

  // ── Estado UI ─────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(false)
  const [exitoData, setExitoData] = useState<ExitoData | null>(null)
  const [error, setError] = useState<string | null>(null)

  // ── Cálculos ──────────────────────────────────────────────────────────────
  const discriminaIVA = TIPOS_CON_IVA.has(tipoCbte)
  const proveedor = proveedores.find((p) => p.id === proveedorId)
  const itemsCalc = items.map((item) => calcularItem(item, discriminaIVA))
  const totalNeto = itemsCalc.reduce((acc, i) => acc + i.subtotalNeto, 0)
  const totalIva = itemsCalc.reduce((acc, i) => acc + i.montoIva, 0)
  const percIIBBNum = parseFloat(percepcionIIBB) || 0
  const percIVANum = parseFloat(percepcionIVA) || 0
  const percGananciasNum = parseFloat(percepcionGanancias) || 0
  const totalPercepciones = percIIBBNum + percIVANum + percGananciasNum
  const totalFinal = totalNeto + totalIva + totalPercepciones

  const pagoMontoNum = parseFloat(pagoMonto) || 0
  const saldoTrasPago = Math.max(0, totalFinal - pagoMontoNum)

  // ── Validación ────────────────────────────────────────────────────────────
  const cabeceraCompleta = !!(
    proveedorId &&
    tipoCbte &&
    ptoVenta.trim() &&
    nroComprobante.trim() &&
    fechaComprobante
  )
  const tieneItemValido = items.some(
    (i) => i.descripcion.trim() && parseFloat(i.precioUnitario) > 0
  )
  const tienePdf = pdfS3Key !== ""

  const pagoValido =
    !registrarPago ||
    (pagoMontoNum > 0 &&
      pagoTipo !== "" &&
      (!REQUIERE_CUENTA.has(pagoTipo) || pagoCuentaId !== "") &&
      (!REQUIERE_CHEQUE_CARTERA.has(pagoTipo) || pagoChequeRecibidoId !== "") &&
      (!REQUIERE_TARJETA.has(pagoTipo) || pagoTarjetaId !== "") &&
      (!REQUIERE_COMPROBANTE.has(pagoTipo) || pagoComprobantePdfS3Key !== ""))

  const gastoFleteroValido = !esPorCuentaDeFletero || gastoFleteroId !== ""
  const puedeRegistrar = cabeceraCompleta && tieneItemValido && tienePdf && pagoValido && gastoFleteroValido

  // ── Handlers ──────────────────────────────────────────────────────────────
  const agregarItem = () => setItems((prev) => [...prev, nuevoItem()])
  const eliminarItem = (id: string) => setItems((prev) => prev.filter((i) => i.id !== id))
  const actualizarItem = (id: string, campo: keyof ItemForm, valor: string) =>
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, [campo]: valor } : i)))

  const handleTipoPagoChange = (tipo: string) => {
    setPagoTipo(tipo)
    setPagoCuentaId("")
    setPagoChequeRecibidoId("")
    setPagoTarjetaId("")
    setPagoComprobantePdfS3Key("")
    if (tipo === "CHEQUE_PROPIO" && proveedor?.cuit) {
      setPagoChequeDocBeneficiario(proveedor.cuit)
    }
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
      setPagoTarjetaId("")
      setPagoChequeNro("")
      setPagoChequeFechaPago("")
      setPagoChequeDocBeneficiario("")
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
    setPdfS3Key("")
    setEsPorCuentaDeFletero(false)
    setGastoFleteroId("")
    setGastoFleteroTipo("COMBUSTIBLE")
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
      .filter((i) => i.descripcion.trim() && parseFloat(i.precioUnitario) > 0)
      .map((item) => {
        const calc = calcularItem(item, discriminaIVA)
        return {
          descripcion: item.descripcion.trim(),
          cantidad: parseFloat(item.cantidad) || 1,
          precioUnitario: parseFloat(item.precioUnitario),
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
          tarjetaId: pagoTarjetaId || undefined,
          chequePropio: pagoTipo === "CHEQUE_PROPIO" ? {
            nroCheque: pagoChequeNro || null,
            tipoDocBeneficiario: pagoChequeTipoDoc,
            nroDocBeneficiario: pagoChequeDocBeneficiario,
            mailBeneficiario: pagoChequeMailBeneficiario || null,
            fechaEmision: pagoChequeFechaEmision,
            fechaPago: pagoChequeFechaPago,
            clausula: pagoChequeClausula,
            descripcion1: pagoChequeDescripcion1 || null,
            descripcion2: pagoChequeDescripcion2 || null,
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
          pago: pagoPayload,
          gastoFletero: esPorCuentaDeFletero
            ? { fleteroId: gastoFleteroId, tipo: gastoFleteroTipo }
            : undefined,
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

            {/* ── Gasto por cuenta de fletero ─────────────────────────────── */}
            <div className="border rounded-md p-3 space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={esPorCuentaDeFletero}
                  onChange={(e) => {
                    setEsPorCuentaDeFletero(e.target.checked)
                    if (!e.target.checked) {
                      setGastoFleteroId("")
                      setGastoFleteroTipo("COMBUSTIBLE")
                    }
                  }}
                  className="h-4 w-4 rounded border-input accent-primary"
                />
                <span className="text-sm font-medium">Esta factura es por cuenta de un fletero</span>
              </label>

              {esPorCuentaDeFletero && (
                <div className="space-y-3 pl-7">
                  <div className="space-y-1.5">
                    <Label>Fletero *</Label>
                    <SearchCombobox
                      items={fleteros.map((f) => ({ id: f.id, label: f.razonSocial, sublabel: f.cuit }))}
                      value={gastoFleteroId}
                      onChange={setGastoFleteroId}
                      placeholder="Buscar fletero..."
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="gastoFleteroTipo">Tipo de gasto *</Label>
                    <select
                      id="gastoFleteroTipo"
                      value={gastoFleteroTipo}
                      onChange={(e) => setGastoFleteroTipo(e.target.value)}
                      className={SELECT_CLS}
                    >
                      <option value="COMBUSTIBLE">Combustible</option>
                      <option value="OTRO">Otro</option>
                    </select>
                  </div>
                  <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
                    Esta factura NO generará crédito fiscal de IVA para Transmagg.
                  </p>
                </div>
              )}
            </div>

            {discriminaIVA && !esPorCuentaDeFletero && (
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
                  <option value="TARJETA_CREDITO">Tarjeta de crédito</option>
                  <option value="TARJETA_DEBITO">Tarjeta de débito</option>
                  <option value="TARJETA_PREPAGA">Tarjeta prepaga</option>
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

              {/* CHEQUE_PROPIO — cuenta chequera + datos cheque */}
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
                      <Label htmlFor="pagoChequeNro">Nro. de cheque (opcional)</Label>
                      <Input
                        id="pagoChequeNro"
                        value={pagoChequeNro}
                        onChange={(e) => setPagoChequeNro(e.target.value)}
                        placeholder="Asignado al emitir"
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
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="pagoChequeTipoDoc">Tipo doc beneficiario</Label>
                      <select
                        id="pagoChequeTipoDoc"
                        value={pagoChequeTipoDoc}
                        onChange={(e) => setPagoChequeTipoDoc(e.target.value)}
                        className={SELECT_CLS}
                      >
                        <option value="CUIT">CUIT</option>
                        <option value="CUIL">CUIL</option>
                        <option value="CDI">CDI</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="pagoChequeDocBenef">Nro doc beneficiario</Label>
                      <Input
                        id="pagoChequeDocBenef"
                        value={pagoChequeDocBeneficiario}
                        onChange={(e) => setPagoChequeDocBeneficiario(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="pagoChequeMailBenef">Mail beneficiario (opcional)</Label>
                    <Input
                      id="pagoChequeMailBenef"
                      type="email"
                      value={pagoChequeMailBeneficiario}
                      onChange={(e) => setPagoChequeMailBeneficiario(e.target.value)}
                      placeholder="email@ejemplo.com"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="pagoChequeDesc1">Descripción 1 (opcional)</Label>
                      <Input
                        id="pagoChequeDesc1"
                        value={pagoChequeDescripcion1}
                        onChange={(e) => setPagoChequeDescripcion1(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="pagoChequeDesc2">Descripción 2 (opcional)</Label>
                      <Input
                        id="pagoChequeDesc2"
                        value={pagoChequeDescripcion2}
                        onChange={(e) => setPagoChequeDescripcion2(e.target.value)}
                      />
                    </div>
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

              {/* TARJETA_* */}
              {REQUIERE_TARJETA.has(pagoTipo) && (
                <div className="space-y-1.5">
                  <Label htmlFor="pagoTarjeta">Tarjeta *</Label>
                  <select
                    id="pagoTarjeta"
                    value={pagoTarjetaId}
                    onChange={(e) => setPagoTarjetaId(e.target.value)}
                    className={SELECT_CLS}
                  >
                    <option value="">— Seleccionar tarjeta —</option>
                    {tarjetas
                      .filter(
                        (t) =>
                          (pagoTipo === "TARJETA_CREDITO" && t.tipo === "CREDITO") ||
                          (pagoTipo === "TARJETA_DEBITO" && t.tipo === "DEBITO") ||
                          (pagoTipo === "TARJETA_PREPAGA" && t.tipo === "PREPAGA") ||
                          true // show all as fallback
                      )
                      .map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.nombre} — {t.banco} ...{t.ultimos4}
                        </option>
                      ))}
                  </select>
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
