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
import { LiquidacionForm } from "@/components/forms/liquidacion-form"

interface ViajeDisponible {
  id: string
  fleteroId: string
  fechaViaje: string | Date
  remito?: string | null
  mercaderia?: string | null
  provinciaOrigen?: string | null
  provinciaDestino?: string | null
  kilos?: number | null
  tarifaFletero: number
  empresa: { razonSocial: string }
  camion: { patenteChasis: string }
  chofer: { nombre: string; apellido: string }
}

interface Props {
  fleteros: Array<{ id: string; razonSocial: string; comisionDefault: number }>
  viajesPendientes: ViajeDisponible[]
}

/**
 * NuevaLiquidacionButton: Props -> JSX.Element
 *
 * Dados los fleteros y los viajes en estado PENDIENTE,
 * renderiza un botón que abre un Dialog con el formulario de nueva liquidación.
 * Existe para encapsular el modal de liquidación, pasando a LiquidacionForm
 * los viajes pendientes que el usuario podrá seleccionar y tarifar.
 *
 * Ejemplos:
 * <NuevaLiquidacionButton fleteros={[{ id: "f1", razonSocial: "JP SRL", comisionDefault: 10 }]} viajesPendientes={[...]} />
 * // => botón "Nueva liquidación" que abre el Dialog con LiquidacionForm
 * <NuevaLiquidacionButton fleteros={[]} viajesPendientes={[]} />
 * // => botón habilitado aunque sin datos (formulario mostrará listas vacías)
 * // => onSuccess del form → Dialog se cierra y página se refresca
 */
export function NuevaLiquidacionButton({ fleteros, viajesPendientes }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus />
        Nueva liquidación
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nueva liquidación</DialogTitle>
            <DialogDescription>
              Seleccioná viajes PENDIENTES del fletero y asignales la tarifa. La tarifa del fletero es confidencial.
            </DialogDescription>
          </DialogHeader>
          <LiquidacionForm
            fleteros={fleteros}
            viajesPendientes={viajesPendientes}
            onSuccess={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
