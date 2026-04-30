/**
 * Tests smoke de generarPDFCCFletero.
 * Verifican que el helper produce un Buffer PDF válido (no vacío) con y sin movimientos.
 */

import { generarPDFCCFletero, type MovimientoCCFleteroPDF } from "@/lib/pdf-cc-fletero"

const fletero = { razonSocial: "Fletero Demo SRL", cuit: "20303303301" }
const hasta = new Date("2026-04-18T00:00:00Z")
const desde = new Date("2026-01-01T00:00:00Z")

describe("generarPDFCCFletero", () => {
  it("genera un PDF no vacío cuando no hay movimientos", async () => {
    const pdf = await generarPDFCCFletero({
      fletero,
      movimientos: [],
      totalDebe: 0,
      totalHaber: 0,
      saldoFinal: 0,
      desde: null,
      hasta,
    })
    expect(Buffer.isBuffer(pdf)).toBe(true)
    expect(pdf.length).toBeGreaterThan(500)
    expect(pdf.slice(0, 4).toString()).toBe("%PDF")
  })

  it("genera un PDF con más contenido cuando hay movimientos", async () => {
    const pdfVacio = await generarPDFCCFletero({
      fletero,
      movimientos: [],
      totalDebe: 0,
      totalHaber: 0,
      saldoFinal: 0,
      desde,
      hasta,
    })

    const movimientos: MovimientoCCFleteroPDF[] = [
      {
        fecha: "2026-01-10T00:00:00Z",
        concepto: "Liquidación",
        comprobante: "0001-00000001",
        debe: 100000,
        haber: 0,
        saldo: 100000,
      },
      {
        fecha: "2026-02-05T00:00:00Z",
        concepto: "Pago — Transferencia",
        comprobante: "BNK-001",
        debe: 0,
        haber: 40000,
        saldo: 60000,
      },
      {
        fecha: "2026-03-15T00:00:00Z",
        concepto: "Adelanto — Efectivo",
        comprobante: "",
        debe: 0,
        haber: 20000,
        saldo: 40000,
      },
    ]

    const pdfLleno = await generarPDFCCFletero({
      fletero,
      movimientos,
      totalDebe: 100000,
      totalHaber: 60000,
      saldoFinal: 40000,
      desde,
      hasta,
    })

    expect(Buffer.isBuffer(pdfLleno)).toBe(true)
    expect(pdfLleno.slice(0, 4).toString()).toBe("%PDF")
    expect(pdfLleno.length).toBeGreaterThan(pdfVacio.length)
  })
})
