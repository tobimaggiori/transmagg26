/**
 * Tests para `ejecutarCrearReciboCobranza`.
 *
 * Foco: aplicación EXPLÍCITA de NC/ND elegidas por el operador.
 * El comando ya no auto-aplica NC; cada nota debe venir en `notasAplicadas`
 * con su monto, registrarse en `notas_aplicadas_en_recibo` y acumular en
 * `montoDescontado` de la NotaCreditoDebito.
 */

const mockPrisma = {
  facturaEmitida: { findMany: jest.fn(), update: jest.fn() },
  reciboCobranza: { aggregate: jest.fn(), create: jest.fn(), update: jest.fn() },
  facturaEnRecibo: { create: jest.fn() },
  notaAplicadaEnRecibo: { create: jest.fn() },
  notaCreditoDebito: { update: jest.fn(), findMany: jest.fn() },
  pagoDeEmpresa: { create: jest.fn(), findMany: jest.fn() },
  medioPagoRecibo: { create: jest.fn() },
  chequeRecibido: { create: jest.fn() },
  faltanteViaje: { create: jest.fn() },
  $transaction: jest.fn((cb: (tx: unknown) => Promise<unknown>) => cb(mockPrisma)),
}

jest.mock("@/lib/prisma", () => ({ prisma: mockPrisma }))
jest.mock("@/lib/storage", () => ({ subirPDF: jest.fn().mockResolvedValue("key") }))
jest.mock("@/lib/pdf-recibo-cobranza", () => ({
  generarPDFReciboCobranza: jest.fn().mockResolvedValue(Buffer.from("")),
}))
jest.mock("@/lib/cuenta-corriente", () => ({
  calcularSaldoCCEmpresa: jest.fn().mockResolvedValue({
    saldoDeudor: 0, saldoAFavor: 0, creditoDisponible: 0, saldoNeto: 0,
  }),
}))
jest.mock("@/lib/movimiento-cuenta", () => ({ registrarMovimiento: jest.fn() }))

import { ejecutarCrearReciboCobranza } from "@/lib/recibo-cobranza-commands"

beforeEach(() => {
  jest.clearAllMocks()
  mockPrisma.reciboCobranza.aggregate.mockResolvedValue({ _max: { nro: 0 } })
  mockPrisma.reciboCobranza.create.mockImplementation(async ({ data }: { data: { nro: number } }) => ({
    id: "r1", nro: data.nro, ptoVenta: 1,
  }))
  mockPrisma.facturaEnRecibo.create.mockResolvedValue({})
  mockPrisma.notaAplicadaEnRecibo.create.mockResolvedValue({})
  mockPrisma.notaCreditoDebito.update.mockResolvedValue({})
  mockPrisma.pagoDeEmpresa.create.mockResolvedValue({ id: "p1" })
  mockPrisma.facturaEmitida.update.mockResolvedValue({})
  mockPrisma.medioPagoRecibo.create.mockResolvedValue({})
})

const FECHA = "2026-04-29"

function setupFactura(opts: {
  total: number
  pagos?: number[]
  notas?: { id: string; tipo: string; montoTotal: number; montoDescontado: number }[]
}) {
  mockPrisma.facturaEmitida.findMany.mockResolvedValue([
    {
      id: "f1",
      total: opts.total,
      pagos: (opts.pagos ?? []).map((m) => ({ monto: m })),
      notasCreditoDebito: opts.notas ?? [],
    },
  ])
}

