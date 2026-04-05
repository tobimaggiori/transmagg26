/**
 * Propósito: Tests de integración para route handlers de factura individual.
 * Verifica que GET y PATCH /api/facturas/[id] y GET /api/facturas/[id]/pdf
 * aplican ownership checks, bloquean acceso indebido y validan transiciones.
 */

import { NextRequest } from "next/server"

// ─── Mocks ───────────────────────────────────────────────────────────────────

const mockAuth = jest.fn()
const mockPrisma = {
  facturaEmitida: { findUnique: jest.fn(), update: jest.fn() },
}
const mockVerificarPropietarioEmpresa = jest.fn()
const mockObtenerUrlFirmada = jest.fn()
const mockStorageConfigurado = jest.fn()

jest.mock("@/lib/auth", () => ({ auth: mockAuth }))
jest.mock("@/lib/prisma", () => ({ prisma: mockPrisma }))
jest.mock("@/lib/session-utils", () => ({
  verificarPropietarioEmpresa: mockVerificarPropietarioEmpresa,
}))
jest.mock("@/lib/storage", () => ({
  obtenerUrlFirmada: mockObtenerUrlFirmada,
  storageConfigurado: mockStorageConfigurado,
}))

import { GET as getFactura, PATCH as patchFactura } from "@/app/api/facturas/[id]/route"
import { GET as getFacturaPdf } from "@/app/api/facturas/[id]/pdf/route"

// ─── Helpers ─────────────────────────────────────────────────────────────────

function session(rol: string, email = "user@test.com") {
  return { user: { id: "u1", email, rol } }
}

const FACTURA_MOCK = {
  id: "fact-1",
  empresaId: "emp-1",
  estado: "EMITIDA",
  total: 150000,
  neto: 123966.94,
  ivaMonto: 26033.06,
  ivaPct: 21,
  tipoCbte: "A",
  nroComprobante: "0001-00000001",
  pdfS3Key: null,
  emitidaEn: new Date("2026-01-15"),
  grabadaEn: new Date("2026-01-15"),
  empresa: { razonSocial: "Empresa Test", cuit: "30-12345678-9" },
  operador: { nombre: "Juan", apellido: "Pérez" },
  viajes: [
    {
      id: "vef-1",
      viajeId: "v1",
      facturaId: "fact-1",
      tarifaEmpresa: 50,
      kilos: 30000,
      subtotal: 1500,
      origen: "Rosario",
      destino: "Buenos Aires",
      viaje: {
        fechaViaje: new Date("2026-01-10"),
        camion: { patenteChasis: "AB123CD" },
        chofer: { nombre: "Carlos", apellido: "López" },
        fletero: { razonSocial: "Fletero SA" },
      },
    },
  ],
  pagos: [],
}

function req(url = "http://localhost/api/facturas/fact-1") {
  return new NextRequest(url)
}
function patchReq(body: unknown) {
  return new NextRequest("http://localhost/api/facturas/fact-1", {
    method: "PATCH",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  })
}
const params = { params: { id: "fact-1" } }

beforeEach(() => jest.clearAllMocks())

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/facturas/[id]
// ═══════════════════════════════════════════════════════════════════════════════

describe("GET /api/facturas/[id] — autenticación", () => {
  it("sin sesión → 401", async () => {
    mockAuth.mockResolvedValue(null)
    const res = await getFactura(req(), params)
    expect(res.status).toBe(401)
  })
})

describe("GET /api/facturas/[id] — acceso por rol", () => {
  it("FLETERO → 403 (no es empresa ni interno)", async () => {
    mockAuth.mockResolvedValue(session("FLETERO"))
    mockPrisma.facturaEmitida.findUnique.mockResolvedValue(FACTURA_MOCK)
    const res = await getFactura(req(), params)
    expect(res.status).toBe(403)
  })

  it("CHOFER → 403", async () => {
    mockAuth.mockResolvedValue(session("CHOFER"))
    mockPrisma.facturaEmitida.findUnique.mockResolvedValue(FACTURA_MOCK)
    const res = await getFactura(req(), params)
    expect(res.status).toBe(403)
  })
})

