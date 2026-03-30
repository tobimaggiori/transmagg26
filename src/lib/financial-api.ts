import type { Session } from "next-auth"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { esRolInterno } from "@/lib/permissions"
import type { Rol } from "@/types"

export type ResultadoAccesoFinanciero =
  | { ok: true; session: Session }
  | { ok: false; response: NextResponse }

/**
 * requireFinancialAccess: -> Promise<ResultadoAccesoFinanciero>
 *
 * Dado [ningún parámetro], devuelve [la sesión autenticada si el usuario es interno, o una respuesta HTTP 401/403 si no cumple los permisos].
 * Esta función existe para centralizar la autorización de todos los endpoints del módulo financiero en un único punto.
 *
 * Ejemplos:
 * requireFinancialAccess() === { ok: true, session }
 * requireFinancialAccess() === { ok: false, response: NextResponse.json({ error: "No autorizado" }, { status: 401 }) }
 * requireFinancialAccess() === { ok: false, response: NextResponse.json({ error: "Acceso denegado" }, { status: 403 }) }
 */
export async function requireFinancialAccess(): Promise<ResultadoAccesoFinanciero> {
  const session = await auth()

  if (!session?.user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "No autorizado" }, { status: 401 }),
    }
  }

  const rol = session.user.rol as Rol
  if (!esRolInterno(rol)) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Acceso denegado" }, { status: 403 }),
    }
  }

  return { ok: true, session }
}

/**
 * invalidDataResponse: unknown -> NextResponse
 *
 * Dado [el detalle de validación rechazado], devuelve [una respuesta HTTP 400 con error descriptivo y detalle serializado].
 * Esta función existe para unificar la forma en que el módulo financiero informa errores de validación al frontend.
 *
 * Ejemplos:
 * invalidDataResponse({ fieldErrors: { nombre: ["Requerido"] } }).status === 400
 * invalidDataResponse({ formErrors: ["Inválido"] }).status === 400
 * invalidDataResponse(null).status === 400
 */
export function invalidDataResponse(detalles: unknown): NextResponse {
  return NextResponse.json({ error: "Datos inválidos", detalles }, { status: 400 })
}

/**
 * badRequestResponse: string -> NextResponse
 *
 * Dado [un mensaje de error funcional], devuelve [una respuesta HTTP 400 con ese mensaje].
 * Esta función existe para distinguir errores de negocio de errores internos en los endpoints financieros.
 *
 * Ejemplos:
 * badRequestResponse("La cuenta destino es obligatoria").status === 400
 * badRequestResponse("El cheque no puede superar 250 filas").status === 400
 * badRequestResponse("La cuenta debe estar activa").status === 400
 */
export function badRequestResponse(error: string): NextResponse {
  return NextResponse.json({ error }, { status: 400 })
}

/**
 * notFoundResponse: string -> NextResponse
 *
 * Dado [el nombre legible del recurso], devuelve [una respuesta HTTP 404 con el mensaje "<recurso> no encontrado"].
 * Esta función existe para mantener mensajes homogéneos entre todos los CRUDs financieros.
 *
 * Ejemplos:
 * notFoundResponse("Cuenta").status === 404
 * notFoundResponse("FCI").status === 404
 * notFoundResponse("Cheque emitido").status === 404
 */
export function notFoundResponse(recurso: string): NextResponse {
  return NextResponse.json({ error: `${recurso} no encontrado` }, { status: 404 })
}

/**
 * conflictResponse: string -> NextResponse
 *
 * Dado [un mensaje de conflicto], devuelve [una respuesta HTTP 409 con ese mensaje].
 * Esta función existe para reportar colisiones de unicidad o estados incompatibles sin usar errores genéricos.
 *
 * Ejemplos:
 * conflictResponse("Ya existe una cuenta con ese nombre").status === 409
 * conflictResponse("Ya existe un broker vinculado a esa cuenta").status === 409
 * conflictResponse("El número de cheque ya está registrado").status === 409
 */
export function conflictResponse(error: string): NextResponse {
  return NextResponse.json({ error }, { status: 409 })
}

/**
 * serverErrorResponse: string unknown -> NextResponse
 *
 * Dado [el contexto del endpoint y el error capturado], devuelve [una respuesta HTTP 500 y además registra el error en consola].
 * Esta función existe para centralizar el manejo de fallos inesperados del módulo financiero manteniendo trazabilidad técnica.
 *
 * Ejemplos:
 * serverErrorResponse("GET /api/cuentas", new Error("boom")).status === 500
 * serverErrorResponse("POST /api/fci", { message: "boom" }).status === 500
 * serverErrorResponse("PATCH /api/cheques-emitidos/[id]", null).status === 500
 */
export function serverErrorResponse(contexto: string, error: unknown): NextResponse {
  console.error(`[${contexto}]`, error)
  return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
}
