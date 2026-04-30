/**
 * Tests de formatos del Portal IVA / LID ARCA.
 *
 * Cubre los helpers de longitud fija (padLeft, padRight, formatFechaYYYYMMDD,
 * formatImporteEnCentavos, etc.) que son críticos: cualquier desviación en
 * longitud o formato hace que ARCA rechace el archivo TXT.
 */

import {
  padLeft,
  padRight,
  formatFechaYYYYMMDD,
  formatFechaDDMMYYYY,
  formatImporteEnCentavos,
  normalizarCuit,
  cuitConPaddingLid,
  limpiarRazonSocial,
  formatTipoCambioLid,
} from "@/lib/iva-portal/formatos"
import {
  codigoArcaSoportado,
  codigoAlicuotaArca,
  alicuotaSoportada,
  codigoDocumentoPorCuit,
  esTipoVentas,
  etiquetaComprobanteArca,
} from "@/lib/iva-portal/codigos-arca"

describe("padLeft / padRight", () => {
  it("padLeft rellena con ceros por defecto", () => {
    expect(padLeft("123", 5)).toBe("00123")
  })
  it("padLeft acepta carácter custom", () => {
    expect(padLeft("123", 5, " ")).toBe("  123")
  })
  it("padLeft trunca por izquierda si supera ancho", () => {
    expect(padLeft("12345", 3)).toBe("345")
  })
  it("padLeft con cadena vacía rellena todo", () => {
    expect(padLeft("", 4)).toBe("0000")
  })
  it("padRight rellena con espacios por defecto", () => {
    expect(padRight("ACME", 10)).toBe("ACME      ")
  })
  it("padRight trunca por derecha si supera ancho", () => {
    expect(padRight("ACME SA SRL", 5)).toBe("ACME ")
  })
  it("padRight con cadena vacía rellena todo", () => {
    expect(padRight("", 3)).toBe("   ")
  })
})

describe("formatFechaYYYYMMDD", () => {
  it("formatea fecha completa", () => {
    expect(formatFechaYYYYMMDD(new Date(2026, 3, 15))).toBe("20260415")
  })
  it("rellena día y mes con cero", () => {
    expect(formatFechaYYYYMMDD(new Date(2026, 0, 1))).toBe("20260101")
  })
  it("longitud siempre 8", () => {
    expect(formatFechaYYYYMMDD(new Date(2026, 11, 31))).toHaveLength(8)
  })
})

describe("formatFechaDDMMYYYY", () => {
  it("formatea en orden DD MM YYYY", () => {
    expect(formatFechaDDMMYYYY(new Date(2026, 3, 15))).toBe("15042026")
  })
  it("longitud siempre 8", () => {
    expect(formatFechaDDMMYYYY(new Date(2026, 0, 1))).toHaveLength(8)
  })
})

describe("formatImporteEnCentavos", () => {
  it("convierte a centavos con padding ceros", () => {
    expect(formatImporteEnCentavos(1234.56, 15)).toBe("000000000123456")
  })
  it("cero genera todos ceros del ancho indicado", () => {
    expect(formatImporteEnCentavos(0, 15)).toBe("000000000000000")
  })
  it("entero exacto", () => {
    expect(formatImporteEnCentavos(2100, 15)).toBe("000000000210000")
  })
  it("centavo único", () => {
    expect(formatImporteEnCentavos(0.01, 10)).toBe("0000000001")
  })
  it("evita errores de coma flotante en multiplicación", () => {
    // 1234.56 * 100 puede dar 123456.00000000001 en JS — no aceptamos -1 al floor
    expect(formatImporteEnCentavos(1234.56, 10)).toBe("0000123456")
  })
  it("redondea half-up", () => {
    // 0.105 → 10.5 centavos → redondea a 11
    expect(formatImporteEnCentavos(0.105, 5)).toBe("00011")
  })
  it("longitud siempre coincide con ancho", () => {
    expect(formatImporteEnCentavos(99999.99, 15)).toHaveLength(15)
    expect(formatImporteEnCentavos(0.01, 5)).toHaveLength(5)
  })
  it("negativos llevan signo y respetan ancho", () => {
    expect(formatImporteEnCentavos(-50.5, 15)).toBe("-00000000005050")
    expect(formatImporteEnCentavos(-50.5, 15)).toHaveLength(15)
  })
  it("null/undefined toman 0", () => {
    expect(formatImporteEnCentavos(undefined as never, 5)).toBe("00000")
    expect(formatImporteEnCentavos(null as never, 5)).toBe("00000")
  })
})

