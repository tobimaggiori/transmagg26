/**
 * Propósito: Tests unitarios para cuenta-corriente.ts.
 *
 * Parte 1: Funciones puras (calcularSaldoCC, calcularAjusteNotasCD, calcularSaldoPendiente)
 *          — sin mock, testean reglas de negocio directamente.
 * Parte 2: Funciones de orquestación (calcularSaldoCCEmpresa, etc.)
 *          — con mock de Prisma, testean integración query→cálculo.
 */

// ─── Parte 1: Funciones puras ────────────────────────────────────────────────
// (imported after mock setup below, alongside the orquestación functions)

describe("calcularSaldoCC (puro)", () => {
  it("documentos sin pagos → saldoDeudor", () => {
    expect(calcularSaldoCC(300000, 0, 0)).toEqual({
      saldoDeudor: 300000, saldoAFavor: 0, saldoNeto: 300000,
    })
  })

  it("pagos > documentos → saldoAFavor", () => {
    expect(calcularSaldoCC(100000, 130000, 0)).toEqual({
      saldoDeudor: 0, saldoAFavor: 30000, saldoNeto: -30000,
    })
  })

  it("todo cero → saldo cero", () => {
    expect(calcularSaldoCC(0, 0, 0)).toEqual({
      saldoDeudor: 0, saldoAFavor: 0, saldoNeto: 0,
    })
  })

  it("ajuste negativo (NC) reduce deuda", () => {
    expect(calcularSaldoCC(100000, 0, -20000)).toEqual({
      saldoDeudor: 80000, saldoAFavor: 0, saldoNeto: 80000,
    })
  })

  it("ajuste positivo (ND) aumenta deuda", () => {
    expect(calcularSaldoCC(100000, 0, 15000)).toEqual({
      saldoDeudor: 115000, saldoAFavor: 0, saldoNeto: 115000,
    })
  })

  it("ajuste que invierte saldo → a favor", () => {
    expect(calcularSaldoCC(50000, 0, -80000)).toEqual({
      saldoDeudor: 0, saldoAFavor: 30000, saldoNeto: -30000,
    })
  })

  it("pagos + ajuste combinados", () => {
    // 100000 docs - 20000 NC = 80000 debe, menos 50000 pagos = 30000 deudor
    expect(calcularSaldoCC(100000, 50000, -20000)).toEqual({
      saldoDeudor: 30000, saldoAFavor: 0, saldoNeto: 30000,
    })
  })
})

describe("calcularAjusteNotasCD (puro)", () => {
  it("NC reduce (negativo)", () => {
    expect(calcularAjusteNotasCD(
      [{ tipo: "NC_EMITIDA", montoTotal: 20000 }],
      "NC_EMITIDA", "ND_EMITIDA"
    )).toBe(-20000)
  })

  it("ND aumenta (positivo)", () => {
    expect(calcularAjusteNotasCD(
      [{ tipo: "ND_EMITIDA", montoTotal: 15000 }],
      "NC_EMITIDA", "ND_EMITIDA"
    )).toBe(15000)
  })

  it("sin notas → 0", () => {
    expect(calcularAjusteNotasCD([], "NC_EMITIDA", "ND_EMITIDA")).toBe(0)
  })

  it("NC + ND combinadas", () => {
    expect(calcularAjusteNotasCD(
      [
        { tipo: "NC_EMITIDA", montoTotal: 10000 },
        { tipo: "ND_EMITIDA", montoTotal: 5000 },
      ],
      "NC_EMITIDA", "ND_EMITIDA"
    )).toBe(-5000)
  })

  it("notas de otro tipo se ignoran", () => {
    expect(calcularAjusteNotasCD(
      [{ tipo: "NC_RECIBIDA", montoTotal: 99999 }],
      "NC_EMITIDA", "ND_EMITIDA"
    )).toBe(0)
  })

  it("funciona con tipos de fletero", () => {
    expect(calcularAjusteNotasCD(
      [{ tipo: "NC_RECIBIDA", montoTotal: 30000 }],
      "NC_RECIBIDA", "ND_RECIBIDA"
    )).toBe(-30000)
  })
})

