/**
 * Propósito: Tests unitarios para utilidades financieras.
 * Cada caso usa exactamente los mismos ejemplos del JSDoc de financial.ts.
 */

import {
  calcularCapitalNetoBroker,
  calcularCapitalNetoFci,
  calcularRendimientoAcumuladoFci,
  calcularRendimientoBroker,
  calcularSaldoContableCuenta,
  calcularSaldoDisponibleCuenta,
  calcularSaldoEnFciPropiosCuenta,
  diasHabilesDesde,
  isDiaHabil,
  sugerirImpuestosMovimientoBancario,
  clasificarImpuestoMovimiento,
  calcularMontoImpuestoDebcred,
} from "@/lib/financial"

describe("isDiaHabil", () => {
  it('isDiaHabil(new Date("2026-03-30T12:00:00.000Z")) === true', () => {
    expect(isDiaHabil(new Date("2026-03-30T12:00:00.000Z"))).toBe(true)
  })

  it('isDiaHabil(new Date("2026-03-28T12:00:00.000Z")) === false', () => {
    expect(isDiaHabil(new Date("2026-03-28T12:00:00.000Z"))).toBe(false)
  })

  it('isDiaHabil(new Date("2026-03-29T12:00:00.000Z")) === false', () => {
    expect(isDiaHabil(new Date("2026-03-29T12:00:00.000Z"))).toBe(false)
  })
})

describe("diasHabilesDesde", () => {
  it('diasHabilesDesde(new Date("2026-03-27T12:00:00.000Z"), new Date("2026-03-30T12:00:00.000Z")) === 1', () => {
    expect(diasHabilesDesde(new Date("2026-03-27T12:00:00.000Z"), new Date("2026-03-30T12:00:00.000Z"))).toBe(1)
  })

  it('diasHabilesDesde(new Date("2026-03-28T12:00:00.000Z"), new Date("2026-03-30T12:00:00.000Z")) === 1', () => {
    expect(diasHabilesDesde(new Date("2026-03-28T12:00:00.000Z"), new Date("2026-03-30T12:00:00.000Z"))).toBe(1)
  })

  it('diasHabilesDesde(new Date("2026-03-23T12:00:00.000Z"), new Date("2026-03-30T12:00:00.000Z")) === 5', () => {
    expect(diasHabilesDesde(new Date("2026-03-23T12:00:00.000Z"), new Date("2026-03-30T12:00:00.000Z"))).toBe(5)
  })
})

// ─── clasificarImpuestoMovimiento (puro — regla de negocio) ─────────────────

describe("clasificarImpuestoMovimiento", () => {
  it("transferencia recibida → aplica crédito", () => {
    expect(clasificarImpuestoMovimiento("TRANSFERENCIA_RECIBIDA", true, false))
      .toEqual({ aplicaDebito: false, aplicaCredito: true })
  })

  it("transferencia enviada → aplica débito", () => {
    expect(clasificarImpuestoMovimiento("TRANSFERENCIA_ENVIADA", true, false))
      .toEqual({ aplicaDebito: true, aplicaCredito: false })
  })

  it("cheque depositado → aplica crédito", () => {
    expect(clasificarImpuestoMovimiento("CHEQUE_DEPOSITADO", true, false))
      .toEqual({ aplicaDebito: false, aplicaCredito: true })
  })

  it("cheque emitido debitado → aplica débito", () => {
    expect(clasificarImpuestoMovimiento("CHEQUE_EMITIDO_DEBITADO", true, false))
      .toEqual({ aplicaDebito: true, aplicaCredito: false })
  })

  it("cuenta sin impuesto debcred → ninguno aplica", () => {
    expect(clasificarImpuestoMovimiento("TRANSFERENCIA_ENVIADA", false, false))
      .toEqual({ aplicaDebito: false, aplicaCredito: false })
  })

  it("envío a broker desde comitente → exento", () => {
    expect(clasificarImpuestoMovimiento("ENVIO_A_BROKER", true, true))
      .toEqual({ aplicaDebito: false, aplicaCredito: false })
  })

  it("rescate de broker desde comitente → exento", () => {
    expect(clasificarImpuestoMovimiento("RESCATE_DE_BROKER", true, true))
      .toEqual({ aplicaDebito: false, aplicaCredito: false })
  })

  it("envío a broker desde cuenta normal → exento (está en TIPOS_SIN_IMPUESTO)", () => {
    expect(clasificarImpuestoMovimiento("ENVIO_A_BROKER", true, false))
      .toEqual({ aplicaDebito: false, aplicaCredito: false })
  })

  it("pago sueldo → exento", () => {
    expect(clasificarImpuestoMovimiento("PAGO_SUELDO", true, false))
      .toEqual({ aplicaDebito: false, aplicaCredito: false })
  })

  it("transferencia entre propias → exento", () => {
    expect(clasificarImpuestoMovimiento("TRANSFERENCIA_ENTRE_CUENTAS_PROPIAS", true, false))
      .toEqual({ aplicaDebito: false, aplicaCredito: false })
  })

  it("tipo desconocido → ninguno aplica", () => {
    expect(clasificarImpuestoMovimiento("OTRO_TIPO", true, false))
      .toEqual({ aplicaDebito: false, aplicaCredito: false })
  })

  it("interés cuenta remunerada → aplica crédito", () => {
    expect(clasificarImpuestoMovimiento("INTERES_CUENTA_REMUNERADA", true, false))
      .toEqual({ aplicaDebito: false, aplicaCredito: true })
  })
})

