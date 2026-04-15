/**
 * Tests grupo 8 — arca-invariantes-y-tests.md §8
 * "Backend forzando payload inválido"
 *
 * Verifica que las funciones de comando rechazan payloads inválidos
 * aunque el frontend se saltee. Llama directamente a ejecutarCrearFactura
 * y ejecutarCrearNotaCD con datos crafteados.
 */

// ─── Mocks ──────────────────────────────────────────────────────────────────

const mockTx = {
  facturaEmitida: { create: jest.fn(), findUnique: jest.fn() },
  notaCreditoDebito: { create: jest.fn(), findFirst: jest.fn() },
  viajeEnNotaCD: { create: jest.fn() },
  viajeEnFactura: { create: jest.fn() },
  asientoIva: { create: jest.fn() },
  asientoIibb: { create: jest.fn() },
  viaje: { findMany: jest.fn(), update: jest.fn(), updateMany: jest.fn() },
  empresa: { findFirst: jest.fn() },
}
const mockPrisma = {
  ...mockTx,
  $transaction: jest.fn((cb: (tx: typeof mockTx) => Promise<unknown>) => cb(mockTx)),
}

jest.mock("@/lib/prisma", () => ({ prisma: mockPrisma }))

// leerComprobantesHabilitados: por defecto devuelve todos los operativos
jest.mock("@/lib/arca/leer-config-habilitados", () => ({
  leerComprobantesHabilitados: jest.fn().mockResolvedValue(
    [1, 2, 3, 6, 7, 8, 60, 61, 201, 202, 203]
  ),
}))

// Usar implementaciones reales de catalogo y nota-cd-utils
// para que tipoCbteArcaParaNotaCD y validarComprobanteHabilitado
// funcionen con la matriz fiscal real.

import { ejecutarCrearFactura } from "@/lib/factura-commands"
import { ejecutarCrearNotaCD } from "@/lib/nota-cd-commands"
import { leerComprobantesHabilitados } from "@/lib/arca/leer-config-habilitados"

const mockLeerHabilitados = leerComprobantesHabilitados as jest.MockedFunction<typeof leerComprobantesHabilitados>

beforeEach(() => {
  jest.clearAllMocks()
  mockTx.notaCreditoDebito.create.mockResolvedValue({ id: "nota-1", tipoCbte: 7 })
  mockTx.notaCreditoDebito.findFirst.mockResolvedValue(null)
})

// ═══════════════════════════════════════════════════════════════════════════════
// Factura empresa — códigos inválidos (B1, B2)
// ═══════════════════════════════════════════════════════════════════════════════

