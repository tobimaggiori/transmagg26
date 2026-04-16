/**
 * Tests para cuenta-corriente.ts (modelo unificado).
 *
 * Modelo:
 *   saldoPendiente(doc) = total − pagos − ncAplicadas (montoDescontado) − gastos − adelantos
 *   saldoCC(actor)      = sum(saldoPendiente de cada doc) menos sobrepagos sin asignar
 *   creditoDisponible   = sum(NC.montoTotal − NC.montoDescontado) por NCs activas
 */

// ─── Funciones puras (sin Prisma) ────────────────────────────────────────────

describe("calcularSaldoPendienteDoc (puro)", () => {
  it("sin componentes → total intacto", () => {
    expect(calcularSaldoPendienteDoc(100000, { pagos: [], ncAplicadas: [] })).toBe(100000)
  })

  it("solo pagos", () => {
    expect(calcularSaldoPendienteDoc(100000, { pagos: [60000], ncAplicadas: [] })).toBe(40000)
  })

  it("solo NC aplicadas", () => {
    expect(calcularSaldoPendienteDoc(100000, { pagos: [], ncAplicadas: [30000] })).toBe(70000)
  })

  it("pagos + NC + gastos + adelantos cubren todo", () => {
    expect(
      calcularSaldoPendienteDoc(100000, {
        pagos: [50000],
        ncAplicadas: [20000],
        gastos: [10000],
        adelantos: [20000],
      }),
    ).toBe(0)
  })

  it("consumido excede el total → 0 (no negativo)", () => {
    expect(calcularSaldoPendienteDoc(100000, { pagos: [120000], ncAplicadas: [] })).toBe(0)
  })

  it("múltiples pagos parciales", () => {
    expect(calcularSaldoPendienteDoc(100000, { pagos: [30000, 25000, 15000], ncAplicadas: [] })).toBe(30000)
  })
})

describe("calcularCreditoDisponible (puro)", () => {
  it("sin NC → 0", () => {
    expect(calcularCreditoDisponible([])).toBe(0)
  })

  it("NC sin descontar → su montoTotal", () => {
    expect(calcularCreditoDisponible([{ montoTotal: 50000, montoDescontado: 0 }])).toBe(50000)
  })

  it("NC totalmente descontada → 0", () => {
    expect(calcularCreditoDisponible([{ montoTotal: 50000, montoDescontado: 50000 }])).toBe(0)
  })

  it("NC parcial + NC sin aplicar → suma restantes", () => {
    expect(
      calcularCreditoDisponible([
        { montoTotal: 50000, montoDescontado: 20000 },
        { montoTotal: 30000, montoDescontado: 0 },
      ]),
    ).toBe(60000)
  })

  it("descontado supera total (caso defensivo) → no negativo", () => {
    expect(calcularCreditoDisponible([{ montoTotal: 50000, montoDescontado: 80000 }])).toBe(0)
  })
})

describe("calcularSaldoCC (puro)", () => {
  it("docs sin pagos ni crédito", () => {
    expect(calcularSaldoCC({ totalDeudaPorDocs: 300000, totalSobrepagos: 0, creditoDisponible: 0 })).toEqual({
      saldoDeudor: 300000,
      saldoAFavor: 0,
      creditoDisponible: 0,
      saldoNeto: 300000,
    })
  })

  it("sobrepagos > deuda → saldoAFavor", () => {
    expect(calcularSaldoCC({ totalDeudaPorDocs: 100000, totalSobrepagos: 130000, creditoDisponible: 0 })).toEqual({
      saldoDeudor: 0,
      saldoAFavor: 30000,
      creditoDisponible: 0,
      saldoNeto: -30000,
    })
  })

  it("crédito disponible se reporta separado, no afecta saldoNeto", () => {
    expect(calcularSaldoCC({ totalDeudaPorDocs: 100000, totalSobrepagos: 0, creditoDisponible: 50000 })).toEqual({
      saldoDeudor: 100000,
      saldoAFavor: 0,
      creditoDisponible: 50000,
      saldoNeto: 100000,
    })
  })

  it("todo cero", () => {
    expect(calcularSaldoCC({ totalDeudaPorDocs: 0, totalSobrepagos: 0, creditoDisponible: 0 })).toEqual({
      saldoDeudor: 0,
      saldoAFavor: 0,
      creditoDisponible: 0,
      saldoNeto: 0,
    })
  })
})

describe("calcularNetoVigente (uso fiscal)", () => {
  it("sin notas → total original", () => {
    expect(calcularNetoVigente(100000, [])).toBe(100000)
  })

  it("NC parcial reduce neto", () => {
    expect(calcularNetoVigente(100000, [{ tipo: "NC_EMITIDA", montoTotal: 30000 }])).toBe(70000)
  })

  it("ND aumenta neto", () => {
    expect(calcularNetoVigente(100000, [{ tipo: "ND_EMITIDA", montoTotal: 15000 }])).toBe(115000)
  })

  it("NC + ND combinadas", () => {
    expect(
      calcularNetoVigente(100000, [
        { tipo: "NC_EMITIDA", montoTotal: 30000 },
        { tipo: "ND_EMITIDA", montoTotal: 5000 },
      ]),
    ).toBe(75000)
  })

  it("NC excede total → 0", () => {
    expect(calcularNetoVigente(50000, [{ tipo: "NC_EMITIDA", montoTotal: 80000 }])).toBe(0)
  })
})