// ─── calcularMontoImpuestoDebcred (puro — cálculo monetario) ────────────────

describe("calcularMontoImpuestoDebcred", () => {
  it("0.6% de 1000 = 6", () => {
    expect(calcularMontoImpuestoDebcred(1000, 0.006)).toBe(6)
  })

  it("valor absoluto de monto negativo", () => {
    expect(calcularMontoImpuestoDebcred(-1000, 0.006)).toBe(6)
  })

  it("0.6% de 50000 = 300", () => {
    expect(calcularMontoImpuestoDebcred(50000, 0.006)).toBe(300)
  })

  it("alícuota 0 → 0", () => {
    expect(calcularMontoImpuestoDebcred(1000, 0)).toBe(0)
  })

  it("monto 0 → 0", () => {
    expect(calcularMontoImpuestoDebcred(0, 0.006)).toBe(0)
  })
})

// ─── sugerirImpuestosMovimientoBancario (compuesta) ─────────────────────────

describe("sugerirImpuestosMovimientoBancario", () => {
  it('sugerirImpuestosMovimientoBancario({ tipo: "TRANSFERENCIA_RECIBIDA", monto: 1000, tieneImpuestoDebcred: true, alicuotaImpuesto: 0.006 }).impuestoCreditoMonto === 6', () => {
    expect(
      sugerirImpuestosMovimientoBancario({
        tipo: "TRANSFERENCIA_RECIBIDA",
        monto: 1000,
        tieneImpuestoDebcred: true,
        alicuotaImpuesto: 0.006,
      }).impuestoCreditoMonto
    ).toBe(6)
  })

  it('sugerirImpuestosMovimientoBancario({ tipo: "TRANSFERENCIA_ENVIADA", monto: -1000, tieneImpuestoDebcred: true, alicuotaImpuesto: 0.006 }).impuestoDebitoMonto === 6', () => {
    expect(
      sugerirImpuestosMovimientoBancario({
        tipo: "TRANSFERENCIA_ENVIADA",
        monto: -1000,
        tieneImpuestoDebcred: true,
        alicuotaImpuesto: 0.006,
      }).impuestoDebitoMonto
    ).toBe(6)
  })

  it('sugerirImpuestosMovimientoBancario({ tipo: "ENVIO_A_BROKER", monto: -1000, tieneImpuestoDebcred: true, alicuotaImpuesto: 0.006, esCuentaComitenteBroker: true }).impuestoDebitoAplica === false', () => {
    expect(
      sugerirImpuestosMovimientoBancario({
        tipo: "ENVIO_A_BROKER",
        monto: -1000,
        tieneImpuestoDebcred: true,
        alicuotaImpuesto: 0.006,
        esCuentaComitenteBroker: true,
      }).impuestoDebitoAplica
    ).toBe(false)
  })
})

describe("calcularCapitalNetoFci", () => {
  it("calcularCapitalNetoFci(200000, 50000) === 150000", () => {
    expect(calcularCapitalNetoFci(200000, 50000)).toBe(150000)
  })

  it("calcularCapitalNetoFci(120000, 0) === 120000", () => {
    expect(calcularCapitalNetoFci(120000, 0)).toBe(120000)
  })

  it("calcularCapitalNetoFci(50000, 70000) === -20000", () => {
    expect(calcularCapitalNetoFci(50000, 70000)).toBe(-20000)
  })
})

