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
import { ProveedorForm } from "@/components/forms/proveedor-form"

/**
 * NuevoProveedorButton: () -> JSX.Element
 *
 * Devuelve un botón que abre un Dialog con el formulario de creación de proveedor.
 * Cierra automáticamente el Dialog cuando el formulario llama onSuccess.
 * Existe para encapsular el estado del modal de nuevo proveedor en la página de proveedores.
 *
 * Ejemplos:
 * <NuevoProveedorButton />
 * // => botón "Nuevo proveedor" que al clicarlo abre el Dialog con ProveedorForm
 * // => onSuccess del form → Dialog se cierra y página se refresca
 * // => usuario cancela Dialog → Dialog se cierra sin cambios
 */
export function NuevoProveedorButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus />
        Nuevo proveedor
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nuevo proveedor</DialogTitle>
            <DialogDescription>
              Registrá un nuevo proveedor en el sistema.
            </DialogDescription>
          </DialogHeader>
          <ProveedorForm onSuccess={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  )
}