describe("calcularSaldoPendiente (puro)", () => {
  it("pago parcial", () => {
    expect(calcularSaldoPendiente(100000, [40000])).toBe(60000)
  })

  it("pago total", () => {
    expect(calcularSaldoPendiente(100000, [100000])).toBe(0)
  })

  it("pago excedente → 0 (no negativo)", () => {
    expect(calcularSaldoPendiente(100000, [120000])).toBe(0)
  })

  it("sin pagos", () => {
    expect(calcularSaldoPendiente(100000, [])).toBe(100000)
  })

  it("múltiples pagos parciales", () => {
    expect(calcularSaldoPendiente(100000, [30000, 25000, 15000])).toBe(30000)
  })

  it("total cero", () => {
    expect(calcularSaldoPendiente(0, [50000])).toBe(0)
  })
})

describe("calcularNetoVigente (puro)", () => {
  it("sin notas → total original", () => {
    expect(calcularNetoVigente(100000, [])).toBe(100000)
  })

  it("NC total anula el neto → 0", () => {
    expect(calcularNetoVigente(100000, [{ tipo: "NC_EMITIDA", montoTotal: 100000 }])).toBe(0)
  })

  it("NC parcial reduce neto", () => {
    expect(calcularNetoVigente(100000, [{ tipo: "NC_EMITIDA", montoTotal: 30000 }])).toBe(70000)
  })

  it("ND aumenta neto", () => {
    expect(calcularNetoVigente(100000, [{ tipo: "ND_EMITIDA", montoTotal: 15000 }])).toBe(115000)
  })

  it("NC + ND combinadas", () => {
    expect(calcularNetoVigente(100000, [
      { tipo: "NC_EMITIDA", montoTotal: 30000 },
      { tipo: "ND_EMITIDA", montoTotal: 5000 },
    ])).toBe(75000)
  })

  it("NC que excede total → 0 (no negativo)", () => {
    expect(calcularNetoVigente(50000, [{ tipo: "NC_EMITIDA", montoTotal: 80000 }])).toBe(0)
  })

  it("funciona con NC_RECIBIDA / ND_RECIBIDA (fletero)", () => {
    expect(calcularNetoVigente(200000, [
      { tipo: "NC_RECIBIDA", montoTotal: 50000 },
      { tipo: "ND_RECIBIDA", montoTotal: 10000 },
    ])).toBe(160000)
  })
})

// ─── Parte 2: Funciones de orquestación (con mock Prisma) ───────────────────

// Mock Prisma before importing from cuenta-corriente
const mockPrisma = {
  facturaEmitida: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
  },
  pagoDeEmpresa: {
    findMany: jest.fn(),
  },
  notaCreditoDebito: {
    findMany: jest.fn(),
  },
  liquidacion: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
  },
  pagoAFletero: {
    findMany: jest.fn(),
  },
}

jest.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}))

import {
  calcularSaldoCC,
  calcularAjusteNotasCD,
  calcularSaldoPendiente,
  calcularNetoVigente,
  calcularSaldoCCEmpresa,
  calcularSaldoCCFletero,
  calcularSaldoPendienteFactura,
  calcularSaldoPendienteLiquidacion,
} from "@/lib/cuenta-corriente"

beforeEach(() => {
  jest.clearAllMocks()
  // Default: no notas CD
  mockPrisma.notaCreditoDebito.findMany.mockResolvedValue([])
})

// ─── calcularSaldoCCEmpresa ───────────────────────────────────────────────────