describe("ejecutarCrearReciboCobranza — NC/ND explícitas", () => {
  it("aplica NC seleccionada: junction + incrementa montoDescontado + factura COBRADA", async () => {
    setupFactura({
      total: 1000,
      notas: [{ id: "nc1", tipo: "NC_EMITIDA", montoTotal: 200, montoDescontado: 0 }],
    })

    const r = await ejecutarCrearReciboCobranza(
      {
        empresaId: "e1",
        facturasAplicadas: [{ facturaId: "f1", montoAplicado: 800 }],
        notasAplicadas: [{ notaId: "nc1", monto: 200 }],
        mediosPago: [{ tipo: "EFECTIVO", monto: 800 }],
        retencionGanancias: 0, retencionIIBB: 0, retencionSUSS: 0,
        faltantes: [], fecha: FECHA,
      },
      "op1",
    )

    expect(r.ok).toBe(true)
    expect(mockPrisma.notaAplicadaEnRecibo.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ notaId: "nc1", reciboId: "r1", monto: 200 }),
    })
    expect(mockPrisma.notaCreditoDebito.update).toHaveBeenCalledWith({
      where: { id: "nc1" },
      data: { montoDescontado: { increment: 200 } },
    })
    expect(mockPrisma.facturaEmitida.update).toHaveBeenCalledWith({
      where: { id: "f1" },
      data: { estadoCobro: "COBRADA" },
    })
  })

  it("rechaza monto de NC superior al disponible (montoTotal − montoDescontado)", async () => {
    setupFactura({
      total: 1000,
      notas: [{ id: "nc1", tipo: "NC_EMITIDA", montoTotal: 200, montoDescontado: 150 }],
    })

    const r = await ejecutarCrearReciboCobranza(
      {
        empresaId: "e1",
        facturasAplicadas: [{ facturaId: "f1", montoAplicado: 800 }],
        notasAplicadas: [{ notaId: "nc1", monto: 100 }],
        mediosPago: [{ tipo: "EFECTIVO", monto: 800 }],
        retencionGanancias: 0, retencionIIBB: 0, retencionSUSS: 0,
        faltantes: [], fecha: FECHA,
      },
      "op1",
    )

    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toMatch(/disponible/i)
  })

  it("rechaza nota que no pertenece a facturas del recibo", async () => {
    setupFactura({ total: 1000 })

    const r = await ejecutarCrearReciboCobranza(
      {
        empresaId: "e1",
        facturasAplicadas: [{ facturaId: "f1", montoAplicado: 1000 }],
        notasAplicadas: [{ notaId: "nc-otra", monto: 100 }],
        mediosPago: [{ tipo: "EFECTIVO", monto: 1000 }],
        retencionGanancias: 0, retencionIIBB: 0, retencionSUSS: 0,
        faltantes: [], fecha: FECHA,
      },
      "op1",
    )

    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toMatch(/no pertenece/i)
  })

  it("ND aplicada aumenta el cash requerido para cerrar la factura", async () => {
    setupFactura({
      total: 1000,
      notas: [{ id: "nd1", tipo: "ND_EMITIDA", montoTotal: 300, montoDescontado: 0 }],
    })

    // Aplicando ND $300, factura 1000 → necesita 1300 cash para COBRADA
    const r = await ejecutarCrearReciboCobranza(
      {
        empresaId: "e1",
        facturasAplicadas: [{ facturaId: "f1", montoAplicado: 1300 }],
        notasAplicadas: [{ notaId: "nd1", monto: 300 }],
        mediosPago: [{ tipo: "EFECTIVO", monto: 1300 }],
        retencionGanancias: 0, retencionIIBB: 0, retencionSUSS: 0,
        faltantes: [], fecha: FECHA,
      },
      "op1",
    )

    expect(r.ok).toBe(true)
    expect(mockPrisma.facturaEmitida.update).toHaveBeenCalledWith({
      where: { id: "f1" },
      data: { estadoCobro: "COBRADA" },
    })
  })

  it("NC aplicada parcialmente deja la factura en PARCIALMENTE_COBRADA", async () => {
    setupFactura({
      total: 1000,
      notas: [{ id: "nc1", tipo: "NC_EMITIDA", montoTotal: 200, montoDescontado: 0 }],
    })

    // Aplica NC $100 (de los 200 disponibles), paga $500 cash. Saldo final = 1000 − 100 − 500 = 400
    const r = await ejecutarCrearReciboCobranza(
      {
        empresaId: "e1",
        facturasAplicadas: [{ facturaId: "f1", montoAplicado: 500 }],
        notasAplicadas: [{ notaId: "nc1", monto: 100 }],
        mediosPago: [{ tipo: "EFECTIVO", monto: 500 }],
        retencionGanancias: 0, retencionIIBB: 0, retencionSUSS: 0,
        faltantes: [], fecha: FECHA,
      },
      "op1",
    )

    expect(r.ok).toBe(true)
    expect(mockPrisma.facturaEmitida.update).toHaveBeenCalledWith({
      where: { id: "f1" },
      data: { estadoCobro: "PARCIALMENTE_COBRADA" },
    })
  })

  it("NC NO seleccionada no se aplica (no incrementa montoDescontado)", async () => {
    setupFactura({
      total: 1000,
      notas: [{ id: "nc1", tipo: "NC_EMITIDA", montoTotal: 200, montoDescontado: 0 }],
    })

    // Cobra full $1000 sin aplicar la NC → factura COBRADA, NC sigue intacta
    const r = await ejecutarCrearReciboCobranza(
      {
        empresaId: "e1",
        facturasAplicadas: [{ facturaId: "f1", montoAplicado: 1000 }],
        notasAplicadas: [],
        mediosPago: [{ tipo: "EFECTIVO", monto: 1000 }],
        retencionGanancias: 0, retencionIIBB: 0, retencionSUSS: 0,
        faltantes: [], fecha: FECHA,
      },
      "op1",
    )

    expect(r.ok).toBe(true)
    expect(mockPrisma.notaAplicadaEnRecibo.create).not.toHaveBeenCalled()
    expect(mockPrisma.notaCreditoDebito.update).not.toHaveBeenCalled()
  })

  it("rechaza cash que excede deuda vigente (con NC aplicada)", async () => {
    setupFactura({
      total: 1000,
      notas: [{ id: "nc1", tipo: "NC_EMITIDA", montoTotal: 200, montoDescontado: 0 }],
    })

    // Saldo después de aplicar NC $200 = $800. Pagar $1000 supera la deuda.
    const r = await ejecutarCrearReciboCobranza(
      {
        empresaId: "e1",
        facturasAplicadas: [{ facturaId: "f1", montoAplicado: 1000 }],
        notasAplicadas: [{ notaId: "nc1", monto: 200 }],
        mediosPago: [{ tipo: "EFECTIVO", monto: 1000 }],
        retencionGanancias: 0, retencionIIBB: 0, retencionSUSS: 0,
        faltantes: [], fecha: FECHA,
      },
      "op1",
    )

    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toMatch(/saldo pendiente/i)
  })

  it("absorción 100% por NC: cash 0 + NC $1000 → COBRADA, sin PagoDeEmpresa", async () => {
    setupFactura({
      total: 1000,
      notas: [{ id: "nc1", tipo: "NC_EMITIDA", montoTotal: 1000, montoDescontado: 0 }],
    })

    const r = await ejecutarCrearReciboCobranza(
      {
        empresaId: "e1",
        facturasAplicadas: [{ facturaId: "f1", montoAplicado: 0 }],
        notasAplicadas: [{ notaId: "nc1", monto: 1000 }],
        mediosPago: [],
        retencionGanancias: 0, retencionIIBB: 0, retencionSUSS: 0,
        faltantes: [], fecha: FECHA,
      },
      "op1",
    )

    expect(r.ok).toBe(true)
    expect(mockPrisma.pagoDeEmpresa.create).not.toHaveBeenCalled()
    expect(mockPrisma.facturaEmitida.update).toHaveBeenCalledWith({
      where: { id: "f1" },
      data: { estadoCobro: "COBRADA" },
    })
  })
})
