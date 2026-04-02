/**
 * Propósito: Configuración de NextAuth v5 para Transmagg.
 * Autenticación passwordless con OTP numérico enviado por email.
 * Usa Credentials provider + JWT para que el flujo OTP custom cree sesión.
 */

import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import { verificarCodigoOtp, estaExpirado } from "@/lib/otp"
import type { Rol } from "@/types"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      rol: Rol
    }
  }

  interface User {
    rol: Rol
  }
}


export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      credentials: {
        email: { type: "email" },
        otp: { type: "text" },
      },
      /**
       * authorize: Credentials -> Promise<User | null>
       *
       * Dados email y otp en credentials, valida el código contra el hash
       * en la DB y devuelve el usuario si es correcto, null en caso contrario.
       * Existe para implementar autenticación OTP passwordless: verifica que
       * el usuario esté activo, el código no esté expirado ni usado,
       * y lo marca como usado al autenticar exitosamente.
       *
       * Ejemplos:
       * // Código correcto y vigente → usuario autenticado
       * await authorize({ email: "admin@transmagg.com.ar", otp: "042891" })
       * // => { id, email, name, rol }
       * // Código incorrecto → null
       * await authorize({ email: "admin@transmagg.com.ar", otp: "000000" })
       * // => null
       * // Usuario inactivo → null
       * await authorize({ email: "inactivo@transmagg.com.ar", otp: "042891" })
       * // => null
       */
      async authorize(credentials) {
        const email = credentials?.email as string | undefined
        const otp = credentials?.otp as string | undefined

        console.log("[authorize] Email:", email, "| OTP recibido:", otp ? `${otp.length} dígitos` : "vacío")

        if (!email || !otp) return null

        const usuario = await prisma.usuario.findUnique({
          where: { email },
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true,
            rol: true,
            activo: true,
          },
        })

        console.log("[authorize] Usuario:", usuario?.id ?? "no encontrado", "| activo:", usuario?.activo)

        if (!usuario || !usuario.activo) return null

        const otpRecord = await prisma.otpCodigo.findFirst({
          where: { usuarioId: usuario.id, usado: false },
          orderBy: { expiraEn: "desc" },
        })

        console.log("[authorize] OTP en BD:", otpRecord?.id ?? "ninguno", "| expira:", otpRecord?.expiraEn)

        if (!otpRecord) return null

        const expirado = estaExpirado(otpRecord.expiraEn)
        console.log("[authorize] ¿Expirado?", expirado)
        if (expirado) return null

        const esValido = await verificarCodigoOtp(otp, otpRecord.codigoHash)
        console.log("[authorize] Match bcrypt:", esValido)
        if (!esValido) return null

        await prisma.otpCodigo.update({
          where: { id: otpRecord.id },
          data: { usado: true },
        })

        console.log("[authorize] Autenticación exitosa para:", email)

        return {
          id: usuario.id,
          email: usuario.email,
          name: `${usuario.nombre} ${usuario.apellido}`.trim(),
          rol: usuario.rol as Rol,
        }
      },
    }),
  ],
  callbacks: {
    /**
     * jwt: { token, user } -> JWT
     *
     * Dado el token JWT actual y el usuario (solo en el primer login),
     * persiste id y rol del usuario en el token para los requests posteriores.
     * Existe para propagar el rol y el id del usuario en el JWT, ya que
     * NextAuth solo llama a este callback con `user` en el inicio de sesión.
     *
     * Ejemplos:
     * // Primer login: user existe → token.id y token.rol se asignan
     * jwt({ token: {}, user: { id: "u1", rol: "FLETERO" } })
     * // => { id: "u1", rol: "FLETERO" }
     * // Requests posteriores: user es undefined → token sin cambios
     * jwt({ token: { id: "u1", rol: "FLETERO" }, user: undefined })
     * // => { id: "u1", rol: "FLETERO" }
     * // Rol admin persiste en cada request
     * jwt({ token: { id: "u2", rol: "ADMIN_TRANSMAGG" }, user: undefined })
     * // => { id: "u2", rol: "ADMIN_TRANSMAGG" }
     */
    jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.rol = user.rol
      }
      return token
    },
    /**
     * session: { session, token } -> Session
     *
     * Dado el objeto session y el token JWT decodificado,
     * expone id y rol del usuario en session.user para los componentes del cliente.
     * Existe para que el frontend pueda acceder al rol y al id del usuario
     * autenticado sin necesidad de consultar la DB en cada render.
     *
     * Ejemplos:
     * // Token con datos → session.user extendida
     * session({ session: { user: { email: "a@b.com" } }, token: { id: "u1", rol: "FLETERO" } })
     * // => session con user.id = "u1" y user.rol = "FLETERO"
     * // Token admin
     * session({ session: { user: {} }, token: { id: "u2", rol: "ADMIN_TRANSMAGG" } })
     * // => session con user.id = "u2" y user.rol = "ADMIN_TRANSMAGG"
     * // Sin token → session sin cambios
     * session({ session: { user: {} }, token: null })
     * // => session sin id ni rol
     */
    session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.rol = token.rol as Rol
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
  },
})
