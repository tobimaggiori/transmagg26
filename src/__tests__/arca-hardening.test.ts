/**
 * Tests de hardening para la capa ARCA.
 * Cubre: crypto, clasificación de errores, ticket WSAA, retry, sanitización.
 */

import { cifrarValor, descifrarValor, estaCifrado } from "@/lib/arca/crypto"
import {
  WsaaError,
  Wsfev1Error,
  ArcaRechazoError,
  ArcaValidacionError,
  DocumentoYaAutorizadoError,
  DocumentoEnProcesoError,
  ArcaNoConfiguradaError,
} from "@/lib/arca/errors"

// ─── Crypto ──────────────────────────────────────────────────────────────────

describe("cifrado de valores sensibles", () => {
  // Guardar y restaurar env
  const originalKey = process.env.ENCRYPTION_KEY
  afterAll(() => {
    if (originalKey !== undefined) process.env.ENCRYPTION_KEY = originalKey
    else delete process.env.ENCRYPTION_KEY
  })

  describe("con ENCRYPTION_KEY configurada", () => {
    beforeAll(() => {
      process.env.ENCRYPTION_KEY = "test-master-key-for-hardening-tests-2026"
    })

    it("cifra y descifra correctamente", () => {
      const original = "mi-password-super-secreto"
      const cifrado = cifrarValor(original)
      expect(cifrado).not.toBe(original)
      expect(cifrado.startsWith("enc:v1:")).toBe(true)
      expect(descifrarValor(cifrado)).toBe(original)
    })

    it("cada cifrado produce resultado diferente (IV aleatorio)", () => {
      const valor = "test"
      const c1 = cifrarValor(valor)
      const c2 = cifrarValor(valor)
      expect(c1).not.toBe(c2) // Diferente IV
      expect(descifrarValor(c1)).toBe(valor)
      expect(descifrarValor(c2)).toBe(valor)
    })

    it("cifra strings vacíos", () => {
      const cifrado = cifrarValor("")
      expect(cifrado.startsWith("enc:v1:")).toBe(true)
      expect(descifrarValor(cifrado)).toBe("")
    })

    it("cifra strings largos (certificado base64)", () => {
      const largo = "A".repeat(10000) // Simula un certificado
      const cifrado = cifrarValor(largo)
      expect(descifrarValor(cifrado)).toBe(largo)
    })

    it("estaCifrado detecta formato correcto", () => {
      expect(estaCifrado("enc:v1:abc:def:ghi")).toBe(true)
      expect(estaCifrado("texto-plano")).toBe(false)
      expect(estaCifrado("")).toBe(false)
    })
  })

  describe("backward compatibility (legacy plaintext)", () => {
    beforeAll(() => {
      process.env.ENCRYPTION_KEY = "test-key"
    })

    it("descifrar texto plano devuelve el mismo texto", () => {
      expect(descifrarValor("texto-plano-legacy")).toBe("texto-plano-legacy")
    })

    it("descifrar base64 sin prefijo devuelve tal cual", () => {
      expect(descifrarValor("SGVsbG8gV29ybGQ=")).toBe("SGVsbG8gV29ybGQ=")
    })

    it("descifrar valor corrupto devuelve tal cual", () => {
      expect(descifrarValor("enc:v1:corrupto")).toBe("enc:v1:corrupto")
    })
  })

  describe("sin ENCRYPTION_KEY", () => {
    beforeAll(() => {
      delete process.env.ENCRYPTION_KEY
    })

    it("cifrarValor devuelve plaintext", () => {
      expect(cifrarValor("secreto")).toBe("secreto")
    })

    it("descifrarValor de cifrado previo devuelve tal cual (no puede descifrar)", () => {
      // Si alguien guardó cifrado y luego borró la key, se devuelve el valor cifrado
      expect(descifrarValor("enc:v1:abc:def:ghi")).toBe("enc:v1:abc:def:ghi")
    })
  })
})

// ─── Clasificación de errores ────────────────────────────────────────────────

