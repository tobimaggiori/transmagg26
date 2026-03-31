"use client"

/**
 * Propósito: Flujo de registro de pago a un proveedor.
 * 3 pasos: seleccionar proveedor → seleccionar factura → formulario de pago.
 */

import { useState } from "react"
import { SearchCombobox } from "@/components/ui/search-combobox"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { FormError } from "@/components/ui/form-error"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { UploadPDF } from "@/components/upload-pdf"
import { ViewPDF } from "@/components/view-pdf"
import { formatearMoneda, formatearFecha } from "@/lib/utils"

// --- Tipos ---

interface Proveedor { id: string; razonSocial: string; cuit: string }
interface Cuenta { id: string; nombre: string; tipo?: string }
interface Tarjeta { id: string; nombre: string; tipo: string; banco: string; ultimos4: string }
interface ChequeEnCartera {
  id: string
  nroCheque: string
  bancoEmisor: string
  monto: number
  fechaCobro: string
  esElectronico: boolean
  empresa: { razonSocial: string }
}
interface FacturaPendiente {
  id: string
  nroComprobante: string
  tipoCbte: string
  fechaCbte: string
  concepto: string | null
  total: number
  totalPagado: number
  saldoPendiente: number
  estadoPago: string
  pdfS3Key: string | null
}

interface ResumenInfo {
  existe: boolean
  tienePdf: boolean
  periodo: string
  id?: string
  s3Key?: string | null
}

interface RegistrarPagoProveedorClientProps {
  proveedores: Proveedor[]
  cuentas: Cuenta[]
  cuentasChequera: Cuenta[]
  tarjetas: Tarjeta[]
  chequesEnCartera: ChequeEnCartera[]
}

const TIPOS_PAGO = [
  { value: "TRANSFERENCIA", label: "Transferencia bancaria" },
  { value: "CHEQUE_PROPIO", label: "Cheque propio (ECheq)" },
  { value: "CHEQUE_FISICO_TERCERO", label: "Cheque físico de tercero (endoso)" },
  { value: "CHEQUE_ELECTRONICO_TERCERO", label: "ECheq de tercero (endoso)" },
  { value: "TARJETA_CREDITO", label: "Tarjeta de crédito" },
  { value: "TARJETA_DEBITO", label: "Tarjeta de débito" },
  { value: "TARJETA_PREPAGA", label: "Tarjeta prepaga" },
  { value: "EFECTIVO", label: "Efectivo" },
] as const

const TIPOS_TARJETA: Record<string, string> = {
  TARJETA_CREDITO: "CREDITO",
  TARJETA_DEBITO: "DEBITO",
  TARJETA_PREPAGA: "PREPAGA",
}

/**
 * RegistrarPagoProveedorClient: RegistrarPagoProveedorClientProps -> JSX.Element
 *
 * Flujo de 3 pasos para registrar un pago a proveedor con múltiples métodos.
 * Maneja: validaciones, efectos secundarios según tipo, confirmación sin comprobante.
 */
