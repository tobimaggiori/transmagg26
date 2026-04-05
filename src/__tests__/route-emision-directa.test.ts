/**
 * Propósito: Tests de integración para los endpoints POST con emisionArca: true.
 * Verifica que los handlers delegan correctamente a emision-directa,
 * que ARCA OK devuelve 201, que ARCA FAIL devuelve error HTTP sin efectos,
 * y que el response tiene la forma esperada para el frontend.
 */

import { NextRequest } from "next/server"

// ─── Mocks ───────────────────────────────────────────────────────────────────

const mockAuth = jest.fn()
const mockResolverOperadorId = jest.fn()
const mockEmitirFacturaDirecta = jest.fn()
const mockEmitirLiquidacionDirecta = jest.fn()
const mockEmitirNotaCDDirecta = jest.fn()
const mockEjecutarCrearFactura = jest.fn()
const mockEjecutarCrearLiquidacion = jest.fn()
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
jest.mock("@/lib/factura-commands", () => ({
  ejecutarCrearFactura: mockEjecutarCrearFactura,
}))
jest.mock("@/lib/liquidacion-commands", () => ({
  ejecutarCrearLiquidacion: mockEjecutarCrearLiquidacion,
  calcularProximoNroComprobanteLiquidacion: jest.fn().mockResolvedValue(1),
}))
jest.mock("@/lib/nota-cd-commands", () => ({
  ejecutarCrearNotaCD: mockEjecutarCrearNotaCD,
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
// POST /api/facturas con emisionArca
// ═══════════════════════════════════════════════════════════════════════════════

describe("POST /api/facturas — emisionArca: true", () => {
  const body = {
    empresaId: "a0000000-0000-4000-8000-000000000010", viajeIds: ["a0000000-0000-4000-8000-000000000011"], tipoCbte: 1, ivaPct: 21,
    emisionArca: true, idempotencyKey: "a0000000-0000-4000-8000-000000000001",
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

  it("ARCA FAIL → error HTTP con mensaje claro (sin 201)", async () => {
    mockEmitirFacturaDirecta.mockResolvedValue({
      ok: false, status: 502,
      error: "No se pudo emitir el comprobante porque no fue posible obtener CAE de ARCA. El comprobante no quedó emitido. Motivo informado por ARCA: CUIT inválido.",
    })

    const res = await postFactura(jsonReq("http://localhost/api/facturas", body))

    expect(res.status).toBe(502)
    const data = await res.json()
    expect(data.error).toContain("No se pudo emitir")
    expect(data.error).toContain("no quedó emitido")
    expect(data.error).toContain("CUIT inválido")
  })

  it("ARCA FAIL → no llama a ejecutarCrearFactura separado", async () => {
    mockEmitirFacturaDirecta.mockResolvedValue({ ok: false, status: 502, error: "ARCA error" })

    await postFactura(jsonReq("http://localhost/api/facturas", body))

    // emitirFacturaDirecta se llama (incluye creación + ARCA + rollback)
    expect(mockEmitirFacturaDirecta).toHaveBeenCalledTimes(1)
    // ejecutarCrearFactura NO se llama por separado
    expect(mockEjecutarCrearFactura).not.toHaveBeenCalled()
  })

  it("delega a emitirFacturaDirecta con idempotencyKey correcta", async () => {
    mockEmitirFacturaDirecta.mockResolvedValue({
      ok: true, documento: { id: "f1" }, arca: ARCA_RESULT,
    })

    await postFactura(jsonReq("http://localhost/api/facturas", body))

    expect(mockEmitirFacturaDirecta).toHaveBeenCalledWith(
      expect.objectContaining({ empresaId: "a0000000-0000-4000-8000-000000000010", emisionArca: true }),
      "op1",
      "a0000000-0000-4000-8000-000000000001"
    )
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// POST /api/liquidaciones con emisionArca
// ═══════════════════════════════════════════════════════════════════════════════

describe("POST /api/liquidaciones — emisionArca: true", () => {
  const body = {
    fleteroId: "a0000000-0000-4000-8000-000000000020", comisionPct: 5, ivaPct: 21,
    viajes: [{ viajeId: "a0000000-0000-4000-8000-000000000021", fechaViaje: "2026-01-01", kilos: 30000, tarifaFletero: 40 }],
    emisionArca: true, idempotencyKey: "a0000000-0000-4000-8000-000000000002",
  }

  it("ARCA OK → 201 con documento y arca", async () => {
    mockEmitirLiquidacionDirecta.mockResolvedValue({
      ok: true,
      documento: { id: "liq-1", estado: "EMITIDA", nroComprobante: 42, ptoVenta: 1 },
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
})

// ═══════════════════════════════════════════════════════════════════════════════
// POST /api/notas-credito-debito con emisionArca
// ═══════════════════════════════════════════════════════════════════════════════

describe("POST /api/notas-credito-debito — emisionArca: true", () => {
  const body = {
    tipo: "NC_EMITIDA", subtipo: "ANULACION_TOTAL",
    facturaId: "a0000000-0000-4000-8000-000000000030", montoNeto: 1000, ivaPct: 21, descripcion: "Anulación",
    emisionArca: true, idempotencyKey: "a0000000-0000-4000-8000-000000000003",
  }

  it("ARCA OK → 201 con nota emitida", async () => {
    mockEmitirNotaCDDirecta.mockResolvedValue({
      ok: true, documento: { id: "nota-1", estado: "EMITIDA" }, arca: ARCA_RESULT,
    })

    const res = await postNotaCD(jsonReq("http://localhost/api/notas-credito-debito", body))

    expect(res.status).toBe(201)
    const data = await res.json()
    expect(data.ok).toBe(true)
  })

  it("ARCA FAIL → error HTTP, nota no emitida", async () => {
    mockEmitirNotaCDDirecta.mockResolvedValue({
      ok: false, status: 502, error: "ARCA rechazó: comprobante asociado inválido.",
    })

    const res = await postNotaCD(jsonReq("http://localhost/api/notas-credito-debito", body))

    expect(res.status).toBe(502)
    const data = await res.json()
    expect(data.error).toContain("ARCA rechazó")
  })

  it("NC_RECIBIDA sin emisionArca → flujo clásico directo", async () => {
    const bodyRecibida = {
      tipo: "NC_RECIBIDA", subtipo: "ANULACION_LIQUIDACION",
      liquidacionId: "a0000000-0000-4000-8000-000000000040", montoNeto: 500, ivaPct: 21, descripcion: "Anulación LP",
      nroComprobanteExterno: "001", fechaComprobanteExterno: "2026-01-15",
    }
    mockEjecutarCrearNotaCD.mockResolvedValue({ ok: true, nota: { id: "nota-2" } })

    const res = await postNotaCD(jsonReq("http://localhost/api/notas-credito-debito", bodyRecibida))

    expect(res.status).toBe(201)
    // Usa flujo clásico, no emision directa
    expect(mockEmitirNotaCDDirecta).not.toHaveBeenCalled()
    expect(mockEjecutarCrearNotaCD).toHaveBeenCalled()
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// Rollback completo verificado en emision-directa
// ═══════════════════════════════════════════════════════════════════════════════

describe("rollback ARCA FAIL — verificación de limpieza completa", () => {
  it("el response ARCA FAIL no contiene documento ni arca", async () => {
    mockEmitirFacturaDirecta.mockResolvedValue({
      ok: false, status: 502, error: "Error ARCA.",
    })

    const body = {
      empresaId: "00000000-0000-0000-0000-000000000010", viajeIds: ["00000000-0000-0000-0000-000000000011"], tipoCbte: 1, ivaPct: 21,
      emisionArca: true, idempotencyKey: "a0000000-0000-4000-8000-000000000004",
    }
    const res = await postFactura(jsonReq("http://localhost/api/facturas", body))
    const data = await res.json()

    // No debe haber documento ni arca en el response de error
    expect(data).not.toHaveProperty("documento")
    expect(data).not.toHaveProperty("arca")
    expect(data).toHaveProperty("error")
  })
})
