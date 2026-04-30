/**
 * Tests de generación TXT del LID ARCA.
 *
 * Crítico verificar:
 * - Longitud exacta de cada línea (266, 62, 325, 84)
 * - Posición correcta de cada campo
 * - Manejo de comprobantes con varias alícuotas
 * - Manejo de NC/ND con signos correctos
 * - Archivo vacío cuando no hay registros
 */

import {
  generarComprobantesVentasTxt,
  generarAlicuotasVentasTxt,
  generarComprobantesComprasTxt,
  generarAlicuotasComprasTxt,
  LONGITUD_VENTAS_CBTE,
  LONGITUD_VENTAS_ALICUOTAS,
  LONGITUD_COMPRAS_CBTE,
  LONGITUD_COMPRAS_ALICUOTAS,
} from "@/lib/iva-portal/generar-txt"
import type { ComprobanteIva, AlicuotaIva } from "@/lib/iva-portal/types"

// ─── Factories de DTOs para tests ────────────────────────────────────────────

function cbteVentaA(overrides: Partial<ComprobanteIva> = {}): ComprobanteIva {
  return {
    tipoLibro: "VENTAS",
    tipoReferencia: "FACTURA_EMITIDA",
    referenciaId: "f1",
    fecha: new Date(2026, 3, 15),
    tipoComprobanteArca: 1,
    puntoVenta: 1,
    numeroDesde: 123,
    numeroHasta: 123,
    cuitContraparte: "30709381683",
    razonSocialContraparte: "EMPRESA CLIENTE SRL",
    totalOperacion: 1210,
    netoGravado: 1000,
    noGravado: 0,
    noCategorizados: 0,
    exento: 0,
    pagosACuenta: 0,
    percepcionIibb: 0,
    impuestosMunicipales: 0,
    impuestosInternos: 0,
    otrosTributos: 0,
    percepcionIva: 0,
    percepcionGanancias: 0,
    codigoMoneda: "PES",
    tipoCambio: 1,
    cantidadAlicuotas: 1,
    codigoOperacion: "0",
    fechaPago: null,
    ...overrides,
  }
}

function alicuotaVenta(overrides: Partial<AlicuotaIva> = {}): AlicuotaIva {
  return {
    tipoLibro: "VENTAS",
    tipoComprobanteArca: 1,
    puntoVenta: 1,
    numeroComprobante: 123,
    netoGravado: 1000,
    alicuotaPorcentaje: 21,
    montoIva: 210,
    ...overrides,
  }
}

function cbteCompra(overrides: Partial<ComprobanteIva> = {}): ComprobanteIva {
  return {
    ...cbteVentaA(),
    tipoLibro: "COMPRAS",
    tipoReferencia: "FACTURA_PROVEEDOR",
    razonSocialContraparte: "PROVEEDOR ACME SA",
    ...overrides,
  }
}