describe("calcularAjusteNotasCD (legacy)", () => {
  it("NC reduce (negativo)", () => {
    expect(
      calcularAjusteNotasCD([{ tipo: "NC_EMITIDA", montoTotal: 20000 }], "NC_EMITIDA", "ND_EMITIDA"),
    ).toBe(-20000)
  })

  it("ND aumenta (positivo)", () => {
    expect(
      calcularAjusteNotasCD([{ tipo: "ND_EMITIDA", montoTotal: 15000 }], "NC_EMITIDA", "ND_EMITIDA"),
    ).toBe(15000)
  })
})

describe("calcularSaldoPendiente (legacy)", () => {
  it("delega a calcularSaldoPendienteDoc con ncAplicadas vacío", () => {
    expect(calcularSaldoPendiente(100000, [40000])).toBe(60000)
  })
})

// ─── Funciones de orquestación (con mock Prisma) ────────────────────────────

const mockPrisma = {
  facturaEmitida: { findMany: jest.fn(), findUnique: jest.fn() },
  pagoDeEmpresa: { findMany: jest.fn() },
  notaCreditoDebito: { findMany: jest.fn() },
  liquidacion: { findMany: jest.fn(), findUnique: jest.fn() },
  pagoAFletero: { findMany: jest.fn() },
}

jest.mock("@/lib/prisma", () => ({ prisma: mockPrisma }))

import {
  calcularSaldoCC,
  calcularAjusteNotasCD,
  calcularSaldoPendiente,
  calcularSaldoPendienteDoc,
  calcularCreditoDisponible,
  calcularNetoVigente,
  calcularSaldoCCEmpresa,
  calcularSaldoCCFletero,
  calcularSaldoPendienteFactura,
  calcularSaldoPendienteLiquidacion,
} from "@/lib/cuenta-corriente"

beforeEach(() => {
  jest.clearAllMocks()
})

describe("calcularSaldoCCEmpresa", () => {
  it("facturas sin pagos ni NC → saldoDeudor = sum totales", async () => {
    mockPrisma.facturaEmitida.findMany.mockResolvedValue([
      { total: 100000, pagos: [], notasCreditoDebito: [] },
      { total: 200000, pagos: [], notasCreditoDebito: [] },
    ])
    mockPrisma.pagoDeEmpresa.findMany.mockResolvedValue([])
    mockPrisma.notaCreditoDebito.findMany.mockResolvedValue([])

    const saldo = await calcularSaldoCCEmpresa("emp1")
    expect(saldo.saldoDeudor).toBe(300000)
    expect(saldo.saldoAFavor).toBe(0)
    expect(saldo.creditoDisponible).toBe(0)
    expect(saldo.saldoNeto).toBe(300000)
  })

  it("pagos sin factura (sobrepago) → saldoAFavor", async () => {
    mockPrisma.facturaEmitida.findMany.mockResolvedValue([
      { total: 100000, pagos: [{ monto: 100000 }], notasCreditoDebito: [] },
    ])
    mockPrisma.pagoDeEmpresa.findMany.mockResolvedValue([{ monto: 30000 }])
    mockPrisma.notaCreditoDebito.findMany.mockResolvedValue([])

    const saldo = await calcularSaldoCCEmpresa("emp1")
    expect(saldo.saldoDeudor).toBe(0)
    expect(saldo.saldoAFavor).toBe(30000)
  })

  it("NC aplicada reduce saldoPendiente, NC sin aplicar va a creditoDisponible", async () => {
    mockPrisma.facturaEmitida.findMany.mockResolvedValue([
      {
        total: 100000,
        pagos: [],
        notasCreditoDebito: [{ tipo: "NC_EMITIDA", montoDescontado: 20000 }],
      },
    ])
    mockPrisma.pagoDeEmpresa.findMany.mockResolvedValue([])
    mockPrisma.notaCreditoDebito.findMany.mockResolvedValue([
      { montoTotal: 30000, montoDescontado: 20000 },
    ])

    const saldo = await calcularSaldoCCEmpresa("emp1")
    expect(saldo.saldoDeudor).toBe(80000)
    expect(saldo.creditoDisponible).toBe(10000)
  })
})

