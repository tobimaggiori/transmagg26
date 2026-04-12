/**
 * Propósito: Layout raíz de la aplicación Transmagg.
 * Define la estructura HTML base con fuentes, metadatos y proveedor de sesión.
 */

import type { Metadata } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import "./globals.css"

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
})

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Transmagg - Sistema de Gestión de Transporte",
  description:
    "Sistema de gestión de liquidaciones, facturas y operaciones de transporte de carga",
}

/**
 * Layout raíz que envuelve toda la aplicación.
 * Aplica fuentes globales y proveedores de contexto necesarios.
 *
 * @param children - Contenido de la página actual
 * @returns HTML base con proveedores configurados
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  )
}
