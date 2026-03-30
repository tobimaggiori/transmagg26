/**
 * Propósito: Handler de NextAuth para las rutas de autenticación de Next.js App Router.
 * Exporta los handlers GET y POST de NextAuth para manejar todas las rutas
 * de autenticación bajo /api/auth/*.
 */

import { handlers } from "@/lib/auth"

/**
 * Handler GET para rutas de NextAuth (sesión, callback, signout, etc.)
 */
export const { GET, POST } = handlers