describe("factura empresa — código inválido rechazado por backend", () => {
  const empresaRI = { id: "e1", condicionIva: "RESPONSABLE_INSCRIPTO", activa: true }

  beforeEach(() => {
    mockPrisma.empresa.findFirst.mockResolvedValue(empresaRI)
  })

  it("tipoCbte 186 (legacy prohibido) → rechazada", async () => {
    const r = await ejecutarCrearFactura({
      empresaId: "e1", viajeIds: ["v1"], tipoCbte: 186, ivaPct: 21,
    }, "op1")

    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.status).toBe(422)
    // 186 no es 1 ni 201, así que la validación de condición fiscal lo bloquea
  })

  it("tipoCbte 65 (no operativo) → rechazada", async () => {
    const r = await ejecutarCrearFactura({
      empresaId: "e1", viajeIds: ["v1"], tipoCbte: 65, ivaPct: 21,
    }, "op1")

    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.status).toBe(422)
  })

  it("tipoCbte 999 (no existe) → rechazada", async () => {
    const r = await ejecutarCrearFactura({
      empresaId: "e1", viajeIds: ["v1"], tipoCbte: 999, ivaPct: 21,
    }, "op1")

    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.status).toBe(422)
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// Factura empresa — condición fiscal cruzada (B3)
// ═══════════════════════════════════════════════════════════════════════════════

describe("factura empresa — condición fiscal cruzada rechazada por backend", () => {
  it("tipoCbte 1 (Factura A) a MONOTRIBUTISTA → rechazada", async () => {
    mockPrisma.empresa.findFirst.mockResolvedValue({
      id: "e1", condicionIva: "MONOTRIBUTISTA", activa: true,
    })

    const r = await ejecutarCrearFactura({
      empresaId: "e1", viajeIds: ["v1"], tipoCbte: 1, ivaPct: 21,
    }, "op1")

    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.status).toBe(422)
      expect(r.error).toContain("Factura B")
    }
  })

  it("tipoCbte 6 (Factura B) a RESPONSABLE_INSCRIPTO → rechazada", async () => {
    mockPrisma.empresa.findFirst.mockResolvedValue({
      id: "e1", condicionIva: "RESPONSABLE_INSCRIPTO", activa: true,
    })

    const r = await ejecutarCrearFactura({
      empresaId: "e1", viajeIds: ["v1"], tipoCbte: 6, ivaPct: 21,
    }, "op1")

    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.status).toBe(422)
      expect(r.error).toContain("Factura A")
    }
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// Notas — combinaciones cruzadas (B4)
// ═══════════════════════════════════════════════════════════════════════════════

describe("notas emitidas — derivación y habilitados", () => {
  // Escenario 6: Cubierto en nota-cd-commands.test.ts:
  // "NC_EMITIDA rechazada si tipoCbte no está en comprobantesHabilitados"
  // "ND_EMITIDA rechazada si tipoCbte no está en comprobantesHabilitados"

  it("ND emitida sobre factura B (tipoCbte 6) → deriva tipoCbte 7 y crea nota", async () => {
    mockPrisma.facturaEmitida.findUnique.mockResolvedValue({
      id: "fact-1", tipoCbte: 6,
      empresa: { condicionIva: "MONOTRIBUTISTA" },
    })
    mockLeerHabilitados.mockResolvedValueOnce([1, 2, 3, 6, 7, 8, 201, 202, 203])

    const r = await ejecutarCrearNotaCD({
      tipo: "ND_EMITIDA", subtipo: "DIFERENCIA_TARIFA", facturaId: "fact-1",
      montoNeto: 500, ivaPct: 21, descripcion: "Diferencia",
    }, "op1")

    expect(r.ok).toBe(true)
    // Verificar que la nota fue creada con tipoCbte 7 (ND B, derivada de factura B)
    expect(mockTx.notaCreditoDebito.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ tipoCbte: 7 }),
    })
  })

  it("NC emitida sobre factura A (tipoCbte 1) → deriva tipoCbte 3 y crea nota", async () => {
    mockPrisma.facturaEmitida.findUnique.mockResolvedValue({
      id: "fact-1", tipoCbte: 1,
      empresa: { condicionIva: "RESPONSABLE_INSCRIPTO" },
      viajes: [{ viajeId: "v1", tarifaEmpresa: 50, kilos: 30000, subtotal: 1500, viaje: { id: "v1" } }],
      notasCreditoDebito: [],
    })
    mockLeerHabilitados.mockResolvedValueOnce([1, 2, 3, 6, 7, 8, 201, 202, 203])

    const r = await ejecutarCrearNotaCD({
      tipo: "NC_EMITIDA", subtipo: "ANULACION_TOTAL", facturaId: "fact-1",
      montoNeto: 1500, ivaPct: 21, descripcion: "Anulación",
    }, "op1")

    expect(r.ok).toBe(true)
    expect(mockTx.notaCreditoDebito.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ tipoCbte: 3 }),
    })
  })

  // Escenario 8: La derivación de tipoCbte de nota es automática vía
  // tipoCbteArcaParaNotaCD(tipo, factura.tipoCbte). No es posible forzar
  // un tipoCbte de nota incompatible con el origen desde el payload,
  // porque el código NUNCA toma tipoCbte del input — siempre lo deriva.
  // Las combinaciones cruzadas (ej: nota 7 sobre factura 1) son imposibles
  // por diseño. La protección unitaria está en arca-catalogo.test.ts:
  // "validarNotaContraOrigen rechaza combinaciones cruzadas"

  it("NC emitida sobre factura con tipoCbte sin nota compatible → rechazada", async () => {
    // Factura con tipoCbte 999 (inexistente): tipoCbteArcaParaNotaCD("NC_EMITIDA", 999) → 0
    mockPrisma.facturaEmitida.findUnique.mockResolvedValue({
      id: "fact-inv", tipoCbte: 999,
      empresa: { condicionIva: "RESPONSABLE_INSCRIPTO" },
      viajes: [],
      notasCreditoDebito: [],
    })

    const r = await ejecutarCrearNotaCD({
      tipo: "NC_EMITIDA", subtipo: "ANULACION_TOTAL", facturaId: "fact-inv",
      montoNeto: 1000, ivaPct: 21, descripcion: "NC sobre comprobante sin nota compatible",
    }, "op1")

    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.status).toBe(400)
      expect(r.error).toContain("No se puede emitir NC")
    }
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// NC/ND sobre LP (B5)
// ═══════════════════════════════════════════════════════════════════════════════

// Cubierto en nota-cd-commands.test.ts:
// "NC_EMITIDA sobre liquidación → rechazada"
// "ND_EMITIDA sobre liquidación → rechazada"
// "NC_RECIBIDA sobre liquidación → rechazada"
// "ND_RECIBIDA sobre liquidación → rechazada"
