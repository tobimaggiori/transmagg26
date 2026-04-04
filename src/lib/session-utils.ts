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

/**
 * resolverEmpresaIdPorEmail: string -> Promise<string | null>
 *
 * Dado [el email del usuario autenticado], devuelve [el empresaId vinculado
 * a ese usuario via EmpresaUsuario, o null si no tiene empresa].
 * Existe para centralizar la resolución "¿a qué empresa pertenece este usuario?"
 * que se repetía ad hoc en 6+ routes y pages.
 *
 * Ejemplos:
 * resolverEmpresaIdPorEmail("admin@empresa.com") // => "uuid-empresa"
 * resolverEmpresaIdPorEmail("sinempresa@x.com")  // => null
 */
export async function resolverEmpresaIdPorEmail(email: string): Promise<string | null> {
  const empUsr = await prisma.empresaUsuario.findFirst({
    where: { usuario: { email } },
    select: { empresaId: true },
  })
  return empUsr?.empresaId ?? null
}

/**
 * resolverFleteroIdPorEmail: string -> Promise<string | null>
 *
 * Dado [el email del usuario autenticado], devuelve [el fleteroId vinculado
 * a ese usuario via Fletero.usuario, o null si no es fletero].
 * Existe para centralizar la resolución "¿qué fletero es este usuario?"
 * que se repetía ad hoc en 5+ routes y pages.
 *
 * Ejemplos:
 * resolverFleteroIdPorEmail("fletero@x.com") // => "uuid-fletero"
 * resolverFleteroIdPorEmail("nofleter@x.com") // => null
 */
export async function resolverFleteroIdPorEmail(email: string): Promise<string | null> {
  const fletero = await prisma.fletero.findFirst({
    where: { usuario: { email } },
    select: { id: true },
  })
  return fletero?.id ?? null
}

/**
 * verificarPropietarioFletero: string string -> Promise<boolean>
 *
 * Dado [un fleteroId y el email del usuario], devuelve [true si el fletero
 * pertenece a ese usuario, false si no].
 * Existe para centralizar el ownership check "¿este fletero es mío?"
 * que se repetía en routes de liquidaciones, camiones y flota.
 *
 * Ejemplos:
 * verificarPropietarioFletero("f1", "fletero@x.com") // => true (si f1 es de ese email)
 * verificarPropietarioFletero("f1", "otro@x.com")    // => false
 */
export async function verificarPropietarioFletero(fleteroId: string, email: string): Promise<boolean> {
  const fletero = await prisma.fletero.findFirst({
    where: { id: fleteroId, usuario: { email } },
    select: { id: true },
  })
  return fletero !== null
}

/**
 * verificarPropietarioEmpresa: string string -> Promise<boolean>
 *
 * Dado [un empresaId y el email del usuario], devuelve [true si el usuario
 * pertenece a esa empresa via EmpresaUsuario, false si no].
 * Existe para centralizar el ownership check "¿soy de esta empresa?"
 * que se repetía en routes de facturas y PDFs.
 *
 * Ejemplos:
 * verificarPropietarioEmpresa("e1", "admin@empresa.com") // => true
 * verificarPropietarioEmpresa("e1", "otro@x.com")        // => false
 */
export async function verificarPropietarioEmpresa(empresaId: string, email: string): Promise<boolean> {
  const empUsr = await prisma.empresaUsuario.findFirst({
    where: { usuario: { email }, empresaId },
    select: { empresaId: true },
  })
  return empUsr !== null
}
