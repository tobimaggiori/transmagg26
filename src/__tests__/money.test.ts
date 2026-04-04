/**
 * Tests para el módulo monetario central (src/lib/money.ts).
 *
 * Cubre:
 * - Ejemplos documentados en estilo HTDP
 * - Casos borde de precisión flotante (0.1 + 0.2 = 0.3)
 * - Cálculos de IVA con distintas alícuotas
 * - Redondeos al centavo
 * - Comisiones porcentuales
 * - Totales derivados
 * - Diferencias de un centavo
 * - Consistencia de sumas acumuladas
 * - Inputs de tipo Prisma.Decimal (DecimalLike)
 */

import {
  m,
  redondearMonetario,
  sumarImportes,
  restarImportes,
  multiplicarImporte,
  aplicarPorcentaje,
  calcularIva,
  calcularNetoMasIva,
  importesIguales,
  parsearImporte,
  esMayorQueCero,
  maxMonetario,
  absMonetario,
  dividirImporte,
  formatearMoneda,
} from "@/lib/money"

// ─── Helper para simular Prisma.Decimal ─────────────────────────────────────

function fakeDecimal(val: number) {
  return {
    toNumber: () => val,
    toString: () => val.toString(),
  }
}

// ─── m() (conversión segura) ────────────────────────────────────────────────

describe("m", () => {
  it("redondea number a 2 decimales", () => {
    expect(m(10.005)).toBe(10.01)
  })

  it("parsea string a number redondeado", () => {
    expect(m("1234.56")).toBe(1234.56)
  })

  it("corrige 0.1 + 0.2 a 0.3", () => {
    expect(m(0.1 + 0.2)).toBe(0.3)
  })

  it("acepta DecimalLike (Prisma.Decimal)", () => {
    expect(m(fakeDecimal(1500.999))).toBe(1501)
  })

  it("redondea HALF_UP: 0.005 → 0.01", () => {
    expect(m(0.005)).toBe(0.01)
  })

  it("redondea HALF_UP: 6.004 → 6.00", () => {
    expect(m(6.004)).toBe(6)
  })

  it("10.999 → 11", () => {
    expect(m(10.999)).toBe(11)
  })

  it("número negativo", () => {
    expect(m(-1234.567)).toBe(-1234.57)
  })

  it("cero", () => {
    expect(m(0)).toBe(0)
  })
})

// ─── redondearMonetario (alias de m) ────────────────────────────────────────

describe("redondearMonetario", () => {
  it("es alias de m", () => {
    expect(redondearMonetario(10.005)).toBe(m(10.005))
    expect(redondearMonetario(6.004)).toBe(m(6.004))
    expect(redondearMonetario(10.999)).toBe(m(10.999))
  })
})

// ─── sumarImportes ──────────────────────────────────────────────────────────

describe("sumarImportes", () => {
  it("suma simple", () => {
    expect(sumarImportes([10, 20])).toBe(30)
  })

  it("corrige 0.1 + 0.2 = 0.3", () => {
    expect(sumarImportes([0.1, 0.2])).toBe(0.3)
  })

  it("array vacío = 0", () => {
    expect(sumarImportes([])).toBe(0)
  })

  it("tres tercios de 100", () => {
    expect(sumarImportes([33.33, 33.33, 33.34])).toBe(100)
  })

  it("suma de muchos importes pequeños sin drift", () => {
    const importes = Array(100).fill(0.01)
    expect(sumarImportes(importes)).toBe(1)
  })

  it("acepta DecimalLike", () => {
    expect(sumarImportes([fakeDecimal(100.50), fakeDecimal(200.25)])).toBe(300.75)
  })

  it("acepta strings", () => {
    expect(sumarImportes(["100.50", "200.25"])).toBe(300.75)
  })

  it("mezcla de tipos", () => {
    expect(sumarImportes([100, "200.50", fakeDecimal(50)])).toBe(350.5)
  })

  it("importes negativos y positivos", () => {
    expect(sumarImportes([1000, -300, -200])).toBe(500)
  })

  it("suma de importes grandes", () => {
    expect(sumarImportes([1000000.01, 2000000.02, 3000000.03])).toBe(6000000.06)
  })
})

// ─── restarImportes ─────────────────────────────────────────────────────────

