/**
 * Propósito: Tests de integración para los endpoints POST de comprobantes.
 *
 * Regla cerrada:
 * - ARCA devuelve CAE => comprobante queda EMITIDA
 * - ARCA no devuelve CAE => comprobante no se emite (no queda nada persistido)
 * - No existe flujo clásico (crear sin ARCA) para documentos emitidos
 * - NC/ND recibidas se crean sin ARCA (son documentos externos)
 */

import { NextRequest } from "next/server"

// ─── Mocks ───────────────────────────────────────────────────────────────────

const mockAuth = jest.fn()
const mockResolverOperadorId = jest.fn()
const mockEmitirFacturaDirecta = jest.fn()
const mockEmitirLiquidacionDirecta = jest.fn()
const mockEmitirNotaCDDirecta = jest.fn()
const mockEjecutarCrearNotaCD = jest.fn()

jest.mock("@/lib/auth", () => ({ auth: mockAuth }))
jest.mock("@/lib/session-utils", () => ({
  resolverOperadorId: mockResolverOperadorId,
  resolverEmpresaIdPorEmail: jest.fn(),
  resolverFleteroIdPorEmail: jest.fn(),
}))
jest.mock("@/lib/emision-directa", () => ({
  emitirFacturaDirecta: mockEmitirFacturaDirecta,
  emitirLiquidacionDirecta: mockEmitirLiquidacionDirecta,
  emitirNotaCDDirecta: mockEmitirNotaCDDirecta,
}))
jest.mock("@/lib/nota-cd-commands", () => ({
  ejecutarCrearNotaCD: mockEjecutarCrearNotaCD,
}))
jest.mock("@/lib/liquidacion-commands", () => ({
  calcularProximoNroComprobanteLiquidacion: jest.fn().mockResolvedValue(1),
}))
jest.mock("@/lib/prisma", () => ({
  prisma: {
    viaje: { findMany: jest.fn().mockResolvedValue([]) },
    facturaEmitida: { findMany: jest.fn().mockResolvedValue([]) },
    liquidacion: { findMany: jest.fn().mockResolvedValue([]) },
    fletero: { findUnique: jest.fn() },
    gastoFletero: { findMany: jest.fn().mockResolvedValue([]) },
    notaCreditoDebito: { findMany: jest.fn().mockResolvedValue([]) },
  },
}))

import { POST as postFactura } from "@/app/api/facturas/route"
import { POST as postLiquidacion } from "@/app/api/liquidaciones/route"
import { POST as postNotaCD } from "@/app/api/notas-credito-debito/route"

// ─── Helpers ─────────────────────────────────────────────────────────────────

function session() {
  return { user: { id: "u1", email: "admin@transmagg.com.ar", rol: "ADMIN_TRANSMAGG" } }
}

function jsonReq(url: string, body: unknown) {
  return new NextRequest(url, {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  })
}

const ARCA_RESULT = {
  ok: true, cae: "74120000000001", caeVto: new Date(),
  nroComprobante: 42, ptoVenta: 1, tipoCbte: 1, qrData: "qr",
}

beforeEach(() => {
  jest.clearAllMocks()
  mockAuth.mockResolvedValue(session())
  mockResolverOperadorId.mockResolvedValue("op1")
})

// ═══════════════════════════════════════════════════════════════════════════════
// Regla cerrada: factura SIEMPRE pasa por ARCA
// ═══════════════════════════════════════════════════════════════════════════════

