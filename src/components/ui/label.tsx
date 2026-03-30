/**
 * Propósito: Componente Label reutilizable con estilos de Tailwind.
 * Wrapper del elemento HTML label nativo con estilos consistentes del sistema de diseño.
 */

"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * Props del componente Label - extiende todas las props nativas del elemento label HTML.
 */
export type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement>

/**
 * Componente Label estilizado para formularios de Transmagg.
 * Se asocia con inputs mediante htmlFor para accesibilidad.
 *
 * @param className - Clases adicionales para personalización
 * @param ref - Ref para acceso directo al elemento DOM
 * @returns Elemento label estilizado
 * @example
 * <Label htmlFor="email">Correo electrónico</Label>
 */
const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={cn(
        "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
        className
      )}
      {...props}
    />
  )
)
Label.displayName = "Label"

export { Label }
