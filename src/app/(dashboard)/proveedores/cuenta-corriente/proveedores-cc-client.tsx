"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { formatearMoneda, formatearFecha, formatearCuit } from "@/lib/utils"

type FacturaImpaga = {
  id: string
  nroComprobante: string
  tipoCbte: string
  total: number
  fechaCbte: string | Date
  saldo: number
  esPorCuentaDeFletero?: boolean
  fleteroId?: string | null
}

type SaldoProveedor = {
  proveedor: { id: string; razonSocial: string; cuit: string }
  saldoAPagar: number
  totalFacturado: number
  totalPagado: number
  facturasImpagas: FacturaImpaga[]
  facturasFletero: FacturaImpaga[]
}

type ProveedoresCCClientProps = {
  saldos: SaldoProveedor[]
}

const TIPOS_PAGO = ["TRANSFERENCIA", "CHEQUE_PROPIO", "EFECTIVO"] as const

/**
 * ProveedoresCCClient: ProveedoresCCClientProps -> JSX.Element
 *
 * Dado la lista de saldos de proveedores, muestra dos columnas:
 * izquierda: lista de proveedores con saldo a pagar, con búsqueda.
 * derecha: tabla de facturas impagas del proveedor seleccionado + formulario de pago.
 * Existe para el módulo de cuenta corriente de proveedores en /proveedores/cuenta-corriente.
 *
 * Ejemplos:
 * <ProveedoresCCClient saldos={[{ proveedor: { id, razonSocial, cuit }, saldoAPagar: 50000, facturasImpagas: [...] }]} />
 */
