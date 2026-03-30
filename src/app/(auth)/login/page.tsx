/**
 * Propósito: Página de inicio de sesión de Transmagg.
 * Implementa autenticación passwordless mediante OTP enviado por email.
 * El usuario ingresa su email y recibe un código de 6 dígitos para ingresar.
 */

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Truck } from "lucide-react"
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
import { Label } from "@/components/ui/label"

/**
 * LoginPage: () -> JSX.Element
 *
 * Devuelve la página de inicio de sesión con un formulario de email.
 * Al enviar, hace POST a /api/auth/send-otp; si tiene éxito, redirige a /verify?email=...
 * Existe como primer paso del flujo OTP passwordless de Transmagg.
 *
 * Ejemplos:
 * // Acceso a /login → formulario de email vacío
 * <LoginPage />
 * // => campo email + botón "Continuar"
 * // Submit con email válido → POST /api/auth/send-otp → redirect /verify?email=...
 * // Submit con email inválido → muestra error de validación
 */
export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Maneja el envío del formulario de email.
   * Llama a la API para enviar el OTP y redirige a la página de verificación.
   *
   * @param e - Evento del formulario
   */
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? "Error al enviar el código. Intenta nuevamente.")
        return
      }

      // Redirigir a página de verificación con el email como parámetro
      router.push(`/verify?email=${encodeURIComponent(email)}`)
    } catch {
      setError("Error de conexión. Verificá tu conexión a internet.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <div className="w-full max-w-sm">
        {/* Logo y título */}
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Truck className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold">transmagg</h1>
          <p className="text-sm text-muted-foreground">
            Sistema de Gestión de Transporte
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Iniciar sesión</CardTitle>
            <CardDescription>
              Ingresá tu email para recibir un código de acceso
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="usuario@empresa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  autoComplete="email"
                  aria-invalid={error !== null}
                />
              </div>

              {error && (
                <p className="text-sm text-destructive" role="alert">
                  {error}
                </p>
              )}
            </CardContent>

            <CardFooter>
              <Button
                type="submit"
                className="w-full"
                disabled={loading || !email}
              >
                {loading ? "Enviando código..." : "Continuar"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}