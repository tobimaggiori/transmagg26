"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { parsearImporte, sumarImportes, restarImportes, maxMonetario, formatearMoneda } from "@/lib/money"
import { hoyLocalYmd } from "@/lib/date-local"

import {
  type Proveedor,
  type Cuenta,
  type ChequeEnCartera,
  type ItemForm,
  type ExitoData,
  type PercepcionForm,
  TIPOS_CON_IVA,
  REQUIERE_CUENTA,
  REQUIERE_CHEQUE_CARTERA,
  REQUIERE_COMPROBANTE,
  nuevoItem,
  nuevaPercepcion,
  calcularItem,
  categoriaPercepcion,
} from "./_components/types"

import { HeaderSection } from "./_components/header-section"
import { ItemsSection } from "./_components/items-section"
import { PercepcionesSection } from "./_components/percepciones-section"
import { PagoSection } from "./_components/pago-section"
import { Sidebar } from "./_components/sidebar"

type FacturaProveedorIngresoClientProps = {
  proveedores: Proveedor[]
  cuentas: Cuenta[]
  chequesEnCartera: ChequeEnCartera[]
}

const todayStr = () => hoyLocalYmd()

/**
 * FacturaProveedorIngresoClient: FacturaProveedorIngresoClientProps -> JSX.Element
 *
 * Dado proveedores, cuentas y cheques en cartera, renderiza el formulario
 * completo para ingresar una factura de proveedor con items, alicuotas IVA por item,
 * percepciones, PDF obligatorio y pago opcional inline en la misma transaccion atomica.
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

  // ── Items ─────────────────────────────────────────────────────────────────
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

  // ── Calculos ──────────────────────────────────────────────────────────────
  const discriminaIVA = TIPOS_CON_IVA.has(tipoCbte)
  const proveedor = proveedores.find((p) => p.id === proveedorId)
  const itemsCalc = items.map((item) => calcularItem(item, discriminaIVA))
  const totalNeto = sumarImportes(itemsCalc.map(i => i.subtotalNeto))
  const totalIva = sumarImportes(itemsCalc.map(i => i.montoIva))
  const totalPercepciones = sumarImportes(percepcionesExtra.map(p => parsearImporte(p.monto)))
  const totalFinal = sumarImportes([totalNeto, totalIva, totalPercepciones])

  const pagoMontoNum = parsearImporte(pagoMonto)
  const saldoTrasPago = maxMonetario(0, restarImportes(totalFinal, pagoMontoNum))

  // ── Validacion ────────────────────────────────────────────────────────────
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
      setError("Completa todos los campos obligatorios, al menos un item valido y el PDF.")
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
      setError("Error de conexion")
    } finally {
      setLoading(false)
    }
  }

  // ── Cheques filtrados por tipo ─────────────────────────────────────────────
  const chequesFisicos = chequesEnCartera.filter((c) => !c.esElectronico)
  const chequesEcheq = chequesEnCartera.filter((c) => c.esElectronico)

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">Ingresar Factura de Proveedor</h2>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
          {/* ── Columna principal ──────────────────────────────────────── */}
          <div className="space-y-6">
            <HeaderSection
              proveedores={proveedores}
              proveedorId={proveedorId}
              onProveedorChange={setProveedorId}
              proveedor={proveedor}
              tipoCbte={tipoCbte}
              onTipoCbteChange={setTipoCbte}
              discriminaIVA={discriminaIVA}
              ptoVenta={ptoVenta}
              onPtoVentaChange={setPtoVenta}
              nroComprobante={nroComprobante}
              onNroComprobanteChange={setNroComprobante}
              fechaComprobante={fechaComprobante}
              onFechaComprobanteChange={setFechaComprobante}
              concepto={concepto}
              onConceptoChange={setConcepto}
            />

            <ItemsSection
              items={items}
              discriminaIVA={discriminaIVA}
              onAgregarItem={agregarItem}
              onEliminarItem={eliminarItem}
              onActualizarItem={actualizarItem}
            />

            <PercepcionesSection
              percepciones={percepcionesExtra}
              totalPercepciones={totalPercepciones}
              onAgregar={agregarPercepcion}
              onEliminar={eliminarPercepcion}
              onActualizar={actualizarPercepcion}
            />

            <PagoSection
              registrarPago={registrarPago}
              onRegistrarPagoChange={handleRegistrarPagoChange}
              pagoFecha={pagoFecha}
              onPagoFechaChange={setPagoFecha}
              pagoMonto={pagoMonto}
              onPagoMontoChange={setPagoMonto}
              pagoMontoNum={pagoMontoNum}
              saldoTrasPago={saldoTrasPago}
              pagoTipo={pagoTipo}
              onPagoTipoChange={handleTipoPagoChange}
              pagoObservaciones={pagoObservaciones}
              onPagoObservacionesChange={setPagoObservaciones}
              pagoComprobantePdfS3Key={pagoComprobantePdfS3Key}
              onPagoComprobantePdfS3KeyChange={setPagoComprobantePdfS3Key}
              pagoCuentaId={pagoCuentaId}
              onPagoCuentaIdChange={setPagoCuentaId}
              pagoChequeRecibidoId={pagoChequeRecibidoId}
              onPagoChequeRecibidoIdChange={setPagoChequeRecibidoId}
              pagoChequeNro={pagoChequeNro}
              onPagoChequeNroChange={setPagoChequeNro}
              pagoChequeFechaEmision={pagoChequeFechaEmision}
              onPagoChequeFechaEmisionChange={setPagoChequeFechaEmision}
              pagoChequeFechaPago={pagoChequeFechaPago}
              onPagoChequeFechaPagoChange={setPagoChequeFechaPago}
              pagoChequeClausula={pagoChequeClausula}
              onPagoChequeClausulaChange={setPagoChequeClausula}
              proveedor={proveedor}
              cuentas={cuentas}
              chequesFisicos={chequesFisicos}
              chequesEcheq={chequesEcheq}
            />

            {/* Submit mobile — visible solo en pantallas sin sidebar */}
            <div className="lg:hidden space-y-3">
              {error && <p className="text-sm text-destructive">{error}</p>}
              {exitoData && (
                <div className="rounded-lg border border-green-200 bg-green-50 p-4 space-y-1 text-sm">
                  <p className="text-green-700 font-medium">Factura registrada correctamente</p>
                  {exitoData.estadoPago === "PAGADA" && exitoData.pagoRegistrado && (
                    <p className="text-green-700">
                      Pago de {formatearMoneda(exitoData.pagoRegistrado)} registrado — Factura: PAGADA
                    </p>
                  )}
                  {exitoData.estadoPago === "PARCIALMENTE_PAGADA" && exitoData.pagoRegistrado && (
                    <p className="text-green-700">
                      Pago parcial de {formatearMoneda(exitoData.pagoRegistrado)} registrado — Saldo
                      pendiente:{" "}
                      {formatearMoneda(Math.max(0, exitoData.total - exitoData.pagoRegistrado))}
                    </p>
                  )}
                  {exitoData.estadoPago === "PENDIENTE" && (
                    <p className="text-muted-foreground text-xs">
                      Estado: PENDIENTE DE PAGO — podes registrar el pago desde Proveedores →
                      Registrar Pago
                    </p>
                  )}
                </div>
              )}
              <Button type="submit" disabled={loading || !puedeRegistrar} className="w-full">
                {loading ? "Guardando..." : "Registrar Factura"}
              </Button>
            </div>
          </div>

          {/* ── Sidebar sticky ────────────────────────────────────────── */}
          <div className="hidden lg:block lg:sticky lg:top-6">
            <Sidebar
              pdfS3Key={pdfS3Key}
              onPdfUpload={(key: string) => setPdfS3Key(key)}
              totalNeto={totalNeto}
              totalIva={totalIva}
              totalPercepciones={totalPercepciones}
              totalFinal={totalFinal}
              discriminaIVA={discriminaIVA}
              registrarPago={registrarPago}
              pagoMontoNum={pagoMontoNum}
              saldoTrasPago={saldoTrasPago}
              cabeceraCompleta={cabeceraCompleta}
              tieneItemValido={tieneItemValido}
              tienePdf={tienePdf}
              pagoValido={pagoValido}
              puedeRegistrar={puedeRegistrar}
              loading={loading}
              error={error}
              exitoData={exitoData}
            />
          </div>
        </div>
      </form>
    </div>
  )
}
