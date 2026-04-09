"use client"

/**
 * Propósito: Resumen mensual de cuotas de seguro por tarjeta de crédito.
 * Muestra cuotas del período seleccionado y permite cerrar el resumen.
 */

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { formatearMoneda } from "@/lib/utils"
import { sumarImportes } from "@/lib/money"
import { hoyLocalYmd } from "@/lib/date-local"

interface Tarjeta {
  id: string
  nombre: string
  banco: string
  ultimos4: string
}

interface Cuenta {
  id: string
  nombre: string
  tipo: string
}

interface Cuota {
  id: string
  nroCuota: number
  totalCuotas: number
  monto: number
  mesAnio: string
  estado: string
  facturaSeguro: {
    id: string
    nroComprobante: string
    tipoComprobante: string
    aseguradora: { razonSocial: string }
    polizas: Array<{ id: string; nroPoliza: string }>
  }
  resumenTarjeta?: { id: string; periodo: string; pagado: boolean } | null
}

interface Props {
  tarjetas: Tarjeta[]
  cuentas: Cuenta[]
}

export function ResumenTarjetasClient({ tarjetas, cuentas }: Props) {
  const today = new Date()
  const defaultMes = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`

  const [mesAnio, setMesAnio] = useState(defaultMes)
  const [tarjetaFiltro, setTarjetaFiltro] = useState("")
  const [cuotasPorTarjeta, setCuotasPorTarjeta] = useState<Record<string, Cuota[]>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [modalTarjetaId, setModalTarjetaId] = useState("")
  const [cuentaPagoId, setCuentaPagoId] = useState("")
  const [fechaPago, setFechaPago] = useState(hoyLocalYmd())
  const [pagoLoading, setPagoLoading] = useState(false)
  const [pagoError, setPagoError] = useState<string | null>(null)

  const tarjetasAMostrar = tarjetaFiltro
    ? tarjetas.filter((t) => t.id === tarjetaFiltro)
    : tarjetas

  const cargarCuotas = useCallback(async (tid: string) => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ mesAnio, tarjetaId: tid })
      const res = await fetch(`/api/aseguradoras/cuotas?${params}`)
      if (!res.ok) throw new Error("Error al cargar cuotas")
      const data = await res.json()
      setCuotasPorTarjeta((prev) => ({ ...prev, [tid]: data.cuotas }))
    } catch {
      setError(`Error al cargar cuotas para tarjeta ${tid}`)
    } finally {
      setLoading(false)
    }
  }, [mesAnio])

  useEffect(() => {
    for (const t of tarjetasAMostrar) {
      cargarCuotas(t.id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mesAnio, tarjetaFiltro])

  async function cerrarResumen() {
    if (!cuentaPagoId || !fechaPago) {
      setPagoError("Seleccioná una cuenta y una fecha de pago")
      return
    }

    setPagoLoading(true)
    setPagoError(null)

    try {
      const res = await fetch("/api/aseguradoras/resumen-tarjetas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tarjetaId: modalTarjetaId,
          mesAnio,
          cuentaPagoId,
          fechaPago,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setPagoError(data.error ?? "Error al cerrar resumen")
        return
      }

      setModalOpen(false)
      // Recargar cuotas de esa tarjeta
      await cargarCuotas(modalTarjetaId)
    } catch {
      setPagoError("Error de conexión")
    } finally {
      setPagoLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Resumen de Tarjetas</h2>
        <p className="text-muted-foreground">Cuotas de seguros por tarjeta de crédito</p>
      </div>

      {/* Filtros */}
      <div className="flex gap-4 items-end">
        <div>
          <Label>Período</Label>
          <Input
            type="month"
            value={mesAnio}
            onChange={(e) => setMesAnio(e.target.value)}
            className="w-40"
          />
        </div>
        <div>
          <Label>Tarjeta</Label>
          <select
            className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={tarjetaFiltro}
            onChange={(e) => setTarjetaFiltro(e.target.value)}
          >
            <option value="">Todas las tarjetas</option>
            {tarjetas.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nombre} xxxx{t.ultimos4}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading && <p className="text-sm text-muted-foreground">Cargando...</p>}

      {/* Cards por tarjeta */}
      {tarjetasAMostrar.map((tarjeta) => {
        const cuotas = cuotasPorTarjeta[tarjeta.id] ?? []
        const pendientes = cuotas.filter((c) => c.estado === "PENDIENTE")
        const total = sumarImportes(pendientes.map(c => c.monto))
        const yaCerrado = cuotas.length > 0 && cuotas.every((c) => c.estado === "PAGADA")

        return (
          <div key={tarjeta.id} className="rounded-lg border p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">{tarjeta.nombre}</h3>
                <p className="text-sm text-muted-foreground">
                  {tarjeta.banco} — xxxx{tarjeta.ultimos4}
                </p>
              </div>
              {pendientes.length > 0 && (
                <Button
                  size="sm"
                  onClick={() => {
                    setModalTarjetaId(tarjeta.id)
                    setPagoError(null)
                    setCuentaPagoId("")
                    setFechaPago(hoyLocalYmd())
                    setModalOpen(true)
                  }}
                >
                  Cerrar resumen y registrar pago
                </Button>
              )}
              {yaCerrado && (
                <span className="text-sm text-green-600 font-medium">Resumen cerrado</span>
              )}
            </div>

            {cuotas.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin cuotas para este período</p>
            ) : (
              <>
                <div className="rounded-md border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="px-3 py-2 text-left font-medium">Factura</th>
                        <th className="px-3 py-2 text-left font-medium">Aseguradora</th>
                        <th className="px-3 py-2 text-left font-medium">Póliza</th>
                        <th className="px-3 py-2 text-center font-medium">Cuota</th>
                        <th className="px-3 py-2 text-right font-medium">Monto</th>
                        <th className="px-3 py-2 text-center font-medium">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cuotas.map((cuota) => (
                        <tr key={cuota.id} className="border-b last:border-0">
                          <td className="px-3 py-2">
                            {cuota.facturaSeguro.tipoComprobante} {cuota.facturaSeguro.nroComprobante}
                          </td>
                          <td className="px-3 py-2">{cuota.facturaSeguro.aseguradora.razonSocial}</td>
                          <td className="px-3 py-2">
                            {cuota.facturaSeguro.polizas.map((p) => p.nroPoliza).join(", ") || "—"}
                          </td>
                          <td className="px-3 py-2 text-center">
                            {cuota.nroCuota}/{cuota.totalCuotas}
                          </td>
                          <td className="px-3 py-2 text-right">{formatearMoneda(cuota.monto)}</td>
                          <td className="px-3 py-2 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                cuota.estado === "PAGADA"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-yellow-100 text-yellow-700"
                              }`}
                            >
                              {cuota.estado}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {pendientes.length > 0 && (
                  <div className="text-sm font-medium text-right">
                    Total pendiente: {formatearMoneda(total)}
                  </div>
                )}
              </>
            )}
          </div>
        )
      })}

      {/* Modal cerrar resumen */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cerrar resumen y registrar pago</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label>Cuenta de pago</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={cuentaPagoId}
                onChange={(e) => setCuentaPagoId(e.target.value)}
              >
                <option value="">Seleccionar cuenta</option>
                {cuentas.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre} ({c.tipo})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Fecha de pago</Label>
              <Input
                type="date"
                value={fechaPago}
                onChange={(e) => setFechaPago(e.target.value)}
              />
            </div>

            {pagoError && (
              <div className="rounded-md bg-destructive/10 border border-destructive/30 px-3 py-2 text-sm text-destructive">
                {pagoError}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={cerrarResumen} disabled={pagoLoading}>
                {pagoLoading ? "Procesando..." : "Confirmar pago"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