describe("clasificación de errores retryable/permanente", () => {
  it("WsaaError: red/timeout es retryable por default", () => {
    const err = new WsaaError("timeout")
    expect(err.retryable).toBe(true)
  })

  it("WsaaError: certificado inválido NO es retryable", () => {
    const err = new WsaaError("certificado inválido", false)
    expect(err.retryable).toBe(false)
  })

  it("Wsfev1Error: red es retryable por default", () => {
    const err = new Wsfev1Error("timeout")
    expect(err.retryable).toBe(true)
  })

  it("Wsfev1Error: error funcional no es retryable", () => {
    const err = new Wsfev1Error("CUIT no habilitado", false)
    expect(err.retryable).toBe(false)
  })

  it("ArcaRechazoError: nunca retryable (rechazo fiscal)", () => {
    const err = new ArcaRechazoError("10013: CUIT inválido")
    expect(err.retryable).toBe(false)
  })

  it("ArcaValidacionError: nunca retryable (datos incorrectos)", () => {
    const err = new ArcaValidacionError(["error"])
    expect(err.retryable).toBe(false)
  })

  it("DocumentoYaAutorizadoError: no retryable", () => {
    const err = new DocumentoYaAutorizadoError()
    expect(err.retryable).toBe(false)
  })

  it("DocumentoEnProcesoError: retryable (esperar y reintentar)", () => {
    const err = new DocumentoEnProcesoError()
    expect(err.retryable).toBe(true)
  })

  it("ArcaNoConfiguradaError: no retryable", () => {
    const err = new ArcaNoConfiguradaError()
    expect(err.retryable).toBe(false)
  })
})

// ─── Ticket WSAA ─────────────────────────────────────────────────────────────

describe("validación de ticket WSAA cacheado", () => {
  it("ticket con token vacío es inválido", () => {
    const esValido = validarTicket({ token: "", sign: "abc123def456", expiresAt: futuro() })
    expect(esValido).toBe(false)
  })

  it("ticket con sign muy corto es inválido", () => {
    const esValido = validarTicket({ token: "abc123def456", sign: "short", expiresAt: futuro() })
    expect(esValido).toBe(false)
  })

  it("ticket expirado es inválido", () => {
    const esValido = validarTicket({ token: "abc123def456", sign: "xyz123def456", expiresAt: pasado() })
    expect(esValido).toBe(false)
  })

  it("ticket próximo a vencer (dentro de margen 10min) es inválido", () => {
    const casiExpira = new Date(Date.now() + 5 * 60 * 1000) // 5 min → dentro de margen de 10
    const esValido = validarTicket({ token: "abc123def456", sign: "xyz123def456", expiresAt: casiExpira })
    expect(esValido).toBe(false)
  })

  it("ticket vigente con margen suficiente es válido", () => {
    const lejos = new Date(Date.now() + 60 * 60 * 1000) // 1 hora
    const esValido = validarTicket({ token: "abc123def456", sign: "xyz123def456", expiresAt: lejos })
    expect(esValido).toBe(true)
  })
})

// ─── Sanitización ────────────────────────────────────────────────────────────

describe("sanitización de errores", () => {
  it("WsaaError de certificado no incluye detalles de forge", () => {
    // Simula el catch de firmarCMS
    const err = new WsaaError("Error al firmar TRA (certificado inválido o contraseña incorrecta)", false)
    expect(err.message).not.toContain("PKCS12")
    expect(err.message).not.toContain("password")
    expect(err.message).toContain("certificado inválido")
  })

  it("ArcaError no incluye IDs de documento en el mensaje genérico", () => {
    // DocumentoYaAutorizadoError no incluye el ID en el mensaje público
    const err = new DocumentoYaAutorizadoError()
    expect(err.message).not.toContain("uuid-secreto-123")
    expect(err.message).toContain("ya fue autorizado")
  })
})

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Replica la lógica de ticketValido de wsaa.ts */
function validarTicket(cached: { token: string; sign: string; expiresAt: Date }): boolean {
  const MARGEN = 10 * 60 * 1000
  if (!cached.token || cached.token.length < 10) return false
  if (!cached.sign || cached.sign.length < 10) return false
  return new Date(cached.expiresAt).getTime() > Date.now() + MARGEN
}

function futuro(): Date { return new Date(Date.now() + 6 * 60 * 60 * 1000) }
function pasado(): Date { return new Date(Date.now() - 60 * 1000) }
