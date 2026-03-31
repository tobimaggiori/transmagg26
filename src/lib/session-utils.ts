/**
 * Propósito: Utilidades para resolver datos de sesión contra la DB.
 * Maneja el caso donde el JWT tiene un ID que ya no existe en la base de datos.
 */

import { prisma } from "@/lib/prisma"

/**
 * resolverOperadorId: (user: { id: string; email?: string | null }) -> Promise<string>
 *
 * Dado el user de la sesión, verifica que el id exista en la tabla usuarios.
 * Si no existe, busca por email como fallback.
 * Lanza error si no se encuentra por ningún medio.
 * Existe para prevenir FK violations cuando el JWT tiene un UUID obsoleto.
 *
 * Ejemplos:
 * await resolverOperadorId({ id: "uuid-valido", email: "admin@transmagg.com.ar" }) // => "uuid-valido"
 * await resolverOperadorId({ id: "uuid-obsoleto", email: "admin@transmagg.com.ar" }) // => "uuid-nuevo"
 * await resolverOperadorId({ id: "x", email: "noexiste@x.com" }) // => throw Error
 */
export async function resolverOperadorId(user: { id: string; email?: string | null }): Promise<string> {
  const porId = await prisma.usuario.findUnique({ where: { id: user.id }, select: { id: true } })
  if (porId) return porId.id

  if (user.email) {
    const porEmail = await prisma.usuario.findUnique({ where: { email: user.email }, select: { id: true } })
    if (porEmail) return porEmail.id
  }

  throw new Error("Operador no encontrado en la base de datos. Cerrá sesión y volvé a ingresar.")
}
