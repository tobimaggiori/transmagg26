/**
 * Tests reales de concurrencia e idempotencia del service ARCA.
 * Mockea Prisma, WSAA, WSFEv1 y config para ejercitar la lógica real
 * de autorizarLiquidacionArca incluyendo tomarLock* (updateMany).
 */

// ─── Mocks ───────────────────────────────────────────────────────────────────

const mockPrisma = {
  liquidacion: {
    findUnique: jest.fn(),
    updateMany: jest.fn(),
    update: jest.fn(),
  },
  configuracionArca: {
    findUnique: jest.fn(),
  },
  ticketWsaa: {
    findUnique: jest.fn(),
    upsert: jest.fn(),
  },
}

jest.mock("@/lib/prisma", () => ({ prisma: mockPrisma }))

jest.mock("@/lib/arca/config", () => ({
  cargarConfigArca: jest.fn(),
  resolverUrls: jest.fn().mockReturnValue({
    wsaaUrl: "https://wsaahomo.afip.gov.ar/ws/services/LoginCms",
    wsfev1Url: "https://wswhomo.afip.gov.ar/wsfev1/service.asmx",
  }),
}))

jest.mock("@/lib/arca/wsaa", () => ({
  obtenerTicketWsaa: jest.fn(),
}))

jest.mock("@/lib/arca/wsfev1", () => ({
  feCompUltimoAutorizado: jest.fn(),
  feCAESolicitar: jest.fn(),
}))

// Mock dynamic imports para PDF/storage (no nos interesan en estos tests)
jest.mock("@/lib/storage", () => ({
  storageConfigurado: jest.fn().mockReturnValue(false),
  subirPDF: jest.fn(),
}))
jest.mock("@/lib/pdf-liquidacion", () => ({
  generarPDFLiquidacion: jest.fn(),
}))

import { autorizarLiquidacionArca } from "@/lib/arca/service"
import { cargarConfigArca } from "@/lib/arca/config"
import { obtenerTicketWsaa } from "@/lib/arca/wsaa"
import { feCompUltimoAutorizado, feCAESolicitar } from "@/lib/arca/wsfev1"
import {
  DocumentoYaAutorizadoError,
  DocumentoEnProcesoError,
  DocumentoNoEncontradoError,
} from "@/lib/arca/errors"
import type { ArcaConfig } from "@/lib/arca/types"

// ─── Fixtures ────────────────────────────────────────────────────────────────

const CONFIG_MOCK: ArcaConfig = {
  cuit: "30709381683",
  razonSocial: "TRANS-MAGG S.R.L.",
  certificadoB64: "cert",
  certificadoPass: "pass",
  modo: "homologacion",
  puntosVenta: { FACTURA_A: 1 },
  cbuMiPymes: null,
  activa: true,
}

const LIQ_MOCK = {
  id: "liq-001",
  estado: "EMITIDA",
  arcaEstado: "PENDIENTE",
  idempotencyKey: null,
  cae: null,
  caeVto: null,
  qrData: null,
  nroComprobante: 1,
  ptoVenta: 1,
  tipoCbte: 186,
  neto: 100000,
  ivaMonto: 21000,
  total: 121000,
  grabadaEn: new Date("2026-04-01"),
  fletero: { cuit: "20123456789", condicionIva: "RESPONSABLE_INSCRIPTO" },
  viajes: [{ fechaViaje: new Date("2026-03-15") }, { fechaViaje: new Date("2026-03-28") }],
}

const TICKET_MOCK = {
  token: "TOKEN_LARGO_SUFICIENTE_PARA_PASAR_VALIDACION",
  sign: "SIGN_LARGO_SUFICIENTE_PARA_PASAR_VALIDACION",
  expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000),
}

const FECAE_RESPONSE_OK = {
  FeCabResp: { Cuit: 30709381683, PtoVta: 1, CbteTipo: 186, FchProceso: "20260401", CantReg: 1, Resultado: "A" },
  FeDetResp: {
    FECAEDetResponse: [{
      Concepto: 2, DocTipo: 80, DocNro: 20123456789,
      CbteDesde: 42, CbteHasta: 42, CbteFch: "20260401",
      Resultado: "A" as const,
      CAE: "74123456789012",
      CAEFchVto: "20260415",
      Observaciones: null,
    }],
  },
  Errors: null,
  Events: null,
}

