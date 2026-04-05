/**
 * Propósito: Tests de integración para route handlers de liquidación individual.
 * Verifica que GET/PATCH /api/liquidaciones/[id] y GET /api/liquidaciones/[id]/pdf
 * aplican ownership checks, bloquean acceso indebido y validan transiciones.
 */

import { NextRequest } from "next/server"

// ─── Mocks ───────────────────────────────────────────────────────────────────

const mockAuth = jest.fn()
const mockPrisma = {
  liquidacion: { findUnique: jest.fn(), update: jest.fn() },
}
const mockVerificarPropietarioFletero = jest.fn()
const mockObtenerUrlFirmada = jest.fn()
const mockStorageConfigurado = jest.fn()
const mockSubirPDF = jest.fn()
const mockGenerarPDFLiquidacion = jest.fn()

jest.mock("@/lib/auth", () => ({ auth: mockAuth }))
jest.mock("@/lib/prisma", () => ({ prisma: mockPrisma }))
jest.mock("@/lib/session-utils", () => ({
  verificarPropietarioFletero: mockVerificarPropietarioFletero,
}))
jest.mock("@/lib/storage", () => ({
  obtenerUrlFirmada: mockObtenerUrlFirmada,
  storageConfigurado: mockStorageConfigurado,
  subirPDF: mockSubirPDF,
}))
jest.mock("@/lib/pdf-liquidacion", () => ({
  generarPDFLiquidacion: mockGenerarPDFLiquidacion,
}))

import { GET as getLiquidacion, PATCH as patchLiquidacion } from "@/app/api/liquidaciones/[id]/route"
import { GET as getLiquidacionPdf } from "@/app/api/liquidaciones/[id]/pdf/route"

// ─── Helpers ─────────────────────────────────────────────────────────────────

function session(rol: string, email = "user@test.com") {
  return { user: { id: "u1", email, rol } }
}

const LIQ_MOCK = {
  id: "liq-1",
  fleteroId: "flet-1",
  estado: "EMITIDA",
  total: 120000,
  neto: 99173.55,
  ivaMonto: 20826.45,
  ivaPct: 21,
  comisionPct: 5,
  nroComprobante: "42",
  ptoVenta: 1,
  pdfS3Key: null,
  grabadaEn: new Date("2026-01-15"),
  fletero: { razonSocial: "Fletero Test", cuit: "20-33445566-7" },
  operador: { nombre: "Ana", apellido: "García" },
  viajes: [
    {
      id: "vel-1",
      viajeId: "v1",
      liquidacionId: "liq-1",
      tarifaFletero: 40,
      kilos: 30000,
      subtotal: 1200,
      origen: "Rosario",
      destino: "Buenos Aires",
    },
  ],
  pagos: [],
}

function req(url = "http://localhost/api/liquidaciones/liq-1") {
  return new NextRequest(url)
}
function patchReq(body: unknown) {
  return new NextRequest("http://localhost/api/liquidaciones/liq-1", {
    method: "PATCH",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  })
}
const params = { params: { id: "liq-1" } }

beforeEach(() => jest.clearAllMocks())

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/liquidaciones/[id]
// ═══════════════════════════════════════════════════════════════════════════════

describe("GET /api/liquidaciones/[id] — autenticación", () => {
  it("sin sesión → 401", async () => {
    mockAuth.mockResolvedValue(null)
    const res = await getLiquidacion(req(), params)
    expect(res.status).toBe(401)
  })
})

describe("GET /api/liquidaciones/[id] — acceso por rol", () => {
  it("ADMIN_EMPRESA → 403 (no es fletero ni interno)", async () => {
    mockAuth.mockResolvedValue(session("ADMIN_EMPRESA"))
    mockPrisma.liquidacion.findUnique.mockResolvedValue(LIQ_MOCK)
    const res = await getLiquidacion(req(), params)
    expect(res.status).toBe(403)
  })

  it("OPERADOR_EMPRESA → 403", async () => {
    mockAuth.mockResolvedValue(session("OPERADOR_EMPRESA"))
    mockPrisma.liquidacion.findUnique.mockResolvedValue(LIQ_MOCK)
    const res = await getLiquidacion(req(), params)
    expect(res.status).toBe(403)
  })

  it("CHOFER → 403", async () => {
    mockAuth.mockResolvedValue(session("CHOFER"))
    mockPrisma.liquidacion.findUnique.mockResolvedValue(LIQ_MOCK)
    const res = await getLiquidacion(req(), params)
    expect(res.status).toBe(403)
  })
})