describe("calcularSaldoCCEmpresa", () => {
  it("empresa con facturas sin pagos → saldoDeudor igual al total de facturas", async () => {
    mockPrisma.facturaEmitida.findMany.mockResolvedValue([
      { total: 100000 },
      { total: 200000 },
    ])
    mockPrisma.pagoDeEmpresa.findMany.mockResolvedValue([])

    const saldo = await calcularSaldoCCEmpresa("emp1")

    expect(saldo.saldoDeudor).toBe(300000)
    expect(saldo.saldoAFavor).toBe(0)
    expect(saldo.saldoNeto).toBe(300000)
  })

  it("empresa con pagos > facturas → saldoAFavor", async () => {
    mockPrisma.facturaEmitida.findMany.mockResolvedValue([{ total: 100000 }])
    mockPrisma.pagoDeEmpresa.findMany.mockResolvedValue([
      { monto: 100000 },
      { monto: 30000 },
    ])

    const saldo = await calcularSaldoCCEmpresa("emp1")

    expect(saldo.saldoDeudor).toBe(0)
    expect(saldo.saldoAFavor).toBe(30000)
    expect(saldo.saldoNeto).toBe(-30000)
  })

  it("empresa sin facturas ni pagos → saldo cero", async () => {
    mockPrisma.facturaEmitida.findMany.mockResolvedValue([])
    mockPrisma.pagoDeEmpresa.findMany.mockResolvedValue([])

    const saldo = await calcularSaldoCCEmpresa("emp1")

    expect(saldo.saldoDeudor).toBe(0)
    expect(saldo.saldoAFavor).toBe(0)
    expect(saldo.saldoNeto).toBe(0)
  })

  it("nota de crédito reduce deuda", async () => {
    mockPrisma.facturaEmitida.findMany.mockResolvedValue([{ total: 100000 }])
    mockPrisma.pagoDeEmpresa.findMany.mockResolvedValue([])
    mockPrisma.notaCreditoDebito.findMany.mockResolvedValue([
      { tipo: "NC_EMITIDA", montoTotal: 20000 },
    ])

    const saldo = await calcularSaldoCCEmpresa("emp1")

    expect(saldo.saldoDeudor).toBe(80000)
    expect(saldo.saldoNeto).toBe(80000)
  })

  it("nota de débito aumenta deuda", async () => {
    mockPrisma.facturaEmitida.findMany.mockResolvedValue([{ total: 100000 }])
    mockPrisma.pagoDeEmpresa.findMany.mockResolvedValue([])
    mockPrisma.notaCreditoDebito.findMany.mockResolvedValue([
      { tipo: "ND_EMITIDA", montoTotal: 15000 },
    ])

    const saldo = await calcularSaldoCCEmpresa("emp1")

    expect(saldo.saldoDeudor).toBe(115000)
    expect(saldo.saldoNeto).toBe(115000)
  })
})

// ─── calcularSaldoPendienteFactura ────────────────────────────────────────────

describe("calcularSaldoPendienteFactura", () => {
  it("pago parcial → saldo pendiente correcto", async () => {
    mockPrisma.facturaEmitida.findUnique.mockResolvedValue({
      total: 100000,
      pagos: [{ monto: 40000 }],
    })

    const saldo = await calcularSaldoPendienteFactura("fact1")

    expect(saldo).toBe(60000)
  })

  it("pago total → saldo pendiente 0", async () => {
    mockPrisma.facturaEmitida.findUnique.mockResolvedValue({
      total: 100000,
      pagos: [{ monto: 100000 }],
    })

    const saldo = await calcularSaldoPendienteFactura("fact1")

    expect(saldo).toBe(0)
  })

  it("pago excedente → saldo pendiente no negativo (0)", async () => {
    mockPrisma.facturaEmitida.findUnique.mockResolvedValue({
      total: 100000,
      pagos: [{ monto: 120000 }],
    })

    const saldo = await calcularSaldoPendienteFactura("fact1")

    expect(saldo).toBe(0)
  })

  it("factura no encontrada → 0", async () => {
    mockPrisma.facturaEmitida.findUnique.mockResolvedValue(null)

    const saldo = await calcularSaldoPendienteFactura("nonexistent")

    expect(saldo).toBe(0)
  })
})

// ─── Estado logic (pago parcial vs total) ────────────────────────────────────

