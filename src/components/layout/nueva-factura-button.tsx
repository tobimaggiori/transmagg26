"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { FacturaForm } from "@/components/forms/factura-form"

interface ViajeDisponible {
  id: string
  fechaViaje: string | Date
  remito?: string | null
  mercaderia?: string | null
  provinciaOrigen?: string | null
  provinciaDestino?: string | null
  kilos?: number | null
  tarifaEmpresa: number
  empresaId: string
  fletero: { razonSocial: string }
  camion: { patenteChasis: string }
  chofer: { nombre: string; apellido: string }
}

interface Props {
  empresas: Array<{ id: string; razonSocial: string }>
  viajesPendientes: ViajeDisponible[]
}

/**
 * NuevaFacturaButton: Props -> JSX.Element
 *
 * Dadas las empresas y los viajes en estado PENDIENTE,
 * renderiza un botón que abre un Dialog con el formulario de nueva factura.
 * Existe para encapsular el modal de facturación, pasando a FacturaForm
 * los viajes pendientes que el usuario podrá seleccionar y tarifar.
 *
 * Ejemplos:
 * <NuevaFacturaButton empresas={[{ id: "e1", razonSocial: "Alimentos del Sur" }]} viajesPendientes={[...]} />
 * // => botón "Nueva factura" que abre el Dialog con FacturaForm
 * <NuevaFacturaButton empresas={[]} viajesPendientes={[]} />
 * // => botón habilitado aunque sin datos (formulario mostrará listas vacías)
 * // => onSuccess del form → Dialog se cierra y página se refresca
 */
export function NuevaFacturaButton({ empresas, viajesPendientes }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus />
        Nueva factura
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nueva factura emitida</DialogTitle>
            <DialogDescription>
              Seleccioná viajes PENDIENTES de la empresa y asignales la tarifa. La tarifa de empresa es confidencial.
            </DialogDescription>
          </DialogHeader>
          <FacturaForm
            empresas={empresas}
            viajesPendientes={viajesPendientes}
            onSuccess={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
