/**
 * Tests unitarios para src/lib/arca/errors.ts
 * Cubre: todos los errores tipados de la capa ARCA.
 */

import {
  ArcaError,
  ArcaNoConfiguradaError,
  ArcaConfigIncompletaError,
  WsaaError,
  Wsfev1Error,
  ArcaRechazoError,
  DocumentoYaAutorizadoError,
  DocumentoEnProcesoError,
  ArcaValidacionError,
  DocumentoNoEncontradoError,
} from "@/lib/arca/errors"

describe("ArcaError (base)", () => {
  it("tiene code, message y statusCode", () => {
    const err = new ArcaError("TEST_CODE", "test message", 418)
    expect(err.code).toBe("TEST_CODE")
    expect(err.message).toBe("test message")
    expect(err.statusCode).toBe(418)
    expect(err.name).toBe("ArcaError")
    expect(err).toBeInstanceOf(Error)
  })

  it("statusCode default es 500", () => {
    const err = new ArcaError("X", "x")
    expect(err.statusCode).toBe(500)
  })
})

describe("ArcaNoConfiguradaError", () => {
  it("tiene código ARCA_NO_CONFIGURADA y status 503", () => {
    const err = new ArcaNoConfiguradaError()
    expect(err.code).toBe("ARCA_NO_CONFIGURADA")
    expect(err.statusCode).toBe(503)
    expect(err).toBeInstanceOf(ArcaError)
  })

  it("acepta mensaje custom", () => {
    const err = new ArcaNoConfiguradaError("detalle custom")
    expect(err.message).toBe("detalle custom")
  })
})

describe("ArcaConfigIncompletaError", () => {
  it("incluye campo faltante en el mensaje", () => {
    const err = new ArcaConfigIncompletaError("certificado")
    expect(err.message).toContain("certificado")
    expect(err.code).toBe("ARCA_CONFIG_INCOMPLETA")
    expect(err.statusCode).toBe(503)
  })
})

describe("WsaaError", () => {
  it("tiene código WSAA_ERROR y status 502", () => {
    const err = new WsaaError("timeout")
    expect(err.code).toBe("WSAA_ERROR")
    expect(err.statusCode).toBe(502)
    expect(err.message).toContain("timeout")
  })
})

describe("Wsfev1Error", () => {
  it("tiene código WSFEV1_ERROR y status 502", () => {
    const err = new Wsfev1Error("SOAP fault")
    expect(err.code).toBe("WSFEV1_ERROR")
    expect(err.statusCode).toBe(502)
  })
})

describe("ArcaRechazoError", () => {
  it("tiene código ARCA_RECHAZO, status 422 y observaciones", () => {
    const err = new ArcaRechazoError("10013: CUIT inválido; 10015: Tipo no habilitado")
    expect(err.code).toBe("ARCA_RECHAZO")
    expect(err.statusCode).toBe(422)
    expect(err.observaciones).toBe("10013: CUIT inválido; 10015: Tipo no habilitado")
  })
})

describe("DocumentoYaAutorizadoError", () => {
  it("tiene código DOCUMENTO_YA_AUTORIZADO y status 409", () => {
    const err = new DocumentoYaAutorizadoError()
    expect(err.code).toBe("DOCUMENTO_YA_AUTORIZADO")
    expect(err.statusCode).toBe(409)
    expect(err.retryable).toBe(false)
    expect(err.message).toContain("ya fue autorizado")
  })
})

describe("DocumentoEnProcesoError", () => {
  it("tiene código DOCUMENTO_EN_PROCESO y status 409", () => {
    const err = new DocumentoEnProcesoError()
    expect(err.code).toBe("DOCUMENTO_EN_PROCESO")
    expect(err.statusCode).toBe(409)
  })
})

describe("ArcaValidacionError", () => {
  it("tiene código ARCA_VALIDACION, status 400 y lista de errores", () => {
    const err = new ArcaValidacionError(["Error 1", "Error 2"])
    expect(err.code).toBe("ARCA_VALIDACION")
    expect(err.statusCode).toBe(400)
    expect(err.errores).toEqual(["Error 1", "Error 2"])
    expect(err.message).toContain("Error 1")
    expect(err.message).toContain("Error 2")
  })
})

describe("DocumentoNoEncontradoError", () => {
  it("tiene código DOCUMENTO_NO_ENCONTRADO y status 404", () => {
    const err = new DocumentoNoEncontradoError("Liquidación")
    expect(err.code).toBe("DOCUMENTO_NO_ENCONTRADO")
    expect(err.statusCode).toBe(404)
    expect(err.retryable).toBe(false)
    expect(err.message).toContain("Liquidación")
    // ID sanitizado — no debe aparecer en el mensaje público
    expect(err.message).not.toContain("abc-123")
  })
})

describe("herencia de errores", () => {
  it("todos los errores son instanceof ArcaError", () => {
    expect(new ArcaNoConfiguradaError()).toBeInstanceOf(ArcaError)
    expect(new WsaaError("x")).toBeInstanceOf(ArcaError)
    expect(new Wsfev1Error("x")).toBeInstanceOf(ArcaError)
    expect(new ArcaRechazoError("x")).toBeInstanceOf(ArcaError)
    expect(new DocumentoYaAutorizadoError()).toBeInstanceOf(ArcaError)
    expect(new ArcaValidacionError([])).toBeInstanceOf(ArcaError)
  })

  it("todos los errores son instanceof Error", () => {
    expect(new ArcaNoConfiguradaError()).toBeInstanceOf(Error)
    expect(new WsaaError("x")).toBeInstanceOf(Error)
  })
})