describe("normalizarCuit", () => {
  it("quita guiones", () => {
    expect(normalizarCuit("30-70938168-3")).toBe("30709381683")
  })
  it("quita espacios", () => {
    expect(normalizarCuit("30 70938168 3")).toBe("30709381683")
  })
  it("CUIT ya normalizado pasa", () => {
    expect(normalizarCuit("30709381683")).toBe("30709381683")
  })
  it("vacío o null devuelve cadena vacía", () => {
    expect(normalizarCuit("")).toBe("")
    expect(normalizarCuit(null)).toBe("")
    expect(normalizarCuit(undefined)).toBe("")
  })
})

describe("cuitConPaddingLid", () => {
  it("CUIT 11 dígitos con padding 20", () => {
    expect(cuitConPaddingLid("30709381683")).toBe("00000000030709381683")
    expect(cuitConPaddingLid("30709381683")).toHaveLength(20)
  })
  it("CUIT vacío genera 20 ceros", () => {
    expect(cuitConPaddingLid("")).toBe("00000000000000000000")
  })
  it("CUIT corto rellena con ceros izquierda", () => {
    expect(cuitConPaddingLid("123")).toBe("00000000000000000123")
  })
})

describe("limpiarRazonSocial", () => {
  it("pad con espacios a la derecha", () => {
    expect(limpiarRazonSocial("ACME SA", 10)).toBe("ACME SA   ")
  })
  it("trunca y reemplaza tabs/newlines por espacio", () => {
    expect(limpiarRazonSocial("ACME\tSA\nSRL", 10)).toBe("ACME SA SR")
  })
  it("colapsa múltiples espacios", () => {
    expect(limpiarRazonSocial("ACME    SA", 30).trimEnd()).toBe("ACME SA")
  })
  it("preserva acentos y ñ", () => {
    const out = limpiarRazonSocial("EMPRESA ÁCME ÑOÑA", 30)
    expect(out.startsWith("EMPRESA ÁCME ÑOÑA")).toBe(true)
    expect(out).toHaveLength(30)
  })
  it("vacío genera string de espacios del ancho", () => {
    expect(limpiarRazonSocial("", 5)).toBe("     ")
  })
})

describe("formatTipoCambioLid", () => {
  it("PES siempre 1 → 0001000000", () => {
    expect(formatTipoCambioLid(1)).toBe("0001000000")
  })
  it("1.05 → 0001050000", () => {
    expect(formatTipoCambioLid(1.05)).toBe("0001050000")
  })
  it("dólar a 900.5 → 0900500000", () => {
    expect(formatTipoCambioLid(900.5)).toBe("0900500000")
  })
  it("longitud siempre 10", () => {
    expect(formatTipoCambioLid(1)).toHaveLength(10)
    expect(formatTipoCambioLid(9999.999)).toHaveLength(10)
  })
})

describe("codigos-arca: codigoArcaSoportado", () => {
  it("acepta facturas A/B y FCE", () => {
    expect(codigoArcaSoportado(1)).toBe(true)
    expect(codigoArcaSoportado(6)).toBe(true)
    expect(codigoArcaSoportado(201)).toBe(true)
  })
  it("acepta NC/ND A/B/FCE", () => {
    expect(codigoArcaSoportado(2)).toBe(true)
    expect(codigoArcaSoportado(3)).toBe(true)
    expect(codigoArcaSoportado(7)).toBe(true)
    expect(codigoArcaSoportado(8)).toBe(true)
    expect(codigoArcaSoportado(202)).toBe(true)
    expect(codigoArcaSoportado(203)).toBe(true)
  })
  it("acepta CVLP A/B (60/61)", () => {
    expect(codigoArcaSoportado(60)).toBe(true)
    expect(codigoArcaSoportado(61)).toBe(true)
  })
  it("rechaza códigos fuera de la matriz cerrada", () => {
    expect(codigoArcaSoportado(99)).toBe(false)
    expect(codigoArcaSoportado(0)).toBe(false)
    expect(codigoArcaSoportado(11)).toBe(false)  // factura E (no soportado)
    expect(codigoArcaSoportado(15)).toBe(false)
  })
})

