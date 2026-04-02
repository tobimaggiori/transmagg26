/**
 * Propósito: Página de verificación del código OTP de Transmagg.
 * El usuario ingresa el código de 6 dígitos recibido por email.
 * Si es válido, NextAuth crea la sesión JWT y redirige al dashboard.
 */

"use client"

import { useState, useRef, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import { Truck, ArrowLeft } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

/**
 * VerifyForm: () -> JSX.Element
 *
 * Lee el email del query param, renderiza un formulario de código OTP de 6 dígitos
 * y llama a signIn credentials con email+otp al enviar. Si el signIn tiene éxito,
 * redirige al dashboard; si falla, muestra el error.
 * Existe separado de VerifyPage para poder usar useSearchParams dentro de Suspense.
 *
 * Ejemplos:
 * // ?email=admin@transmagg.com.ar → formulario con email pre-cargado
 * <VerifyForm />
 * // => formulario con 6 inputs de dígito y botón "Verificar"
 * // Submit con código correcto → signIn exitoso → redirect /dashboard
 * // Submit con código incorrecto → "Código inválido o expirado"
 */
function VerifyForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const email = searchParams.get("email") ?? ""

  const [codigo, setCodigo] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reenviando, setReenviando] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    if (!email) router.replace("/login")
  }, [email, router])

  /**
   * handleVerificar: FormEvent -> Promise<void>
   *
   * Dado el submit del formulario, llama a signIn credentials con email y otp.
   * Si tiene éxito redirige a /dashboard; si falla muestra el error al usuario.
   * Existe para ejecutar el paso final del flujo OTP creando la sesión NextAuth.
   *
   * Ejemplos:
   * // Código correcto → signIn resuelve sin error → router.push("/dashboard")
   * handleVerificar(event) // => redirect /dashboard
   * // Código incorrecto → signIn retorna error → setError(...)
   * handleVerificar(event) // => "Código inválido o expirado..."
   * // Error de red → catch → setError("Error de conexión...")
   * handleVerificar(event) // => "Error de conexión. Verificá tu conexión..."
   */
  async function handleVerificar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const result = await signIn("credentials", {
        email,
        otp: codigo,
        redirect: false,
      })

      if (result?.error) {
        setError("Código inválido o expirado. Verificá e intentá nuevamente.")
        return
      }

      router.push("/dashboard")
      router.refresh()
    } catch {
      setError("Error de conexión. Verificá tu conexión a internet.")
    } finally {
      setLoading(false)
    }
  }

  /**
   * handleReenviar: () -> Promise<void>
   *
   * Hace POST a /api/auth/send-otp con el email actual para generar un nuevo OTP
   * e invalida el anterior. Limpia el campo de código y enfoca el input.
   * Existe para que el usuario pueda pedir un nuevo código si el anterior expiró.
   *
   * Ejemplos:
   * // Email válido registrado → POST exitoso → campo limpio y foco en input
   * handleReenviar() // => void (nuevo OTP enviado por email)
   * // Error de red → catch → setError("Error al reenviar el código.")
   * handleReenviar() // => "Error al reenviar el código."
   * // Siempre muestra 200 aunque el email no exista (seguridad)
   * handleReenviar() // => void sin revelar si el email existe
   */
  async function handleReenviar() {
    setReenviando(true)
    setError(null)

    try {
      await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      setCodigo("")
      inputRef.current?.focus()
    } catch {
      setError("Error al reenviar el código.")
    } finally {
      setReenviando(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Verificar código</CardTitle>
        <CardDescription>
          Ingresá el código de 6 dígitos enviado a{" "}
          <strong className="text-foreground">{email}</strong>
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleVerificar}>
        <CardContent className="space-y-4">
          <Input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            placeholder="000000"
            value={codigo}
            onChange={(e) =>
              setCodigo(e.target.value.replace(/\D/g, "").slice(0, 6))
            }
            className="text-center text-2xl tracking-widest"
            required
            disabled={loading}
            aria-label="Código de verificación"
            aria-invalid={error !== null}
          />

          {error && (
            <p className="text-sm text-destructive text-center" role="alert">
              {error}
            </p>
          )}

          <p className="text-center text-xs text-muted-foreground">
            ¿No recibiste el código?{" "}
            <button
              type="button"
              onClick={handleReenviar}
              disabled={reenviando}
              className="text-primary underline-offset-4 hover:underline disabled:opacity-50"
            >
              {reenviando ? "Reenviando..." : "Reenviar"}
            </button>
          </p>
        </CardContent>

        <CardFooter className="flex flex-col gap-2">
          <Button
            type="submit"
            className="w-full"
            disabled={loading || codigo.length !== 6}
          >
            {loading ? "Verificando..." : "Ingresar"}
          </Button>

          <button
            type="button"
            onClick={() => router.push("/login")}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3 w-3" />
            Volver al inicio de sesión
          </button>
        </CardFooter>
      </form>
    </Card>
  )
}

/**
 * VerifyPage: () -> JSX.Element
 *
 * Devuelve la página de verificación OTP envolviendo VerifyForm en Suspense.
 * El Suspense es necesario porque VerifyForm usa useSearchParams (API de cliente).
 * Existe como segundo paso del flujo OTP: el usuario ingresa el código recibido
 * por email y NextAuth crea la sesión JWT si es válido.
 *
 * Ejemplos:
 * // Acceso a /verify?email=admin@transmagg.com.ar → formulario de código
 * <VerifyPage />
 * // => VerifyForm envuelto en Suspense con fallback de carga
 * // Sin ?email en query → VerifyForm redirige a /login
 * // Código correcto → signIn credentials → redirect /dashboard
 */
export default function VerifyPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Truck className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold">Transmagg</h1>
        </div>

        <Suspense fallback={<Card><CardContent className="pt-6 text-center text-sm text-muted-foreground">Cargando...</CardContent></Card>}>
          <VerifyForm />
        </Suspense>
      </div>
    </div>
  )
}