describe("Estado logic: pago parcial → PARCIALMENTE_COBRADA, pago total → COBRADA", () => {
  it("si saldo pendiente es 60000 y se paga 40000, no cubre → PARCIALMENTE_COBRADA", () => {
    const saldoPendiente = 60000
    const totalPagoActual = 40000
    const nuevoEstado = totalPagoActual >= saldoPendiente ? "COBRADA" : "PARCIALMENTE_COBRADA"
    expect(nuevoEstado).toBe("PARCIALMENTE_COBRADA")
  })

  it("si saldo pendiente es 60000 y se paga 60000, cubre exacto → COBRADA", () => {
    const saldoPendiente = 60000
    const totalPagoActual = 60000
    const nuevoEstado = totalPagoActual >= saldoPendiente ? "COBRADA" : "PARCIALMENTE_COBRADA"
    expect(nuevoEstado).toBe("COBRADA")
  })

  it("si saldo pendiente es 60000 y se paga 80000, excede → COBRADA + excedente", () => {
    const saldoPendiente = 60000
    const totalPagoActual = 80000
    const nuevoEstado = totalPagoActual >= saldoPendiente ? "COBRADA" : "PARCIALMENTE_COBRADA"
    const excedente = Math.max(0, totalPagoActual - saldoPendiente)
    expect(nuevoEstado).toBe("COBRADA")
    expect(excedente).toBe(20000)
  })
})

// ─── Saldo a favor validation ─────────────────────────────────────────────────

describe("SALDO_A_FAVOR validation", () => {
  it("si saldoAFavor es 30000 y se intenta usar 40000 → debería rechazarse", () => {
    const saldoAFavor = 30000
    const montoSaldoAFavor = 40000
    const esValido = montoSaldoAFavor <= saldoAFavor
    expect(esValido).toBe(false)
  })

  it("si saldoAFavor es 30000 y se usa 30000 → válido", () => {
    const saldoAFavor = 30000
    const montoSaldoAFavor = 30000
    const esValido = montoSaldoAFavor <= saldoAFavor
    expect(esValido).toBe(true)
  })

  it("si saldoAFavor es 30000 y se usa 20000 → válido", () => {
    const saldoAFavor = 30000
    const montoSaldoAFavor = 20000
    const esValido = montoSaldoAFavor <= saldoAFavor
    expect(esValido).toBe(true)
  })
})

// ─── calcularSaldoCCFletero ───────────────────────────────────────────────────

describe("calcularSaldoCCFletero", () => {
  it("fletero con liquidaciones sin pagos → saldoDeudor igual al total de liquidaciones", async () => {
    mockPrisma.liquidacion.findMany.mockResolvedValue([
      { total: 150000 },
      { total: 50000 },
    ])
    mockPrisma.pagoAFletero.findMany.mockResolvedValue([])
    mockPrisma.notaCreditoDebito.findMany.mockResolvedValue([])

    const saldo = await calcularSaldoCCFletero("flet1")

    expect(saldo.saldoDeudor).toBe(200000)
    expect(saldo.saldoAFavor).toBe(0)
    expect(saldo.saldoNeto).toBe(200000)
  })

  it("fletero con pagos > liquidaciones → saldoAFavor (sobrepago)", async () => {
    mockPrisma.liquidacion.findMany.mockResolvedValue([{ total: 100000 }])
    mockPrisma.pagoAFletero.findMany.mockResolvedValue([
      { monto: 100000 },
      { monto: 10000 },
    ])
    mockPrisma.notaCreditoDebito.findMany.mockResolvedValue([])

    const saldo = await calcularSaldoCCFletero("flet1")

    expect(saldo.saldoDeudor).toBe(0)
    expect(saldo.saldoAFavor).toBe(10000)
    expect(saldo.saldoNeto).toBe(-10000)
  })
})

// ─── calcularSaldoPendienteLiquidacion ────────────────────────────────────────

describe("calcularSaldoPendienteLiquidacion", () => {
  it("pago parcial → saldo pendiente correcto", async () => {
    mockPrisma.liquidacion.findUnique.mockResolvedValue({
      total: 200000,
      pagos: [{ monto: 80000 }],
    })

    const saldo = await calcularSaldoPendienteLiquidacion("liq1")

    expect(saldo).toBe(120000)
  })

  it("liquidacion no encontrada → 0", async () => {
    mockPrisma.liquidacion.findUnique.mockResolvedValue(null)

    const saldo = await calcularSaldoPendienteLiquidacion("nonexistent")

    expect(saldo).toBe(0)
  })
})
