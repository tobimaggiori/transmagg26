/**
 * Propósito: Componentes de Card para organizar contenido en bloques visuales.
 * Exporta Card, CardHeader, CardTitle, CardDescription, CardContent y CardFooter
 * como componentes compositivos del sistema de diseño de Transmagg.
 */

import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * Contenedor principal de la tarjeta con borde, sombra y fondo.
 *
 * @param className - Clases adicionales
 * @returns Div estilizado como tarjeta
 * @example
 * <Card><CardContent>Contenido</CardContent></Card>
 */
const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-xl border bg-card text-card-foreground shadow",
        className
      )}
      {...props}
    />
  )
)
Card.displayName = "Card"

/**
 * Encabezado de la tarjeta con padding y layout flex column.
 *
 * @param className - Clases adicionales
 */
const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex flex-col space-y-1.5 p-6", className)}
      {...props}
    />
  )
)
CardHeader.displayName = "CardHeader"

/**
 * Título principal de la tarjeta con tipografía semibold.
 *
 * @param className - Clases adicionales
 */
const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn("font-semibold leading-none tracking-tight", className)}
      {...props}
    />
  )
)
CardTitle.displayName = "CardTitle"

/**
 * Descripción secundaria de la tarjeta con tipografía muted.
 *
 * @param className - Clases adicionales
 */
const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
)
CardDescription.displayName = "CardDescription"

/**
 * Contenido principal de la tarjeta con padding lateral y bottom.
 *
 * @param className - Clases adicionales
 */
const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
  )
)
CardContent.displayName = "CardContent"

/**
 * Pie de la tarjeta con padding y layout flex.
 *
 * @param className - Clases adicionales
 */
const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex items-center p-6 pt-0", className)}
      {...props}
    />
  )
)
CardFooter.displayName = "CardFooter"

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
}
