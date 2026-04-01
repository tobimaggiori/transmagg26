/**
 * Propósito: Tests unitarios para los helpers de respuesta HTTP del módulo financiero.
 * Cubre las funciones puras (sin dependencias de sesión) de financial-api.ts.
 */

// Mock @/lib/auth antes de importar financial-api para evitar que next-auth rompa Jest
jest.mock("@/lib/auth", () => ({ auth: jest.fn().mockResolvedValue(null) }))

import {
  badRequestResponse,
  conflictResponse,
  invalidDataResponse,
  notFoundResponse,
  serverErrorResponse,
} from "@/lib/financial-api"

describe("badRequestResponse", () => {
  it("devuelve status 400", () => {
    expect(badRequestResponse("La cuenta destino es obligatoria").status).toBe(400)
  })

  it("incluye el mensaje en el body", async () => {
    const res = badRequestResponse("El cheque no puede superar 250 filas")
    const body = await res.json()
    expect(body.error).toBe("El cheque no puede superar 250 filas")
  })

  it("mensaje vacío también devuelve 400", () => {
    expect(badRequestResponse("").status).toBe(400)
  })
})

describe("notFoundResponse", () => {
  it("devuelve status 404", () => {
    expect(notFoundResponse("Cuenta").status).toBe(404)
  })

  it("incluye el recurso en el mensaje", async () => {
    const res = notFoundResponse("FCI")
    const body = await res.json()
    expect(body.error).toContain("FCI")
  })

  it("notFoundResponse('Cheque emitido').status === 404", () => {
    expect(notFoundResponse("Cheque emitido").status).toBe(404)
  })
})

describe("conflictResponse", () => {
  it("devuelve status 409", () => {
    expect(conflictResponse("Ya existe una cuenta con ese nombre").status).toBe(409)
  })

  it("incluye el mensaje de conflicto en el body", async () => {
    const res = conflictResponse("El número de cheque ya está registrado")
    const body = await res.json()
    expect(body.error).toBe("El número de cheque ya está registrado")
  })

  it("conflictResponse('Ya existe un broker vinculado a esa cuenta').status === 409", () => {
    expect(conflictResponse("Ya existe un broker vinculado a esa cuenta").status).toBe(409)
  })
})

describe("invalidDataResponse", () => {
  it("devuelve status 400", () => {
    expect(invalidDataResponse({ fieldErrors: { nombre: ["Requerido"] } }).status).toBe(400)
  })

  it("incluye el detalle en el body", async () => {
    const detalle = { fieldErrors: { nombre: ["Requerido"] } }
    const res = invalidDataResponse(detalle)
    const body = await res.json()
    expect(body.detalles).toEqual(detalle)
  })

  it("acepta null como detalle y devuelve 400", () => {
    expect(invalidDataResponse(null).status).toBe(400)
  })
})

describe("serverErrorResponse", () => {
  it("devuelve status 500", () => {
    expect(serverErrorResponse("GET /api/cuentas", new Error("boom")).status).toBe(500)
  })

  it("devuelve status 500 con objeto de error", () => {
    expect(serverErrorResponse("POST /api/fci", { message: "boom" }).status).toBe(500)
  })

  it("devuelve status 500 con null como error", () => {
    expect(serverErrorResponse("PATCH /api/cheques-emitidos/[id]", null).status).toBe(500)
  })
})
