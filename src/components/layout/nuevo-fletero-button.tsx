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
import { FleteroForm } from "@/components/forms/fletero-form"

/**
 * NuevoFleteroButton: () -> JSX.Element
 *
 * Devuelve un botón que abre un Dialog con el formulario de creación de fletero.
 * Cierra automáticamente el Dialog cuando el formulario llama onSuccess.
 * Existe para encapsular el estado de apertura/cierre del modal de nuevo fletero
 * en un componente reutilizable en la página de fleteros.
 *
 * Ejemplos:
 * <NuevoFleteroButton />
 * // => botón "Nuevo fletero" que al clicarlo abre el Dialog con FleteroForm
 * // => onSuccess del form → Dialog se cierra
 * // => usuario cancela Dialog → Dialog se cierra sin cambios
 */
export function NuevoFleteroButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus />
        Nuevo fletero
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nuevo fletero</DialogTitle>
            <DialogDescription>
              Completá los datos del transportista. Se creará un usuario con rol FLETERO.
            </DialogDescription>
          </DialogHeader>
          <FleteroForm onSuccess={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  )
}