describe("calcularRendimientoAcumuladoFci", () => {
  it("calcularRendimientoAcumuladoFci(210500, 150000) === 60500", () => {
    expect(calcularRendimientoAcumuladoFci(210500, 150000)).toBe(60500)
  })

  it("calcularRendimientoAcumuladoFci(160000, 150000) === 10000", () => {
    expect(calcularRendimientoAcumuladoFci(160000, 150000)).toBe(10000)
  })

  it("calcularRendimientoAcumuladoFci(90000, 120000) === -30000", () => {
    expect(calcularRendimientoAcumuladoFci(90000, 120000)).toBe(-30000)
  })
})

describe("calcularSaldoContableCuenta", () => {
  it("calcularSaldoContableCuenta(1000, [200, -50, 25]) === 1175", () => {
    expect(calcularSaldoContableCuenta(1000, [200, -50, 25])).toBe(1175)
  })

  it("calcularSaldoContableCuenta(0, []) === 0", () => {
    expect(calcularSaldoContableCuenta(0, [])).toBe(0)
  })

  it("calcularSaldoContableCuenta(500, [-100, -50]) === 350", () => {
    expect(calcularSaldoContableCuenta(500, [-100, -50])).toBe(350)
  })
})

describe("calcularSaldoEnFciPropiosCuenta", () => {
  it("calcularSaldoEnFciPropiosCuenta([{ saldoInformadoActual: 210500 }, { saldoInformadoActual: 50000 }]) === 260500", () => {
    expect(calcularSaldoEnFciPropiosCuenta([{ saldoInformadoActual: 210500 }, { saldoInformadoActual: 50000 }])).toBe(260500)
  })

  it("calcularSaldoEnFciPropiosCuenta([]) === 0", () => {
    expect(calcularSaldoEnFciPropiosCuenta([])).toBe(0)
  })

  it("calcularSaldoEnFciPropiosCuenta([{ saldoInformadoActual: 160000 }]) === 160000", () => {
    expect(calcularSaldoEnFciPropiosCuenta([{ saldoInformadoActual: 160000 }])).toBe(160000)
  })
})

describe("calcularSaldoDisponibleCuenta", () => {
  it("calcularSaldoDisponibleCuenta(1000000, 210500) === 789500", () => {
    expect(calcularSaldoDisponibleCuenta(1000000, 210500)).toBe(789500)
  })

  it("calcularSaldoDisponibleCuenta(50000, 0) === 50000", () => {
    expect(calcularSaldoDisponibleCuenta(50000, 0)).toBe(50000)
  })

  it("calcularSaldoDisponibleCuenta(120000, 160000) === -40000", () => {
    expect(calcularSaldoDisponibleCuenta(120000, 160000)).toBe(-40000)
  })
})

describe("calcularCapitalNetoBroker", () => {
  it("calcularCapitalNetoBroker(200000, 50000) === 150000", () => {
    expect(calcularCapitalNetoBroker(200000, 50000)).toBe(150000)
  })

  it("calcularCapitalNetoBroker(0, 0) === 0", () => {
    expect(calcularCapitalNetoBroker(0, 0)).toBe(0)
  })

  it("calcularCapitalNetoBroker(100000, 130000) === -30000", () => {
    expect(calcularCapitalNetoBroker(100000, 130000)).toBe(-30000)
  })
})

describe("calcularRendimientoBroker", () => {
  it("calcularRendimientoBroker({ capitalEnviado: 200000, capitalRescatado: 50000, saldoFcis: 160000 }) === 10000", () => {
    expect(calcularRendimientoBroker({ capitalEnviado: 200000, capitalRescatado: 50000, saldoFcis: 160000 })).toBe(10000)
  })

  it("calcularRendimientoBroker({ capitalEnviado: 100000, capitalRescatado: 0, saldoFcis: 95000 }) === -5000", () => {
    expect(calcularRendimientoBroker({ capitalEnviado: 100000, capitalRescatado: 0, saldoFcis: 95000 })).toBe(-5000)
  })

  it("calcularRendimientoBroker({ capitalEnviado: 0, capitalRescatado: 0, saldoFcis: 0 }) === 0", () => {
    expect(calcularRendimientoBroker({ capitalEnviado: 0, capitalRescatado: 0, saldoFcis: 0 })).toBe(0)
  })
})