describe("restarImportes", () => {
  it("resta simple", () => {
    expect(restarImportes(100, 33.33)).toBe(66.67)
  })

  it("resultado cero", () => {
    expect(restarImportes(1000, 1000)).toBe(0)
  })

  it("corrige 0.3 - 0.1 = 0.2", () => {
    expect(restarImportes(0.3, 0.1)).toBe(0.2)
  })

  it("resultado negativo", () => {
    expect(restarImportes(100, 150)).toBe(-50)
  })

  it("acepta DecimalLike", () => {
    expect(restarImportes(fakeDecimal(1000), fakeDecimal(333.33))).toBe(666.67)
  })
})

// ─── multiplicarImporte ─────────────────────────────────────────────────────

describe("multiplicarImporte", () => {
  it("multiplicación con redondeo", () => {
    expect(multiplicarImporte(100, 1.21)).toBe(121)
  })

  it("33.33 × 3", () => {
    expect(multiplicarImporte(33.33, 3)).toBe(99.99)
  })

  it("importes pequeños", () => {
    expect(multiplicarImporte(0.1, 0.2)).toBe(0.02)
  })

  it("multiplicar por cero", () => {
    expect(multiplicarImporte(1000, 0)).toBe(0)
  })
})

// ─── aplicarPorcentaje ──────────────────────────────────────────────────────

describe("aplicarPorcentaje", () => {
  it("21% de 1000 = 210", () => {
    expect(aplicarPorcentaje(1000, 21)).toBe(210)
  })

  it("10% de 1250 = 125 (comisión)", () => {
    expect(aplicarPorcentaje(1250, 10)).toBe(125)
  })

  it("21% de 333.33 = 70 (redondeo)", () => {
    expect(aplicarPorcentaje(333.33, 21)).toBe(70)
  })

  it("0.6% de 100 = 0.6 (impuesto débito/crédito)", () => {
    expect(aplicarPorcentaje(100, 0.6)).toBe(0.6)
  })

  it("0% = 0", () => {
    expect(aplicarPorcentaje(1000, 0)).toBe(0)
  })

  it("100% = base", () => {
    expect(aplicarPorcentaje(1234.56, 100)).toBe(1234.56)
  })

  it("10.5% de 1000 = 105", () => {
    expect(aplicarPorcentaje(1000, 10.5)).toBe(105)
  })

  it("21% de 1125 = 236.25 (IVA sobre neto de liquidación)", () => {
    expect(aplicarPorcentaje(1125, 21)).toBe(236.25)
  })

  it("acepta DecimalLike como base", () => {
    expect(aplicarPorcentaje(fakeDecimal(1000), 21)).toBe(210)
  })
})

// ─── calcularIva ────────────────────────────────────────────────────────────

describe("calcularIva", () => {
  it("IVA 21% de 1000", () => {
    expect(calcularIva(1000, 21)).toBe(210)
  })

  it("IVA 21% de 1500", () => {
    expect(calcularIva(1500, 21)).toBe(315)
  })

  it("IVA 21% de 1125", () => {
    expect(calcularIva(1125, 21)).toBe(236.25)
  })

  it("IVA 0% = 0", () => {
    expect(calcularIva(500, 0)).toBe(0)
  })

  it("IVA 21% de 333.33 = 70", () => {
    expect(calcularIva(333.33, 21)).toBe(70)
  })

  it("IVA 10.5% de 1000 = 105", () => {
    expect(calcularIva(1000, 10.5)).toBe(105)
  })

  it("IVA 27% de 1000 = 270", () => {
    expect(calcularIva(1000, 27)).toBe(270)
  })
})

// ─── calcularNetoMasIva ──────────────────────────────────────────────────────

describe("calcularNetoMasIva", () => {
  it("1000 + 21% = {1000, 210, 1210}", () => {
    expect(calcularNetoMasIva(1000, 21)).toEqual({
      neto: 1000,
      iva: 210,
      total: 1210,
    })
  })

  it("333.33 + 21% = {333.33, 70, 403.33}", () => {
    expect(calcularNetoMasIva(333.33, 21)).toEqual({
      neto: 333.33,
      iva: 70,
      total: 403.33,
    })
  })

  it("500 + 0% = {500, 0, 500}", () => {
    expect(calcularNetoMasIva(500, 0)).toEqual({
      neto: 500,
      iva: 0,
      total: 500,
    })
  })

  it("1500 + 21% = {1500, 315, 1815}", () => {
    expect(calcularNetoMasIva(1500, 21)).toEqual({
      neto: 1500,
      iva: 315,
      total: 1815,
    })
  })

  it("neto + iva = total (siempre consistente)", () => {
    const result = calcularNetoMasIva(99.99, 21)
    expect(result.neto + result.iva).toBeCloseTo(result.total, 2)
  })

  it("acepta string como neto", () => {
    expect(calcularNetoMasIva("1000", 21)).toEqual({
      neto: 1000,
      iva: 210,
      total: 1210,
    })
  })
})