describe("GET /api/facturas/[id] — ownership empresa", () => {
  it("ADMIN_EMPRESA dueño → 200 con tarifaEmpresa visible", async () => {
    mockAuth.mockResolvedValue(session("ADMIN_EMPRESA", "admin@empresa.com"))
    mockPrisma.facturaEmitida.findUnique.mockResolvedValue(FACTURA_MOCK)
    mockVerificarPropietarioEmpresa.mockResolvedValue(true)

    const res = await getFactura(req(), params)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.id).toBe("fact-1")
    // ADMIN_EMPRESA puede ver tarifaEmpresa (es su tarifa)
    expect(body.viajes[0].tarifaEmpresa).toBe(50)
    expect(mockVerificarPropietarioEmpresa).toHaveBeenCalledWith("emp-1", "admin@empresa.com")
  })

  it("ADMIN_EMPRESA ajena → 403", async () => {
    mockAuth.mockResolvedValue(session("ADMIN_EMPRESA", "intruso@otra.com"))
    mockPrisma.facturaEmitida.findUnique.mockResolvedValue(FACTURA_MOCK)
    mockVerificarPropietarioEmpresa.mockResolvedValue(false)

    const res = await getFactura(req(), params)
    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body).not.toHaveProperty("viajes")
    expect(body).not.toHaveProperty("total")
  })

  it("OPERADOR_EMPRESA ajeno → 403", async () => {
    mockAuth.mockResolvedValue(session("OPERADOR_EMPRESA", "op@otra.com"))
    mockPrisma.facturaEmitida.findUnique.mockResolvedValue(FACTURA_MOCK)
    mockVerificarPropietarioEmpresa.mockResolvedValue(false)

    const res = await getFactura(req(), params)
    expect(res.status).toBe(403)
  })
})

describe("GET /api/facturas/[id] — acceso interno", () => {
  it("ADMIN_TRANSMAGG → 200 con tarifaEmpresa", async () => {
    mockAuth.mockResolvedValue(session("ADMIN_TRANSMAGG"))
    mockPrisma.facturaEmitida.findUnique.mockResolvedValue(FACTURA_MOCK)

    const res = await getFactura(req(), params)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.viajes[0].tarifaEmpresa).toBe(50)
    // No se llama a verificarPropietarioEmpresa para roles internos
    expect(mockVerificarPropietarioEmpresa).not.toHaveBeenCalled()
  })
})

