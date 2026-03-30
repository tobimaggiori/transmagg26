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
import { CamionForm } from "@/components/forms/camion-form"

interface NuevoCamionButtonProps {
  fleteros: Array<{ id: string; razonSocial: string }>
  /** Si es FLETERO, el ID ya viene fijo */
  fleteroIdFijo?: string
}

/**
 * NuevoCamionButton: NuevoCamionButtonProps -> JSX.Element
 *
 * Dados los fleteros disponibles y un fleteroIdFijo opcional,
 * renderiza un botón que abre un Dialog con el formulario de creación de camión.
 * Cuando fleteroIdFijo está presente (rol FLETERO), el selector de fletero queda bloqueado.
 * Existe para encapsular el modal de nuevo camión pasando los datos necesarios a CamionForm.
 *
 * Ejemplos:
 * <NuevoCamionButton fleteros={[{ id: "f1", razonSocial: "JP SRL" }]} />
 * // => botón con selector de fletero libre en el formulario
 * <NuevoCamionButton fleteros={[]} fleteroIdFijo="f1" />
 * // => botón con fleteroId fijo "f1" (uso para rol FLETERO)
 * // => onSuccess del form → Dialog se cierra y página se refresca
 */
export function NuevoCamionButton({ fleteros, fleteroIdFijo }: NuevoCamionButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus />
        Nuevo camión
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nuevo camión</DialogTitle>
            <DialogDescription>
              Registrá una nueva unidad en el sistema.
            </DialogDescription>
          </DialogHeader>
          <CamionForm
            fleteros={fleteros}
            fleteroIdFijo={fleteroIdFijo}
            onSuccess={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