// ─── importesIguales ────────────────────────────────────────────────────────

describe("importesIguales", () => {
  it("iguales exactos", () => {
    expect(importesIguales(100, 100)).toBe(true)
  })

  it("diferencia menor a tolerancia", () => {
    expect(importesIguales(100, 100.005)).toBe(true)
  })

  it("diferencia mayor a tolerancia", () => {
    expect(importesIguales(100, 100.02)).toBe(false)
  })

  it("0.1 + 0.2 ≈ 0.3", () => {
    expect(importesIguales(0.1 + 0.2, 0.3)).toBe(true)
  })

  it("diferencia exacta de 1 centavo", () => {
    expect(importesIguales(100, 100.01)).toBe(true)
  })

  it("diferencia de 2 centavos", () => {
    expect(importesIguales(100, 100.02)).toBe(false)
  })

  it("tolerancia personalizada", () => {
    expect(importesIguales(100, 100.05, 0.1)).toBe(true)
    expect(importesIguales(100, 100.05, 0.01)).toBe(false)
  })

  it("importes negativos", () => {
    expect(importesIguales(-100, -100.005)).toBe(true)
  })
})

// ��── parsearImporte ─────────────────────────────────────────────────────────

describe("parsearImporte", () => {
  it("string válido", () => {
    expect(parsearImporte("1234.56")).toBe(1234.56)
  })

  it("string vacío = 0", () => {
    expect(parsearImporte("")).toBe(0)
  })

  it("string inválido = 0", () => {
    expect(parsearImporte("abc")).toBe(0)
  })

  it("number con redondeo", () => {
    expect(parsearImporte(10.005)).toBe(10.01)
  })

  it("string con espacios", () => {
    expect(parsearImporte("  100.50  ")).toBe(100.5)
  })

  it("NaN = 0", () => {
    expect(parsearImporte(NaN)).toBe(0)
  })

  it("Infinity = 0", () => {
    expect(parsearImporte(Infinity)).toBe(0)
  })

  it("número negativo válido", () => {
    expect(parsearImporte("-50.75")).toBe(-50.75)
  })

  it("cero", () => {
    expect(parsearImporte(0)).toBe(0)
  })
})

// ─── esMayorQueCero ─────────────────────────────────────────────────────────

describe("esMayorQueCero", () => {
  it("positivo", () => {
    expect(esMayorQueCero(100)).toBe(true)
  })

  it("cero", () => {
    expect(esMayorQueCero(0)).toBe(false)
  })

  it("negativo", () => {
    expect(esMayorQueCero(-5)).toBe(false)
  })

  it("un centavo", () => {
    expect(esMayorQueCero(0.01)).toBe(true)
  })
})

// ─── maxMonetario ───────────────────────────────────────────────────────────

describe("maxMonetario", () => {
  it("mayor de dos positivos", () => {
    expect(maxMonetario(100, 200)).toBe(200)
  })

  it("clampa a cero", () => {
    expect(maxMonetario(-5, 0)).toBe(0)
  })

  it("ambos iguales", () => {
    expect(maxMonetario(100, 100)).toBe(100)
  })
})

// ─── absMonetario ───────────────────────────────────────────────────────────

describe("absMonetario", () => {
  it("negativo a positivo", () => {
    expect(absMonetario(-100)).toBe(100)
  })

  it("positivo sin cambio", () => {
    expect(absMonetario(50.5)).toBe(50.5)
  })

  it("cero", () => {
    expect(absMonetario(0)).toBe(0)
  })
})

// ─── dividirImporte ─────────────────────────────────────────────────────────

describe("dividirImporte", () => {
  it("100 / 3 = 33.33", () => {
    expect(dividirImporte(100, 3)).toBe(33.33)
  })

  it("1000 / 4 = 250", () => {
    expect(dividirImporte(1000, 4)).toBe(250)
  })

  it("10 / 3 = 3.33", () => {
    expect(dividirImporte(10, 3)).toBe(3.33)
  })

  it("dividir por cero = 0 (seguro)", () => {
    expect(dividirImporte(100, 0)).toBe(0)
  })
})

// ─── formatearMoneda ────────────────────────────────────────────────────────

