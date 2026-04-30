"use client"

/**
 * Selector multi-factura de pago a proveedor.
 * Paso 1: elegir proveedor → cargar facturas pendientes.
 * Paso 2: tildar varias → "Continuar con el pago" abre el modal.
 */

import { useState } from "react"
import { SearchCombobox } from "@/components/ui/search-combobox"
import { Button } from "@/components/ui/button"
import { ViewPDF } from "@/components/view-pdf"
import { formatearMoneda, formatearFecha } from "@/lib/utils"
import { sumarImportes } from "@/lib/money"
import { RegistrarPagoProveedorModal } from "@/components/forms/registrar-pago-proveedor-modal"

interface Proveedor { id: string; razonSocial: string; cuit: string }
interface Cuenta { id: string; nombre: string; tipo?: string }
interface ChequeEnCartera {
  id: string
  nroCheque: string
  bancoEmisor: string
  monto: number
  fechaCobro: string
  esElectronico: boolean
  empresa: { razonSocial: string } | null
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
  esPorCuentaDeFletero: boolean
  tipoGastoFletero: string | null
  fleteroId: string | null
}

interface Props {
  proveedores: Proveedor[]
  cuentas: Cuenta[]
  cuentasChequera: Cuenta[]
  chequesEnCartera: ChequeEnCartera[]
}

