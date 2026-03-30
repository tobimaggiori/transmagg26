"use client"

/**
 * Componente cliente para la página de operatoria de proveedores.
 * Maneja el estado de búsqueda y el dialog de ingreso de facturas.
 */

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { FacturaProveedorForm } from "@/components/forms/factura-proveedor-form"
import { formatearCuit, formatearMoneda } from "@/lib/utils"
import { Search, FileText } from "lucide-react"

export interface ProveedorOp {
  id: string
  razonSocial: string
  cuit: string
  condicionIva: string
  rubro: string | null
  cantFacturas: number
  deudaTotal: number
}

interface ProveedoresClientProps {
  proveedores: ProveedorOp[]
}

/**
 * calcularFiltroProveedorOp: ProveedorOp string -> boolean
 *
 * Dado un proveedor y texto de búsqueda, devuelve true si la razón social
 * o el CUIT contienen el texto (insensible a mayúsculas).
 * Existe para filtrar la lista en el cliente sin roundtrips al servidor.
 *
 * Ejemplos:
 * calcularFiltroProveedorOp({ razonSocial: "Gas SA", cuit: "30111222333", ... }, "gas") === true
 * calcularFiltroProveedorOp({ razonSocial: "Gas SA", cuit: "30111222333", ... }, "301") === true
 * calcularFiltroProveedorOp({ razonSocial: "Gas SA", cuit: "30111222333", ... }, "xyz") === false
 */
export function calcularFiltroProveedorOp(proveedor: Pick<ProveedorOp, "razonSocial" | "cuit">, busqueda: string): boolean {
  const q = busqueda.toLowerCase()
  return proveedor.razonSocial.toLowerCase().includes(q) || proveedor.cuit.includes(q)
}

/**
 * ProveedoresClient: ProveedoresClientProps -> JSX.Element
 *
 * Dado el listado de proveedores, renderiza la lista con buscador y botón
 * "Ingresar factura" por cada proveedor. Sin botones de crear/editar/eliminar
 * (esos están en /abm?tab=proveedores).
 * Existe para la operatoria diaria de carga de facturas de proveedores.
 *
 * Ejemplos:
 * <ProveedoresClient proveedores={[{ id:"p1", razonSocial:"Gas SA", ... }]} />
 * // => lista con buscador + "Gas SA" + botón "Ingresar factura"
 * <ProveedoresClient proveedores={[]} />
 * // => mensaje "No hay proveedores registrados"
 */
export function ProveedoresClient({ proveedores }: ProveedoresClientProps) {
  const [busqueda, setBusqueda] = useState("")
  const [dialogFactura, setDialogFactura] = useState<ProveedorOp | null>(null)

  const filtrados = busqueda
    ? proveedores.filter((p) => calcularFiltroProveedorOp(p, busqueda))
    : proveedores

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar por razón social o CUIT..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full h-10 pl-9 pr-4 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {filtrados.length === 0 ? (
        <p className="text-center py-8 text-muted-foreground">
          {busqueda ? "Sin resultados para la búsqueda." : "No hay proveedores registrados."}
        </p>
      ) : (
        <div className="border rounded-lg divide-y">
          {filtrados.map((p) => (
            <div key={p.id} className="flex items-center justify-between px-4 py-3">
              <div className="flex-1 min-w-0">
                <p className="font-medium">{p.razonSocial}</p>
                <p className="text-sm text-muted-foreground">
                  CUIT: {formatearCuit(p.cuit)}
                  {p.rubro ? ` · ${p.rubro}` : ""}
                  {" · "}{p.cantFacturas} factura(s)
                  {p.deudaTotal > 0 && (
                    <span className="ml-2 font-medium text-destructive">
                      Saldo: {formatearMoneda(p.deudaTotal)}
                    </span>
                  )}
                </p>
              </div>
              <button
                onClick={() => setDialogFactura(p)}
                className="ml-4 flex items-center gap-1.5 h-8 px-3 rounded-md border text-sm font-medium hover:bg-accent shrink-0"
              >
                <FileText className="h-3.5 w-3.5" />
                Ingresar factura
              </button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!dialogFactura} onOpenChange={(o) => { if (!o) setDialogFactura(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ingresar factura — {dialogFactura?.razonSocial}</DialogTitle>
            <DialogDescription>
              Registrá la factura del proveedor. Genera asiento IVA Compras automáticamente.
            </DialogDescription>
          </DialogHeader>
          {dialogFactura && (
            <FacturaProveedorForm
              proveedorId={dialogFactura.id}
              onSuccess={() => setDialogFactura(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
