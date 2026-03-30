/**
 * Propósito: Componente Input reutilizable con estilos de Tailwind.
 * Extiende el elemento HTML input nativo con estilos consistentes del sistema de diseño.
 */

import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * Props del componente Input - extiende todas las props nativas del elemento input HTML.
 */
export type InputProps = React.InputHTMLAttributes<HTMLInputElement>

/**
 * Componente Input estilizado con diseño consistente para formularios de Transmagg.
 * Soporta estados de error mediante aria-invalid y es completamente accesible.
 *
 * @param className - Clases adicionales para personalización
 * @param type - Tipo del input HTML (text, email, password, etc.)
 * @param ref - Ref para acceso directo al elemento DOM
 * @returns Elemento input estilizado
 * @example
 * <Input type="email" placeholder="usuario@empresa.com" />
 */
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium",
          "placeholder:text-muted-foreground",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "aria-invalid:border-destructive",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