export function RegistrarPagoProveedorClient({
  proveedores,
  cuentas,
  cuentasChequera,
  chequesEnCartera,
}: Props) {
  const [proveedorId, setProveedorId] = useState("")
  const [facturasPendientes, setFacturasPendientes] = useState<FacturaPendiente[] | null>(null)
  const [cargandoFacturas, setCargandoFacturas] = useState(false)
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set())
  const [pagando, setPagando] = useState(false)
  const [exito, setExito] = useState(false)

  const proveedor = proveedores.find((p) => p.id === proveedorId)

  async function seleccionarProveedor(id: string) {
    setProveedorId(id)
    setFacturasPendientes(null)
    setSeleccionados(new Set())
    if (!id) return
    setCargandoFacturas(true)
    const r = await fetch(`/api/proveedores/${id}/facturas-pendientes`)
    const d = await r.json()
    setFacturasPendientes(Array.isArray(d) ? d : [])
    setCargandoFacturas(false)
  }

  function toggleFactura(id: string) {
    setSeleccionados((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleTodasDeLista(lista: FacturaPendiente[]) {
    const ids = lista.map((f) => f.id)
    const todasSeleccionadas = ids.every((id) => seleccionados.has(id))
    setSeleccionados((prev) => {
      const next = new Set(prev)
      if (todasSeleccionadas) ids.forEach((id) => next.delete(id))
      else ids.forEach((id) => next.add(id))
      return next
    })
  }

  const facturasSeleccionadas = (facturasPendientes ?? []).filter((f) => seleccionados.has(f.id))
  const totalSeleccionado = sumarImportes(facturasSeleccionadas.map((f) => f.saldoPendiente))

  function abrirModal() {
    if (facturasSeleccionadas.length === 0) return
    setPagando(true)
  }

  function cerrarModal() {
    setPagando(false)
  }

  function onPagoExitoso() {
    setPagando(false)
    setExito(true)
    setProveedorId("")
    setFacturasPendientes(null)
    setSeleccionados(new Set())
  }

  if (exito) {
    return (
      <div className="space-y-4 max-w-2xl">
        <h2 className="text-2xl font-bold tracking-tight">Registrar pago a proveedor</h2>
        <div className="rounded-lg border border-green-200 bg-green-50 p-6 text-center space-y-3">
          <p className="text-green-700 font-semibold text-lg">✓ Pago registrado correctamente</p>
          <Button onClick={() => setExito(false)}>Registrar otro pago</Button>
        </div>
      </div>
    )
  }

  const facturas = facturasPendientes ?? []
  const propias = facturas.filter((f) => !f.esPorCuentaDeFletero)
  const fletero = facturas.filter((f) => f.esPorCuentaDeFletero)

  const renderTabla = (lista: FacturaPendiente[], colorHeader?: string) => {
    const ids = lista.map((f) => f.id)
    const todas = ids.length > 0 && ids.every((id) => seleccionados.has(id))
    return (
      <div className="border rounded overflow-auto">
        <table className="w-full text-sm">
          <thead className={colorHeader ?? "bg-muted/50"}>
            <tr>
              <th className="px-3 py-2 w-8">
                <input
                  type="checkbox"
                  checked={todas}
                  onChange={() => toggleTodasDeLista(lista)}
                  aria-label="Seleccionar todas"
                />
              </th>
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
            {lista.map((f) => {
              const checked = seleccionados.has(f.id)
              return (
                <tr
                  key={f.id}
                  onClick={() => toggleFactura(f.id)}
                  className={`border-t cursor-pointer hover:bg-muted/50 ${checked ? "bg-primary/5" : ""}`}
                >
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleFactura(f.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">{formatearFecha(f.fechaCbte)}</td>
                  <td className="px-3 py-2 font-mono text-xs">{f.tipoCbte} {f.nroComprobante}</td>
                  <td className="px-3 py-2 text-muted-foreground text-xs">{f.concepto ?? "-"}</td>
                  <td className="px-3 py-2 text-right">{formatearMoneda(f.total)}</td>
                  <td className="px-3 py-2 text-right text-muted-foreground">{formatearMoneda(f.totalPagado)}</td>
                  <td className="px-3 py-2 text-right font-semibold text-destructive">
                    {formatearMoneda(f.saldoPendiente)}
                  </td>
                  <td className="px-3 py-2 text-center" onClick={(e) => e.stopPropagation()}>
                    <ViewPDF s3Key={f.pdfS3Key} size="sm" label="Ver" />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Registrar pago a proveedor</h2>
      </div>

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

      {proveedorId && (
        <section className="space-y-3">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            2. Facturas a pagar
          </h3>
          {cargandoFacturas ? (
            <p className="text-muted-foreground text-sm">Cargando facturas...</p>
          ) : facturas.length === 0 ? (
            <p className="text-muted-foreground text-sm">Sin facturas pendientes de pago.</p>
          ) : (
            <div className="space-y-4">
              {propias.length > 0 && (
                <div className="space-y-1">
                  {fletero.length > 0 && (
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Facturas propias</p>
                  )}
                  {renderTabla(propias)}
                </div>
              )}
              {fletero.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-blue-700 uppercase tracking-wide">Por cuenta de fletero</p>
                  {renderTabla(fletero, "bg-blue-50/80")}
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {facturasSeleccionadas.length > 0 && (
        <div className="sticky bottom-0 bg-background border-t pt-4 pb-2 flex items-center justify-between">
          <div className="text-sm">
            <span className="text-muted-foreground">
              {facturasSeleccionadas.length} factura(s) seleccionada(s) ·{" "}
            </span>
            <span className="font-semibold">{formatearMoneda(totalSeleccionado)}</span>
          </div>
          <Button onClick={abrirModal}>Continuar con el pago →</Button>
        </div>
      )}

      {pagando && proveedor && (
        <RegistrarPagoProveedorModal
          facturas={facturasSeleccionadas.map((f) => ({
            id: f.id,
            tipoCbte: f.tipoCbte,
            nroComprobante: f.nroComprobante,
            fechaCbte: f.fechaCbte,
            total: f.total,
            totalPagado: f.totalPagado,
            saldoPendiente: f.saldoPendiente,
          }))}
          proveedor={proveedor}
          cuentas={cuentas}
          cuentasChequera={cuentasChequera}
          chequesEnCartera={chequesEnCartera}
          onClose={cerrarModal}
          onSuccess={onPagoExitoso}
        />
      )}
    </div>
  )
}