describe("GET /api/liquidaciones/[id] — ownership fletero", () => {
  it("FLETERO dueño → 200 con tarifaFletero visible", async () => {
    mockAuth.mockResolvedValue(session("FLETERO", "fletero@test.com"))
    mockPrisma.liquidacion.findUnique.mockResolvedValue(LIQ_MOCK)
    mockVerificarPropietarioFletero.mockResolvedValue(true)

    const res = await getLiquidacion(req(), params)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.id).toBe("liq-1")
    expect(body.viajes[0].tarifaFletero).toBe(40)
    expect(body.viajes[0].subtotal).toBe(1200)
    expect(mockVerificarPropietarioFletero).toHaveBeenCalledWith("flet-1", "fletero@test.com")
  })

  it("FLETERO ajeno → 403 (no filtra datos de la liquidación)", async () => {
    mockAuth.mockResolvedValue(session("FLETERO", "intruso@otro.com"))
    mockPrisma.liquidacion.findUnique.mockResolvedValue(LIQ_MOCK)
    mockVerificarPropietarioFletero.mockResolvedValue(false)

    const res = await getLiquidacion(req(), params)
    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body).not.toHaveProperty("viajes")
    expect(body).not.toHaveProperty("total")
    expect(body).not.toHaveProperty("fletero")
  })
})

describe("GET /api/liquidaciones/[id] — acceso interno", () => {
  it("ADMIN_TRANSMAGG → 200 con tarifaFletero", async () => {
    mockAuth.mockResolvedValue(session("ADMIN_TRANSMAGG"))
    mockPrisma.liquidacion.findUnique.mockResolvedValue(LIQ_MOCK)

    const res = await getLiquidacion(req(), params)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.viajes[0].tarifaFletero).toBe(40)
    expect(mockVerificarPropietarioFletero).not.toHaveBeenCalled()
  })

  it("OPERADOR_TRANSMAGG → 200 con tarifaFletero", async () => {
    mockAuth.mockResolvedValue(session("OPERADOR_TRANSMAGG"))
    mockPrisma.liquidacion.findUnique.mockResolvedValue(LIQ_MOCK)

    const res = await getLiquidacion(req(), params)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.viajes[0].tarifaFletero).toBe(40)
  })
})

