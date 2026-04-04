"use client"

/**
 * Propósito: Componente client mejorado para cuentas corrientes.
 * Añade buscador, panel lateral con detalle y registro de pagos.
 */

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { FormError } from "@/components/ui/form-error"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { formatearMoneda, formatearFecha, formatearCuit } from "@/lib/utils"
import { parsearImporte } from "@/lib/money"
import { Plus, Printer } from "lucide-react"

interface FacturaImpaga {
  id: string
  nroComprobante: string | null
  tipoCbte: number
  total: number
  ivaMonto: number
  estado: string
  emitidaEn: Date | string
  saldo: number
}

interface LiquidacionImpaga {
  id: string
  total: number
  neto: number
  estado: string
  grabadaEn: Date | string
  saldo: number
}

interface DeudaEmpresa {
  empresa: { id: string; razonSocial: string; cuit: string }
  saldoDeudor: number
  facturasImpagas: FacturaImpaga[]
  totalFacturado: number
}

interface DeudaFletero {
  fletero: { id: string; razonSocial: string; cuit: string }
  saldoAPagar: number
  liquidacionesImpagas: LiquidacionImpaga[]
  totalLiquidado: number
}

interface CuentasCorrientesClientProps {
  totalDeudaEmpresas: number
  totalDeudaFleteros: number
  deudaEmpresas: DeudaEmpresa[]
  deudaFleteros: DeudaFletero[]
}

/**
 * CuentasCorrientesClient: CuentasCorrientesClientProps -> JSX.Element
 *
 * Dado los datos de deudas de empresas y fleteros, renderiza la vista mejorada con
 * búsqueda, panel lateral con detalle y modales para registrar pagos.
 * Existe para agregar interactividad client-side a la página de cuentas corrientes.
 *
 * Ejemplos:
 * <CuentasCorrientesClient deudaEmpresas={[]} deudaFleteros={[]} totalDeudaEmpresas={0} totalDeudaFleteros={0} />
 * <CuentasCorrientesClient deudaEmpresas={deudas} ... /> // buscador filtra por nombre/CUIT
 * <CuentasCorrientesClient ... /> // click en empresa → panel lateral con facturas
 */
