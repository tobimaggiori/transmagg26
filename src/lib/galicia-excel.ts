import ExcelJS from "exceljs"

export type FilaPlanillaGalicia = {
  tipoDocBeneficiario: "CUIT" | "CUIL" | "CDI"
  nroDocBeneficiario: string
  monto: number
  fechaPago: Date
  motivoPago: "VARIOS" | "FACTURA" | "ORDEN_DE_PAGO" | "ALQUILER" | "EXPENSAS" | "SERVICIOS"
  descripcion1: string | null
  descripcion2: string | null
  mailBeneficiario: string | null
  clausula: "A_LA_ORDEN" | "NO_A_LA_ORDEN"
  nroCheque: string | null
}

/**
 * normalizarDocumentoGalicia: string -> string
 *
 * Dado [un número de documento con o sin separadores], devuelve [el documento limpio, sin puntos ni guiones y truncado a 11 caracteres].
 * Esta función existe para garantizar el formato exigido por la planilla de emisión masiva de Banco Galicia.
 *
 * Ejemplos:
 * normalizarDocumentoGalicia("20-12345678-9") === "20123456789"
 * normalizarDocumentoGalicia("30.71429569.8") === "30714295698"
 * normalizarDocumentoGalicia("1234567890123") === "12345678901"
 */
export function normalizarDocumentoGalicia(documento: string): string {
  return documento.replace(/[^\d]/g, "").slice(0, 11)
}

/**
 * formatearFechaGalicia: Date -> string
 *
 * Dado [una fecha], devuelve [un string con formato DD/MM/AAAA].
 * Esta función existe para serializar fechas exactamente como las espera la plantilla del Banco Galicia.
 *
 * Ejemplos:
 * formatearFechaGalicia(new Date("2026-04-15T00:00:00.000Z")) === "15/04/2026"
 * formatearFechaGalicia(new Date("2026-01-01T00:00:00.000Z")) === "01/01/2026"
 * formatearFechaGalicia(new Date("2026-12-31T00:00:00.000Z")) === "31/12/2026"
 */
export function formatearFechaGalicia(fecha: Date): string {
  const dia = `${fecha.getUTCDate()}`.padStart(2, "0")
  const mes = `${fecha.getUTCMonth() + 1}`.padStart(2, "0")
  const anio = fecha.getUTCFullYear()
  return `${dia}/${mes}/${anio}`
}

/**
 * normalizarMotivoPagoGalicia: FilaPlanillaGalicia["motivoPago"] -> string
 *
 * Dado [un motivo de pago interno], devuelve [el texto exacto que debe verse en la planilla Galicia].
 * Esta función existe para mapear enums internos al formato textual aceptado por el banco.
 *
 * Ejemplos:
 * normalizarMotivoPagoGalicia("VARIOS") === "Varios"
 * normalizarMotivoPagoGalicia("ORDEN_DE_PAGO") === "Orden de pago"
 * normalizarMotivoPagoGalicia("SERVICIOS") === "Servicios"
 */
export function normalizarMotivoPagoGalicia(motivoPago: FilaPlanillaGalicia["motivoPago"]): string {
  const motivos: Record<FilaPlanillaGalicia["motivoPago"], string> = {
    VARIOS: "Varios",
    FACTURA: "Factura",
    ORDEN_DE_PAGO: "Orden de pago",
    ALQUILER: "Alquiler",
    EXPENSAS: "Expensas",
    SERVICIOS: "Servicios",
  }

  return motivos[motivoPago]
}

/**
 * normalizarClausulaGalicia: FilaPlanillaGalicia["clausula"] -> string
 *
 * Dado [una cláusula interna del cheque], devuelve [el texto visible exacto requerido por Galicia].
 * Esta función existe para traducir la representación interna al valor humano que consume la plantilla bancaria.
 *
 * Ejemplos:
 * normalizarClausulaGalicia("A_LA_ORDEN") === "A la orden"
 * normalizarClausulaGalicia("NO_A_LA_ORDEN") === "No a la orden"
 * normalizarClausulaGalicia("A_LA_ORDEN") === "A la orden"
 */
export function normalizarClausulaGalicia(clausula: FilaPlanillaGalicia["clausula"]): string {
  return clausula === "A_LA_ORDEN" ? "A la orden" : "No a la orden"
}

/**
 * generarExcelPlanillaGalicia: FilaPlanillaGalicia[] -> Promise<ArrayBuffer>
 *
 * Dado [un arreglo de filas de cheques emitidos], devuelve [un `ArrayBuffer` `.xlsx` compatible con la hoja "Plantilla para emision" y sus 10 columnas exactas].
 * Esta función existe para materializar la exportación bancaria masiva de cheques para Banco Galicia.
 *
 * Ejemplos:
 * await generarExcelPlanillaGalicia([{ tipoDocBeneficiario: "CUIT", nroDocBeneficiario: "20123456789", monto: 10, fechaPago: new Date("2026-04-15T00:00:00.000Z"), motivoPago: "VARIOS", descripcion1: null, descripcion2: null, mailBeneficiario: null, clausula: "A_LA_ORDEN", nroCheque: null }]) instanceof ArrayBuffer === true
 * await generarExcelPlanillaGalicia([]) instanceof ArrayBuffer === true
 * (await generarExcelPlanillaGalicia([{ tipoDocBeneficiario: "CUIT", nroDocBeneficiario: "20123456789", monto: 10, fechaPago: new Date("2026-04-15T00:00:00.000Z"), motivoPago: "SERVICIOS", descripcion1: "Pago", descripcion2: null, mailBeneficiario: null, clausula: "NO_A_LA_ORDEN", nroCheque: "1001" }])).length > 0 === true
 */
export async function generarExcelPlanillaGalicia(filas: FilaPlanillaGalicia[]): Promise<ArrayBuffer> {
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet("Plantilla para emision")

  worksheet.addRow([
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

  for (const fila of filas) {
    worksheet.addRow([
      fila.tipoDocBeneficiario,
      normalizarDocumentoGalicia(fila.nroDocBeneficiario),
      fila.monto,
      formatearFechaGalicia(fila.fechaPago),
      normalizarMotivoPagoGalicia(fila.motivoPago),
      fila.descripcion1 ?? "",
      fila.descripcion2 ?? "",
      fila.mailBeneficiario ?? "",
      normalizarClausulaGalicia(fila.clausula),
      fila.nroCheque ?? "",
    ])
  }

  worksheet.columns = [
    { width: 18 },
    { width: 18 },
    { width: 14 },
    { width: 14 },
    { width: 20 },
    { width: 30 },
    { width: 20 },
    { width: 28 },
    { width: 18 },
    { width: 16 },
  ]

  worksheet.getRow(1).font = { bold: true }

  for (let fila = 2; fila <= worksheet.rowCount; fila += 1) {
    worksheet.getCell(`C${fila}`).numFmt = "#,##0.00"
  }

  const arrayBuffer = await workbook.xlsx.writeBuffer()
  const excelArrayBuffer = new ArrayBuffer(arrayBuffer.byteLength)
  new Uint8Array(excelArrayBuffer).set(new Uint8Array(arrayBuffer))
  return excelArrayBuffer
}