describe("calcularSaldoCCFletero", () => {
  it("LPs sin pagos ni descuentos → saldoDeudor = sum totales", async () => {
    mockPrisma.liquidacion.findMany.mockResolvedValue([
      { total: 150000, pagos: [], ncDescuentos: [], gastoDescuentos: [], adelantoDescuentos: [] },
      { total: 50000, pagos: [], ncDescuentos: [], gastoDescuentos: [], adelantoDescuentos: [] },
    ])
    mockPrisma.pagoAFletero.findMany.mockResolvedValue([])
    mockPrisma.notaCreditoDebito.findMany.mockResolvedValue([])

    const saldo = await calcularSaldoCCFletero("flet1")
    expect(saldo.saldoDeudor).toBe(200000)
    expect(saldo.saldoNeto).toBe(200000)
  })

  it("aplicaciones (NC + gastos + adelantos) cubren la LP → saldoDeudor 0", async () => {
    mockPrisma.liquidacion.findMany.mockResolvedValue([
      {
        total: 100000,
        pagos: [{ monto: 50000 }],
        ncDescuentos: [{ montoDescontado: 20000 }],
        gastoDescuentos: [{ montoDescontado: 10000 }],
        adelantoDescuentos: [{ montoDescontado: 20000 }],
      },
    ])
    mockPrisma.pagoAFletero.findMany.mockResolvedValue([])
    mockPrisma.notaCreditoDebito.findMany.mockResolvedValue([
      { montoTotal: 20000, montoDescontado: 20000 },
    ])

    const saldo = await calcularSaldoCCFletero("flet1")
    expect(saldo.saldoDeudor).toBe(0)
    expect(saldo.creditoDisponible).toBe(0)
  })

  it("sobrepago global (pago suelto sin LP) → saldoAFavor", async () => {
    mockPrisma.liquidacion.findMany.mockResolvedValue([])
    mockPrisma.pagoAFletero.findMany.mockResolvedValue([{ monto: 10000 }])
    mockPrisma.notaCreditoDebito.findMany.mockResolvedValue([])

    const saldo = await calcularSaldoCCFletero("flet1")
    expect(saldo.saldoAFavor).toBe(10000)
  })
})

describe("calcularSaldoPendienteFactura", () => {
  it("sin pagos ni NC", async () => {
    mockPrisma.facturaEmitida.findUnique.mockResolvedValue({
      total: 100000,
      pagos: [],
      notasCreditoDebito: [],
    })
    expect(await calcularSaldoPendienteFactura("fact1")).toBe(100000)
  })

  it("pago parcial", async () => {
    mockPrisma.facturaEmitida.findUnique.mockResolvedValue({
      total: 100000,
      pagos: [{ monto: 40000 }],
      notasCreditoDebito: [],
    })
    expect(await calcularSaldoPendienteFactura("fact1")).toBe(60000)
  })

  it("NC aplicada reduce pendiente", async () => {
    mockPrisma.facturaEmitida.findUnique.mockResolvedValue({
      total: 100000,
      pagos: [],
      notasCreditoDebito: [{ tipo: "NC_EMITIDA", montoDescontado: 30000 }],
    })
    expect(await calcularSaldoPendienteFactura("fact1")).toBe(70000)
  })

  it("pagos + NC aplicada combinados", async () => {
    mockPrisma.facturaEmitida.findUnique.mockResolvedValue({
      total: 100000,
      pagos: [{ monto: 40000 }],
      notasCreditoDebito: [{ tipo: "NC_EMITIDA", montoDescontado: 20000 }],
    })
    expect(await calcularSaldoPendienteFactura("fact1")).toBe(40000)
  })

  it("factura no encontrada → 0", async () => {
    mockPrisma.facturaEmitida.findUnique.mockResolvedValue(null)
    expect(await calcularSaldoPendienteFactura("nope")).toBe(0)
  })
})

describe("calcularSaldoPendienteLiquidacion", () => {
  it("sin componentes → total", async () => {
    mockPrisma.liquidacion.findUnique.mockResolvedValue({
      total: 200000,
      pagos: [],
      ncDescuentos: [],
      gastoDescuentos: [],
      adelantoDescuentos: [],
    })
    expect(await calcularSaldoPendienteLiquidacion("liq1")).toBe(200000)
  })

  it("pago parcial", async () => {
    mockPrisma.liquidacion.findUnique.mockResolvedValue({
      total: 200000,
      pagos: [{ monto: 80000 }],
      ncDescuentos: [],
      gastoDescuentos: [],
      adelantoDescuentos: [],
    })
    expect(await calcularSaldoPendienteLiquidacion("liq1")).toBe(120000)
  })

  it("NC aplicada + gasto + adelanto + pago", async () => {
    mockPrisma.liquidacion.findUnique.mockResolvedValue({
      total: 200000,
      pagos: [{ monto: 100000 }],
      ncDescuentos: [{ montoDescontado: 40000 }],
      gastoDescuentos: [{ montoDescontado: 30000 }],
      adelantoDescuentos: [{ montoDescontado: 30000 }],
    })
    expect(await calcularSaldoPendienteLiquidacion("liq1")).toBe(0)
  })

  it("liquidacion no encontrada → 0", async () => {
    mockPrisma.liquidacion.findUnique.mockResolvedValue(null)
    expect(await calcularSaldoPendienteLiquidacion("nope")).toBe(0)
  })
})
