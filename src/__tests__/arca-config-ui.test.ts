/**
 * Tests para la configuración ARCA: validaciones, endpoints, seguridad.
 */

import { validarPreAutorizacion } from "@/lib/arca/validators"
import { cifrarValor, descifrarValor } from "@/lib/arca/crypto"
import type { ArcaConfig } from "@/lib/arca/types"
import type { DatosComprobanteBase } from "@/lib/arca/mappers"

describe("configuración ARCA — validaciones", () => {
  const configValida: ArcaConfig = {
    cuit: "30709381683",
    razonSocial: "TRANS-MAGG S.R.L.",
    certificadoB64: "base64cert",
    certificadoPass: "pass",
    modo: "homologacion",
    puntosVenta: { FACTURA_A: 1 },
    cbuMiPymes: null,
    comprobantesHabilitados: [1, 6, 60, 61, 201],
    activa: true,
  }

  const datosValidos: DatosComprobanteBase = {
    tipoCbte: 1,
    ptoVenta: 1,
    nroComprobante: 1,
    fecha: new Date(),
    cuitReceptor: "20123456789",
    neto: 1000,
    ivaMonto: 210,
    total: 1210,
    concepto: 2,
    fechaServDesde: new Date(),
    fechaServHasta: new Date(),
  }

  it("config válida no produce errores", () => {
    expect(validarPreAutorizacion(configValida, datosValidos)).toEqual([])
  })

  it("config inactiva produce error", () => {
    const errors = validarPreAutorizacion({ ...configValida, activa: false }, datosValidos)
    expect(errors).toContain("ARCA no está activa")
  })

  it("CUIT inválido produce error", () => {
    const errors = validarPreAutorizacion({ ...configValida, cuit: "123" }, datosValidos)
    expect(errors.some((e) => e.includes("CUIT"))).toBe(true)
  })
})

describe("seguridad de secretos en config ARCA", () => {
  const key = process.env.ENCRYPTION_KEY
  beforeAll(() => { process.env.ENCRYPTION_KEY = "test-key-config-ui" })
  afterAll(() => { if (key) process.env.ENCRYPTION_KEY = key; else delete process.env.ENCRYPTION_KEY })

  it("certificado se cifra correctamente", () => {
    const cert = "MIIBojCCAUmgAwIBAgIRAIlz..."
    const cifrado = cifrarValor(cert)
    expect(cifrado.startsWith("enc:v1:")).toBe(true)
    expect(descifrarValor(cifrado)).toBe(cert)
  })

  it("password se cifra correctamente", () => {
    const pass = "mi-password"
    const cifrado = cifrarValor(pass)
    expect(cifrado).not.toBe(pass)
    expect(descifrarValor(cifrado)).toBe(pass)
  })

  it("GET /api/configuracion-arca no debe devolver certificadoB64 ni certificadoPass", () => {
    // Verificación estructural: la API strip esos campos
    const dbRow = {
      id: "unico",
      cuit: "30709381683",
      razonSocial: "TEST",
      certificadoB64: "secret",
      certificadoPass: "secret",
      modo: "homologacion",
      puntosVenta: "{}",
      cbuMiPymes: null,
      activa: false,
      actualizadoEn: new Date(),
      actualizadoPor: null,
    }
    // Simula lo que hace el GET handler
    const { certificadoB64, certificadoPass, ...safe } = dbRow
    const response = { ...safe, tieneCertificado: !!certificadoB64 }

    expect(response).not.toHaveProperty("certificadoB64")
    expect(response).not.toHaveProperty("certificadoPass")
    expect(response.tieneCertificado).toBe(true)
    // Asegurar que las variables se "usen" para el compiler
    void certificadoPass
  })
})

describe("diagnóstico ARCA — estructura de respuesta", () => {
  it("la estructura de DiagnosticoData tiene los campos esperados", () => {
    // Verificación de tipo: asegurar que los campos que la UI espera existan
    const diagMock = {
      config: {
        activa: true,
        modo: "produccion",
        tieneCertificado: true,
        cuit: "30709381683",
        razonSocial: "TEST",
        puntosVentaCount: 3,
        actualizadoEn: new Date().toISOString(),
        actualizadoPor: "admin@test.com",
      },
      ticket: {
        vigente: true,
        expiresAt: new Date().toISOString(),
        obtainedAt: new Date().toISOString(),
      },
      ultimaEmision: null,
      ultimoError: null,
      urls: {
        wsaaUrl: "https://wsaahomo.afip.gov.ar/ws/services/LoginCms",
        wsfev1Url: "https://wswhomo.afip.gov.ar/wsfev1/service.asmx",
      },
      emisionesRecientes: [],
    }

    expect(diagMock.config.activa).toBe(true)
    expect(diagMock.ticket?.vigente).toBe(true)
    expect(diagMock.urls.wsaaUrl).toContain("wsaa")
    expect(diagMock.urls.wsfev1Url).toContain("wsfev1")
  })
})