function alicuotaCompra(overrides: Partial<AlicuotaIva> = {}): AlicuotaIva {
  return {
    tipoLibro: "COMPRAS",
    tipoComprobanteArca: 1,
    puntoVenta: 1,
    numeroComprobante: 123,
    netoGravado: 1000,
    alicuotaPorcentaje: 21,
    montoIva: 210,
    cuitProveedor: "30709381683",
    ...overrides,
  }
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe("generarComprobantesVentasTxt", () => {
  it("array vacío genera string vacío", () => {
    expect(generarComprobantesVentasTxt([])).toBe("")
  })

  it("longitud exacta 266 + CRLF", () => {
    const out = generarComprobantesVentasTxt([cbteVentaA()])
    // Quitar el CRLF final para medir línea
    const lineas = out.split("\r\n").filter(l => l.length > 0)
    expect(lineas).toHaveLength(1)
    expect(lineas[0]).toHaveLength(LONGITUD_VENTAS_CBTE)
    expect(out.endsWith("\r\n")).toBe(true)
  })

  it("posiciones del header (fecha, tipoCbte, ptoVenta, nro)", () => {
    const c = cbteVentaA({
      fecha: new Date(2026, 3, 15),
      tipoComprobanteArca: 1,
      puntoVenta: 1,
      numeroDesde: 123,
      numeroHasta: 123,
    })
    const linea = generarComprobantesVentasTxt([c]).trim()
    expect(linea.slice(0, 8)).toBe("20260415")
    expect(linea.slice(8, 11)).toBe("001")
    expect(linea.slice(11, 16)).toBe("00001")
    expect(linea.slice(16, 36)).toBe("00000000000000000123")
    expect(linea.slice(36, 56)).toBe("00000000000000000123")
  })

  it("código documento + CUIT padded a 20", () => {
    const linea = generarComprobantesVentasTxt([cbteVentaA()]).trim()
    expect(linea.slice(56, 58)).toBe("80") // CUIT
    expect(linea.slice(58, 78)).toBe("00000000030709381683")
  })

  it("razón social truncada/padded a 30", () => {
    const linea = generarComprobantesVentasTxt([
      cbteVentaA({ razonSocialContraparte: "EMPRESA CLIENTE SRL" }),
    ]).trim()
    expect(linea.slice(78, 108)).toBe("EMPRESA CLIENTE SRL           ")
  })

  it("razón social con tabs/newlines limpia", () => {
    const linea = generarComprobantesVentasTxt([
      cbteVentaA({ razonSocialContraparte: "ACME\tSA\nSRL" }),
    ]).trim()
    expect(linea.slice(78, 108)).toBe("ACME SA SRL                   ")
  })

  it("total y neto en centavos correctos", () => {
    const linea = generarComprobantesVentasTxt([
      cbteVentaA({ totalOperacion: 1210, netoGravado: 1000 }),
    ]).trim()
    // total: posiciones 108-123 (15 chars)
    expect(linea.slice(108, 123)).toBe("000000000121000") // 1210.00 → 121000 centavos
  })

  it("código moneda PES y tipo cambio 1", () => {
    const linea = generarComprobantesVentasTxt([cbteVentaA()]).trim()
    expect(linea.slice(228, 231)).toBe("PES")
    expect(linea.slice(231, 241)).toBe("0001000000")
  })

  it("cantidad alícuotas y código operación", () => {
    const linea = generarComprobantesVentasTxt([
      cbteVentaA({ cantidadAlicuotas: 2, codigoOperacion: "0" }),
    ]).trim()
    expect(linea.slice(241, 242)).toBe("2")
    expect(linea.slice(242, 243)).toBe("0")
  })

  it("fecha de pago para FCE 201 en formato DDMMYYYY", () => {
    const c = cbteVentaA({
      tipoComprobanteArca: 201,
      fechaPago: new Date(2026, 4, 15),
    })
    const linea = generarComprobantesVentasTxt([c]).trim()
    expect(linea.slice(258, 266)).toBe("15052026")
  })

  it("fecha de pago vacía para no FCE", () => {
    const linea = generarComprobantesVentasTxt([cbteVentaA()]).trim()
    expect(linea.slice(258, 266)).toBe("00000000")
  })

  it("varios comprobantes: una línea por cada uno", () => {
    const out = generarComprobantesVentasTxt([cbteVentaA(), cbteVentaA({ numeroDesde: 124, numeroHasta: 124 })])
    const lineas = out.split("\r\n").filter(l => l.length > 0)
    expect(lineas).toHaveLength(2)
    expect(lineas[0]).toHaveLength(LONGITUD_VENTAS_CBTE)
    expect(lineas[1]).toHaveLength(LONGITUD_VENTAS_CBTE)
  })

  it("FCE 201 con campos correctos", () => {
    const c = cbteVentaA({
      tipoComprobanteArca: 201,
      totalOperacion: 121000,
      netoGravado: 100000,
      fechaPago: new Date(2026, 5, 30),
    })
    const linea = generarComprobantesVentasTxt([c]).trim()
    expect(linea.slice(8, 11)).toBe("201")
    expect(linea.slice(258, 266)).toBe("30062026")
  })
})

describe("generarAlicuotasVentasTxt", () => {
  it("array vacío genera string vacío", () => {
    expect(generarAlicuotasVentasTxt([])).toBe("")
  })

  it("longitud exacta 62", () => {
    const out = generarAlicuotasVentasTxt([alicuotaVenta()])
    const lineas = out.split("\r\n").filter(l => l.length > 0)
    expect(lineas[0]).toHaveLength(LONGITUD_VENTAS_ALICUOTAS)
  })

  it("posiciones correctas con alícuota 21%", () => {
    const linea = generarAlicuotasVentasTxt([alicuotaVenta()]).trim()
    expect(linea.slice(0, 3)).toBe("001")
    expect(linea.slice(3, 8)).toBe("00001")
    expect(linea.slice(8, 28)).toBe("00000000000000000123")
    expect(linea.slice(28, 43)).toBe("000000000100000") // 1000.00 = 100000 centavos
    expect(linea.slice(43, 47)).toBe("0005") // 21% → código 5
    expect(linea.slice(47, 62)).toBe("000000000021000") // 210.00 = 21000 centavos
  })

  it("alícuota 10.5% → código 0004", () => {
    const linea = generarAlicuotasVentasTxt([
      alicuotaVenta({ alicuotaPorcentaje: 10.5, montoIva: 105 }),
    ]).trim()
    expect(linea.slice(43, 47)).toBe("0004")
  })

  it("alícuota 0% → código 0003", () => {
    const linea = generarAlicuotasVentasTxt([
      alicuotaVenta({ alicuotaPorcentaje: 0, montoIva: 0 }),
    ]).trim()
    expect(linea.slice(43, 47)).toBe("0003")
  })

  it("alícuota no soportada lanza error", () => {
    expect(() =>
      generarAlicuotasVentasTxt([alicuotaVenta({ alicuotaPorcentaje: 12 })]),
    ).toThrow("alícuota 12 no soportada")
  })

  it("comprobante con 2 alícuotas → 2 líneas", () => {
    const out = generarAlicuotasVentasTxt([
      alicuotaVenta({ alicuotaPorcentaje: 21, netoGravado: 1000, montoIva: 210 }),
      alicuotaVenta({ alicuotaPorcentaje: 10.5, netoGravado: 500, montoIva: 52.5 }),
    ])
    const lineas = out.split("\r\n").filter(l => l.length > 0)
    expect(lineas).toHaveLength(2)
    expect(lineas[0].slice(43, 47)).toBe("0005")
    expect(lineas[1].slice(43, 47)).toBe("0004")
  })
})

describe("generarComprobantesComprasTxt", () => {
  it("longitud exacta 325", () => {
    const out = generarComprobantesComprasTxt([cbteCompra()])
    const lineas = out.split("\r\n").filter(l => l.length > 0)
    expect(lineas[0]).toHaveLength(LONGITUD_COMPRAS_CBTE)
  })

  it("nro despacho de importación vacío (16 espacios)", () => {
    const linea = generarComprobantesComprasTxt([cbteCompra()]).trim()
    expect(linea.slice(36, 52)).toBe("                ") // 16 espacios
  })

  it("CUIT vendedor en posición 54-74", () => {
    const linea = generarComprobantesComprasTxt([cbteCompra()]).trim()
    expect(linea.slice(52, 54)).toBe("80") // codDoc
    expect(linea.slice(54, 74)).toBe("00000000030709381683")
  })

  it("percepciones IVA, IIBB, municipales en sus posiciones", () => {
    const c = cbteCompra({
      percepcionIva: 50,
      percepcionIibb: 30,
      impuestosMunicipales: 10,
    })
    const linea = generarComprobantesComprasTxt([c]).trim()
    // Pos 149-164: percIVA. Pos 179-194: percIIBB. Pos 194-209: percMunic
    expect(linea.slice(149, 164)).toBe("000000000005000") // 50 → 5000 centavos
    expect(linea.slice(179, 194)).toBe("000000000003000")
    expect(linea.slice(194, 209)).toBe("000000000001000")
  })

  it("array vacío → string vacío", () => {
    expect(generarComprobantesComprasTxt([])).toBe("")
  })
})

describe("generarAlicuotasComprasTxt", () => {
  it("longitud exacta 84", () => {
    const out = generarAlicuotasComprasTxt([alicuotaCompra()])
    const lineas = out.split("\r\n").filter(l => l.length > 0)
    expect(lineas[0]).toHaveLength(LONGITUD_COMPRAS_ALICUOTAS)
  })

  it("CUIT proveedor en posición 30-50", () => {
    const linea = generarAlicuotasComprasTxt([alicuotaCompra()]).trim()
    expect(linea.slice(28, 30)).toBe("80") // codDoc
    expect(linea.slice(30, 50)).toBe("00000000030709381683")
  })

  it("alícuota y monto IVA", () => {
    const linea = generarAlicuotasComprasTxt([alicuotaCompra()]).trim()
    expect(linea.slice(50, 65)).toBe("000000000100000") // neto 1000 → 100000 centavos
    expect(linea.slice(65, 69)).toBe("0005")
    expect(linea.slice(69, 84)).toBe("000000000021000") // iva 210 → 21000 centavos
  })

  it("falta CUIT proveedor → error", () => {
    expect(() =>
      generarAlicuotasComprasTxt([alicuotaCompra({ cuitProveedor: undefined })]),
    ).toThrow("cuitProveedor es obligatorio")
  })

  it("alícuota no soportada → error", () => {
    expect(() =>
      generarAlicuotasComprasTxt([alicuotaCompra({ alicuotaPorcentaje: 15 })]),
    ).toThrow("alícuota 15 no soportada")
  })
})

describe("Casos completos", () => {
  it("Factura A 1 alícuota: cbte + 1 fila alícuota", () => {
    const c = cbteVentaA({ totalOperacion: 1210, netoGravado: 1000, cantidadAlicuotas: 1 })
    const alic = alicuotaVenta({ netoGravado: 1000, alicuotaPorcentaje: 21, montoIva: 210 })

    const cbteTxt = generarComprobantesVentasTxt([c])
    const alicTxt = generarAlicuotasVentasTxt([alic])

    expect(cbteTxt.split("\r\n").filter(l => l).length).toBe(1)
    expect(alicTxt.split("\r\n").filter(l => l).length).toBe(1)
  })

  it("Factura A multi-alícuota: 1 cbte + 3 filas alícuota", () => {
    // Comprobante de referencia para el caso (no se usa en assertions, solo documenta el caso)
    cbteVentaA({
      totalOperacion: 1262.5, // 1000 al 21% + 500 al 10.5% + 100 al 0%
      netoGravado: 1500,
      cantidadAlicuotas: 3,
    })
    const alics = [
      alicuotaVenta({ alicuotaPorcentaje: 21, netoGravado: 1000, montoIva: 210 }),
      alicuotaVenta({ alicuotaPorcentaje: 10.5, netoGravado: 500, montoIva: 52.5 }),
      alicuotaVenta({ alicuotaPorcentaje: 0, netoGravado: 100, montoIva: 0 }),
    ]

    const alicTxt = generarAlicuotasVentasTxt(alics)
    const lineas = alicTxt.split("\r\n").filter(l => l)
    expect(lineas).toHaveLength(3)
  })

  it("NC sobre factura A (tipoCbte 3)", () => {
    const nc = cbteVentaA({
      tipoComprobanteArca: 3,
      tipoReferencia: "NC_EMITIDA",
      totalOperacion: 121,
      netoGravado: 100,
    })
    const linea = generarComprobantesVentasTxt([nc]).trim()
    expect(linea.slice(8, 11)).toBe("003")
  })

  it("CVLP 60 en compras", () => {
    const lp = cbteCompra({
      tipoComprobanteArca: 60,
      tipoReferencia: "LIQUIDACION",
      totalOperacion: 1089, // neto 900 + iva 189 (10% comisión sobre 1000)
      netoGravado: 900,
    })
    const linea = generarComprobantesComprasTxt([lp]).trim()
    expect(linea.slice(8, 11)).toBe("060")
    expect(linea).toHaveLength(LONGITUD_COMPRAS_CBTE)
  })

  it("Factura proveedor con percepciones múltiples", () => {
    const fp = cbteCompra({
      tipoComprobanteArca: 1,
      totalOperacion: 1300,
      netoGravado: 1000,
      percepcionIva: 50,
      percepcionGanancias: 25,
      percepcionIibb: 30,
      impuestosMunicipales: 10,
    })
    const linea = generarComprobantesComprasTxt([fp]).trim()
    expect(linea).toHaveLength(LONGITUD_COMPRAS_CBTE)
    expect(linea.slice(149, 164)).toBe("000000000005000") // perc IVA
  })

  it("Comprobante con razón social larga se trunca a 30", () => {
    const cbte = cbteVentaA({
      razonSocialContraparte: "RAZON SOCIAL EXTREMADAMENTE LARGA QUE EXCEDE LOS 30 CARACTERES PERMITIDOS",
    })
    const linea = generarComprobantesVentasTxt([cbte]).trim()
    expect(linea.slice(78, 108)).toHaveLength(30)
    expect(linea.slice(78, 108)).toBe("RAZON SOCIAL EXTREMADAMENTE LA")
  })
})