// ─── Setup ───────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  (cargarConfigArca as jest.Mock).mockResolvedValue(CONFIG_MOCK);
  (obtenerTicketWsaa as jest.Mock).mockResolvedValue(TICKET_MOCK);
  (feCompUltimoAutorizado as jest.Mock).mockResolvedValue({ PtoVta: 1, CbteTipo: 186, CbteNro: 41 });
  (feCAESolicitar as jest.Mock).mockResolvedValue(FECAE_RESPONSE_OK)
  mockPrisma.liquidacion.update.mockResolvedValue({})
})

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("autorizarLiquidacionArca — lock atómico real", () => {
  it("toma el lock con updateMany y procede cuando count=1", async () => {
    mockPrisma.liquidacion.findUnique.mockResolvedValue({ ...LIQ_MOCK })
    mockPrisma.liquidacion.updateMany.mockResolvedValue({ count: 1 })

    const result = await autorizarLiquidacionArca("liq-001", "key-001")

    // Verificar que updateMany fue llamado con WHERE condicional
    expect(mockPrisma.liquidacion.updateMany).toHaveBeenCalledWith({
      where: {
        id: "liq-001",
        arcaEstado: { in: ["PENDIENTE", "RECHAZADA"] },
      },
      data: { arcaEstado: "EN_PROCESO", idempotencyKey: "key-001" },
    })

    // Verificar que la autorización se completó
    expect(result.ok).toBe(true)
    expect(result.cae).toBe("74123456789012")
  })

  it("aborta con DocumentoEnProcesoError cuando updateMany devuelve count=0 (EN_PROCESO)", async () => {
    mockPrisma.liquidacion.findUnique
      .mockResolvedValueOnce({ ...LIQ_MOCK }) // primera lectura: PENDIENTE
      .mockResolvedValueOnce({ arcaEstado: "EN_PROCESO" }) // relectura post-lock fallido
    mockPrisma.liquidacion.updateMany.mockResolvedValue({ count: 0 })

    await expect(autorizarLiquidacionArca("liq-001", "key-001"))
      .rejects.toThrow(DocumentoEnProcesoError)

    // updateMany se llamó pero no matcheó (otro proceso ya lo tomó)
    expect(mockPrisma.liquidacion.updateMany).toHaveBeenCalledTimes(1)
    // feCAESolicitar NO se llamó (se abortó antes)
    expect(feCAESolicitar).not.toHaveBeenCalled()
  })

  it("aborta con DocumentoYaAutorizadoError cuando updateMany count=0 y relectura da AUTORIZADA", async () => {
    mockPrisma.liquidacion.findUnique
      .mockResolvedValueOnce({ ...LIQ_MOCK }) // primera lectura
      .mockResolvedValueOnce({ arcaEstado: "AUTORIZADA" }) // relectura: ya autorizado
    mockPrisma.liquidacion.updateMany.mockResolvedValue({ count: 0 })

    await expect(autorizarLiquidacionArca("liq-001", "key-001"))
      .rejects.toThrow(DocumentoYaAutorizadoError)
  })

  it("permite reintentar desde RECHAZADA (updateMany matchea RECHAZADA)", async () => {
    const liqRechazada = { ...LIQ_MOCK, arcaEstado: "RECHAZADA" }
    mockPrisma.liquidacion.findUnique.mockResolvedValue(liqRechazada)
    mockPrisma.liquidacion.updateMany.mockResolvedValue({ count: 1 })

    const result = await autorizarLiquidacionArca("liq-001", "key-002")

    expect(result.ok).toBe(true)
    expect(mockPrisma.liquidacion.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          arcaEstado: { in: ["PENDIENTE", "RECHAZADA"] },
        }),
      })
    )
  })
})

describe("autorizarLiquidacionArca — idempotencia real", () => {
  it("misma key + AUTORIZADA devuelve resultado sin llamar ARCA", async () => {
    const liqAutorizada = {
      ...LIQ_MOCK,
      arcaEstado: "AUTORIZADA",
      idempotencyKey: "key-001",
      cae: "74123456789012",
      caeVto: new Date("2026-04-15"),
      qrData: "eyJ2ZXIiOjF9",
    }
    mockPrisma.liquidacion.findUnique.mockResolvedValue(liqAutorizada)

    const result = await autorizarLiquidacionArca("liq-001", "key-001")

    expect(result.ok).toBe(true)
    expect(result.cae).toBe("74123456789012")
    // No se llamó a updateMany (no intentó tomar lock)
    expect(mockPrisma.liquidacion.updateMany).not.toHaveBeenCalled()
    // No se llamó a WSAA ni WSFEv1
    expect(obtenerTicketWsaa).not.toHaveBeenCalled()
    expect(feCAESolicitar).not.toHaveBeenCalled()
  })

  it("key diferente + AUTORIZADA lanza DocumentoYaAutorizadoError", async () => {
    const liqAutorizada = {
      ...LIQ_MOCK,
      arcaEstado: "AUTORIZADA",
      idempotencyKey: "key-vieja",
      cae: "74123456789012",
    }
    mockPrisma.liquidacion.findUnique.mockResolvedValue(liqAutorizada)

    await expect(autorizarLiquidacionArca("liq-001", "key-nueva"))
      .rejects.toThrow(DocumentoYaAutorizadoError)

    expect(feCAESolicitar).not.toHaveBeenCalled()
  })
})

