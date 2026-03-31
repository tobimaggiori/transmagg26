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
import { ViajeForm } from "@/components/forms/viaje-form"

interface Props {
  fleteros: Array<{ id: string; razonSocial: string; cuit: string }>
  camiones: Array<{ id: string; patenteChasis: string; fleteroId: string }>
  choferes: Array<{ id: string; nombre: string; apellido: string }>
  empresas: Array<{ id: string; razonSocial: string; cuit: string }>
}

/**
 * NuevoViajeButton: Props -> JSX.Element
 *
 * Dados los listados de fleteros, camiones, choferes y empresas,
 * renderiza un botón que abre un Dialog con el formulario de creación de viaje.
 * Existe para encapsular el estado del modal y pasar los datos necesarios
 * al ViajeForm desde la página de viajes.
 *
 * Ejemplos:
 * <NuevoViajeButton fleteros={[]} camiones={[]} choferes={[]} empresas={[]} />
 * // => botón "Nuevo viaje" que abre el Dialog con ViajeForm
 * <NuevoViajeButton fleteros={[{ id: "f1", razonSocial: "JP SRL" }]} camiones={[...]} choferes={[...]} empresas={[...]} />
 * // => ViajeForm con datos precargados para seleccionar
 * // => onSuccess del form → Dialog se cierra y página se refresca
 */
export function NuevoViajeButton({ fleteros, camiones, choferes, empresas }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus />
        Nuevo viaje
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nuevo viaje</DialogTitle>
            <DialogDescription>
              Cargá los datos del viaje. Luego podrás asociarlo a una liquidación y/o factura de forma independiente.
            </DialogDescription>
          </DialogHeader>
          <ViajeForm
            fleteros={fleteros}
            camiones={camiones}
            choferes={choferes}
            empresas={empresas}
            onSuccess={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
