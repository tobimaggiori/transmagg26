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
import { UsuarioForm } from "@/components/forms/usuario-form"

interface Props {
  empresas: Array<{ id: string; razonSocial: string }>
}

/**
 * NuevoUsuarioButton: Props -> JSX.Element
 *
 * Dado el listado de empresas, renderiza un botón que abre un Dialog
 * con el formulario de creación de usuario del sistema.
 * Existe para encapsular el modal de nuevo usuario en el panel de administración,
 * pasando las empresas necesarias para asignar roles empresa.
 *
 * Ejemplos:
 * <NuevoUsuarioButton empresas={[]} />
 * // => botón "Nuevo usuario" con UsuarioForm sin opciones de empresa
 * <NuevoUsuarioButton empresas={[{ id: "e1", razonSocial: "Alimentos del Sur" }]} />
 * // => UsuarioForm con "Alimentos del Sur" disponible para roles ADMIN_EMPRESA/OPERADOR_EMPRESA
 * // => onSuccess del form → Dialog se cierra y página se refresca
 */
export function NuevoUsuarioButton({ empresas }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus />
        Nuevo usuario
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nuevo usuario</DialogTitle>
            <DialogDescription>
              Creá un usuario del sistema. El usuario recibirá un email con OTP para ingresar.
            </DialogDescription>
          </DialogHeader>
          <UsuarioForm empresas={empresas} onSuccess={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  )
}