export function ProveedoresCCClient({ saldos: saldosIniciales }: ProveedoresCCClientProps) {
  const [saldos, setSaldos] = useState<SaldoProveedor[]>(saldosIniciales)
  const [busqueda, setBusqueda] = useState("")
  const [seleccionado, setSeleccionado] = useState<SaldoProveedor | null>(null)
  const [dialogAbierto, setDialogAbierto] = useState(false)
  const [monto, setMonto] = useState("")
  const [tipo, setTipo] = useState<string>("TRANSFERENCIA")
  const [referencia, setReferencia] = useState("")
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const saldosFiltrados = saldos.filter((s) =>
    s.proveedor.razonSocial.toLowerCase().includes(busqueda.toLowerCase()) ||
    s.proveedor.cuit.includes(busqueda)
  )

  const totalDeuda = saldos.reduce((acc, s) => acc + s.saldoAPagar, 0)

  const registrarPago = async () => {
    if (!seleccionado) return
    setError(null)
    const montoNum = parseFloat(monto)
    if (isNaN(montoNum) || montoNum <= 0) {
      setError("Ingresá un monto válido")
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/cuentas-corrientes/proveedores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proveedorId: seleccionado.proveedor.id,
          monto: montoNum,
          tipo,
          referencia: referencia || null,
          fecha,
        }),
      })

      if (!res.ok) {
        const data = await res.json() as { error?: string }
        setError(data.error ?? "Error al registrar el pago")
        return
      }

      // Refresh data
      const refreshRes = await fetch("/api/cuentas-corrientes/proveedores")
      if (refreshRes.ok) {
        const nuevos = await refreshRes.json() as SaldoProveedor[]
        setSaldos(nuevos)
        const actualizado = nuevos.find((s) => s.proveedor.id === seleccionado.proveedor.id)
        setSeleccionado(actualizado ?? null)
      }

      setDialogAbierto(false)
      setMonto("")
      setReferencia("")
    } catch {
      setError("Error de conexión")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Cuenta Corriente — Proveedores</h2>
          <p className="text-muted-foreground">Deuda total de Transmagg a proveedores: {formatearMoneda(totalDeuda)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Lista de proveedores */}
        <div className="space-y-3">
          <Input
            placeholder="Buscar proveedor..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          <div className="space-y-2">
            {saldosFiltrados.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Sin proveedores con deuda.</p>
            ) : (
              saldosFiltrados.map((s) => (
                <button
                  key={s.proveedor.id}
                  onClick={() => setSeleccionado(s)}
                  className={`w-full text-left rounded-lg border p-3 transition-colors hover:bg-accent ${seleccionado?.proveedor.id === s.proveedor.id ? "border-primary bg-accent" : ""}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{s.proveedor.razonSocial}</p>
                      <p className="text-xs text-muted-foreground">{formatearCuit(s.proveedor.cuit)}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold text-sm ${s.saldoAPagar > 0 ? "text-destructive" : "text-green-600"}`}>
                        {formatearMoneda(s.saldoAPagar)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {s.facturasImpagas.length} fact. impaga(s)
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Detalle del proveedor seleccionado */}
        {seleccionado ? (
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">{seleccionado.proveedor.razonSocial}</CardTitle>
                  <p className="text-xs text-muted-foreground">{formatearCuit(seleccionado.proveedor.cuit)}</p>
                </div>
                {seleccionado.saldoAPagar > 0 && (
                  <Button size="sm" onClick={() => setDialogAbierto(true)}>
                    Registrar Pago
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-2 text-center text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Facturado</p>
                  <p className="font-semibold">{formatearMoneda(seleccionado.totalFacturado)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Pagado</p>
                  <p className="font-semibold">{formatearMoneda(seleccionado.totalPagado)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Saldo</p>
                  <p className={`font-bold ${seleccionado.saldoAPagar > 0 ? "text-destructive" : "text-green-600"}`}>
                    {formatearMoneda(seleccionado.saldoAPagar)}
                  </p>
                </div>
              </div>

              {seleccionado.facturasImpagas.length === 0 && seleccionado.facturasFletero.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-2">Sin facturas impagas.</p>
              ) : (
                <div className="space-y-3">
                  {seleccionado.facturasImpagas.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Facturas propias impagas</p>
                      {seleccionado.facturasImpagas.map((f) => (
                        <div key={f.id} className="flex items-center justify-between rounded border p-2 text-sm">
                          <div>
                            <p className="font-mono text-xs">{f.tipoCbte} {f.nroComprobante}</p>
                            <p className="text-xs text-muted-foreground">{formatearFecha(String(f.fechaCbte))}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">Total: {formatearMoneda(f.total)}</p>
                            <p className="font-semibold text-destructive">{formatearMoneda(f.saldo)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {seleccionado.facturasFletero.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-blue-700" title="Estas facturas fueron ingresadas desde Fleteros → Ingresar Gasto">Por cuenta de fletero</p>
                      {seleccionado.facturasFletero.map((f) => (
                        <div key={f.id} className="flex items-center justify-between rounded border border-blue-200 bg-blue-50/50 p-2 text-sm">
                          <div>
                            <p className="font-mono text-xs">{f.tipoCbte} {f.nroComprobante}</p>
                            <p className="text-xs text-muted-foreground">{formatearFecha(String(f.fechaCbte))}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">Total: {formatearMoneda(f.total)}</p>
                            <p className="font-semibold text-destructive">{formatearMoneda(f.saldo)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="flex items-center justify-center h-48 text-muted-foreground text-sm">
              Seleccioná un proveedor para ver el detalle.
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dialog de pago */}
      <Dialog open={dialogAbierto} onOpenChange={setDialogAbierto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Pago a {seleccionado?.proveedor.razonSocial}</DialogTitle>
            <DialogDescription>
              Saldo pendiente: {formatearMoneda(seleccionado?.saldoAPagar ?? 0)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="monto-pago">Monto</Label>
              <Input
                id="monto-pago"
                type="number"
                step="0.01"
                min="0"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tipo-pago">Tipo de pago</Label>
              <select
                id="tipo-pago"
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {TIPOS_PAGO.map((t) => (
                  <option key={t} value={t}>{t.replace(/_/g, " ")}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="referencia-pago">Referencia (opcional)</Label>
              <Input
                id="referencia-pago"
                value={referencia}
                onChange={(e) => setReferencia(e.target.value)}
                placeholder="Nro transferencia, cheque, etc."
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fecha-pago">Fecha de pago</Label>
              <Input
                id="fecha-pago"
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setDialogAbierto(false)}>Cancelar</Button>
              <Button onClick={registrarPago} disabled={loading}>
                {loading ? "Guardando..." : "Registrar Pago"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