describe("POST /api/facturas — emisión directa obligatoria", () => {
  const body = {
    empresaId: "a0000000-0000-4000-8000-000000000010",
    viajeIds: ["a0000000-0000-4000-8000-000000000011"],
    tipoCbte: 1,
    ivaPct: 21,
  }

  it("ARCA OK → 201 con documento y arca", async () => {
    mockEmitirFacturaDirecta.mockResolvedValue({
      ok: true,
      documento: { id: "fact-1", estado: "EMITIDA" },
      arca: ARCA_RESULT,
    })

    const res = await postFactura(jsonReq("http://localhost/api/facturas", body))

    expect(res.status).toBe(201)
    const data = await res.json()
    expect(data.ok).toBe(true)
    expect(data.documento.estado).toBe("EMITIDA")
    expect(data.arca.cae).toBe("74120000000001")
  })

  it("ARCA FAIL → error HTTP con mensaje claro, sin documento", async () => {
    mockEmitirFacturaDirecta.mockResolvedValue({
      ok: false, status: 502,
      error: "No se pudo emitir el comprobante porque no fue posible obtener CAE de ARCA. El comprobante no quedó emitido. Motivo informado por ARCA: CUIT inválido.",
    })

    const res = await postFactura(jsonReq("http://localhost/api/facturas", body))

    expect(res.status).toBe(502)
    const data = await res.json()
    expect(data.error).toContain("No se pudo emitir")
    expect(data.error).toContain("no quedó emitido")
    expect(data).not.toHaveProperty("documento")
  })

  it("siempre usa emitirFacturaDirecta (nunca ejecutarCrearFactura directo)", async () => {
    mockEmitirFacturaDirecta.mockResolvedValue({
      ok: true, documento: { id: "f1" }, arca: ARCA_RESULT,
    })

    await postFactura(jsonReq("http://localhost/api/facturas", body))

    expect(mockEmitirFacturaDirecta).toHaveBeenCalledTimes(1)
  })

  it("sin emisionArca ni idempotencyKey igual pasa por ARCA (auto-genera key)", async () => {
    mockEmitirFacturaDirecta.mockResolvedValue({
      ok: true, documento: { id: "f1" }, arca: ARCA_RESULT,
    })

    // Body sin emisionArca ni idempotencyKey
    await postFactura(jsonReq("http://localhost/api/facturas", body))

    expect(mockEmitirFacturaDirecta).toHaveBeenCalledTimes(1)
    // Se llamó con un idempotencyKey auto-generado (string UUID)
    const [, , key] = mockEmitirFacturaDirecta.mock.calls[0]
    expect(typeof key).toBe("string")
    expect(key.length).toBeGreaterThan(0)
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// Regla cerrada: liquidación SIEMPRE pasa por ARCA
// ═══════════════════════════════════════════════════════════════════════════════

describe("POST /api/liquidaciones — emisión directa obligatoria", () => {
  const body = {
    fleteroId: "a0000000-0000-4000-8000-000000000020", comisionPct: 5, ivaPct: 21,
    viajes: [{ viajeId: "a0000000-0000-4000-8000-000000000021", fechaViaje: "2026-01-01", kilos: 30000, tarifaFletero: 40 }],
  }

  it("ARCA OK → 201 con documento y arca", async () => {
    mockEmitirLiquidacionDirecta.mockResolvedValue({
      ok: true,
      documento: { id: "liq-1", estado: "EMITIDA" },
      arca: ARCA_RESULT,
    })

    const res = await postLiquidacion(jsonReq("http://localhost/api/liquidaciones", body))

    expect(res.status).toBe(201)
    const data = await res.json()
    expect(data.ok).toBe(true)
    expect(data.documento.estado).toBe("EMITIDA")
  })

  it("ARCA FAIL → error HTTP sin 201", async () => {
    mockEmitirLiquidacionDirecta.mockResolvedValue({
      ok: false, status: 502, error: "No se pudo emitir. Timeout WSAA.",
    })

    const res = await postLiquidacion(jsonReq("http://localhost/api/liquidaciones", body))

    expect(res.status).toBe(502)
    const data = await res.json()
    expect(data.error).toContain("No se pudo emitir")
  })

  it("sin emisionArca igual pasa por ARCA (auto-genera key)", async () => {
    mockEmitirLiquidacionDirecta.mockResolvedValue({
      ok: true, documento: { id: "liq-1" }, arca: ARCA_RESULT,
    })

    await postLiquidacion(jsonReq("http://localhost/api/liquidaciones", body))

    expect(mockEmitirLiquidacionDirecta).toHaveBeenCalledTimes(1)
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// Regla cerrada: NC/ND emitidas SIEMPRE pasan por ARCA
// ═══════════════════════════════════════════════════════════════════════════════

describe("POST /api/notas-credito-debito — NC/ND emitidas por ARCA", () => {
  const bodyNCEmitida = {
    tipo: "NC_EMITIDA", subtipo: "ANULACION_TOTAL",
    facturaId: "a0000000-0000-4000-8000-000000000030", montoNeto: 1000, ivaPct: 21, descripcion: "Anulación",
  }

  it("NC_EMITIDA → emisión directa ARCA", async () => {
    mockEmitirNotaCDDirecta.mockResolvedValue({
      ok: true, documento: { id: "nota-1", estado: "EMITIDA" }, arca: ARCA_RESULT,
    })

    const res = await postNotaCD(jsonReq("http://localhost/api/notas-credito-debito", bodyNCEmitida))

    expect(res.status).toBe(201)
    expect(mockEmitirNotaCDDirecta).toHaveBeenCalledTimes(1)
    expect(mockEjecutarCrearNotaCD).not.toHaveBeenCalled()
  })

  it("ND_EMITIDA → emisión directa ARCA", async () => {
    mockEmitirNotaCDDirecta.mockResolvedValue({
      ok: true, documento: { id: "nota-2", estado: "EMITIDA" }, arca: ARCA_RESULT,
    })

    const bodyND = {
      tipo: "ND_EMITIDA", subtipo: "DIFERENCIA_TARIFA",
      facturaId: "a0000000-0000-4000-8000-000000000030", montoNeto: 500, ivaPct: 21, descripcion: "Diferencia",
    }
    const res = await postNotaCD(jsonReq("http://localhost/api/notas-credito-debito", bodyND))

    expect(res.status).toBe(201)
    expect(mockEmitirNotaCDDirecta).toHaveBeenCalledTimes(1)
    expect(mockEjecutarCrearNotaCD).not.toHaveBeenCalled()
  })

  it("ARCA FAIL en NC_EMITIDA → error HTTP, nota no persiste", async () => {
    mockEmitirNotaCDDirecta.mockResolvedValue({
      ok: false, status: 502, error: "ARCA rechazó: comprobante asociado inválido.",
    })

    const res = await postNotaCD(jsonReq("http://localhost/api/notas-credito-debito", bodyNCEmitida))

    expect(res.status).toBe(502)
    const data = await res.json()
    expect(data.error).toContain("ARCA rechazó")
    expect(data).not.toHaveProperty("documento")
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// NC/ND recibidas: flujo clásico (sin ARCA)
// ═══════════════════════════════════════════════════════════════════════════════

describe("POST /api/notas-credito-debito — NC/ND recibidas sin ARCA", () => {
  it("NC_RECIBIDA → flujo clásico, sin ARCA", async () => {
    const bodyRecibida = {
      tipo: "NC_RECIBIDA", subtipo: "ANULACION_LIQUIDACION",
      liquidacionId: "a0000000-0000-4000-8000-000000000040", montoNeto: 500, ivaPct: 21, descripcion: "Anulación LP",
      nroComprobanteExterno: "001", fechaComprobanteExterno: "2026-01-15",
    }
    mockEjecutarCrearNotaCD.mockResolvedValue({ ok: true, nota: { id: "nota-2" } })

    const res = await postNotaCD(jsonReq("http://localhost/api/notas-credito-debito", bodyRecibida))

    expect(res.status).toBe(201)
    // Usa flujo clásico, no emisión directa
    expect(mockEmitirNotaCDDirecta).not.toHaveBeenCalled()
    expect(mockEjecutarCrearNotaCD).toHaveBeenCalled()
  })

  it("ND_RECIBIDA → flujo clásico, sin ARCA", async () => {
    const bodyND = {
      tipo: "ND_RECIBIDA", subtipo: "CHEQUE_RECHAZADO",
      chequeRecibidoId: "a0000000-0000-4000-8000-000000000050", montoNeto: 300, ivaPct: 21, descripcion: "Cheque rechazado",
    }
    mockEjecutarCrearNotaCD.mockResolvedValue({ ok: true, nota: { id: "nota-3" } })

    const res = await postNotaCD(jsonReq("http://localhost/api/notas-credito-debito", bodyND))

    expect(res.status).toBe(201)
    expect(mockEmitirNotaCDDirecta).not.toHaveBeenCalled()
    expect(mockEjecutarCrearNotaCD).toHaveBeenCalled()
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// Invariantes de respuesta
// ═══════════════════════════════════════════════════════════════════════════════

describe("invariantes de respuesta", () => {
  it("ARCA FAIL no contiene documento ni arca en response", async () => {
    mockEmitirFacturaDirecta.mockResolvedValue({
      ok: false, status: 502, error: "Error ARCA.",
    })

    const body = {
      empresaId: "00000000-0000-0000-0000-000000000010",
      viajeIds: ["00000000-0000-0000-0000-000000000011"],
      tipoCbte: 1, ivaPct: 21,
    }
    const res = await postFactura(jsonReq("http://localhost/api/facturas", body))
    const data = await res.json()

    expect(data).not.toHaveProperty("documento")
    expect(data).not.toHaveProperty("arca")
    expect(data).toHaveProperty("error")
  })
})