export function RegistrarPagoProveedorClient({
  proveedores,
  cuentas,
  cuentasChequera,
  tarjetas,
  chequesEnCartera,
}: RegistrarPagoProveedorClientProps) {
  // Paso 1: proveedor seleccionado
  const [proveedorId, setProveedorId] = useState("")
  // Paso 2: factura seleccionada
  const [facturasPendientes, setFacturasPendientes] = useState<FacturaPendiente[] | null>(null)
  const [cargandoFacturas, setCargandoFacturas] = useState(false)
  const [facturaSeleccionada, setFacturaSeleccionada] = useState<FacturaPendiente | null>(null)
  // Paso 3: formulario de pago
  const [fechaPago, setFechaPago] = useState(new Date().toISOString().slice(0, 10))
  const [monto, setMonto] = useState("")
  const [tipoPago, setTipoPago] = useState("TRANSFERENCIA")
  const [observaciones, setObservaciones] = useState("")
  const [cuentaId, setCuentaId] = useState("")
  const [chequeRecibidoId, setChequeRecibidoId] = useState("")
  const [tarjetaId, setTarjetaId] = useState("")
  const [comprobantePdfS3Key, setComprobantePdfS3Key] = useState("")
  const [chequeNro, setChequeNro] = useState("")
  const [chequeFechaPago, setChequeFechaPago] = useState("")
  const [chequeNroDoc, setChequeNroDoc] = useState("")
  // Resumen tarjeta info
  const [resumenInfo, setResumenInfo] = useState<ResumenInfo | null>(null)
  const [cargandoResumen, setCargandoResumen] = useState(false)
  // Estado de envío
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState("")
  const [exito, setExito] = useState(false)
  // Modal confirmación sin comprobante
  const [modalSinComprobante, setModalSinComprobante] = useState(false)

  const proveedor = proveedores.find((p) => p.id === proveedorId)

  // Requiere comprobante PDF
  const requiereComprobante = [
    "TRANSFERENCIA",
    "CHEQUE_PROPIO",
    "CHEQUE_FISICO_TERCERO",
    "CHEQUE_ELECTRONICO_TERCERO",
  ].includes(tipoPago)

  const esTarjeta = ["TARJETA_CREDITO", "TARJETA_DEBITO", "TARJETA_PREPAGA"].includes(tipoPago)

  // Filtrar cheques según tipo
  const chequesFiltrados = chequesEnCartera.filter((c) => {
    if (tipoPago === "CHEQUE_FISICO_TERCERO") return !c.esElectronico
    if (tipoPago === "CHEQUE_ELECTRONICO_TERCERO") return c.esElectronico
    return false
  })

  // Filtrar tarjetas según tipo de pago
  const tarjetasFiltradas = tarjetas.filter(
    (t) => t.tipo === (TIPOS_TARJETA[tipoPago] ?? "")
  )

  // Al seleccionar proveedor: cargar facturas pendientes
  async function seleccionarProveedor(id: string) {
    setProveedorId(id)
    setFacturaSeleccionada(null)
    setFacturasPendientes(null)
    resetFormPago()
    if (!id) return
    setCargandoFacturas(true)
    const r = await fetch(`/api/proveedores/${id}/facturas-pendientes`)
    const d = await r.json()
    setFacturasPendientes(Array.isArray(d) ? d : [])
    setCargandoFacturas(false)
  }

  // Al seleccionar factura: precargar monto = saldo pendiente
  function seleccionarFactura(f: FacturaPendiente) {
    setFacturaSeleccionada(f)
    setMonto(f.saldoPendiente.toFixed(2))
    setError("")
    resetFormPago()
  }

  function resetFormPago() {
    setTipoPago("TRANSFERENCIA")
    setObservaciones("")
    setCuentaId("")
    setChequeRecibidoId("")
    setTarjetaId("")
    setComprobantePdfS3Key("")
    setChequeNro("")
    setChequeFechaPago("")
    setChequeNroDoc("")
    setResumenInfo(null)
    setError("")
  }

  // Al cambiar tarjetaId + fecha: verificar resumen del mes
  async function verificarResumenTarjeta(tId: string, fecha: string) {
    if (!tId || !fecha) return
    const periodo = fecha.slice(0, 7) // YYYY-MM
    setCargandoResumen(true)
    const r = await fetch(`/api/tarjetas/${tId}/resumenes`)
    const d = await r.json()
    const resumenes: Array<{ id: string; periodo: string; s3Key: string | null }> = Array.isArray(d) ? d : []
    const resumen = resumenes.find((rs) => rs.periodo === periodo)
    if (resumen) {
      setResumenInfo({
        existe: true,
        tienePdf: !!resumen.s3Key,
        periodo,
        id: resumen.id,
        s3Key: resumen.s3Key,
      })
    } else {
      setResumenInfo({ existe: false, tienePdf: false, periodo })
    }
    setCargandoResumen(false)
  }

  function handleTarjetaChange(tId: string) {
    setTarjetaId(tId)
    if (tId && fechaPago) verificarResumenTarjeta(tId, fechaPago)
  }

  function handleFechaChange(f: string) {
    setFechaPago(f)
    if (tarjetaId && esTarjeta && f) verificarResumenTarjeta(tarjetaId, f)
  }

  // Preparar payload y enviar
  async function enviarPago() {
    setError("")
    setGuardando(true)
    const body = {
      facturaProveedorId: facturaSeleccionada!.id,
      fecha: new Date(fechaPago + "T12:00:00Z").toISOString(),
      monto: parseFloat(monto),
      tipo: tipoPago,
      observaciones: observaciones || null,
      comprobantePdfS3Key: comprobantePdfS3Key || null,
      cuentaId: cuentaId || null,
      chequeRecibidoId: chequeRecibidoId || null,
      tarjetaId: tarjetaId || null,
      chequeNro: chequeNro || null,
      chequeFechaPago: chequeFechaPago ? new Date(chequeFechaPago + "T12:00:00Z").toISOString() : null,
      chequeNroDocBeneficiario: chequeNroDoc || null,
    }
    const res = await fetch(`/api/proveedores/${proveedorId}/pago`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    setGuardando(false)
    if (res.ok) {
      setExito(true)
      setFacturaSeleccionada(null)
      setFacturasPendientes(null)
      setProveedorId("")
      resetFormPago()
      setMonto("")
    } else {
      const d = await res.json()
      setError(d.error ?? "Error al registrar pago")
    }
  }

  // Validar antes de confirmar
  function confirmarPago() {
    setError("")
    if (!facturaSeleccionada) { setError("Seleccioná una factura"); return }
    if (!monto || parseFloat(monto) <= 0) { setError("Ingresá un monto válido"); return }
    if (parseFloat(monto) > facturaSeleccionada.saldoPendiente + 0.01) {
      setError(`El monto excede el saldo pendiente (${formatearMoneda(facturaSeleccionada.saldoPendiente)})`)
      return
    }
    if (tipoPago === "TRANSFERENCIA" && !cuentaId) { setError("Seleccioná la cuenta de origen"); return }
    if (tipoPago === "CHEQUE_PROPIO" && !cuentaId) { setError("Seleccioná la cuenta/chequera"); return }
    if ((tipoPago === "CHEQUE_FISICO_TERCERO" || tipoPago === "CHEQUE_ELECTRONICO_TERCERO") && !chequeRecibidoId) {
      setError("Seleccioná el cheque a endosar")
      return
    }
    if (esTarjeta && !tarjetaId) { setError("Seleccioná la tarjeta"); return }

    // Mostrar modal si requiere comprobante y no hay PDF
    if (requiereComprobante && !comprobantePdfS3Key) {
      setModalSinComprobante(true)
      return
    }
    void enviarPago()
  }

  if (exito) {
    return (
      <div className="space-y-4 max-w-2xl">
        <h2 className="text-2xl font-bold tracking-tight">Registrar Pago a Proveedor</h2>
        <div className="rounded-lg border border-green-200 bg-green-50 p-6 text-center space-y-3">
          <p className="text-green-700 font-semibold text-lg">✓ Pago registrado correctamente</p>
          <Button onClick={() => setExito(false)}>Registrar otro pago</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Registrar Pago a Proveedor</h2>
        <p className="text-muted-foreground">Registrá un pago contra una factura pendiente.</p>
      </div>

      {/* Paso 1: Seleccionar proveedor */}
      <section className="space-y-3">
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
          1. Proveedor
        </h3>
        <SearchCombobox
          items={proveedores.map((p) => ({ id: p.id, label: p.razonSocial, sublabel: p.cuit }))}
          value={proveedorId}
          onChange={seleccionarProveedor}
          placeholder="Buscar proveedor..."
        />
      </section>

      {/* Paso 2: Seleccionar factura */}
      {proveedorId && (
        <section className="space-y-3">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            2. Factura a pagar
          </h3>
          {cargandoFacturas ? (
            <p className="text-muted-foreground text-sm">Cargando facturas...</p>
          ) : facturasPendientes && facturasPendientes.length === 0 ? (
            <p className="text-muted-foreground text-sm">Sin facturas pendientes de pago.</p>
          ) : (
            <div className="border rounded overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left px-3 py-2">Fecha</th>
                    <th className="text-left px-3 py-2">Comprobante</th>
                    <th className="text-left px-3 py-2">Concepto</th>
                    <th className="text-right px-3 py-2">Total</th>
                    <th className="text-right px-3 py-2">Pagado</th>
                    <th className="text-right px-3 py-2">Saldo</th>
                    <th className="text-center px-3 py-2">PDF</th>
                  </tr>
                </thead>
                <tbody>
                  {(facturasPendientes ?? []).map((f) => (
                    <tr
                      key={f.id}
                      onClick={() => seleccionarFactura(f)}
                      className={`border-t cursor-pointer hover:bg-muted/50 ${
                        facturaSeleccionada?.id === f.id ? "bg-primary/5 border-l-2 border-l-primary" : ""
                      }`}
                    >
                      <td className="px-3 py-2 whitespace-nowrap">{formatearFecha(f.fechaCbte)}</td>
                      <td className="px-3 py-2 font-mono text-xs">{f.tipoCbte} {f.nroComprobante}</td>
                      <td className="px-3 py-2 text-muted-foreground text-xs">{f.concepto ?? "-"}</td>
                      <td className="px-3 py-2 text-right">{formatearMoneda(f.total)}</td>
                      <td className="px-3 py-2 text-right text-muted-foreground">{formatearMoneda(f.totalPagado)}</td>
                      <td className="px-3 py-2 text-right font-semibold text-destructive">
                        {formatearMoneda(f.saldoPendiente)}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <ViewPDF s3Key={f.pdfS3Key} size="sm" label="Ver" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* Paso 3: Formulario de pago */}
      {facturaSeleccionada && (
        <section className="space-y-4">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            3. Datos del pago
          </h3>

          <div className="rounded-md border bg-muted/30 px-4 py-2 text-sm">
            Factura <strong>{facturaSeleccionada.tipoCbte} {facturaSeleccionada.nroComprobante}</strong>
            {" · "}Saldo pendiente:{" "}
            <strong className="text-destructive">{formatearMoneda(facturaSeleccionada.saldoPendiente)}</strong>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Fecha de pago</Label>
              <Input type="date" value={fechaPago} onChange={(e) => handleFechaChange(e.target.value)} />
            </div>
            <div>
              <Label>Monto a pagar</Label>
              <Input
                type="number"
                step="0.01"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label>Método de pago</Label>
            <Select
              value={tipoPago}
              onChange={(e) => { setTipoPago(e.target.value); setChequeRecibidoId(""); setTarjetaId(""); setCuentaId(""); setComprobantePdfS3Key(""); setResumenInfo(null) }}
            >
              {TIPOS_PAGO.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </Select>
          </div>

          {/* Campos condicionales según tipo */}

          {tipoPago === "TRANSFERENCIA" && (
            <div>
              <Label>Cuenta de origen</Label>
              <Select value={cuentaId} onChange={(e) => setCuentaId(e.target.value)}>
                <option value="">— Seleccioná cuenta —</option>
                {cuentas.map((c) => <option key={c.id} value={c.id}>{c.nombre} ({c.tipo})</option>)}
              </Select>
            </div>
          )}

          {tipoPago === "CHEQUE_PROPIO" && (
            <>
              <div>
                <Label>Cuenta / Chequera</Label>
                <Select value={cuentaId} onChange={(e) => setCuentaId(e.target.value)}>
                  <option value="">— Seleccioná chequera —</option>
                  {cuentasChequera.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Nro. cheque (opcional)</Label>
                  <Input value={chequeNro} onChange={(e) => setChequeNro(e.target.value)} placeholder="000123" />
                </div>
                <div>
                  <Label>Fecha de pago del cheque</Label>
                  <Input type="date" value={chequeFechaPago} onChange={(e) => setChequeFechaPago(e.target.value)} />
                </div>
              </div>
              <div>
                <Label>CUIT/CUIL beneficiario (opcional)</Label>
                <Input value={chequeNroDoc} onChange={(e) => setChequeNroDoc(e.target.value)} placeholder="30-12345678-9" />
              </div>
            </>
          )}

          {(tipoPago === "CHEQUE_FISICO_TERCERO" || tipoPago === "CHEQUE_ELECTRONICO_TERCERO") && (
            <div>
              <Label>
                Cheque a endosar {tipoPago === "CHEQUE_FISICO_TERCERO" ? "(físicos en cartera)" : "(ECheqs en cartera)"}
              </Label>
              <div className="mt-1 border rounded overflow-auto max-h-48">
                {chequesFiltrados.length === 0 ? (
                  <p className="px-3 py-3 text-sm text-muted-foreground">
                    Sin cheques {tipoPago === "CHEQUE_FISICO_TERCERO" ? "físicos" : "electrónicos"} en cartera.
                  </p>
                ) : (
                  <table className="w-full text-sm">
                    <tbody>
                      {chequesFiltrados.map((c) => (
                        <tr
                          key={c.id}
                          onClick={() => setChequeRecibidoId(c.id)}
                          className={`border-b cursor-pointer hover:bg-muted/50 ${chequeRecibidoId === c.id ? "bg-primary/5" : ""}`}
                        >
                          <td className="px-3 py-2">
                            <span className={`text-xs px-1.5 py-0.5 rounded mr-1 ${c.esElectronico ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"}`}>
                              {c.esElectronico ? "ECheq" : "Físico"}
                            </span>
                            {c.bancoEmisor} · {c.nroCheque}
                          </td>
                          <td className="px-3 py-2">{c.empresa.razonSocial}</td>
                          <td className="px-3 py-2 text-right font-medium">{formatearMoneda(c.monto)}</td>
                          <td className="px-3 py-2 text-right text-muted-foreground text-xs">{formatearFecha(c.fechaCobro)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {esTarjeta && (
            <div>
              <Label>Tarjeta ({TIPOS_TARJETA[tipoPago] ?? ""})</Label>
              <Select value={tarjetaId} onChange={(e) => handleTarjetaChange(e.target.value)}>
                <option value="">— Seleccioná tarjeta —</option>
                {tarjetasFiltradas.map((t) => (
                  <option key={t.id} value={t.id}>{t.nombre} — {t.banco} •••• {t.ultimos4}</option>
                ))}
              </Select>
              {tarjetaId && !cargandoResumen && resumenInfo && (
                <div className={`mt-2 text-xs rounded px-3 py-2 ${resumenInfo.existe && resumenInfo.tienePdf ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>
                  {resumenInfo.existe && resumenInfo.tienePdf && (
                    <span>✓ Resumen {resumenInfo.periodo} ya cargado. <ViewPDF s3Key={resumenInfo.s3Key} size="sm" label="Ver" /></span>
                  )}
                  {resumenInfo.existe && !resumenInfo.tienePdf && (
                    <span>⚠ El resumen {resumenInfo.periodo} existe pero aún no tiene PDF cargado. Podés cargarlo en Contabilidad → Tarjetas.</span>
                  )}
                  {!resumenInfo.existe && (
                    <span>⚠ No hay resumen de {resumenInfo.periodo} para esta tarjeta. Se creará automáticamente al registrar el pago.</span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Comprobante PDF (solo si requiere) */}
          {requiereComprobante && (
            <div>
              <Label>Comprobante de pago (PDF)</Label>
              <UploadPDF
                prefijo="comprobantes-pago-proveedor"
                onUpload={(key) => setComprobantePdfS3Key(key)}
                s3Key={comprobantePdfS3Key || undefined}
              />
            </div>
          )}

          <div>
            <Label>Observaciones (opcional)</Label>
            <Input value={observaciones} onChange={(e) => setObservaciones(e.target.value)} placeholder="Referencia, nota..." />
          </div>

          {error && <FormError message={error} />}

          <Button onClick={confirmarPago} disabled={guardando} className="w-full">
            {guardando ? "Registrando..." : "Registrar pago"}
          </Button>
        </section>
      )}

      {/* Modal confirmación sin comprobante */}
      <Dialog open={modalSinComprobante} onOpenChange={setModalSinComprobante}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Registrar sin comprobante?</DialogTitle>
            <DialogDescription>
              ¿Registrar el pago sin adjuntar un comprobante PDF? Esto puede dificultar la auditoría futura.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setModalSinComprobante(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => { setModalSinComprobante(false); void enviarPago() }}
              disabled={guardando}
            >
              Registrar de todas formas
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
