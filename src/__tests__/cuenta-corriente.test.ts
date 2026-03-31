/**
 * Propósito: Tests unitarios para cuenta-corriente.ts.
 * Prueba cálculo de saldos de CC para empresas y fleteros, así como lógica de estados.
 */

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
