/**
 * Propósito: Tests unitarios para utilidades de exportación Galicia.
 * Cada caso usa exactamente los mismos ejemplos del JSDoc de galicia-excel.ts.
 */

import ExcelJS from "exceljs"
import {
  formatearFechaGalicia,
  generarExcelPlanillaGalicia,
  normalizarClausulaGalicia,
  normalizarDocumentoGalicia,
  normalizarMotivoPagoGalicia,
} from "@/lib/galicia-excel"

describe("normalizarDocumentoGalicia", () => {
  it('normalizarDocumentoGalicia("20-12345678-9") === "20123456789"', () => {
    expect(normalizarDocumentoGalicia("20-12345678-9")).toBe("20123456789")
  })

  it('normalizarDocumentoGalicia("30.71429569.8") === "30714295698"', () => {
    expect(normalizarDocumentoGalicia("30.71429569.8")).toBe("30714295698")
  })

  it('normalizarDocumentoGalicia("1234567890123") === "12345678901"', () => {
    expect(normalizarDocumentoGalicia("1234567890123")).toBe("12345678901")
  })
})

describe("formatearFechaGalicia", () => {
  it('formatearFechaGalicia(new Date("2026-04-15T00:00:00.000Z")) === "15/04/2026"', () => {
    expect(formatearFechaGalicia(new Date("2026-04-15T00:00:00.000Z"))).toBe("15/04/2026")
  })

  it('formatearFechaGalicia(new Date("2026-01-01T00:00:00.000Z")) === "01/01/2026"', () => {
    expect(formatearFechaGalicia(new Date("2026-01-01T00:00:00.000Z"))).toBe("01/01/2026")
  })

  it('formatearFechaGalicia(new Date("2026-12-31T00:00:00.000Z")) === "31/12/2026"', () => {
    expect(formatearFechaGalicia(new Date("2026-12-31T00:00:00.000Z"))).toBe("31/12/2026")
  })
})

describe("normalizarMotivoPagoGalicia", () => {
  it('normalizarMotivoPagoGalicia("VARIOS") === "Varios"', () => {
    expect(normalizarMotivoPagoGalicia("VARIOS")).toBe("Varios")
  })

  it('normalizarMotivoPagoGalicia("ORDEN_DE_PAGO") === "Orden de pago"', () => {
    expect(normalizarMotivoPagoGalicia("ORDEN_DE_PAGO")).toBe("Orden de pago")
  })

  it('normalizarMotivoPagoGalicia("SERVICIOS") === "Servicios"', () => {
    expect(normalizarMotivoPagoGalicia("SERVICIOS")).toBe("Servicios")
  })
})

describe("normalizarClausulaGalicia", () => {
  it('normalizarClausulaGalicia("A_LA_ORDEN") === "A la orden"', () => {
    expect(normalizarClausulaGalicia("A_LA_ORDEN")).toBe("A la orden")
  })

  it('normalizarClausulaGalicia("NO_A_LA_ORDEN") === "No a la orden"', () => {
    expect(normalizarClausulaGalicia("NO_A_LA_ORDEN")).toBe("No a la orden")
  })

  it('normalizarClausulaGalicia("A_LA_ORDEN") === "A la orden"', () => {
    expect(normalizarClausulaGalicia("A_LA_ORDEN")).toBe("A la orden")
  })
})

describe("generarExcelPlanillaGalicia", () => {
  it("await generarExcelPlanillaGalicia([{ tipoDocBeneficiario: \"CUIT\", nroDocBeneficiario: \"20123456789\", monto: 10, fechaPago: new Date(\"2026-04-15T00:00:00.000Z\"), motivoPago: \"VARIOS\", descripcion1: null, descripcion2: null, mailBeneficiario: null, clausula: \"A_LA_ORDEN\", nroCheque: null }]) instanceof ArrayBuffer === true", async () => {
    await expect(
      generarExcelPlanillaGalicia([
        {
          tipoDocBeneficiario: "CUIT",
          nroDocBeneficiario: "20123456789",
          monto: 10,
          fechaPago: new Date("2026-04-15T00:00:00.000Z"),
          motivoPago: "VARIOS",
          descripcion1: null,
          descripcion2: null,
          mailBeneficiario: null,
          clausula: "A_LA_ORDEN",
          nroCheque: null,
        },
      ])
    ).resolves.toBeInstanceOf(ArrayBuffer)
  })

  it("await generarExcelPlanillaGalicia([]) instanceof ArrayBuffer === true", async () => {
    await expect(generarExcelPlanillaGalicia([])).resolves.toBeInstanceOf(ArrayBuffer)
  })

  it("(await generarExcelPlanillaGalicia([{ tipoDocBeneficiario: \"CUIT\", nroDocBeneficiario: \"20123456789\", monto: 10, fechaPago: new Date(\"2026-04-15T00:00:00.000Z\"), motivoPago: \"SERVICIOS\", descripcion1: \"Pago\", descripcion2: null, mailBeneficiario: null, clausula: \"NO_A_LA_ORDEN\", nroCheque: \"1001\" }])).length > 0 === true", async () => {
    const buffer = await generarExcelPlanillaGalicia([
      {
        tipoDocBeneficiario: "CUIT",
        nroDocBeneficiario: "20123456789",
        monto: 10,
        fechaPago: new Date("2026-04-15T00:00:00.000Z"),
        motivoPago: "SERVICIOS",
        descripcion1: "Pago",
        descripcion2: null,
        mailBeneficiario: null,
        clausula: "NO_A_LA_ORDEN",
        nroCheque: "1001",
      },
    ])

    expect(buffer.byteLength).toBeGreaterThan(0)
  })

  it('la hoja se llama exactamente "Plantilla para emision"', async () => {
    const buffer = await generarExcelPlanillaGalicia([])
    const workbook = new ExcelJS.Workbook()
    const loadWorkbook = workbook.xlsx.load as unknown as (data: unknown) => Promise<unknown>
    await loadWorkbook(Buffer.from(new Uint8Array(buffer)))

    expect(workbook.worksheets[0]?.name).toBe("Plantilla para emision")
  })

  it("la planilla exporta las 10 columnas exactas en orden", async () => {
    const buffer = await generarExcelPlanillaGalicia([])
    const workbook = new ExcelJS.Workbook()
    const loadWorkbook = workbook.xlsx.load as unknown as (data: unknown) => Promise<unknown>
    await loadWorkbook(Buffer.from(new Uint8Array(buffer)))
    const worksheet = workbook.worksheets[0]

    expect((worksheet.getRow(1).values as string[]).slice(1)).toEqual([
      "Tipo de documento",
      "Nro. de documento",
      "Monto",
      "Fecha de pago",
      "Motivo de pago",
      "Descripcion 1",
      "Descripcion 2",
      "Mail",
      "Clausula",
      "Nro de cheque",
    ])
  })
})