describe("autorizarLiquidacionArca — doble ejecución simulada", () => {
  it("solo la primera ejecución completa la autorización", async () => {
    mockPrisma.liquidacion.findUnique
      .mockResolvedValueOnce({ ...LIQ_MOCK }) // request A: lee PENDIENTE
      .mockResolvedValueOnce({ ...LIQ_MOCK }) // request B: lee PENDIENTE (antes del lock)
      .mockResolvedValueOnce({ arcaEstado: "EN_PROCESO" }) // request B: relectura post-lock fallido

    // Request A obtiene el lock
    mockPrisma.liquidacion.updateMany
      .mockResolvedValueOnce({ count: 1 }) // request A: lock OK
      .mockResolvedValueOnce({ count: 0 }) // request B: lock FAIL

    // Ejecutar ambos "simultáneamente"
    const requestA = autorizarLiquidacionArca("liq-001", "key-A")
    const requestB = autorizarLiquidacionArca("liq-001", "key-B")

    const [resultA, resultB] = await Promise.allSettled([requestA, requestB])

    // A completó exitosamente
    expect(resultA.status).toBe("fulfilled")
    if (resultA.status === "fulfilled") {
      expect(resultA.value.ok).toBe(true)
      expect(resultA.value.cae).toBe("74123456789012")
    }

    // B falló con DocumentoEnProcesoError
    expect(resultB.status).toBe("rejected")
    if (resultB.status === "rejected") {
      expect(resultB.reason).toBeInstanceOf(DocumentoEnProcesoError)
    }

    // feCAESolicitar se llamó exactamente 1 vez (solo request A)
    expect(feCAESolicitar).toHaveBeenCalledTimes(1)
  })
})

describe("autorizarLiquidacionArca — casos de error", () => {
  it("lanza DocumentoNoEncontradoError si la liquidación no existe", async () => {
    mockPrisma.liquidacion.findUnique.mockResolvedValue(null)

    await expect(autorizarLiquidacionArca("liq-inexistente", "key-001"))
      .rejects.toThrow(DocumentoNoEncontradoError)
  })

  it("lanza DocumentoEnProcesoError si arcaEstado es EN_PROCESO antes del lock", async () => {
    mockPrisma.liquidacion.findUnique.mockResolvedValue({ ...LIQ_MOCK, arcaEstado: "EN_PROCESO" })

    await expect(autorizarLiquidacionArca("liq-001", "key-001"))
      .rejects.toThrow(DocumentoEnProcesoError)

    // No intentó tomar lock (falló en la verificación previa)
    expect(mockPrisma.liquidacion.updateMany).not.toHaveBeenCalled()
  })

  it("revierte estado a PENDIENTE si falla después del lock", async () => {
    mockPrisma.liquidacion.findUnique.mockResolvedValue({ ...LIQ_MOCK })
    mockPrisma.liquidacion.updateMany.mockResolvedValue({ count: 1 });
    // Hacer que WSAA falle
    (obtenerTicketWsaa as jest.Mock).mockRejectedValue(new Error("WSAA timeout"))

    await expect(autorizarLiquidacionArca("liq-001", "key-001"))
      .rejects.toThrow()

    // Verificar que se revirtió el estado
    expect(mockPrisma.liquidacion.update).toHaveBeenCalledWith({
      where: { id: "liq-001" },
      data: { arcaEstado: "PENDIENTE" },
    })
  })
})

describe("autorizarLiquidacionArca — persistencia post-CAE", () => {
  it("persiste todos los campos ARCA después de autorización exitosa", async () => {
    mockPrisma.liquidacion.findUnique.mockResolvedValue({ ...LIQ_MOCK })
    mockPrisma.liquidacion.updateMany.mockResolvedValue({ count: 1 })

    await autorizarLiquidacionArca("liq-001", "key-001")

    // Verificar que update se llamó con los campos ARCA
    const updateCalls = mockPrisma.liquidacion.update.mock.calls
    const persistCall = updateCalls.find(
      (call: unknown[]) => (call[0] as { data: Record<string, unknown> }).data.cae !== undefined
    )

    expect(persistCall).toBeDefined()
    const data = (persistCall[0] as { data: Record<string, unknown> }).data
    expect(data.cae).toBe("74123456789012")
    expect(data.arcaEstado).toBe("AUTORIZADA")
    expect(data.nroComprobante).toBe(42) // ultimo (41) + 1
    expect(data.requestArcaJson).toBeDefined()
    expect(data.responseArcaJson).toBeDefined()
    expect(data.qrData).toBeDefined()
    expect(data.autorizadaEn).toBeInstanceOf(Date)
  })
})