describe("formatearMoneda", () => {
  it("formatea cero", () => {
    const result = formatearMoneda(0)
    expect(result).toContain("0,00")
  })

  it("formatea miles", () => {
    const result = formatearMoneda(1500)
    expect(result).toContain("1.500,00")
  })

  it("formatea decimales", () => {
    const result = formatearMoneda(1234.56)
    expect(result).toContain("1.234,56")
  })

  it("acepta DecimalLike", () => {
    const result = formatearMoneda(fakeDecimal(1000))
    expect(result).toContain("1.000,00")
  })

  it("acepta string", () => {
    const result = formatearMoneda("2500.75")
    expect(result).toContain("2.500,75")
  })
})

// ─── Escenarios de dominio ──────────────────────────────────────────────────

describe("escenarios de dominio Transmagg", () => {
  it("cálculo completo de factura: viajes → neto → IVA → total", () => {
    // 25000 kg × $60/ton = $1500 neto
    const toneladas = 25000 / 1000 // 25
    const neto = multiplicarImporte(toneladas, 60)
    expect(neto).toBe(1500)

    const { iva, total } = calcularNetoMasIva(neto, 21)
    expect(iva).toBe(315)
    expect(total).toBe(1815)
  })

  it("cálculo completo de liquidación: viajes → subtotal → comisión → neto → IVA", () => {
    const subtotal = sumarImportes([
      multiplicarImporte(25, 50),  // 1250
      multiplicarImporte(10, 100), // 1000
    ])
    expect(subtotal).toBe(2250)

    const comision = aplicarPorcentaje(subtotal, 10)
    expect(comision).toBe(225)

    const neto = restarImportes(subtotal, comision)
    expect(neto).toBe(2025)

    const iva = calcularIva(neto, 21)
    expect(iva).toBe(425.25)

    const total = sumarImportes([neto, iva])
    expect(total).toBe(2450.25)
  })

  it("nota de crédito: montoNeto → IVA → total", () => {
    const { neto, iva, total } = calcularNetoMasIva(333.33, 21)
    expect(neto).toBe(333.33)
    expect(iva).toBe(70)
    expect(total).toBe(403.33)
  })

  it("saldo de cuenta corriente: facturas - pagos ± notas", () => {
    const facturas = [1815, 2420, 968.5]
    const pagos = [1815, 1000]
    const ncEmitida = 100
    const ndEmitida = 50

    const totalFacturas = sumarImportes(facturas)
    const totalPagos = sumarImportes(pagos)
    const ajuste = restarImportes(ndEmitida, ncEmitida) // ND suma deuda, NC resta
    const saldo = restarImportes(
      sumarImportes([totalFacturas, ajuste]),
      totalPagos
    )

    expect(totalFacturas).toBe(5203.5)
    expect(totalPagos).toBe(2815)
    expect(ajuste).toBe(-50)
    expect(saldo).toBe(2338.5)
  })

  it("impuesto débito/crédito: 0.6% de monto", () => {
    expect(aplicarPorcentaje(1000, 0.6)).toBe(6)
    expect(aplicarPorcentaje(50000, 0.6)).toBe(300)
  })

  it("distribución de pago FIFO sin drift", () => {
    let montoRestante = 5000
    const facturas = [1815, 2420, 968.5]
    const pagados: number[] = []

    for (const total of facturas) {
      const aplicar = Math.min(montoRestante, total)
      pagados.push(m(aplicar))
      montoRestante = restarImportes(montoRestante, aplicar)
    }

    expect(pagados).toEqual([1815, 2420, 765])
    expect(montoRestante).toBe(0)
  })

  it("cuotas de seguro: total / N cuotas", () => {
    const total = 12500
    const cuotas = 3
    const montoCuota = dividirImporte(total, cuotas)
    expect(montoCuota).toBe(4166.67)

    // La suma de cuotas iguales puede diferir del total por 1 centavo
    const sumaCuotas = multiplicarImporte(montoCuota, cuotas)
    expect(importesIguales(sumaCuotas, total, 0.01)).toBe(true)
  })

  it("descuento de cheque: monto × tasa → comisión y neto", () => {
    const monto = 10000
    const tasa = 2 // 2%
    const comision = aplicarPorcentaje(monto, tasa)
    const neto = restarImportes(monto, comision)

    expect(comision).toBe(200)
    expect(neto).toBe(9800)
  })

  it("payload ARCA: valores correctamente redondeados", () => {
    const neto = m(1500.006)
    const iva = calcularIva(neto, 21)
    const total = sumarImportes([neto, iva])

    expect(neto).toBe(1500.01)
    expect(iva).toBe(315)
    expect(total).toBe(1815.01)
  })
})