describe("codigos-arca: codigoAlicuotaArca", () => {
  it("21% → código 5", () => {
    expect(codigoAlicuotaArca(21)).toBe(5)
  })
  it("10.5% → código 4", () => {
    expect(codigoAlicuotaArca(10.5)).toBe(4)
  })
  it("0% → código 3", () => {
    expect(codigoAlicuotaArca(0)).toBe(3)
  })
  it("27% → código 6", () => {
    expect(codigoAlicuotaArca(27)).toBe(6)
  })
  it("5% → código 8", () => {
    expect(codigoAlicuotaArca(5)).toBe(8)
  })
  it("2.5% → código 9", () => {
    expect(codigoAlicuotaArca(2.5)).toBe(9)
  })
  it("alícuota no estándar → null", () => {
    expect(codigoAlicuotaArca(12)).toBeNull()
    expect(codigoAlicuotaArca(15)).toBeNull()
    expect(codigoAlicuotaArca(50)).toBeNull()
  })
  it("tolerancia para coma flotante (< 0.01)", () => {
    expect(codigoAlicuotaArca(21.0001)).toBe(5)
    expect(codigoAlicuotaArca(20.9999)).toBe(5)
  })
  it("fuera de tolerancia → null", () => {
    expect(codigoAlicuotaArca(20.99)).toBeNull()  // diferencia > 0.01
  })
  it("alicuotaSoportada coincide con codigoAlicuotaArca", () => {
    expect(alicuotaSoportada(21)).toBe(true)
    expect(alicuotaSoportada(12)).toBe(false)
  })
})

describe("codigos-arca: codigoDocumentoPorCuit", () => {
  it("11 dígitos → CUIT (80)", () => {
    expect(codigoDocumentoPorCuit("30709381683")).toBe(80)
    expect(codigoDocumentoPorCuit("20-12345678-9")).toBe(80)
  })
  it("8 dígitos → DNI (96)", () => {
    expect(codigoDocumentoPorCuit("12345678")).toBe(96)
  })
  it("vacío → SIN_IDENTIFICAR (99)", () => {
    expect(codigoDocumentoPorCuit("")).toBe(99)
  })
  it("longitud rara → SIN_IDENTIFICAR", () => {
    expect(codigoDocumentoPorCuit("123")).toBe(99)
  })
})

describe("codigos-arca: esTipoVentas", () => {
  it("facturas y notas A/B/FCE → true", () => {
    expect(esTipoVentas(1)).toBe(true)
    expect(esTipoVentas(2)).toBe(true)
    expect(esTipoVentas(3)).toBe(true)
    expect(esTipoVentas(6)).toBe(true)
    expect(esTipoVentas(201)).toBe(true)
  })
  it("CVLP → false (compras en Transmagg)", () => {
    expect(esTipoVentas(60)).toBe(false)
    expect(esTipoVentas(61)).toBe(false)
  })
})

describe("codigos-arca: etiquetaComprobanteArca", () => {
  it("códigos conocidos devuelven nombre legible", () => {
    expect(etiquetaComprobanteArca(1)).toBe("Factura A")
    expect(etiquetaComprobanteArca(60)).toBe("Cuenta de Venta y Líquido Producto A")
  })
  it("código no soportado devuelve placeholder", () => {
    expect(etiquetaComprobanteArca(99)).toContain("99")
    expect(etiquetaComprobanteArca(99)).toContain("no soportado")
  })
})
