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
import { EmpresaForm } from "@/components/forms/empresa-form"

/**
 * NuevoEmpresaButton: () -> JSX.Element
 *
 * Devuelve un botón que abre un Dialog con el formulario de creación de empresa.
 * Cierra automáticamente el Dialog cuando el formulario llama onSuccess.
 * Existe para encapsular el estado del modal de nueva empresa en la página de empresas.
 *
 * Ejemplos:
 * <NuevoEmpresaButton />
 * // => botón "Nueva empresa" que al clicarlo abre el Dialog con EmpresaForm
 * // => onSuccess del form → Dialog se cierra y página se refresca
 * // => usuario cancela Dialog → Dialog se cierra sin cambios
 */
export function NuevoEmpresaButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus />
        Nueva empresa
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nueva empresa</DialogTitle>
            <DialogDescription>
              Registrá una nueva empresa cliente en el sistema.
            </DialogDescription>
          </DialogHeader>
          <EmpresaForm onSuccess={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  )
}