describe("GET /api/facturas/[id] — recurso inexistente", () => {
  it("factura no encontrada → 404", async () => {
    mockAuth.mockResolvedValue(session("ADMIN_TRANSMAGG"))
    mockPrisma.facturaEmitida.findUnique.mockResolvedValue(null)

    const res = await getFactura(req(), params)
    expect(res.status).toBe(404)
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/facturas/[id]/pdf
// ═══════════════════════════════════════════════════════════════════════════════

describe("GET /api/facturas/[id]/pdf — autenticación", () => {
  it("sin sesión → 401", async () => {
    mockAuth.mockResolvedValue(null)
    const res = await getFacturaPdf(req(), params)
    expect(res.status).toBe(401)
  })
})

describe("GET /api/facturas/[id]/pdf — acceso por rol", () => {
  it("FLETERO → 403", async () => {
    mockAuth.mockResolvedValue(session("FLETERO"))
    const res = await getFacturaPdf(req(), params)
    expect(res.status).toBe(403)
  })

  it("CHOFER → 403", async () => {
    mockAuth.mockResolvedValue(session("CHOFER"))
    const res = await getFacturaPdf(req(), params)
    expect(res.status).toBe(403)
  })
})

describe("GET /api/facturas/[id]/pdf — ownership empresa", () => {
  it("ADMIN_EMPRESA dueño con PDF en R2 → 200 con URL firmada", async () => {
    mockAuth.mockResolvedValue(session("ADMIN_EMPRESA", "admin@empresa.com"))
    mockPrisma.facturaEmitida.findUnique.mockResolvedValue({
      id: "fact-1",
      pdfS3Key: "facturas/0001-00000001.pdf",
      empresaId: "emp-1",
    })
    mockVerificarPropietarioEmpresa.mockResolvedValue(true)
    mockStorageConfigurado.mockReturnValue(true)
    mockObtenerUrlFirmada.mockResolvedValue("https://r2.example.com/signed-url")

    const res = await getFacturaPdf(req(), params)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.url).toBe("https://r2.example.com/signed-url")
  })

  it("ADMIN_EMPRESA ajena → 403 (no filtra datos del PDF)", async () => {
    mockAuth.mockResolvedValue(session("ADMIN_EMPRESA", "intruso@otra.com"))
    mockPrisma.facturaEmitida.findUnique.mockResolvedValue({
      id: "fact-1",
      pdfS3Key: "facturas/0001-00000001.pdf",
      empresaId: "emp-1",
    })
    mockVerificarPropietarioEmpresa.mockResolvedValue(false)

    const res = await getFacturaPdf(req(), params)
    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body).not.toHaveProperty("url")
  })
})

describe("GET /api/facturas/[id]/pdf — recurso inexistente", () => {
  it("factura no encontrada → 404", async () => {
    mockAuth.mockResolvedValue(session("ADMIN_TRANSMAGG"))
    mockPrisma.facturaEmitida.findUnique.mockResolvedValue(null)

    const res = await getFacturaPdf(req(), params)
    expect(res.status).toBe(404)
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// PATCH /api/facturas/[id]
// ═══════════════════════════════════════════════════════════════════════════════

describe("PATCH /api/facturas/[id] — autenticación", () => {
  it("sin sesión → 401", async () => {
    mockAuth.mockResolvedValue(null)
    const res = await patchFactura(patchReq({ estado: "COBRADA" }), params)
    expect(res.status).toBe(401)
  })
})

describe("PATCH /api/facturas/[id] — acceso por rol", () => {
  it("FLETERO → 403", async () => {
    mockAuth.mockResolvedValue(session("FLETERO"))
    const res = await patchFactura(patchReq({ estado: "COBRADA" }), params)
    expect(res.status).toBe(403)
  })

  it("ADMIN_EMPRESA → 403", async () => {
    mockAuth.mockResolvedValue(session("ADMIN_EMPRESA"))
    const res = await patchFactura(patchReq({ estado: "COBRADA" }), params)
    expect(res.status).toBe(403)
  })

  it("OPERADOR_EMPRESA → 403", async () => {
    mockAuth.mockResolvedValue(session("OPERADOR_EMPRESA"))
    const res = await patchFactura(patchReq({ estado: "COBRADA" }), params)
    expect(res.status).toBe(403)
  })

  it("CHOFER → 403", async () => {
    mockAuth.mockResolvedValue(session("CHOFER"))
    const res = await patchFactura(patchReq({ estado: "COBRADA" }), params)
    expect(res.status).toBe(403)
  })
})

describe("PATCH /api/facturas/[id] — validación de body", () => {
  it("body inválido → 400", async () => {
    mockAuth.mockResolvedValue(session("ADMIN_TRANSMAGG"))
    const res = await patchFactura(patchReq({ estado: "INVENTADO" }), params)
    expect(res.status).toBe(400)
  })
})

describe("PATCH /api/facturas/[id] — recurso inexistente", () => {
  it("factura no encontrada → 404", async () => {
    mockAuth.mockResolvedValue(session("ADMIN_TRANSMAGG"))
    mockPrisma.facturaEmitida.findUnique.mockResolvedValue(null)

    const res = await patchFactura(patchReq({ estado: "COBRADA" }), params)
    expect(res.status).toBe(404)
  })
})

describe("PATCH /api/facturas/[id] — transiciones de estado", () => {
  it("COBRADA → EMITIDA (inválida) → 422", async () => {
    mockAuth.mockResolvedValue(session("ADMIN_TRANSMAGG"))
    mockPrisma.facturaEmitida.findUnique.mockResolvedValue({
      id: "fact-1",
      estado: "COBRADA",
      viajes: [],
    })

    const res = await patchFactura(patchReq({ estado: "EMITIDA" }), params)
    expect(res.status).toBe(422)
    const body = await res.json()
    expect(body.error).toContain("No se puede cambiar de COBRADA a EMITIDA")
  })

  it("EMITIDA → COBRADA (válida) → 200", async () => {
    mockAuth.mockResolvedValue(session("ADMIN_TRANSMAGG"))
    mockPrisma.facturaEmitida.findUnique.mockResolvedValue({
      id: "fact-1",
      estado: "EMITIDA",
    })
    mockPrisma.facturaEmitida.update.mockResolvedValue({
      id: "fact-1",
      estado: "COBRADA",
    })

    const res = await patchFactura(patchReq({ estado: "COBRADA" }), params)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.estado).toBe("COBRADA")
  })

  it("ANULADA ya no es transición válida → 400 (datos inválidos)", async () => {
    mockAuth.mockResolvedValue(session("OPERADOR_TRANSMAGG"))

    const res = await patchFactura(patchReq({ estado: "ANULADA" }), params)
    expect(res.status).toBe(400)
  })
})
