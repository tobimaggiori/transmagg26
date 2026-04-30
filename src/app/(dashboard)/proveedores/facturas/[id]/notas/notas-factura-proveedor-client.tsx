"use client"

/**
 * Cliente para NC/ND recibidas de una factura de proveedor.
 * Muestra datos de la factura, saldo pendiente y listado de NC/ND asociadas.
 * Permite ingresar una nueva NC/ND con los datos del comprobante del proveedor.
 */

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { formatearMoneda, formatearFecha } from "@/lib/utils"
import { labelTipoNotaCD } from "@/lib/nota-cd-utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ModalIngresarNotaProveedor } from "@/components/modals/modal-ingresar-nota-proveedor"

type NotaCD = {
  id: string
  tipo: string
  subtipo: string | null
  montoNeto: number
  montoIva: number
  montoTotal: number
  percepcionIIBB: number | null
  percepcionIVA: number | null
  percepcionGanancias: number | null
  descripcion: string | null
  motivoDetalle: string | null
  estado: string
  tipoCbte: number | null
  nroComprobanteExterno: string | null
  fechaComprobanteExterno: string | null
  emisorExterno: string | null
  creadoEn: string
  operador: { nombre: string; apellido: string }
}

type FacturaData = {
  id: string
  proveedor: { id: string; razonSocial: string; cuit: string; condicionIva: string }
  nroComprobante: string
  ptoVenta: string | null
  tipoCbte: string
  fechaCbte: string
  neto: number
  ivaMonto: number
  total: number
  estadoPago: string
  saldoPendiente: number
}

export function NotasFacturaProveedorClient({ facturaProveedorId }: { facturaProveedorId: string }) {
  const [factura, setFactura] = useState<FacturaData | null>(null)
  const [notas, setNotas] = useState<NotaCD[]>([])
  const [loading, setLoading] = useState(true)
  const [modalTipo, setModalTipo] = useState<"NC" | "ND" | null>(null)

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/facturas-proveedor/${facturaProveedorId}/notas`)
      if (res.ok) {
        const data = await res.json()
        setFactura(data.factura)
        setNotas(data.notas)
      }
    } finally {
      setLoading(false)
    }
  }, [facturaProveedorId])

  useEffect(() => { cargar() }, [cargar])

  if (loading) return <p className="text-sm text-muted-foreground">Cargando…</p>
  if (!factura) return <p className="text-sm text-destructive">Factura no encontrada.</p>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Notas de Crédito / Débito</h2>
          <p className="text-sm text-muted-foreground">
            Factura {factura.tipoCbte} {factura.ptoVenta ? `${factura.ptoVenta}-` : ""}{factura.nroComprobante} — {factura.proveedor.razonSocial}
          </p>
        </div>
        <Link href="/proveedores/facturas/consultar">
          <Button variant="outline" size="sm">← Volver</Button>
        </Link>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">Fecha</p>
              <p>{formatearFecha(factura.fechaCbte)}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Neto</p>
              <p>{formatearMoneda(factura.neto)}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Total</p>
              <p className="font-semibold">{formatearMoneda(factura.total)}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Saldo pendiente</p>
              <p className={factura.saldoPendiente > 0.01 ? "font-semibold text-destructive" : ""}>
                {factura.saldoPendiente > 0.01 ? formatearMoneda(factura.saldoPendiente) : "—"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button onClick={() => setModalTipo("NC")}>Ingresar NC</Button>
        <Button onClick={() => setModalTipo("ND")} variant="outline">Ingresar ND</Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          {notas.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay notas registradas.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="py-2 pr-3">Fecha cbte</th>
                    <th className="py-2 pr-3">Tipo</th>
                    <th className="py-2 pr-3">Nro</th>
                    <th className="py-2 pr-3 text-right">Neto</th>
                    <th className="py-2 pr-3 text-right">IVA</th>
                    <th className="py-2 pr-3 text-right">Total</th>
                    <th className="py-2 pr-3">Descripción</th>
                    <th className="py-2 pr-3">Operador</th>
                  </tr>
                </thead>
                <tbody>
                  {notas.map((n) => (
                    <tr key={n.id} className="border-b">
                      <td className="py-2 pr-3">{n.fechaComprobanteExterno ? formatearFecha(n.fechaComprobanteExterno) : "—"}</td>
                      <td className="py-2 pr-3">{labelTipoNotaCD(n.tipo)}</td>
                      <td className="py-2 pr-3 font-mono text-xs">{n.nroComprobanteExterno ?? "—"}</td>
                      <td className="py-2 pr-3 text-right">{formatearMoneda(n.montoNeto)}</td>
                      <td className="py-2 pr-3 text-right">{formatearMoneda(n.montoIva)}</td>
                      <td className="py-2 pr-3 text-right font-semibold">{formatearMoneda(n.montoTotal)}</td>
                      <td className="py-2 pr-3">{n.descripcion ?? "—"}</td>
                      <td className="py-2 pr-3 text-xs">{n.operador.apellido}, {n.operador.nombre}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {modalTipo && (
        <ModalIngresarNotaProveedor
          facturaProveedorId={factura.id}
          proveedorRazonSocial={factura.proveedor.razonSocial}
          tipoNota={modalTipo}
          tipoCbteFactura={factura.tipoCbte}
          onClose={() => setModalTipo(null)}
          onSuccess={() => { setModalTipo(null); cargar() }}
        />
      )}
    </div>
  )
}