describe("GET /api/liquidaciones/[id] — recurso inexistente", () => {
  it("liquidación no encontrada → 404", async () => {
    mockAuth.mockResolvedValue(session("ADMIN_TRANSMAGG"))
    mockPrisma.liquidacion.findUnique.mockResolvedValue(null)

    const res = await getLiquidacion(req(), params)
    expect(res.status).toBe(404)
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/liquidaciones/[id]/pdf
// ═══════════════════════════════════════════════════════════════════════════════

describe("GET /api/liquidaciones/[id]/pdf — autenticación", () => {
  it("sin sesión ni token → 401", async () => {
    mockAuth.mockResolvedValue(null)
    const res = await getLiquidacionPdf(req(), params)
    expect(res.status).toBe(401)
  })
})

describe("GET /api/liquidaciones/[id]/pdf — acceso por rol", () => {
  it("ADMIN_EMPRESA → 403", async () => {
    mockAuth.mockResolvedValue(session("ADMIN_EMPRESA"))
    const res = await getLiquidacionPdf(req(), params)
    expect(res.status).toBe(403)
  })

  it("CHOFER → 403", async () => {
    mockAuth.mockResolvedValue(session("CHOFER"))
    const res = await getLiquidacionPdf(req(), params)
    expect(res.status).toBe(403)
  })
})

describe("GET /api/liquidaciones/[id]/pdf — ownership fletero", () => {
  it("FLETERO dueño con PDF existente → 200 con URL firmada", async () => {
    mockAuth.mockResolvedValue(session("FLETERO", "fletero@test.com"))
    // Primera llamada: ownership check (select fleteroId)
    // Segunda llamada: obtener pdfS3Key
    mockPrisma.liquidacion.findUnique
      .mockResolvedValueOnce({ fleteroId: "flet-1" })
      .mockResolvedValueOnce({
        id: "liq-1",
        nroComprobante: "42",
        ptoVenta: 1,
        pdfS3Key: "liquidaciones/LP-0001-00000042.pdf",
      })
    mockVerificarPropietarioFletero.mockResolvedValue(true)
    mockStorageConfigurado.mockReturnValue(true)
    mockObtenerUrlFirmada.mockResolvedValue("https://r2.example.com/signed-liq")

    const res = await getLiquidacionPdf(req(), params)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.url).toBe("https://r2.example.com/signed-liq")
  })

  it("FLETERO ajeno → 403 (no accede al PDF)", async () => {
    mockAuth.mockResolvedValue(session("FLETERO", "intruso@otro.com"))
    mockPrisma.liquidacion.findUnique.mockResolvedValue({ fleteroId: "flet-1" })
    mockVerificarPropietarioFletero.mockResolvedValue(false)

    const res = await getLiquidacionPdf(req(), params)
    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body).not.toHaveProperty("url")
  })
})

describe("GET /api/liquidaciones/[id]/pdf — recurso inexistente", () => {
  it("liquidación no encontrada (FLETERO) → 404", async () => {
    mockAuth.mockResolvedValue(session("FLETERO", "fletero@test.com"))
    mockPrisma.liquidacion.findUnique.mockResolvedValue(null)

    const res = await getLiquidacionPdf(req(), params)
    expect(res.status).toBe(404)
  })
})

describe("GET /api/liquidaciones/[id]/pdf — acceso con token HMAC inválido", () => {
  it("token inválido → 403", async () => {
    const url = "http://localhost/api/liquidaciones/liq-1/pdf?token=token-falso"
    const res = await getLiquidacionPdf(new NextRequest(url), params)
    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error).toBe("Token inválido")
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// PATCH /api/liquidaciones/[id]
// ═══════════════════════════════════════════════════════════════════════════════

describe("PATCH /api/liquidaciones/[id] — autenticación", () => {
  it("sin sesión → 401", async () => {
    mockAuth.mockResolvedValue(null)
    const res = await patchLiquidacion(patchReq({ estado: "PAGADA" }), params)
    expect(res.status).toBe(401)
  })
})

describe("PATCH /api/liquidaciones/[id] — acceso por rol", () => {
  it("FLETERO → 403", async () => {
    mockAuth.mockResolvedValue(session("FLETERO"))
    const res = await patchLiquidacion(patchReq({ estado: "PAGADA" }), params)
    expect(res.status).toBe(403)
  })

  it("ADMIN_EMPRESA → 403", async () => {
    mockAuth.mockResolvedValue(session("ADMIN_EMPRESA"))
    const res = await patchLiquidacion(patchReq({ estado: "PAGADA" }), params)
    expect(res.status).toBe(403)
  })

  it("OPERADOR_EMPRESA → 403", async () => {
    mockAuth.mockResolvedValue(session("OPERADOR_EMPRESA"))
    const res = await patchLiquidacion(patchReq({ estado: "PAGADA" }), params)
    expect(res.status).toBe(403)
  })

  it("CHOFER → 403", async () => {
    mockAuth.mockResolvedValue(session("CHOFER"))
    const res = await patchLiquidacion(patchReq({ estado: "PAGADA" }), params)
    expect(res.status).toBe(403)
  })
})

describe("PATCH /api/liquidaciones/[id] — validación de body", () => {
  it("body inválido → 400", async () => {
    mockAuth.mockResolvedValue(session("ADMIN_TRANSMAGG"))
    const res = await patchLiquidacion(patchReq({ estado: "INVENTADO" }), params)
    expect(res.status).toBe(400)
  })
})

describe("PATCH /api/liquidaciones/[id] — recurso inexistente", () => {
  it("liquidación no encontrada → 404", async () => {
    mockAuth.mockResolvedValue(session("ADMIN_TRANSMAGG"))
    mockPrisma.liquidacion.findUnique.mockResolvedValue(null)

    const res = await patchLiquidacion(patchReq({ estado: "PAGADA" }), params)
    expect(res.status).toBe(404)
  })
})

describe("PATCH /api/liquidaciones/[id] — transiciones de estado", () => {
  it("PAGADA → EMITIDA (inválida) → 422", async () => {
    mockAuth.mockResolvedValue(session("ADMIN_TRANSMAGG"))
    mockPrisma.liquidacion.findUnique.mockResolvedValue({
      id: "liq-1",
      estado: "PAGADA",
      viajes: [],
      asientoIva: null,
    })

    const res = await patchLiquidacion(patchReq({ estado: "EMITIDA" }), params)
    expect(res.status).toBe(422)
    const body = await res.json()
    expect(body.error).toContain("No se puede cambiar de PAGADA a EMITIDA")
  })

  it("EMITIDA → PAGADA (válida) → 200", async () => {
    mockAuth.mockResolvedValue(session("ADMIN_TRANSMAGG"))
    mockPrisma.liquidacion.findUnique.mockResolvedValue({
      id: "liq-1",
      estado: "EMITIDA",
    })
    mockPrisma.liquidacion.update.mockResolvedValue({
      id: "liq-1",
      estado: "PAGADA",
    })

    const res = await patchLiquidacion(patchReq({ estado: "PAGADA" }), params)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.estado).toBe("PAGADA")
  })

  it("ANULADA ya no es transición válida → 400 (datos inválidos)", async () => {
    mockAuth.mockResolvedValue(session("OPERADOR_TRANSMAGG"))

    const res = await patchLiquidacion(patchReq({ estado: "ANULADA" }), params)
    expect(res.status).toBe(400)
  })
})
