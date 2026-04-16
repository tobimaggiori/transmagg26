/**
 * Tests del invariante crítico de Orden de Pago:
 *
 * Una OP cancela íntegramente los LPs incluidos. Si la validación
 * `pagos + descuentos == sum(saldos pendientes)` pasa, después de aplicar
 * la distribución todos los LPs deben quedar en saldo 0.
 *
 * `distribuirEnLPs` es la helper pura que reparte cada item (pago o descuento)
 * entre los LPs en orden cronológico, consumiendo `saldosRestantes` in place.
 * Estos tests garantizan ese contrato.
 */

import { distribuirEnLPs } from "@/lib/orden-pago-commands"
import { sumarImportes } from "@/lib/money"

function totalSaldosRestantes(map: Map<string, number>): number {
  return sumarImportes(Array.from(map.values()))
}

describe("distribuirEnLPs", () => {
  it("monto cubre primer LP exacto, no toca el segundo", () => {
    const saldos = new Map([["a", 100], ["b", 50]])
    const lps = [{ id: "a" }, { id: "b" }]
    const segs = distribuirEnLPs(100, saldos, lps)
    expect(segs).toEqual([{ liquidacionId: "a", monto: 100 }])
    expect(saldos.get("a")).toBe(0)
    expect(saldos.get("b")).toBe(50)
  })

  it("monto se reparte entre dos LPs cuando excede el saldo del primero", () => {
    const saldos = new Map([["a", 30], ["b", 40]])
    const lps = [{ id: "a" }, { id: "b" }]
    const segs = distribuirEnLPs(50, saldos, lps)
    expect(segs).toEqual([
      { liquidacionId: "a", monto: 30 },
      { liquidacionId: "b", monto: 20 },
    ])
    expect(saldos.get("a")).toBe(0)
    expect(saldos.get("b")).toBe(20)
  })

  it("salta LPs ya saldados (saldo = 0) y empieza por el siguiente con saldo", () => {
    const saldos = new Map([["a", 0], ["b", 100]])
    const lps = [{ id: "a" }, { id: "b" }]
    const segs = distribuirEnLPs(100, saldos, lps)
    expect(segs).toEqual([{ liquidacionId: "b", monto: 100 }])
    expect(saldos.get("a")).toBe(0)
    expect(saldos.get("b")).toBe(0)
  })

  it("monto 0 no genera segmentos ni modifica saldos", () => {
    const saldos = new Map([["a", 100]])
    const lps = [{ id: "a" }]
    expect(distribuirEnLPs(0, saldos, lps)).toEqual([])
    expect(saldos.get("a")).toBe(100)
  })

  it("monto excedente sobre el último LP queda imputado al primer segmento", () => {
    // Caso defensivo de redondeo: si el caller pasa más de lo que hay en saldos.
    const saldos = new Map([["a", 30]])
    const lps = [{ id: "a" }]
    const segs = distribuirEnLPs(50, saldos, lps)
    expect(segs).toHaveLength(1)
    expect(segs[0].liquidacionId).toBe("a")
    expect(segs[0].monto).toBe(50)
  })
})

// ─── Invariante crítico: una OP cancela los LPs en su totalidad ─────────────

describe("Invariante OP: pagos + descuentos cancelan todos los LPs", () => {
  it("un solo LP, solo pagos cubren el total", () => {
    const saldos = new Map([["liq1", 100000]])
    const lps = [{ id: "liq1" }]
    distribuirEnLPs(100000, saldos, lps)
    expect(totalSaldosRestantes(saldos)).toBe(0)
  })

  it("dos LPs cubiertos por dos pagos en cadena", () => {
    const saldos = new Map([["liq1", 60000], ["liq2", 40000]])
    const lps = [{ id: "liq1" }, { id: "liq2" }]
    // Pago 1 cubre liq1 entero
    distribuirEnLPs(60000, saldos, lps)
    // Pago 2 cubre liq2
    distribuirEnLPs(40000, saldos, lps)
    expect(totalSaldosRestantes(saldos)).toBe(0)
  })

  it("dos LPs con pago + NC + gasto + adelanto cubren la totalidad", () => {
    // Caso del bug que motivó el refactor: 2 LPs, varios items, todos deben quedar en 0
    const saldos = new Map([["liq1", 1076900], ["liq2", 2423025]])
    const lps = [{ id: "liq1" }, { id: "liq2" }]
    // Pago grande que cubre liq1 entero y deja un resto en liq2
    distribuirEnLPs(1076900 + 2391487, saldos, lps)
    expect(saldos.get("liq1")).toBe(0)
    expect(saldos.get("liq2")).toBe(31538)
    // NC aplicada cubre parte
    distribuirEnLPs(21538, saldos, lps)
    // Gasto descontado cubre el resto
    distribuirEnLPs(10000, saldos, lps)
    expect(totalSaldosRestantes(saldos)).toBe(0)
  })

  it("descuento cuyo monto excede el saldo del LP corriente se reparte al siguiente", () => {
    const saldos = new Map([["liq1", 5000], ["liq2", 30000]])
    const lps = [{ id: "liq1" }, { id: "liq2" }]
    // El descuento de 25000 va 5000 a liq1 y 20000 a liq2
    const segs = distribuirEnLPs(25000, saldos, lps)
    expect(segs).toEqual([
      { liquidacionId: "liq1", monto: 5000 },
      { liquidacionId: "liq2", monto: 20000 },
    ])
    expect(saldos.get("liq1")).toBe(0)
    expect(saldos.get("liq2")).toBe(10000)
  })

  it("tres LPs, mix realista de items, todos quedan saldados", () => {
    const saldos = new Map([
      ["lp1", 50000],
      ["lp2", 75000],
      ["lp3", 25000],
    ])
    const lps = [{ id: "lp1" }, { id: "lp2" }, { id: "lp3" }]
    // Cheque de 80000
    distribuirEnLPs(80000, saldos, lps)
    // Transferencia de 40000
    distribuirEnLPs(40000, saldos, lps)
    // NC aplicada de 20000
    distribuirEnLPs(20000, saldos, lps)
    // Gasto descontado de 10000
    distribuirEnLPs(10000, saldos, lps)
    expect(totalSaldosRestantes(saldos)).toBe(0)
  })
})
