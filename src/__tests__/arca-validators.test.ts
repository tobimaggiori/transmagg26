/**
 * Tests unitarios para src/lib/arca/validators.ts
 * Cubre: validación pre-autorización y verificación de estado de documento.
 */

import { validarPreAutorizacion, validarDocumentoNoAutorizado } from "@/lib/arca/validators"
import type { ArcaConfig } from "@/lib/arca/types"
import type { DatosComprobanteBase } from "@/lib/arca/mappers"

const configOk: ArcaConfig = {
  cuit: "30709381683",
  razonSocial: "TRANS-MAGG S.R.L.",
  certificadoB64: "base64cert",
  certificadoPass: "pass",
  modo: "homologacion",
  puntosVenta: { FACTURA_A: 1 },
  cbuMiPymes: null,
  comprobantesHabilitados: [1, 2, 3, 6, 7, 8, 60, 61, 201, 202, 203],
  activa: true,
}

const datosOk: DatosComprobanteBase = {
  tipoCbte: 60,
  ptoVenta: 1,
  nroComprobante: 43,
  fecha: new Date(2026, 3, 3),
  cuitReceptor: "20123456789",
  neto: 100000,
  ivaMonto: 21000,
  total: 121000,
  concepto: 2,
  fechaServDesde: new Date(2026, 2, 1),
  fechaServHasta: new Date(2026, 2, 31),
}

// ─── validarPreAutorizacion ──────────────────────────────────────────────────

describe("validarPreAutorizacion", () => {
  it("retorna array vacío cuando todo es válido", () => {
    expect(validarPreAutorizacion(configOk, datosOk)).toEqual([])
  })

  it("detecta config ARCA inactiva", () => {
    const config = { ...configOk, activa: false }
    const errores = validarPreAutorizacion(config, datosOk)
    expect(errores).toContain("ARCA no está activa")
  })

  it("detecta CUIT emisor inválido", () => {
    const config = { ...configOk, cuit: "123" }
    const errores = validarPreAutorizacion(config, datosOk)
    expect(errores).toContain("CUIT del emisor inválido")
  })

  it("detecta CUIT receptor inválido", () => {
    const datos = { ...datosOk, cuitReceptor: "999" }
    const errores = validarPreAutorizacion(configOk, datos)
    expect(errores.some((e) => e.includes("CUIT del receptor"))).toBe(true)
  })

  it("detecta neto <= 0", () => {
    const datos = { ...datosOk, neto: 0 }
    const errores = validarPreAutorizacion(configOk, datos)
    expect(errores).toContain("El neto debe ser mayor a 0")
  })

  it("detecta inconsistencia monetaria (total ≠ neto + IVA)", () => {
    const datos = { ...datosOk, total: 999999 }
    const errores = validarPreAutorizacion(configOk, datos)
    expect(errores.some((e) => e.includes("no coincide"))).toBe(true)
  })

  it("detecta punto de venta inválido", () => {
    const datos = { ...datosOk, ptoVenta: 0 }
    const errores = validarPreAutorizacion(configOk, datos)
    expect(errores).toContain("Punto de venta inválido")
  })

  it("detecta tipo de comprobante no soportado", () => {
    const datos = { ...datosOk, tipoCbte: 999 }
    const errores = validarPreAutorizacion(configOk, datos)
    expect(errores.some((e) => e.includes("no soportado"))).toBe(true)
  })

  it("requiere comprobante asociado para NC tipo 3", () => {
    const datos = { ...datosOk, tipoCbte: 3 }
    const errores = validarPreAutorizacion(configOk, datos)
    expect(errores.some((e) => e.includes("comprobante asociado"))).toBe(true)
  })

  it("requiere comprobante asociado para ND tipo 2", () => {
    const datos = { ...datosOk, tipoCbte: 2 }
    const errores = validarPreAutorizacion(configOk, datos)
    expect(errores.some((e) => e.includes("comprobante asociado"))).toBe(true)
  })

  it("no requiere comprobante asociado para LP tipo 60", () => {
    const errores = validarPreAutorizacion(configOk, datosOk)
    expect(errores.some((e) => e.includes("comprobante asociado"))).toBe(false)
  })

  it("requiere CBU para FCE MiPyME tipo 201", () => {
    const datos = { ...datosOk, tipoCbte: 201 }
    const errores = validarPreAutorizacion(configOk, datos)
    expect(errores.some((e) => e.includes("CBU"))).toBe(true)
  })

  it("acepta tipo 201 con CBU presente", () => {
    const datos = { ...datosOk, tipoCbte: 201, cbuMiPymes: "1234567890123456789012" }
    const errores = validarPreAutorizacion(configOk, datos)
    expect(errores.some((e) => e.includes("CBU"))).toBe(false)
  })

  it("detecta fecha inicio servicio posterior a fin", () => {
    const datos = {
      ...datosOk,
      fechaServDesde: new Date(2026, 3, 15),
      fechaServHasta: new Date(2026, 3, 1),
    }
    const errores = validarPreAutorizacion(configOk, datos)
    expect(errores.some((e) => e.includes("fecha de inicio"))).toBe(true)
  })

  it("detecta falta de fechas de servicio para concepto 2", () => {
    const datos = { ...datosOk, fechaServDesde: undefined, fechaServHasta: undefined }
    const errores = validarPreAutorizacion(configOk, datos)
    expect(errores.some((e) => e.includes("fecha de inicio"))).toBe(true)
  })

  it("detecta nroComprobante inválido", () => {
    const datos = { ...datosOk, nroComprobante: 0 }
    const errores = validarPreAutorizacion(configOk, datos)
    expect(errores.some((e) => e.includes("Número de comprobante"))).toBe(true)
  })

  it("valida comprobante asociado con datos inválidos", () => {
    const datos = {
      ...datosOk,
      tipoCbte: 3,
      comprobanteAsociado: {
        tipo: 0,
        ptoVta: 0,
        nro: 0,
        cuit: "123",
        fecha: new Date(),
      },
    }
    const errores = validarPreAutorizacion(configOk, datos)
    expect(errores.length).toBeGreaterThanOrEqual(3) // tipo, ptoVta, nro, cuit inválidos
  })
})

// ─── validarDocumentoNoAutorizado ────────────────────────────────────────────

describe("validarDocumentoNoAutorizado", () => {
  it("retorna null para PENDIENTE", () => {
    expect(validarDocumentoNoAutorizado("PENDIENTE")).toBeNull()
  })

  it("retorna null para RECHAZADA (puede reintentarse)", () => {
    expect(validarDocumentoNoAutorizado("RECHAZADA")).toBeNull()
  })

  it("retorna null para null", () => {
    expect(validarDocumentoNoAutorizado(null)).toBeNull()
  })

  it("retorna error para AUTORIZADA", () => {
    expect(validarDocumentoNoAutorizado("AUTORIZADA")).toContain("ya fue autorizado")
  })

  it("retorna error para EN_PROCESO", () => {
    expect(validarDocumentoNoAutorizado("EN_PROCESO")).toContain("siendo procesado")
  })
})