export function CuentasCorrientesClient({
  totalDeudaEmpresas,
  totalDeudaFleteros,
  deudaEmpresas,
  deudaFleteros,
}: CuentasCorrientesClientProps) {
  const [busqueda, setBusqueda] = useState("")
  const [seccion, setSeccion] = useState<"empresas" | "fleteros">("empresas")
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState<string | null>(null)
  const [fleteroSeleccionado, setFleteroSeleccionado] = useState<string | null>(null)
  const [modalPagoEmpresa, setModalPagoEmpresa] = useState(false)
  const [modalPagoFletero, setModalPagoFletero] = useState(false)
  const [formPago, setFormPago] = useState({ monto: "", tipo: "TRANSFERENCIA", referencia: "", fecha: new Date().toISOString().slice(0, 10) })
  const [error, setError] = useState("")
  const [guardando, setGuardando] = useState(false)

  const empresasFiltradas = deudaEmpresas.filter((e) =>
    !busqueda ||
    e.empresa.razonSocial.toLowerCase().includes(busqueda.toLowerCase()) ||
    e.empresa.cuit.includes(busqueda)
  )

  const fleterosFiltrados = deudaFleteros.filter((f) =>
    !busqueda ||
    f.fletero.razonSocial.toLowerCase().includes(busqueda.toLowerCase()) ||
    f.fletero.cuit.includes(busqueda)
  )

  const empresaDetalle = deudaEmpresas.find(e => e.empresa.id === empresaSeleccionada)
  const fleteroDetalle = deudaFleteros.find(f => f.fletero.id === fleteroSeleccionado)

  async function guardarPagoEmpresa() {
    if (!empresaSeleccionada) return
    setError("")
    setGuardando(true)
    const res = await fetch("/api/cuentas-corrientes/empresas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ empresaId: empresaSeleccionada, monto: parsearImporte(formPago.monto), tipo: formPago.tipo, referencia: formPago.referencia || null, fecha: formPago.fecha }),
    })
    setGuardando(false)
    if (res.ok) {
      setModalPagoEmpresa(false)
      window.location.reload()
    } else {
      const d = await res.json()
      setError(d.error ?? "Error al registrar pago")
    }
  }

  async function guardarPagoFletero() {
    if (!fleteroSeleccionado) return
    setError("")
    setGuardando(true)
    const res = await fetch("/api/cuentas-corrientes/fleteros", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fleteroId: fleteroSeleccionado, monto: parsearImporte(formPago.monto), tipo: formPago.tipo, referencia: formPago.referencia || null, fecha: formPago.fecha }),
    })
    setGuardando(false)
    if (res.ok) {
      setModalPagoFletero(false)
      window.location.reload()
    } else {
      const d = await res.json()
      setError(d.error ?? "Error al registrar pago")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Cuentas Corrientes</h2>
          <p className="text-muted-foreground">Posición financiera: cuentas por cobrar y cuentas por pagar</p>
        </div>
        <Button variant="outline" onClick={() => window.print()}>
          <Printer className="h-4 w-4 mr-1" /> Imprimir
        </Button>
      </div>

      {/* Resumen */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total a cobrar (Empresas)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-destructive">{formatearMoneda(totalDeudaEmpresas)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {deudaEmpresas.filter(e => e.saldoDeudor > 0).length} empresa(s) con saldo pendiente
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total a pagar (Fleteros)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-orange-600">{formatearMoneda(totalDeudaFleteros)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {deudaFleteros.filter(f => f.saldoAPagar > 0).length} fletero(s) con liquidaciones sin pagar
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs y buscador */}
      <div className="flex items-center gap-4">
        <div className="flex border-b">
          <button
            onClick={() => { setSeccion("empresas"); setBusqueda("") }}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${seccion === "empresas" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            Empresas
          </button>
          <button
            onClick={() => { setSeccion("fleteros"); setBusqueda("") }}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${seccion === "fleteros" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            Fleteros
          </button>
        </div>
        <Input
          placeholder={`Buscar ${seccion === "empresas" ? "empresa" : "fletero"}...`}
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="max-w-xs"
        />
      </div>

      {/* Layout columnas */}
      {seccion === "empresas" && (
        <div className="grid grid-cols-5 gap-4">
          <div className="col-span-2 space-y-2">
            {empresasFiltradas.filter(e => e.saldoDeudor > 0).map((e) => (
              <div
                key={e.empresa.id}
                onClick={() => setEmpresaSeleccionada(e.empresa.id)}
                className={`border rounded p-3 cursor-pointer hover:border-primary ${empresaSeleccionada === e.empresa.id ? "border-primary bg-primary/5" : ""}`}
              >
                <p className="font-medium text-sm">{e.empresa.razonSocial}</p>
                <p className="text-xs text-muted-foreground">CUIT: {formatearCuit(e.empresa.cuit)}</p>
                <p className="text-base font-bold text-destructive mt-1">{formatearMoneda(e.saldoDeudor)}</p>
              </div>
            ))}
            {empresasFiltradas.filter(e => e.saldoDeudor > 0).length === 0 && (
              <p className="text-muted-foreground text-sm">Sin deudas pendientes.</p>
            )}
          </div>
          <div className="col-span-3">
            {!empresaDetalle ? (
              <p className="text-muted-foreground">Seleccioná una empresa para ver el detalle.</p>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{empresaDetalle.empresa.razonSocial}</h3>
                  <Button size="sm" onClick={() => { setFormPago({ monto: "", tipo: "TRANSFERENCIA", referencia: "", fecha: new Date().toISOString().slice(0,10) }); setModalPagoEmpresa(true) }}>
                    <Plus className="h-4 w-4 mr-1" /> Registrar pago
                  </Button>
                </div>
                <div className="border rounded overflow-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50"><tr><th className="text-left px-3 py-2">Comprobante</th><th className="text-left px-3 py-2">Estado</th><th className="text-right px-3 py-2">Total</th><th className="text-right px-3 py-2">Saldo</th></tr></thead>
                    <tbody>
                      {empresaDetalle.facturasImpagas.map((f) => (
                        <tr key={f.id} className="border-t">
                          <td className="px-3 py-2">{f.tipoCbte} {f.nroComprobante ?? ""} <span className="text-muted-foreground text-xs">({formatearFecha(f.emitidaEn)})</span></td>
                          <td className="px-3 py-2"><span className="text-xs bg-muted px-1.5 py-0.5 rounded">{f.estado}</span></td>
                          <td className="px-3 py-2 text-right">{formatearMoneda(f.total)}</td>
                          <td className="px-3 py-2 text-right font-semibold text-destructive">{formatearMoneda(f.saldo)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {seccion === "fleteros" && (
        <div className="grid grid-cols-5 gap-4">
          <div className="col-span-2 space-y-2">
            {fleterosFiltrados.filter(f => f.saldoAPagar > 0).map((f) => (
              <div
                key={f.fletero.id}
                onClick={() => setFleteroSeleccionado(f.fletero.id)}
                className={`border rounded p-3 cursor-pointer hover:border-primary ${fleteroSeleccionado === f.fletero.id ? "border-primary bg-primary/5" : ""}`}
              >
                <p className="font-medium text-sm">{f.fletero.razonSocial}</p>
                <p className="text-xs text-muted-foreground">CUIT: {formatearCuit(f.fletero.cuit)}</p>
                <p className="text-base font-bold text-orange-600 mt-1">{formatearMoneda(f.saldoAPagar)}</p>
              </div>
            ))}
            {fleterosFiltrados.filter(f => f.saldoAPagar > 0).length === 0 && (
              <p className="text-muted-foreground text-sm">Sin pagos pendientes.</p>
            )}
          </div>
          <div className="col-span-3">
            {!fleteroDetalle ? (
              <p className="text-muted-foreground">Seleccioná un fletero para ver el detalle.</p>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{fleteroDetalle.fletero.razonSocial}</h3>
                  <Button size="sm" onClick={() => { setFormPago({ monto: "", tipo: "TRANSFERENCIA", referencia: "", fecha: new Date().toISOString().slice(0,10) }); setModalPagoFletero(true) }}>
                    <Plus className="h-4 w-4 mr-1" /> Registrar pago
                  </Button>
                </div>
                <div className="border rounded overflow-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50"><tr><th className="text-left px-3 py-2">Fecha</th><th className="text-left px-3 py-2">Estado</th><th className="text-right px-3 py-2">Total</th><th className="text-right px-3 py-2">Saldo</th></tr></thead>
                    <tbody>
                      {fleteroDetalle.liquidacionesImpagas.map((l) => (
                        <tr key={l.id} className="border-t">
                          <td className="px-3 py-2">{formatearFecha(l.grabadaEn)}</td>
                          <td className="px-3 py-2"><span className="text-xs bg-muted px-1.5 py-0.5 rounded">{l.estado}</span></td>
                          <td className="px-3 py-2 text-right">{formatearMoneda(l.total)}</td>
                          <td className="px-3 py-2 text-right font-semibold text-orange-600">{formatearMoneda(l.saldo)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal pago empresa */}
      <Dialog open={modalPagoEmpresa} onOpenChange={setModalPagoEmpresa}>
        <DialogContent>
          <DialogHeader><DialogTitle>Registrar pago de empresa</DialogTitle><DialogDescription>{empresaDetalle?.empresa.razonSocial}</DialogDescription></DialogHeader>
          <div className="space-y-3">
            <div><Label>Monto</Label><Input type="number" value={formPago.monto} onChange={(e) => setFormPago(f => ({ ...f, monto: e.target.value }))} /></div>
            <div><Label>Tipo</Label>
              <Select value={formPago.tipo} onChange={(e) => setFormPago(f => ({ ...f, tipo: e.target.value }))}>
                <option value="TRANSFERENCIA">TRANSFERENCIA</option>
                <option value="CHEQUE">CHEQUE</option>
                <option value="EFECTIVO">EFECTIVO</option>
              </Select>
            </div>
            <div><Label>Referencia</Label><Input value={formPago.referencia} onChange={(e) => setFormPago(f => ({ ...f, referencia: e.target.value }))} /></div>
            <div><Label>Fecha</Label><Input type="date" value={formPago.fecha} onChange={(e) => setFormPago(f => ({ ...f, fecha: e.target.value }))} /></div>
            {error && <FormError message={error} />}
          </div>
          <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setModalPagoEmpresa(false)}>Cancelar</Button><Button onClick={guardarPagoEmpresa} disabled={guardando}>Guardar</Button></div>
        </DialogContent>
      </Dialog>

      {/* Modal pago fletero */}
      <Dialog open={modalPagoFletero} onOpenChange={setModalPagoFletero}>
        <DialogContent>
          <DialogHeader><DialogTitle>Registrar pago a fletero</DialogTitle><DialogDescription>{fleteroDetalle?.fletero.razonSocial}</DialogDescription></DialogHeader>
          <div className="space-y-3">
            <div><Label>Monto</Label><Input type="number" value={formPago.monto} onChange={(e) => setFormPago(f => ({ ...f, monto: e.target.value }))} /></div>
            <div><Label>Tipo</Label>
              <Select value={formPago.tipo} onChange={(e) => setFormPago(f => ({ ...f, tipo: e.target.value }))}>
                <option value="TRANSFERENCIA">TRANSFERENCIA</option>
                <option value="CHEQUE">CHEQUE</option>
                <option value="EFECTIVO">EFECTIVO</option>
              </Select>
            </div>
            <div><Label>Referencia</Label><Input value={formPago.referencia} onChange={(e) => setFormPago(f => ({ ...f, referencia: e.target.value }))} /></div>
            <div><Label>Fecha</Label><Input type="date" value={formPago.fecha} onChange={(e) => setFormPago(f => ({ ...f, fecha: e.target.value }))} /></div>
            {error && <FormError message={error} />}
          </div>
          <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setModalPagoFletero(false)}>Cancelar</Button><Button onClick={guardarPagoFletero} disabled={guardando}>Guardar</Button></div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
